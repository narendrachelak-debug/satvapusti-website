const test = require("node:test");
const assert = require("node:assert/strict");
const Order = require("../models/Order");
const Inventory = require("../models/Inventory");
const {
  deductInventoryOnce,
  restoreInventoryOnce,
} = require("../services/inventoryConcurrency");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Simulates MongoDB's per-document atomicity: the check-and-set on the fake
// "order" state is a single synchronous block (no await inside it), which in
// a single-threaded JS event loop cannot be interleaved by another in-flight
// call -- exactly mirroring how a real findOneAndUpdate on one document is
// atomic even when two requests race to call it.
const makeOrderMock = ({ items, deducted = false }) => {
  const state = { deducted };
  Order.findOneAndUpdate = async (filter, update) => {
    await delay(Math.random() * 5); // simulate network latency before reaching the "server"
    if (filter.inventoryDeducted === false && update.$set.inventoryDeducted === true) {
      if (state.deducted) return null;
      state.deducted = true;
      return { _id: filter._id, items, inventoryDeducted: true };
    }
    if (filter.inventoryDeducted === true && update.$set.inventoryDeducted === false) {
      if (!state.deducted) return null;
      state.deducted = false;
      return { _id: filter._id, items, inventoryDeducted: false };
    }
    return null;
  };
  return state;
};

const makeInventoryMock = (initialStock) => {
  const stock = { ...initialStock };
  const calls = [];
  Inventory.findOneAndUpdate = async (filter, update) => {
    const key = `${filter.productId}-${filter.weight}`;
    calls.push({ key, filter, update });
    if (update.$inc.stock < 0) {
      const need = -update.$inc.stock;
      if (filter.stock && (stock[key] ?? 0) < need) return null; // insufficient, filter's $gte fails
      stock[key] = (stock[key] ?? 0) - need;
      return { productId: filter.productId, weight: filter.weight, stock: stock[key] };
    }
    stock[key] = (stock[key] ?? 0) + update.$inc.stock;
    return { productId: filter.productId, weight: filter.weight, stock: stock[key] };
  };
  return { stock, calls };
};

test("normal deduction: sufficient stock deducts every item exactly once", async () => {
  const items = [
    { productId: "family", weight: "1KG", quantity: 2 },
    { productId: "kids", weight: "500G", quantity: 1 },
  ];
  makeOrderMock({ items });
  const inv = makeInventoryMock({ "family-1KG": 10, "kids-500G": 5 });

  const result = await deductInventoryOnce("order1", items);

  assert.equal(result, true);
  assert.equal(inv.stock["family-1KG"], 8);
  assert.equal(inv.stock["kids-500G"], 4);
});

test("normal restoration: previously deducted stock is added back exactly once", async () => {
  const items = [{ productId: "family", weight: "1KG", quantity: 3 }];
  makeOrderMock({ items, deducted: true });
  const inv = makeInventoryMock({ "family-1KG": 7 });

  const result = await restoreInventoryOnce("order1", items);

  assert.equal(result, true);
  assert.equal(inv.stock["family-1KG"], 10);
});

test("concurrent duplicate deduction requests: inventory deducted exactly once", async () => {
  const items = [{ productId: "family", weight: "1KG", quantity: 1 }];
  makeOrderMock({ items });
  const inv = makeInventoryMock({ "family-1KG": 50 });

  const [first, second] = await Promise.all([
    deductInventoryOnce("order1", items),
    deductInventoryOnce("order1", items),
  ]);

  const results = [first, second].sort();
  assert.deepEqual(results, [false, true]); // exactly one of the two actually deducted
  assert.equal(inv.stock["family-1KG"], 49); // deducted exactly once, not twice
});

test("concurrent duplicate cancellation requests: inventory restored exactly once", async () => {
  const items = [{ productId: "family", weight: "1KG", quantity: 1 }];
  makeOrderMock({ items, deducted: true });
  const inv = makeInventoryMock({ "family-1KG": 49 });

  const [first, second] = await Promise.all([
    restoreInventoryOnce("order1", items),
    restoreInventoryOnce("order1", items),
  ]);

  const results = [first, second].sort();
  assert.deepEqual(results, [false, true]);
  assert.equal(inv.stock["family-1KG"], 50); // restored exactly once, not twice
});

test("repeated sequential status updates do not deduct again", async () => {
  const items = [{ productId: "family", weight: "1KG", quantity: 1 }];
  makeOrderMock({ items });
  const inv = makeInventoryMock({ "family-1KG": 50 });

  const first = await deductInventoryOnce("order1", items); // Processing
  const second = await deductInventoryOnce("order1", items); // Packed (already deducted)
  const third = await deductInventoryOnce("order1", items); // Shipped (already deducted)

  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(third, false);
  assert.equal(inv.stock["family-1KG"], 49);
});

test("repeated cancellation does not restore again", async () => {
  const items = [{ productId: "family", weight: "1KG", quantity: 1 }];
  makeOrderMock({ items, deducted: true });
  const inv = makeInventoryMock({ "family-1KG": 49 });

  const first = await restoreInventoryOnce("order1", items);
  const second = await restoreInventoryOnce("order1", items);

  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(inv.stock["family-1KG"], 50);
});

test("insufficient stock: claim is released, inventoryDeducted is not left true", async () => {
  const items = [{ productId: "family", weight: "1KG", quantity: 5 }];
  const orderState = makeOrderMock({ items });
  makeInventoryMock({ "family-1KG": 2 }); // not enough for quantity 5

  await assert.rejects(
    () => deductInventoryOnce("order1", items),
    /out of stock/
  );
  assert.equal(orderState.deducted, false); // claim was released, not left stuck at true
});

test("multi-item partial failure: an earlier successfully-deducted item is rolled back", async () => {
  const items = [
    { productId: "family", weight: "1KG", quantity: 2 }, // will succeed
    { productId: "kids", weight: "500G", quantity: 10 }, // will fail (insufficient)
  ];
  const orderState = makeOrderMock({ items });
  const inv = makeInventoryMock({ "family-1KG": 10, "kids-500G": 3 });

  await assert.rejects(
    () => deductInventoryOnce("order1", items),
    /out of stock/
  );

  assert.equal(inv.stock["family-1KG"], 10); // rolled back to original, not left at 8
  assert.equal(inv.stock["kids-500G"], 3); // untouched (never went below 0)
  assert.equal(orderState.deducted, false); // order-level claim also released
});
