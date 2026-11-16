import assert from "node:assert/strict";
import test from "node:test";
import { parseHistoricalSalesSheet } from "./historicalSalesImport.mjs";

const headers = [
  "NAME",
  "ADDRESH",
  null,
  "CITY",
  "STATE",
  "PIN",
  "MOBILE NO",
  "QNTY",
  "PRICE",
  "INVOICE DATE",
];

test("parses dated sales and skips only rows with no invoice date", () => {
  const result = parseHistoricalSalesSheet([
    headers,
    ["Customer One", "Address One", "-", "City", "CHHATTISGARH", 490006, null, "1KG", 1799, new Date("2026-10-01T00:00:00Z")],
    ["Customer Two", "Address Two", "-", "City", "CHHATTISGARH", null, "9123456789", "500G", 999, null],
    ["Customer Three", "Address Three", "-", "City", "CHHATTISGARH", 490006, "", "500G", 999, 46297],
  ]);

  assert.deepEqual(result.missingDateRows, [3]);
  assert.equal(result.summary.rows, 2);
  assert.equal(result.summary.quantityKg, 1.5);
  assert.equal(result.summary.totalAmountPaise, 279800);
  assert.equal(result.sales[0].invoiceDate, "2026-10-01");
  assert.equal(result.sales[1].invoiceDate, "2026-10-02");
  assert.equal(result.sales[1].mobile, "");
});

test("rejects missing required columns and invalid dated sales", () => {
  assert.throws(
    () => parseHistoricalSalesSheet([["NAME"], ["Customer"]]),
    /missing required columns/
  );
  assert.throws(
    () => parseHistoricalSalesSheet([
      headers,
      ["Customer", "", "-", "City", "CHHATTISGARH", "", "", "250G", 499, "2026-10-01"],
    ]),
    /ADDRESH is missing|unsupported QNTY value/
  );
});
