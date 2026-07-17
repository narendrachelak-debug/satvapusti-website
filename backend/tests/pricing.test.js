const test = require("node:test");
const assert = require("node:assert/strict");
const Product = require("../models/Product");
const { calculateOrder, extractInclusiveTax, validateGstin } = require("../services/pricingService");

const familyProduct = {
  productId: "family",
  name: "SatvaPusti Family Nutrition Formula",
  isActive: true,
  weights: {
    "1KG": {
      mrp: 1999,
      offer: 1799,
      mrpPaise: 199900,
      sellingPricePaise: 179900,
      gstRateBasisPoints: 500,
      taxInclusive: true,
      hsnCode: "1106",
      discountLabel: "10% OFF",
      packSize: "1 Kg",
      sku: "FAMILY-1KG",
    },
  },
};

Product.findOne = () => ({ lean: async () => familyProduct });
const item = (quantity = 1, tamperedPrice = undefined) => ({
  productId: "family",
  weight: "1KG",
  quantity,
  offer: tamperedPrice,
});

test("Chhattisgarh extracts CGST and SGST from 1799 without adding tax", async () => {
  const quote = await calculateOrder({ items: [item()], shippingStateCode: "22" });
  assert.equal(quote.finalPayablePaise, 179900);
  assert.equal(quote.placeOfSupplyState, "Chhattisgarh");
  assert.equal(quote.cgstRateBasisPoints, 250);
  assert.equal(quote.sgstRateBasisPoints, 250);
  assert.equal(quote.igstAmountPaise, 0);
  assert.equal(quote.taxableValuePaise, 171333);
  assert.equal(quote.cgstAmountPaise + quote.sgstAmountPaise, quote.gstAmountPaise);
});

test("two units calculate tax on the 3598 line total", async () => {
  const quote = await calculateOrder({ items: [item(2)], shippingStateCode: "22" });
  assert.equal(quote.grossSellingTotalPaise, 359800);
  assert.deepEqual(extractInclusiveTax(359800), {
    taxableValuePaise: quote.taxableValuePaise,
    gstAmountPaise: quote.gstAmountPaise,
  });
});

for (const [code, name] of [["23", "Madhya Pradesh"], ["27", "Maharashtra"], ["07", "Delhi"]]) {
  test(`${name} (${code}) uses IGST and preserves state code`, async () => {
    const quote = await calculateOrder({ items: [item()], shippingStateCode: code });
    assert.equal(quote.placeOfSupplyStateCode, code);
    assert.equal(quote.supplyType, "INTER_STATE");
    assert.equal(quote.igstRateBasisPoints, 500);
    assert.equal(quote.cgstAmountPaise, 0);
    assert.equal(quote.sgstAmountPaise, 0);
    assert.equal(quote.finalPayablePaise, 179900);
  });
}

test("GSTIN state code must match billing state", () => {
  assert.equal(
    validateGstin({ gstin: "23ABCDE1234F1Z5", billingStateCode: "23" }),
    "23ABCDE1234F1Z5"
  );
  assert.throws(
    () => validateGstin({ gstin: "23ABCDE1234F1Z5", billingStateCode: "22" }),
    /does not match/
  );
});

test("coupon tax is extracted after discount", async () => {
  const quote = await calculateOrder({
    items: [item()], shippingStateCode: "22", couponDiscountPaise: 10000,
  });
  assert.equal(quote.finalPayablePaise, 169900);
  assert.equal(quote.taxableValuePaise + quote.gstAmountPaise, 169900);
});

test("tampered frontend price is ignored in favor of product data", async () => {
  const quote = await calculateOrder({ items: [item(1, 1)], shippingStateCode: "22" });
  assert.equal(quote.lines[0].sellingPricePaise, 179900);
  assert.equal(quote.finalPayablePaise, quote.gatewayOrderAmountPaise || 179900);
});
