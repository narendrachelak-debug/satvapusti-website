const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customerName: String,
    mobile: String,
    address: String,
    city: String,
    pincode: String,

    product: String,
    weight: String,
    quantity: Number,

    mrp: Number,
    offerPrice: Number,
    totalAmount: Number,

    paymentMethod: String,
    paymentStatus: {
      type: String,
      default: "Pending",
    },
    orderStatus: {
      type: String,
      default: "New",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);