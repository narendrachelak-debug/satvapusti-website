const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      enum: ["family", "kids", "active"],
      required: true,
    },
    weight: {
      type: String,
      enum: ["250G", "500G", "1KG"],
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 10,
    },
    lastRestocked: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

inventorySchema.index({ productId: 1, weight: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", inventorySchema);
