const mongoose = require("mongoose");

const weightDataSchema = new mongoose.Schema(
  {
    mrp: { type: Number, default: 0 },
    offer: { type: Number, default: 0 },
    image: { type: String, default: "" },
  },
  { _id: false }
);

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
