const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Counter = require("../models/Counter");
const Inventory = require("../models/Inventory");
const { calculateOrder } = require("../services/pricingService");
const availability = require("../../shared/productAvailability.json");

// No real email provider or database is used by these tests.
delete process.env.BREVO_API_KEY;
delete process.env.EMAIL_FROM;
delete process.env.ADMIN_EMAIL;

const variant = {
  mrp: 1999,
  offer: 1799,
  mrpPaise: 199900,
  sellingPricePaise: 179900,
  gstRateBasisPoints: 500,
  taxInclusive: true,
  hsnCode: "1106",
  packSize: "1 Kg",
};
// Kids and Active are active in the catalogue and in stock, exactly like
// production, so only the Coming Soon rule can stop them being ordered.
const products = Object.fromEntries(
  ["family", "kids", "active"].map((productId) => [
    productId,
    { productId, name: `SatvaPusti ${productId}`, isActive: true, weights: { "1KG": variant } },
  ])
);

const dbCalls = [];
const record = (name, fn) => (...args) => {
  dbCalls.push(name);
  return fn(...args);
};
Order.findOne = record("Order.findOne", async () => null);
Order.find = record("Order.find", () => ({ select: () => ({ lean: async () => [] }) }));
Product.findOne = record("Product.findOne", ({ productId }) => ({ lean: async () => products[productId] || null }));
Counter.findById = record("Counter.findById", async () => ({ _id: "order", seq: 1150 }));
Counter.findOneAndUpdate = record("Counter.findOneAndUpdate", async () => ({ seq: 1151 }));
Inventory.findOne = record("Inventory.findOne", async () => ({ stock: 50 }));
Order.prototype.save = async function save() {
  dbCalls.push("Order.save");
  return this;
};

const orderRoutes = require("../routes/orderRoutes");

let base;
let server;
test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/orders", orderRoutes);
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise((resolve) => {
  server.close(resolve);
  server.closeAllConnections();
}));
test.beforeEach(() => {
  dbCalls.length = 0;
});

const createOrder = async (productIds) => {
  const res = await fetch(`${base}/api/orders/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Test Customer",
      email: "test@example.com",
      mobile: "9876543210",
      address: "12 Test Street",
      city: "Raipur",
      pincode: "492001",
      shippingStateCode: "22",
      paymentMethod: "COD",
      items: productIds.map((productId) => ({ productId, weight: "1KG", quantity: 1 })),
    }),
  });
  return { status: res.status, body: await res.json() };
};

const assertRejectedWithoutDatabaseAccess = ({ status, body }) => {
  assert.equal(status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, availability.comingSoonMessage);
  assert.deepEqual(dbCalls, [], "a rejected order must not read or write any order, counter or stock data");
};

test("A. a Family-only order is accepted", async () => {
  const { status, body } = await createOrder(["family"]);
  assert.equal(status, 201);
  assert.equal(body.success, true);
  assert.equal(body.order.orderId, "SP1151");
  assert.deepEqual(body.order.items.map((item) => item.productId), ["family"]);
  assert.equal(body.order.totalAmountPaise, 179900);
  assert.ok(dbCalls.includes("Order.save"));
});

test("B. an Active Kids order is rejected by the API", async () => {
  assertRejectedWithoutDatabaseAccess(await createOrder(["kids"]));
});

test("C. an Active order is rejected by the API", async () => {
  assertRejectedWithoutDatabaseAccess(await createOrder(["active"]));
});

test("D. a Family order mixed with a Coming Soon product is rejected", async () => {
  assertRejectedWithoutDatabaseAccess(await createOrder(["family", "kids"]));
  assertRejectedWithoutDatabaseAccess(await createOrder(["active", "family"]));
});

test("checkout quotes also refuse Coming Soon products, regardless of ID casing", async () => {
  for (const productId of ["kids", "active", " KIDS "]) {
    await assert.rejects(
      calculateOrder({ items: [{ productId, weight: "1KG", quantity: 1 }], shippingStateCode: "22" }),
      { message: availability.comingSoonMessage }
    );
  }
  const quote = await calculateOrder({
    items: [{ productId: "family", weight: "1KG", quantity: 1 }],
    shippingStateCode: "22",
  });
  assert.equal(quote.finalPayablePaise, 179900);
});

test("storefront and backend read the same Coming Soon list", () => {
  assert.deepEqual(availability.comingSoonProductIds, ["kids", "active"]);
  const app = fs.readFileSync(path.resolve(__dirname, "../../src/App.jsx"), "utf8");
  assert.match(app, /from "\.\.\/shared\/productAvailability\.json"/);
  assert.doesNotMatch(app, /new Set\(\["kids"/, "the storefront must not keep its own copy of the list");
});
