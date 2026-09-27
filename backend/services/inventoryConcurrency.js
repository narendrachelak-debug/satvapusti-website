const Order = require("../models/Order");
const Inventory = require("../models/Inventory");

// Atomically flips inventoryDeducted false->true on the Order document
// itself. A single findOneAndUpdate on one document is atomic in MongoDB
// independent of replica-set transaction support, so of any number of
// concurrent callers targeting the same order, only one can ever receive a
// non-null result here -- every other caller's filter simply stops matching
// the instant the winner's write applies. This is what makes deduction/
// restoration exactly-once under concurrent requests without needing a
// multi-document transaction.
const claimInventoryDeduction = (orderId) =>
  Order.findOneAndUpdate(
    { _id: orderId, inventoryDeducted: false },
    { $set: { inventoryDeducted: true } },
    { new: true }
  );

// Reverses a claim that was granted but whose actual stock deduction then
// failed (e.g. an item turned out to be out of stock), so the order is left
// in a state consistent with what actually happened to inventory.
const releaseInventoryDeductionClaim = (orderId) =>
  Order.findOneAndUpdate(
    { _id: orderId, inventoryDeducted: true },
    { $set: { inventoryDeducted: false } }
  );

const claimInventoryRestoration = (orderId) =>
  Order.findOneAndUpdate(
    { _id: orderId, inventoryDeducted: true },
    { $set: { inventoryDeducted: false } },
    { new: true }
  );

const reduceInventoryForItems = async (items) => {
  const deducted = [];
  for (const item of items || []) {
    const quantity = Number(item.quantity || 0);
    if (!item.productId || !item.weight || quantity <= 0) continue;
    const inventoryItem = await Inventory.findOneAndUpdate(
      { productId: item.productId, weight: item.weight, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true }
    );
    if (!inventoryItem) {
      for (const previous of deducted) {
        await Inventory.findOneAndUpdate(
          { productId: previous.productId, weight: previous.weight },
          { $inc: { stock: previous.quantity } }
        );
      }
      throw new Error(`${item.name || item.productId} ${item.weight} is out of stock`);
    }
    deducted.push({ productId: item.productId, weight: item.weight, quantity });
  }
};

const restoreInventoryForItems = async (items) => {
  for (const item of items || []) {
    const quantity = Number(item.quantity || 0);
    if (!item.productId || !item.weight || quantity <= 0) continue;
    await Inventory.findOneAndUpdate(
      { productId: item.productId, weight: item.weight },
      { $inc: { stock: quantity } }
    );
  }
};

// Claims the exclusive right to deduct stock for this order (atomic, so
// concurrent callers never both proceed), then performs the actual per-item
// deduction. If the deduction fails partway (handled by
// reduceInventoryForItems' own rollback) the claim is released so the order
// is never left with inventoryDeducted=true while no stock was actually taken.
// Returns true if this call actually performed the deduction, false if
// another call already claimed/performed it (nothing to do).
const deductInventoryOnce = async (orderId, items) => {
  const claimed = await claimInventoryDeduction(orderId);
  if (!claimed) return false;
  try {
    await reduceInventoryForItems(items);
    return true;
  } catch (error) {
    await releaseInventoryDeductionClaim(orderId);
    throw error;
  }
};

// Claims the exclusive right to restore stock for this order, then performs
// the restoration. Restoration itself cannot fail under normal conditions
// (it only ever adds stock back), so no rollback-on-failure is needed here.
// Returns true if this call actually performed the restoration, false if
// another call already claimed/performed it (nothing to do).
const restoreInventoryOnce = async (orderId, items) => {
  const claimed = await claimInventoryRestoration(orderId);
  if (!claimed) return false;
  await restoreInventoryForItems(items);
  return true;
};

module.exports = {
  claimInventoryDeduction,
  releaseInventoryDeductionClaim,
  claimInventoryRestoration,
  reduceInventoryForItems,
  restoreInventoryForItems,
  deductInventoryOnce,
  restoreInventoryOnce,
};
