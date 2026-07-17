const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { GST_STATES, getStateByCode } = require("../data/gstStates");
const business = require("../config/business");

const root = path.resolve(__dirname, "../..");

test("GST State/UT master stores two-digit string codes", () => {
  assert.ok(GST_STATES.length >= 36);
  assert.equal(getStateByCode("07").state_name, "Delhi");
  assert.equal(getStateByCode("22").state_abbreviation, "CG");
  assert.ok(GST_STATES.every((state) => /^\d{2}$/.test(state.gst_state_code)));
});

test("central seller configuration is GST registered in Chhattisgarh", () => {
  assert.equal(business.gstin, "22AMIPN1783D1Z9");
  assert.equal(business.stateName, "Chhattisgarh");
  assert.equal(business.stateCode, "22");
});

test("product UI contract contains rounded price and inclusive-tax label", () => {
  const app = fs.readFileSync(path.join(root, "src/App.jsx"), "utf8");
  assert.match(app, /mrp: 1999, offer: 1799/);
  assert.match(app, /discountLabel: "10% OFF"/);
  assert.match(app, /Inclusive of all taxes/);
  assert.doesNotMatch(app, /1799\.10/);
});

test("structured product offer publishes 1799 INR", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /"priceCurrency": "INR"/);
  assert.match(html, /"price": "1799\.00"/);
});

test("new invoice template includes required state and GST fields", () => {
  const admin = fs.readFileSync(path.join(root, "src/Admin.jsx"), "utf8");
  for (const label of ["TAX INVOICE", "Billing State:", "Shipping State:", "Place of Supply:", "HSN", "GST-inclusive price", "Unregistered (B2C)"]) {
    assert.ok(admin.includes(label), `missing invoice label: ${label}`);
  }
  assert.match(admin, /banners\/logo-banner\.png/);
});
