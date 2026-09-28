const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const {
  TEST_KEY_ID,
  TEST_KEY_SECRET,
  call,
  counters,
  createRazorpayOrder,
  logged,
  orderBody,
  pay,
  razorpayCalls,
  sign,
  stock,
  stored,
  verify,
} = require("./helpers/razorpayHarness");
const { isValidPaymentSignature } = require("../services/razorpay");

// ---- Tests ------------------------------------------------------------------
test("payment options expose only an enabled flag and test mode, never keys", async () => {
  const { status, body } = await call("GET", "/payment-options");
  assert.equal(status, 200);
  assert.deepEqual(body.razorpay, { enabled: true, testMode: true });
  assert.ok(!JSON.stringify(body).includes(TEST_KEY_SECRET));
});

test("amount tampering: the Razorpay order always uses the server-calculated amount", async () => {
  const before = razorpayCalls.length;
  const body = await createRazorpayOrder({
    items: [["family", 2]],
    extra: { totalAmount: 1, totalAmountPaise: 100, amount: 100, paymentStatus: "Paid" },
  });
  const createCall = razorpayCalls.slice(before).find((c) => c.path === "/v1/orders");
  assert.equal(createCall.body.amount, 359800);
  assert.equal(createCall.body.currency, "INR");
  assert.equal(createCall.body.receipt, body.order.orderId);
  assert.equal(body.razorpay.amount, 359800);
  assert.equal(body.razorpay.keyId, TEST_KEY_ID);
  assert.equal(body.razorpay.testMode, true);
  assert.equal(body.order.paymentStatus, "Pending", "a client cannot mark an online order Paid");
  assert.ok(!JSON.stringify(body).includes(TEST_KEY_SECRET), "the secret must never reach the browser");
  assert.equal(stored(body.order.orderId).razorpayOrderId, body.razorpay.orderId);
});

test("valid signature for a captured payment marks the order Paid", async () => {
  const stockBefore = stock.get("family|1KG");
  const { order, razorpay } = await createRazorpayOrder();
  const paymentId = pay(razorpay.orderId);
  const result = await verify(razorpay.orderId, paymentId, sign(razorpay.orderId, paymentId));
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  const saved = stored(order.orderId);
  assert.equal(saved.paymentStatus, "Paid");
  assert.equal(saved.razorpayPaymentId, paymentId);
  assert.equal(saved.paymentAmountPaise, 179900);
  assert.ok(saved.paymentDate);
  assert.equal(saved.inventoryDeducted, true);
  assert.equal(stock.get("family|1KG"), stockBefore - 1);
});

test("invalid signatures never mark the order Paid or reach Razorpay", async () => {
  const { order, razorpay } = await createRazorpayOrder();
  const paymentId = pay(razorpay.orderId);
  const callsBefore = razorpayCalls.length;
  const forged = [
    sign(razorpay.orderId, paymentId, crypto.randomBytes(24).toString("hex")), // wrong secret
    sign(razorpay.orderId, `pay_${crypto.randomBytes(7).toString("hex")}`), // other payment
    sign(`order_${crypto.randomBytes(7).toString("hex")}`, paymentId), // other order
    "0".repeat(64),
    "not-a-signature",
    "",
  ];
  for (const signature of forged) {
    const result = await verify(razorpay.orderId, paymentId, signature);
    assert.equal(result.status, 400);
    assert.equal(result.body.success, false);
  }
  assert.equal(stored(order.orderId).paymentStatus, "Pending");
  assert.equal(razorpayCalls.length, callsBefore, "a bad signature is rejected before any Razorpay or database lookup");
});

test("duplicate and concurrent verification callbacks process the payment only once", async () => {
  const stockBefore = stock.get("family|1KG");
  const { order, razorpay } = await createRazorpayOrder({ items: [["family", 3]] });
  const paymentId = pay(razorpay.orderId);
  const signature = sign(razorpay.orderId, paymentId);
  const results = await Promise.all([1, 2, 3].map(() => verify(razorpay.orderId, paymentId, signature)));
  assert.ok(results.every((r) => r.status === 200 && r.body.success === true));
  assert.equal(results.filter((r) => !r.body.alreadyVerified).length, 1, "exactly one callback performs the Paid transition");
  const again = await verify(razorpay.orderId, paymentId, signature);
  assert.equal(again.status, 200);
  assert.equal(again.body.alreadyVerified, true);
  assert.equal(stock.get("family|1KG"), stockBefore - 3, "stock is deducted exactly once");
  assert.equal(stored(order.orderId).paymentStatus, "Paid");

  // A second, different payment for an already-paid order is refused.
  const secondPayment = pay(razorpay.orderId);
  const conflict = await verify(razorpay.orderId, secondPayment, sign(razorpay.orderId, secondPayment));
  assert.equal(conflict.status, 409);
  assert.equal(stored(order.orderId).razorpayPaymentId, paymentId);
});

test("failed, authorised-only and cancelled payments are never marked Paid", async () => {
  const failed = await createRazorpayOrder();
  const failedPayment = pay(failed.razorpay.orderId, { status: "failed" });
  const failedResult = await verify(failed.razorpay.orderId, failedPayment, sign(failed.razorpay.orderId, failedPayment));
  assert.equal(failedResult.status, 400);
  assert.equal(stored(failed.order.orderId).paymentStatus, "Pending");

  const authorised = await createRazorpayOrder();
  const authPayment = pay(authorised.razorpay.orderId, { status: "authorized" });
  const authResult = await verify(authorised.razorpay.orderId, authPayment, sign(authorised.razorpay.orderId, authPayment));
  assert.equal(authResult.status, 202);
  assert.equal(authResult.body.pending, true);
  assert.equal(stored(authorised.order.orderId).paymentStatus, "Pending");

  // Customer closes Checkout: no verification call happens, so the order stays unpaid.
  const cancelled = await createRazorpayOrder();
  assert.equal(stored(cancelled.order.orderId).paymentStatus, "Pending");
  assert.equal(stored(cancelled.order.orderId).razorpayPaymentId, "");
});

test("a payment for a different amount or another order is rejected", async () => {
  const { order, razorpay } = await createRazorpayOrder();
  const underpaid = pay(razorpay.orderId, { amount: 100 });
  const underpaidResult = await verify(razorpay.orderId, underpaid, sign(razorpay.orderId, underpaid));
  assert.equal(underpaidResult.status, 400);

  const other = await createRazorpayOrder();
  const otherPayment = pay(other.razorpay.orderId);
  // Correctly signed for the other order, replayed against this one.
  const replayed = await verify(razorpay.orderId, otherPayment, sign(razorpay.orderId, otherPayment));
  assert.equal(replayed.status, 400);
  assert.equal(stored(order.orderId).paymentStatus, "Pending");
});

test("double-click / refresh reuses the same order and Razorpay order", async () => {
  const mobile = "9812345678";
  const ordersBefore = counters.saves;
  const razorpayOrdersBefore = razorpayCalls.filter((c) => c.path === "/v1/orders").length;
  const first = await call("POST", "/create", orderBody({ mobile }));
  const second = await call("POST", "/create", orderBody({ mobile }));
  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  assert.equal(second.body.replay, true);
  assert.equal(second.body.order.orderId, first.body.order.orderId);
  assert.equal(second.body.razorpay.orderId, first.body.razorpay.orderId);
  assert.equal(counters.saves - ordersBefore, 1);
  assert.equal(razorpayCalls.filter((c) => c.path === "/v1/orders").length - razorpayOrdersBefore, 1);
});

test("Coming Soon products cannot be bought through Razorpay", async () => {
  const savesBefore = counters.saves;
  const callsBefore = razorpayCalls.length;
  for (const items of [[["kids", 1]], [["active", 1]], [["family", 1], ["kids", 1]]]) {
    const result = await call("POST", "/create", orderBody({ items }));
    assert.equal(result.status, 400);
    assert.match(result.body.message, /coming soon/i);
  }
  assert.equal(counters.saves, savesBefore);
  assert.equal(razorpayCalls.length, callsBefore, "no Razorpay order is created");
});

test("without Razorpay keys, online payment is refused and COD still works", async () => {
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  try {
    const callsBefore = razorpayCalls.length;
    const options = await call("GET", "/payment-options");
    assert.equal(options.body.razorpay.enabled, false);
    const online = await call("POST", "/create", orderBody());
    assert.equal(online.status, 400);
    const cod = await call("POST", "/create", orderBody({ paymentMethod: "COD" }));
    assert.equal(cod.status, 201);
    assert.equal(cod.body.order.paymentMethod, "COD");
    assert.equal(cod.body.razorpay, undefined);
    const verifyResult = await verify("order_abcdef123456", "pay_abcdef123456", "0".repeat(64));
    assert.equal(verifyResult.status, 503);
    assert.equal(razorpayCalls.length, callsBefore);
  } finally {
    process.env.RAZORPAY_KEY_ID = TEST_KEY_ID;
    process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
  }
});

test("signature helper follows Razorpay's order_id|payment_id HMAC-SHA256 rule", () => {
  const good = sign("order_abc123", "pay_def456");
  assert.equal(isValidPaymentSignature({ razorpayOrderId: "order_abc123", razorpayPaymentId: "pay_def456", signature: good }), true);
  assert.equal(isValidPaymentSignature({ razorpayOrderId: "order_abc123", razorpayPaymentId: "pay_def457", signature: good }), false);
  assert.equal(isValidPaymentSignature({ razorpayOrderId: "order_abc123", razorpayPaymentId: "pay_def456", signature: good.slice(2) }), false);
  assert.equal(isValidPaymentSignature({ razorpayOrderId: "order_abc123", razorpayPaymentId: "pay_def456", signature: undefined }), false);
});

test("the key secret never appears in any log output", () => {
  assert.ok(logged.length > 0);
  for (const line of logged) {
    assert.ok(!line.includes(TEST_KEY_SECRET), "secret leaked into logs");
    assert.ok(!line.includes(Buffer.from(`${TEST_KEY_ID}:${TEST_KEY_SECRET}`).toString("base64")), "auth header leaked into logs");
  }
});
