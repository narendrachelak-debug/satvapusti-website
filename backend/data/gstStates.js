const GST_STATES = Object.freeze([
  ["01", "Jammu and Kashmir", "JK"], ["02", "Himachal Pradesh", "HP"],
  ["03", "Punjab", "PB"], ["04", "Chandigarh", "CH"],
  ["05", "Uttarakhand", "UK"], ["06", "Haryana", "HR"],
  ["07", "Delhi", "DL"], ["08", "Rajasthan", "RJ"],
  ["09", "Uttar Pradesh", "UP"], ["10", "Bihar", "BR"],
  ["11", "Sikkim", "SK"], ["12", "Arunachal Pradesh", "AR"],
  ["13", "Nagaland", "NL"], ["14", "Manipur", "MN"],
  ["15", "Mizoram", "MZ"], ["16", "Tripura", "TR"],
  ["17", "Meghalaya", "ML"], ["18", "Assam", "AS"],
  ["19", "West Bengal", "WB"], ["20", "Jharkhand", "JH"],
  ["21", "Odisha", "OD"], ["22", "Chhattisgarh", "CG"],
  ["23", "Madhya Pradesh", "MP"], ["24", "Gujarat", "GJ"],
  ["26", "Dadra and Nagar Haveli and Daman and Diu", "DN"],
  ["27", "Maharashtra", "MH"], ["29", "Karnataka", "KA"],
  ["30", "Goa", "GA"], ["31", "Lakshadweep", "LD"],
  ["32", "Kerala", "KL"], ["33", "Tamil Nadu", "TN"],
  ["34", "Puducherry", "PY"], ["35", "Andaman and Nicobar Islands", "AN"],
  ["36", "Telangana", "TS"], ["37", "Andhra Pradesh", "AP"],
  ["38", "Ladakh", "LA"], ["97", "Other Territory", "OT"],
]).map(([gstStateCode, stateName, stateAbbreviation]) => Object.freeze({
  state_name: stateName,
  gst_state_code: gstStateCode,
  state_abbreviation: stateAbbreviation,
  active: true,
}));

const getStateByCode = (code) =>
  GST_STATES.find((state) => state.gst_state_code === String(code || "").padStart(2, "0"));

module.exports = { GST_STATES, getStateByCode };
