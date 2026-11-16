const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeHistoricalSale } = require("../services/historicalSalesImport");
const Order = require("../models/Order");

test("normalizes a historical cash-sale row without inventing missing contact fields", () => {
  const sale = normalizeHistoricalSale({
    rowNumber: 2,
    customerName: "  Customer One ",
    address: " Main Road ",
    city: " Raipur ",
    state: "CHHATTISGARH",
    pincode: "",
    mobile: "",
    weight: "1KG",
    pricePaise: 179900,
    invoiceDate: "2026-10-01",
  });

  assert.equal(sale.customerName, "Customer One");
  assert.equal(sale.stateCode, "22");
  assert.equal(sale.pincode, "");
  assert.equal(sale.mobile, "");
  assert.equal(sale.weight, "1KG");
  assert.equal(sale.pricePaise, 179900);
});

test("rejects undated, non-October, and invalid package or PIN data", () => {
  const valid = {
    rowNumber: 2,
    customerName: "Customer One",
    address: "Main Road",
    city: "Raipur",
    state: "CHHATTISGARH",
    pincode: "",
    weight: "1KG",
    pricePaise: 179900,
    invoiceDate: "2026-10-01",
  };

  assert.throws(() => normalizeHistoricalSale({ ...valid, invoiceDate: "" }), /October 2026/);
  assert.throws(() => normalizeHistoricalSale({ ...valid, invoiceDate: "2026-09-30" }), /October 2026/);
  assert.throws(() => normalizeHistoricalSale({ ...valid, weight: "250G" }), /package size/);
  assert.throws(() => normalizeHistoricalSale({ ...valid, pincode: "12345" }), /six digits/);
  assert.throws(() => normalizeHistoricalSale({ ...valid, rowNumber: 112 }), /valid Excel row number/);
});

test("historical orders can leave unavailable contact fields blank", async () => {
  const order = new Order({
    customerName: "Customer One",
    address: "Main Road",
    city: "Raipur",
  });
  await order.validate();
  assert.equal(order.email, "");
  assert.equal(order.mobile, "");
  assert.equal(order.pincode, "");
});
