const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeManualCashSale } = require("../services/manualCashSales");

test("manual cash sale accepts a monthly aggregate without customer details", () => {
  assert.deepEqual(normalizeManualCashSale({ period: "2026-10", quantityKg: "120" }), {
    period: "2026-10",
    quantityKg: 120,
  });
  assert.equal(normalizeManualCashSale({ period: "2026-10", quantityKg: "1.001" }).quantityKg, 1.001);
});

test("manual cash sale rejects invalid periods and quantities", () => {
  for (const payload of [
    { period: "2026-13", quantityKg: 120 },
    { period: "Oct 2026", quantityKg: 120 },
    { period: "2026-10", quantityKg: -1 },
    { period: "2026-10", quantityKg: 1.2345 },
    { period: "2026-10", quantityKg: 1000001 },
    { period: "2026-10", quantityKg: "not a number" },
  ]) {
    assert.throws(() => normalizeManualCashSale(payload));
  }
});
