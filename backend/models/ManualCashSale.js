const mongoose = require("mongoose");

const manualCashSaleSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    productId: { type: String, enum: ["family"], default: "family", immutable: true },
    quantityKg: { type: Number, required: true, min: 0, max: 1000000 },
    paymentMethod: { type: String, enum: ["Cash"], default: "Cash", immutable: true },
    entryType: {
      type: String,
      enum: ["Manual historical aggregate"],
      default: "Manual historical aggregate",
      immutable: true,
    },
    customerDetailsAvailable: { type: Boolean, default: false, immutable: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ManualCashSale", manualCashSaleSchema);
