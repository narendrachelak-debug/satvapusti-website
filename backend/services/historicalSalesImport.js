const { GST_STATES } = require("../data/gstStates");

const cleanText = (value, maxLength) =>
  String(value ?? "")
    .replace(/[<>\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const normalizeHistoricalSale = (sale) => {
  const rowNumber = Number(sale?.rowNumber);
  if (!Number.isSafeInteger(rowNumber) || rowNumber < 2 || rowNumber > 111) {
    throw new Error("Every imported sale must include a valid Excel row number");
  }

  const invoiceDate = String(sale?.invoiceDate || "").trim();
  if (!/^2026-10-(0[1-9]|[12]\d|3[01])$/.test(invoiceDate)) {
    throw new Error(`Excel row ${rowNumber}: invoice date must be in October 2026`);
  }

  const weight = String(sale?.weight || "").replace(/\s+/g, "").toUpperCase();
  if (!["1KG", "500G"].includes(weight)) {
    throw new Error(`Excel row ${rowNumber}: unsupported package size`);
  }

  const pricePaise = Number(sale?.pricePaise);
  if (!Number.isSafeInteger(pricePaise) || pricePaise <= 0) {
    throw new Error(`Excel row ${rowNumber}: price must be a positive amount in paise`);
  }

  const state = GST_STATES.find(
    (item) => item.state_name.toLowerCase() === cleanText(sale?.state, 80).toLowerCase()
  );
  if (!state) {
    throw new Error(`Excel row ${rowNumber}: state is not recognized`);
  }

  const normalized = {
    rowNumber,
    customerName: cleanText(sale?.customerName, 100),
    address: cleanText(sale?.address, 300),
    city: cleanText(sale?.city, 100),
    stateName: state.state_name,
    stateCode: state.gst_state_code,
    pincode: cleanText(sale?.pincode, 12),
    mobile: cleanText(sale?.mobile, 30),
    weight,
    pricePaise,
    invoiceDate,
  };

  if (normalized.customerName.length < 2) {
    throw new Error(`Excel row ${rowNumber}: customer name is missing`);
  }
  if (normalized.address.length < 5) {
    throw new Error(`Excel row ${rowNumber}: address is missing`);
  }
  if (normalized.city.length < 2) {
    throw new Error(`Excel row ${rowNumber}: city is missing`);
  }
  if (normalized.pincode && !/^\d{6}$/.test(normalized.pincode)) {
    throw new Error(`Excel row ${rowNumber}: PIN must be six digits when provided`);
  }

  return normalized;
};

module.exports = { normalizeHistoricalSale };
