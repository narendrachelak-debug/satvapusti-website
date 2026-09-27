const test = require("node:test");
const assert = require("node:assert/strict");
const { computeOrderSignature } = require("../services/idempotency");

const baseRequest = {
  mobile: "9876543210",
  pincode: "491335",
  paymentMethod: "COD",
  items: [{ productId: "family", weight: "1KG", quantity: 1 }],
};

test("identical retry produces the same signature", () => {
  const first = computeOrderSignature(baseRequest);
  const retry = computeOrderSignature({ ...baseRequest });
  assert.equal(first, retry);
});

test("item order in the cart does not change the signature", () => {
  const twoItems = { ...baseRequest, items: [
    { productId: "family", weight: "1KG", quantity: 1 },
    { productId: "kids", weight: "500G", quantity: 2 },
  ] };
  const reordered = { ...baseRequest, items: [
    { productId: "kids", weight: "500G", quantity: 2 },
    { productId: "family", weight: "1KG", quantity: 1 },
  ] };
  assert.equal(computeOrderSignature(twoItems), computeOrderSignature(reordered));
});

test("a different customer mobile number produces a different signature", () => {
  const other = { ...baseRequest, mobile: "9999999999" };
  assert.notEqual(computeOrderSignature(baseRequest), computeOrderSignature(other));
});

test("a different cart (quantity change) produces a different signature", () => {
  const other = { ...baseRequest, items: [{ productId: "family", weight: "1KG", quantity: 2 }] };
  assert.notEqual(computeOrderSignature(baseRequest), computeOrderSignature(other));
});

test("a different payment method produces a different signature", () => {
  const other = { ...baseRequest, paymentMethod: "UPI" };
  assert.notEqual(computeOrderSignature(baseRequest), computeOrderSignature(other));
});
