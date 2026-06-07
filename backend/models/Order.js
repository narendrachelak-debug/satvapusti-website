const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true },

    customerName: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },

    items: [
      {
        cartId: String,
        productId: String,
        name: String,
        weight: String,
        quantity: Number,
        mrp: Number,
        offer: Number,
        image: String,
      },
    ],

    product: String,
    weight: String,
    quantity: Number,
    mrp: Number,
    offerPrice: Number,
    totalAmount: Number,
    paymentMethod: String,

    paymentStatus: {
      type: String,
      enum: ["Pending", "Awaiting Verification", "Paid", "Failed"],
      default: "Pending",
    },

    orderStatus: {
      type: String,
      enum: ["Received", "Processing", "Packed", "Shipped", "Delivered", "Cancelled"],
      default: "Received",
    },

    paymentDate: {
      type: Date,
      default: null,
    },

    deliveryDate: {
      type: Date,
      default: null,
    },

    courierName: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    trackingUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
