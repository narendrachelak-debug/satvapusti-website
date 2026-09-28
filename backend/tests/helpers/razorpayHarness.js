// Shared harness for the Razorpay tests. Throwaway test-mode credentials are
// generated per run; no real Razorpay keys, network access, email provider or
// database are used. Models are replaced with in-memory versions and calls to
// api.razorpay.com are answered by a fake Razorpay API.
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");

const TEST_KEY_ID = `rzp_test_${crypto.randomBytes(7).toString("hex")}`;
const TEST_KEY_SECRET = crypto.randomBytes(24).toString("hex");
const TEST_WEBHOOK_SECRET = crypto.randomBytes(24).toString("hex");
process.env.RAZORPAY_KEY_ID = TEST_KEY_ID;
process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
delete process.env.BREVO_API_KEY;
delete process.env.EMAIL_FROM;
delete process.env.ADMIN_EMAIL;

// Capture all console output so secrets and duplicate emails can be checked.
const logged = [];
for (const method of ["log", "error", "warn", "info"]) {
  const original = console[method].bind(console);
  console[method] = (...args) => {
    logged.push(args.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg))).join(" "));
    if (process.env.SHOW_TEST_LOGS) original(...args);
  };
}

const Order = require("../../models/Order");
const Product = require("../../models/Product");
const Counter = require("../../models/Counter");
const Inventory = require("../../models/Inventory");

// ---- In-memory models -------------------------------------------------------
const variant = {
  mrp: 1999, offer: 1799, mrpPaise: 199900, sellingPricePaise: 179900,
  gstRateBasisPoints: 500, taxInclusive: true, hsnCode: "1106", packSize: "1 Kg",
};
const products = Object.fromEntries(["family", "kids", "active"].map((productId) => [
  productId,
  { productId, name: `SatvaPusti ${productId}`, isActive: true, weights: { "1KG": variant } },
]));
const orders = new Map();
const stock = new Map([["family|1KG", 500], ["kids|1KG", 50], ["active|1KG", 50]]);
const counters = { seq: 1150, saves: 0 };

const clone = (value) => (value ? structuredClone(value) : null);
const query = (value) => ({
  lean: async () => clone(value),
  then: (resolve, reject) => Promise.resolve(clone(value)).then(resolve, reject),
});
const matches = (doc, filter) => Object.entries(filter).every(([key, expected]) => {
  const actual = key === "_id" ? String(doc._id) : doc[key];
  if (expected && typeof expected === "object" && "$ne" in expected) return actual !== expected.$ne;
  if (expected && typeof expected === "object" && "$gte" in expected) return actual >= expected.$gte;
  return key === "_id" ? actual === String(expected) : actual === expected;
});
const findStored = (filter) => [...orders.values()].find((doc) => matches(doc, filter)) || null;

Order.findOne = (filter) => query(findStored(filter));
Order.findById = (id) => query(orders.get(String(id)) || null);
Order.findOneAndUpdate = async (filter, update) => {
  const doc = findStored(filter);
  if (!doc) return null;
  Object.assign(doc, update.$set || {});
  return clone(doc);
};
Order.prototype.save = async function save() {
  counters.saves += 1;
  const doc = this.toObject();
  doc._id = String(doc._id);
  doc.createdAt = new Date();
  orders.set(doc._id, doc);
  return this;
};
Product.findOne = ({ productId }) => ({ lean: async () => clone(products[productId]) });
Counter.findById = async () => ({ _id: "order", seq: counters.seq });
Counter.findOneAndUpdate = async () => ({ seq: ++counters.seq });
Inventory.findOne = async ({ productId, weight }) => ({ productId, weight, stock: stock.get(`${productId}|${weight}`) });
Inventory.findOneAndUpdate = async (filter, update) => {
  const key = `${filter.productId}|${filter.weight}`;
  const current = stock.get(key);
  if (filter.stock?.$gte !== undefined && !(current >= filter.stock.$gte)) return null;
  stock.set(key, current + update.$inc.stock);
  return { productId: filter.productId, weight: filter.weight, stock: stock.get(key) };
};

// ---- Fake Razorpay API ------------------------------------------------------
const razorpayCalls = [];
const razorpayOrders = new Map();
const razorpayPayments = new Map();
const realFetch = global.fetch;
global.fetch = async (url, options = {}) => {
  const target = String(url);
  if (!target.startsWith("https://api.razorpay.com/")) return realFetch(url, options);
  const path = target.replace("https://api.razorpay.com", "");
  const body = options.body ? JSON.parse(options.body) : undefined;
  razorpayCalls.push({ method: options.method, path, body });
  const expectedAuth = `Basic ${Buffer.from(`${TEST_KEY_ID}:${TEST_KEY_SECRET}`).toString("base64")}`;
  if (options.headers.Authorization !== expectedAuth) {
    return Response.json({ error: { code: "BAD_REQUEST_ERROR" } }, { status: 401 });
  }
  if (options.method === "POST" && path === "/v1/orders") {
    const created = { id: `order_${crypto.randomBytes(7).toString("hex")}`, status: "created", ...body };
    razorpayOrders.set(created.id, created);
    return Response.json(created);
  }
  const paymentMatch = path.match(/^\/v1\/payments\/([^/]+)$/);
  if (options.method === "GET" && paymentMatch && razorpayPayments.has(paymentMatch[1])) {
    // Network latency, so concurrent callbacks genuinely overlap.
    await new Promise((resolve) => setTimeout(resolve, 25));
    return Response.json(razorpayPayments.get(paymentMatch[1]));
  }
  return Response.json({ error: { code: "BAD_REQUEST_ERROR" } }, { status: 400 });
};

// Simulates the customer paying in Razorpay Checkout.
const pay = (razorpayOrderId, overrides = {}) => {
  const id = `pay_${crypto.randomBytes(7).toString("hex")}`;
  const { amount } = razorpayOrders.get(razorpayOrderId) || { amount: 0 };
  razorpayPayments.set(id, {
    id, entity: "payment", order_id: razorpayOrderId, amount, currency: "INR",
    status: "captured", captured: true, ...overrides,
  });
  return id;
};
const sign = (razorpayOrderId, razorpayPaymentId, secret = TEST_KEY_SECRET) =>
  crypto.createHmac("sha256", secret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");

// ---- Server mirroring server.js middleware order ----------------------------
const orderRoutes = require("../../routes/orderRoutes");
const http = { base: "", server: null, client: 0 };
test.before(async () => {
  const app = express();
  app.set("trust proxy", true); // lets each request use its own rate-limit bucket
  app.use("/api/orders/razorpay/webhook", express.raw({ type: "*/*", limit: "100kb" }));
  app.use(express.json({ limit: "100kb" }));
  app.use("/api/orders", orderRoutes);
  http.server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => http.server.once("listening", resolve));
  http.base = `http://127.0.0.1:${http.server.address().port}`;
});
test.after(() => new Promise((resolve) => {
  http.server.close(resolve);
  http.server.closeAllConnections();
}));

const call = async (method, path, body) => {
  http.client += 1;
  const res = await fetch(`${http.base}/api/orders${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Forwarded-For": `10.0.${Math.floor(http.client / 250)}.${http.client % 250}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
};
let mobileSeq = 9000000000;
const orderBody = ({ items = [["family", 1]], paymentMethod = "RAZORPAY", mobile, extra = {} } = {}) => ({
  customerName: "Test Customer",
  email: "test@example.com",
  mobile: String(mobile || ++mobileSeq),
  address: "12 Test Street",
  city: "Raipur",
  pincode: "492001",
  shippingStateCode: "22",
  paymentMethod,
  items: items.map(([productId, quantity]) => ({ productId, weight: "1KG", quantity })),
  ...extra,
});
const createRazorpayOrder = async (options) => {
  const result = await call("POST", "/create", orderBody(options));
  assert.equal(result.status, 201, JSON.stringify(result.body));
  return result.body;
};
const verify = (razorpay_order_id, razorpay_payment_id, razorpay_signature) =>
  call("POST", "/razorpay/verify", { razorpay_order_id, razorpay_payment_id, razorpay_signature });
const stored = (orderId) => [...orders.values()].find((doc) => doc.orderId === orderId);

// ---- Webhook helpers --------------------------------------------------------
// Pretty-printed on purpose: the signature must be checked on these exact
// bytes, so re-serializing the parsed JSON would break verification.
const webhookBody = ({ event = "payment.captured", paymentId, payment, includeOrder = event === "order.paid", orderEntityId }) => {
  const entity = payment || razorpayPayments.get(paymentId);
  const payload = { payment: { entity } };
  if (includeOrder) payload.order = { entity: { id: orderEntityId || entity.order_id, entity: "order", status: "paid" } };
  return JSON.stringify({
    entity: "event",
    account_id: "acc_test",
    event,
    contains: Object.keys(payload),
    payload,
    created_at: Math.floor(Date.now() / 1000),
  }, null, 2);
};
const signWebhook = (rawBody, secret = TEST_WEBHOOK_SECRET) =>
  crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
const sendWebhook = async (rawBody, { signature = signWebhook(rawBody), eventId = `evt_${crypto.randomBytes(7).toString("hex")}` } = {}) => {
  const headers = { "Content-Type": "application/json", "x-razorpay-event-id": eventId };
  if (signature !== null) headers["X-Razorpay-Signature"] = signature;
  const res = await fetch(`${http.base}/api/orders/razorpay/webhook`, { method: "POST", headers, body: rawBody });
  return { status: res.status, body: await res.json() };
};

// How many times the order-received and payment emails were attempted for an order.
const emailAttempts = (orderId) => ({
  received: logged.filter((line) => line.startsWith("Sending order received email:") && line.includes(`"${orderId}"`)).length,
  payment: logged.filter((line) => line.startsWith("Order email skipped/failed:") && line.includes(`"${orderId}"`) && line.includes('"type":"payment"')).length,
});

module.exports = {
  TEST_KEY_ID,
  TEST_KEY_SECRET,
  TEST_WEBHOOK_SECRET,
  call,
  counters,
  createRazorpayOrder,
  emailAttempts,
  logged,
  orderBody,
  pay,
  razorpayCalls,
  razorpayPayments,
  sendWebhook,
  sign,
  signWebhook,
  stock,
  stored,
  verify,
  webhookBody,
};
