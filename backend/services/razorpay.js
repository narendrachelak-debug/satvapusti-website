const crypto = require("node:crypto");

// Razorpay Orders + Standard Checkout integration using the REST API directly.
// Credentials come only from RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET. The secret
// is used here and nowhere else, and is never logged or returned.
const RAZORPAY_API = "https://api.razorpay.com/v1";

const getKeyId = () => String(process.env.RAZORPAY_KEY_ID || "").trim();
const getKeySecret = () => String(process.env.RAZORPAY_KEY_SECRET || "").trim();

const isRazorpayConfigured = () => Boolean(getKeyId() && getKeySecret());
const isRazorpayTestMode = () => getKeyId().startsWith("rzp_test_");

class RazorpayError extends Error {
  constructor(message, { statusCode, code } = {}) {
    super(message);
    this.name = "RazorpayError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const razorpayRequest = async (method, path, body) => {
  if (!isRazorpayConfigured()) throw new RazorpayError("Razorpay is not configured");
  const auth = Buffer.from(`${getKeyId()}:${getKeySecret()}`).toString("base64");
  let response;
  try {
    response = await fetch(`${RAZORPAY_API}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw new RazorpayError(`Razorpay request could not be completed (${error.name})`);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new RazorpayError("Razorpay request was rejected", {
      statusCode: response.status,
      code: data?.error?.code,
    });
  }
  return data;
};

// Amount must be the server-calculated payable amount in paise.
const createRazorpayOrder = async ({ amountPaise, receipt, notes }) => {
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) {
    throw new RazorpayError("Invalid payable amount for online payment");
  }
  return razorpayRequest("POST", "/orders", {
    amount: amountPaise,
    currency: "INR",
    receipt: String(receipt || "").slice(0, 40),
    notes,
  });
};

const fetchRazorpayPayment = (paymentId) =>
  razorpayRequest("GET", `/payments/${encodeURIComponent(paymentId)}`);

// Razorpay: generated_signature = hmac_sha256(order_id + "|" + razorpay_payment_id, secret)
const isValidPaymentSignature = ({ razorpayOrderId, razorpayPaymentId, signature }) => {
  const secret = getKeySecret();
  if (!secret || typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, "hex"));
};

const getWebhookSecret = () => String(process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();
const isRazorpayWebhookConfigured = () => Boolean(isRazorpayConfigured() && getWebhookSecret());

// Razorpay: X-Razorpay-Signature = hex(hmac_sha256(raw request body, webhook secret)).
// The body must be the raw bytes as received, never parsed and re-serialized.
const isValidWebhookSignature = (rawBody, signature) => {
  const secret = getWebhookSecret();
  if (!secret || !Buffer.isBuffer(rawBody) || typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, "hex"));
};

module.exports = {
  RazorpayError,
  isRazorpayWebhookConfigured,
  isValidWebhookSignature,
  createRazorpayOrder,
  fetchRazorpayPayment,
  getKeyId,
  isRazorpayConfigured,
  isRazorpayTestMode,
  isValidPaymentSignature,
};
