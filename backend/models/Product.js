const mongoose = require("mongoose");

const weightDataSchema = new mongoose.Schema(
  {
    mrp: { type: Number, default: 0, min: 0 },
    offer: { type: Number, default: 0, min: 0 },
    mrpPaise: { type: Number, default: 0, min: 0 },
    sellingPricePaise: { type: Number, default: 0, min: 0 },
    gstRateBasisPoints: { type: Number, default: 500, min: 0 },
    taxInclusive: { type: Boolean, default: true },
    hsnCode: { type: String, default: "1106", trim: true },
    discountLabel: { type: String, default: "", trim: true },
    packSize: { type: String, default: "", trim: true },
    sku: { type: String, default: "", trim: true },
    image: { type: String, default: "" },
  },
  { _id: false }
);

weightDataSchema.pre("validate", function validateVariant(next) {
  if (this.offer > this.mrp || this.sellingPricePaise > this.mrpPaise) {
    return next(new Error("Selling price cannot exceed MRP"));
  }
  if (this.taxInclusive && !this.hsnCode) {
    return next(new Error("HSN code is required for a taxable product"));
  }
  next();
});

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "" },
    desc: { type: String, default: "" },
    bestFor: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    usage: { type: String, default: "" },
    weights: {
      "1KG": { type: weightDataSchema, default: () => ({}) },
      "500G": { type: weightDataSchema, default: () => ({}) },
      "250G": { type: weightDataSchema, default: () => ({}) },
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
