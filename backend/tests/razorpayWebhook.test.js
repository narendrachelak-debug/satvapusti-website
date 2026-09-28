const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const {
  TEST_KEY_SECRET,
  TEST_WEBHOOK_SECRET,
  createRazorpayOrder,
  emailAttempts,
  logged,
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
} = require("./helpers/razorpayHarness");

// Customer pays, then closes the browser: only the webhook will arrive.
const paidButBrowserClosed = async (options) => {
  const created = await createRazorpayOrder(options);
  const paymentId = pay(created.razorpay.orderId);
  return { ...created, paymentId };
};

test("webhook success: payment.captured marks the order Paid when the browser never verified", async () => {
  const stockBefore = stock.get("family|1KG");
  const { order, paymentId } = await paidButBrowserClosed({ items: [["family", 2]] });
  assert.equal(stored(order.orderId).paymentStatus, "Pending");

  const result = await sendWebhook(webhookBody({ paymentId }));
  assert.equal(result.status, 200);
  assert.equal(result.body.processed, true);
  const saved = stored(order.orderId);
  assert.equal(saved.paymentStatus, "Paid");
  assert.equal(saved.razorpayPaymentId, paymentId);
  assert.equal(saved.paymentAmountPaise, 359800);
  assert.equal(stock.get("family|1KG"), stockBefore - 2);
  assert.deepEqual(emailAttempts(order.orderId), { received: 1, payment: 1 });
});

test("webhook success: order.paid is handled the same way", async () => {
  const { order, paymentId } = await paidButBrowserClosed();
  const result = await sendWebhook(webhookBody({ event: "order.paid", paymentId }));
  assert.equal(result.status, 200);
  assert.equal(result.body.processed, true);
  assert.equal(stored(order.orderId).paymentStatus, "Paid");
});

test("invalid webhook signatures are rejected before anything is looked up", async () => {
  const { order, paymentId } = await paidButBrowserClosed();
  const raw = webhookBody({ paymentId });
  const callsBefore = razorpayCalls.length;
  const attempts = [
    { body: raw, signature: signWebhook(raw, crypto.randomBytes(24).toString("hex")) }, // wrong secret
    { body: raw, signature: signWebhook(raw, TEST_KEY_SECRET) }, // API key secret instead of webhook secret
    { body: raw.replace('"captured"', '"captured" '), signature: signWebhook(raw) }, // body altered after signing
    { body: JSON.stringify(JSON.parse(raw)), signature: signWebhook(raw) }, // re-serialized body
    { body: raw, signature: "0".repeat(64) },
    { body: raw, signature: null }, // header missing
  ];
  for (const attempt of attempts) {
    const result = await sendWebhook(attempt.body, { signature: attempt.signature });
    assert.equal(result.status, 400);
    assert.equal(result.body.success, false);
  }
  assert.equal(stored(order.orderId).paymentStatus, "Pending");
  assert.equal(razorpayCalls.length, callsBefore, "no Razorpay lookup for an unauthenticated webhook");
});

test("duplicate and replayed webhooks process the payment only once", async () => {
  const stockBefore = stock.get("family|1KG");
  const { order, paymentId } = await paidButBrowserClosed();
  const raw = webhookBody({ paymentId });
  const eventId = `evt_${crypto.randomBytes(7).toString("hex")}`;
  const results = await Promise.all([1, 2, 3].map(() => sendWebhook(raw, { eventId })));
  const later = await sendWebhook(raw, { eventId });
  const all = [...results, later];
  assert.ok(all.every((r) => r.status === 200));
  assert.equal(all.filter((r) => r.body.processed).length, 1);
  assert.ok(all.filter((r) => !r.body.processed).every((r) => r.body.outcome === "alreadyPaid"));
  assert.equal(stock.get("family|1KG"), stockBefore - 1);
  assert.deepEqual(emailAttempts(order.orderId), { received: 1, payment: 1 });
});

test("browser verification and webhook arriving together settle the order exactly once", async () => {
  for (let round = 0; round < 5; round += 1) {
    const stockBefore = stock.get("family|1KG");
    const { order, razorpay, paymentId } = await paidButBrowserClosed();
    const [browser, webhook] = await Promise.all([
      verify(razorpay.orderId, paymentId, sign(razorpay.orderId, paymentId)),
      sendWebhook(webhookBody({ paymentId })),
    ]);
    assert.equal(browser.status, 200);
    assert.equal(browser.body.success, true);
    assert.equal(webhook.status, 200);
    const winners = [!browser.body.alreadyVerified, webhook.body.processed].filter(Boolean).length;
    assert.equal(winners, 1, "exactly one of browser/webhook performs the Paid transition");
    assert.equal(stored(order.orderId).paymentStatus, "Paid");
    assert.equal(stock.get("family|1KG"), stockBefore - 1, "stock deducted once");
    assert.deepEqual(emailAttempts(order.orderId), { received: 1, payment: 1 }, "emails sent once");
  }
});

test("wrong amount, wrong order or unknown order never marks anything Paid", async () => {
  // Razorpay reports a different amount than this order's server-side total.
  const underpaid = await createRazorpayOrder();
  const underpaidPayment = pay(underpaid.razorpay.orderId, { amount: 100 });
  const r1 = await sendWebhook(webhookBody({ paymentId: underpaidPayment }));
  assert.equal(r1.status, 200);
  assert.equal(r1.body.processed, false);
  assert.equal(r1.body.outcome, "mismatch");
  assert.equal(stored(underpaid.order.orderId).paymentStatus, "Pending");

  // A signed event naming order A but carrying a payment that belongs to order B.
  const orderA = await createRazorpayOrder();
  const orderB = await createRazorpayOrder();
  const paymentForB = pay(orderB.razorpay.orderId);
  const crossed = { ...razorpayPayments.get(paymentForB), order_id: orderA.razorpay.orderId };
  const r2 = await sendWebhook(webhookBody({ payment: crossed }));
  assert.equal(r2.body.processed, false);
  assert.equal(r2.body.outcome, "mismatch");
  assert.equal(stored(orderA.order.orderId).paymentStatus, "Pending");
  assert.equal(stored(orderB.order.orderId).paymentStatus, "Pending");

  // order.paid whose order entity disagrees with the payment's order.
  const r3 = await sendWebhook(webhookBody({ event: "order.paid", paymentId: paymentForB, orderEntityId: orderA.razorpay.orderId }));
  assert.equal(r3.body.processed, false);
  assert.equal(stored(orderB.order.orderId).paymentStatus, "Pending");

  // A payment for a Razorpay order this shop never created.
  const unknown = await sendWebhook(webhookBody({
    payment: { id: "pay_unknown0001", order_id: "order_unknown0001", amount: 179900, currency: "INR", status: "captured" },
  }));
  assert.equal(unknown.status, 200);
  assert.equal(unknown.body.processed, false);
  assert.equal(unknown.body.outcome, "unknownOrder");

  // Currency mismatch reported by Razorpay.
  const usd = await createRazorpayOrder();
  const usdPayment = pay(usd.razorpay.orderId, { currency: "USD" });
  const r4 = await sendWebhook(webhookBody({ paymentId: usdPayment }));
  assert.equal(r4.body.outcome, "mismatch");
  assert.equal(stored(usd.order.orderId).paymentStatus, "Pending");
});

test("a payment already settled cannot be overwritten by a different payment's webhook", async () => {
  const { order, razorpay, paymentId } = await paidButBrowserClosed();
  await sendWebhook(webhookBody({ paymentId }));
  const secondPayment = pay(razorpay.orderId);
  const result = await sendWebhook(webhookBody({ paymentId: secondPayment }));
  assert.equal(result.body.processed, false);
  assert.equal(result.body.outcome, "conflict");
  assert.equal(stored(order.orderId).razorpayPaymentId, paymentId);
});

test("non-captured payments are never marked Paid, even if the event claims capture", async () => {
  for (const status of ["authorized", "failed", "created", "refunded"]) {
    const { order, razorpay } = await createRazorpayOrder();
    const paymentId = pay(razorpay.orderId, { status });
    // The event body claims "captured", but Razorpay's API reports the real status.
    const claimed = { ...razorpayPayments.get(paymentId), status: "captured", captured: true };
    const result = await sendWebhook(webhookBody({ payment: claimed }));
    assert.equal(result.status, 200);
    assert.equal(result.body.processed, false, status);
    assert.equal(stored(order.orderId).paymentStatus, "Pending", status);
  }
});

test("other authentic events are acknowledged but settle nothing", async () => {
  const { order, paymentId } = await paidButBrowserClosed();
  for (const event of ["payment.authorized", "payment.failed", "refund.processed"]) {
    const result = await sendWebhook(webhookBody({ event, paymentId, includeOrder: false }));
    assert.equal(result.status, 200);
    assert.equal(result.body.processed, false);
  }
  assert.equal(stored(order.orderId).paymentStatus, "Pending");
});

test("without RAZORPAY_WEBHOOK_SECRET the webhook refuses to process", async () => {
  const { order, paymentId } = await paidButBrowserClosed();
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  try {
    const raw = webhookBody({ paymentId });
    const result = await sendWebhook(raw, { signature: signWebhook(raw) });
    assert.equal(result.status, 503);
    assert.equal(stored(order.orderId).paymentStatus, "Pending");
  } finally {
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
  }
});

test("server.js keeps the raw body for the webhook path, ahead of the JSON parser", () => {
  const server = fs.readFileSync(path.resolve(__dirname, "../server.js"), "utf8");
  const rawMount = server.indexOf('app.use("/api/orders/razorpay/webhook", express.raw(');
  const jsonParser = server.indexOf("app.use(express.json(");
  assert.ok(rawMount > -1, "raw body parser for the webhook path is missing");
  assert.ok(rawMount < jsonParser, "raw body parser must run before express.json");
});

test("neither secret ever appears in log output", () => {
  assert.ok(logged.length > 0);
  for (const line of logged) {
    assert.ok(!line.includes(TEST_WEBHOOK_SECRET), "webhook secret leaked into logs");
    assert.ok(!line.includes(TEST_KEY_SECRET), "key secret leaked into logs");
  }
});
