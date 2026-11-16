import assert from "node:assert/strict";
import test from "node:test";
import { createDemoInvoiceOrders } from "./demoInvoiceData.mjs";

test("demo invoice data has 120 isolated customers and the requested 100 kg mix", () => {
  const orders = createDemoInvoiceOrders();

  assert.equal(orders.length, 120);
  assert.equal(orders.reduce((total, order) => total + order.quantityKg, 0), 100);
  assert.equal(orders.filter((order) => order.weight === "250G").length, 20);
  assert.equal(orders.filter((order) => order.weight === "1KG").length, 90);
  assert.equal(orders.filter((order) => order.weight === "500G").length, 10);
  assert.ok(orders.every((order) => order.orderId.startsWith("DEMO-")));
  assert.ok(orders.every((order) => order.mobile.includes("NO REAL NUMBER")));
  assert.ok(orders.every((order) => order.email.endsWith("@example.invalid")));
});

test("demo invoices use the configured Family product prices when available", () => {
  const orders = createDemoInvoiceOrders({
    weights: {
      "250G": { offer: 501, mrp: 601, gstRateBasisPoints: 500, hsnCode: "1106" },
      "500G": { offer: 1001, mrp: 1101 },
      "1KG": { offer: 1801, mrp: 2001 },
    },
  });

  assert.equal(orders[0].sellingPricePaise, 50100);
  assert.equal(orders[20].sellingPricePaise, 180100);
  assert.equal(orders[110].sellingPricePaise, 100100);
});
