const Product = require("../models/Product");
const business = require("../config/business");
const { getStateByCode } = require("../data/gstStates");

const CALCULATION_VERSION = "gst-inclusive-v1";
const GST_RATE_BPS = 500;

const rupeesToPaise = (value) => {
  const normalized = String(value ?? "0").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error("Invalid money amount");
  const [rupees, paise = ""] = normalized.split(".");
  return Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
};

const assertInteger = (value, label) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error(`${label} must be a whole number`);
  return number;
};

const extractInclusiveTax = (inclusivePaise, rateBasisPoints = GST_RATE_BPS) => {
  const amount = assertInteger(inclusivePaise, "Inclusive amount");
  const rate = assertInteger(rateBasisPoints, "GST rate");
  const taxableValuePaise = Math.round((amount * 10000) / (10000 + rate));
  const gstAmountPaise = amount - taxableValuePaise;
  return { taxableValuePaise, gstAmountPaise };
};

const validateGstin = ({ gstin, billingStateCode }) => {
  const normalized = String(gstin || "").trim().toUpperCase();
  if (!normalized) return "";
  if (!/^\d{2}[A-Z0-9]{13}$/.test(normalized)) {
    throw new Error("GSTIN must be 15 characters and begin with a two-digit state code");
  }
  if (normalized.slice(0, 2) !== billingStateCode) {
    throw new Error("Customer GSTIN state code does not match the billing state");
  }
  return normalized;
};

const calculateOrder = async ({ items, shippingStateCode, billingStateCode, couponDiscountPaise = 0 }) => {
  const shippingState = getStateByCode(shippingStateCode);
  const billingState = getStateByCode(billingStateCode || shippingStateCode);
  if (!shippingState) throw new Error("Select a valid shipping state");
  if (!billingState) throw new Error("Select a valid billing state");
  if (!Array.isArray(items) || items.length === 0) throw new Error("Cart is empty");

  const lines = [];
  let mrpTotalPaise = 0;
  let grossSellingTotalPaise = 0;

  for (const requestItem of items) {
    const productId = String(requestItem.productId || "").trim().toLowerCase();
    const weight = String(requestItem.weight || "").toUpperCase();
    const quantity = assertInteger(requestItem.quantity, "Quantity");
    if (quantity < 1 || quantity > 99) throw new Error("Quantity must be between 1 and 99");
    const product = await Product.findOne({ productId, isActive: true }).lean();
    if (!product) throw new Error(`Product ${productId} is unavailable`);
    const variant = product.weights?.[weight];
    if (!variant) throw new Error(`Invalid pack size for ${product.name}`);
    const mrpPaise = assertInteger(variant.mrpPaise ?? Number(variant.mrp || 0) * 100, "MRP");
    const sellingPricePaise = assertInteger(
      variant.sellingPricePaise ?? Number(variant.offer || 0) * 100,
      "Selling price"
    );
    if (sellingPricePaise < 0 || mrpPaise < sellingPricePaise) throw new Error("Invalid product pricing");
    const lineMrpPaise = mrpPaise * quantity;
    const lineInclusivePaise = sellingPricePaise * quantity;
    mrpTotalPaise += lineMrpPaise;
    grossSellingTotalPaise += lineInclusivePaise;
    lines.push({
      productId: product.productId,
      productName: product.name,
      sku: variant.sku || `${product.productId}-${weight}`,
      packSize: variant.packSize || (weight === "1KG" ? "1 Kg" : weight),
      weight,
      image: variant.image || "",
      hsnCode: variant.hsnCode || "1106",
      quantity,
      mrpPaise,
      sellingPricePaise,
      lineMrpPaise,
      lineInclusivePaise,
      productDiscountPaise: lineMrpPaise - lineInclusivePaise,
      discountLabel: variant.discountLabel || "",
      gstRateBasisPoints: variant.gstRateBasisPoints ?? GST_RATE_BPS,
      taxInclusive: variant.taxInclusive !== false,
    });
  }

  const discount = Math.max(0, assertInteger(couponDiscountPaise, "Coupon discount"));
  if (discount > grossSellingTotalPaise) throw new Error("Discount exceeds the eligible amount");
  const productConsiderationPaise = grossSellingTotalPaise - discount;
  const shippingPaise = 0; // no configured shipping amount/tax treatment exists yet
  const { taxableValuePaise, gstAmountPaise } = extractInclusiveTax(productConsiderationPaise);
  const intraState = shippingState.gst_state_code === business.stateCode;
  const cgstAmountPaise = intraState ? Math.floor(gstAmountPaise / 2) : 0;
  const sgstAmountPaise = intraState ? gstAmountPaise - cgstAmountPaise : 0;
  const igstAmountPaise = intraState ? 0 : gstAmountPaise;
  const finalPayablePaise = productConsiderationPaise + shippingPaise;

  let allocatedConsideration = 0;
  let allocatedTaxable = 0;
  lines.forEach((line, index) => {
    const isLast = index === lines.length - 1;
    const lineConsiderationPaise = isLast
      ? productConsiderationPaise - allocatedConsideration
      : Math.floor((line.lineInclusivePaise * productConsiderationPaise) / grossSellingTotalPaise);
    const extracted = extractInclusiveTax(lineConsiderationPaise, line.gstRateBasisPoints);
    const lineTaxableValuePaise = isLast
      ? taxableValuePaise - allocatedTaxable
      : extracted.taxableValuePaise;
    const lineGstAmountPaise = lineConsiderationPaise - lineTaxableValuePaise;
    const lineCgstAmountPaise = intraState ? Math.floor(lineGstAmountPaise / 2) : 0;
    Object.assign(line, {
      lineConsiderationPaise,
      couponDiscountPaise: line.lineInclusivePaise - lineConsiderationPaise,
      taxableValuePaise: lineTaxableValuePaise,
      gstAmountPaise: lineGstAmountPaise,
      cgstRateBasisPoints: intraState ? 250 : 0,
      cgstAmountPaise: lineCgstAmountPaise,
      sgstRateBasisPoints: intraState ? 250 : 0,
      sgstAmountPaise: intraState ? lineGstAmountPaise - lineCgstAmountPaise : 0,
      igstRateBasisPoints: intraState ? 0 : line.gstRateBasisPoints,
      igstAmountPaise: intraState ? 0 : lineGstAmountPaise,
    });
    allocatedConsideration += lineConsiderationPaise;
    allocatedTaxable += lineTaxableValuePaise;
  });

  return {
    lines,
    mrpTotalPaise,
    grossSellingTotalPaise,
    productDiscountPaise: mrpTotalPaise - grossSellingTotalPaise,
    couponDiscountPaise: discount,
    promotionalDiscountPaise: 0,
    productConsiderationPaise,
    taxableValuePaise,
    gstRateBasisPoints: GST_RATE_BPS,
    gstAmountPaise,
    cgstRateBasisPoints: intraState ? 250 : 0,
    cgstAmountPaise,
    sgstRateBasisPoints: intraState ? 250 : 0,
    sgstAmountPaise,
    igstRateBasisPoints: intraState ? 0 : GST_RATE_BPS,
    igstAmountPaise,
    supplyType: intraState ? "INTRA_STATE" : "INTER_STATE",
    placeOfSupplyState: shippingState.state_name,
    placeOfSupplyStateCode: shippingState.gst_state_code,
    billingStateName: billingState.state_name,
    billingStateCode: billingState.gst_state_code,
    shippingStateName: shippingState.state_name,
    shippingStateCode: shippingState.gst_state_code,
    shippingPaise,
    finalPayablePaise,
    gatewayOrderAmountPaise: finalPayablePaise,
    currency: "INR",
    calculationVersion: CALCULATION_VERSION,
    seller: business,
  };
};

module.exports = {
  CALCULATION_VERSION,
  rupeesToPaise,
  extractInclusiveTax,
  validateGstin,
  calculateOrder,
};
