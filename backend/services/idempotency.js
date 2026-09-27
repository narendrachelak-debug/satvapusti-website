const crypto = require("node:crypto");

const ORDER_RETRY_WINDOW_MS = 2 * 60 * 1000;

const computeOrderSignature = ({ mobile, pincode, paymentMethod, items }) => {
  const normalizedItems = (Array.isArray(items) ? items : [])
    .map((item) => ({
      productId: String(item.productId || "").trim().toLowerCase(),
      weight: String(item.weight || "").trim().toUpperCase(),
      quantity: Number(item.quantity || 0),
    }))
    .sort((a, b) =>
      a.productId.localeCompare(b.productId) || a.weight.localeCompare(b.weight)
    );

  const payload = JSON.stringify({
    mobile: String(mobile || "").trim(),
    pincode: String(pincode || "").trim(),
    paymentMethod: String(paymentMethod || "").trim().toUpperCase(),
    items: normalizedItems,
  });

  return crypto.createHash("sha256").update(payload).digest("hex");
};

module.exports = { computeOrderSignature, ORDER_RETRY_WINDOW_MS };
