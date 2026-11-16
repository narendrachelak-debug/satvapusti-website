const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const normalizeManualCashSale = (payload = {}) => {
  const period = String(payload.period || "").trim();
  if (!PERIOD_PATTERN.test(period)) {
    throw new Error("Period must be a valid YYYY-MM month");
  }

  const quantityKg = Number(payload.quantityKg);
  const thousandths = quantityKg * 1000;
  if (
    !Number.isFinite(quantityKg) ||
    quantityKg < 0 ||
    quantityKg > 1000000 ||
    Math.abs(Math.round(thousandths) - thousandths) > 1e-8
  ) {
    throw new Error("Quantity must be between 0 and 1,000,000 kg with up to 3 decimals");
  }

  return { period, quantityKg };
};

module.exports = { normalizeManualCashSale };
