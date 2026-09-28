const availability = require("../../shared/productAvailability.json");

// Shared with the storefront so both sides use the same Coming Soon list.
const COMING_SOON_PRODUCT_IDS = new Set(availability.comingSoonProductIds);
const COMING_SOON_MESSAGE = availability.comingSoonMessage;

const isComingSoonProduct = (productId) =>
  COMING_SOON_PRODUCT_IDS.has(String(productId || "").trim().toLowerCase());

const hasComingSoonItem = (items) =>
  Array.isArray(items) && items.some((item) => isComingSoonProduct(item?.productId));

module.exports = {
  COMING_SOON_MESSAGE,
  isComingSoonProduct,
  hasComingSoonItem,
};
