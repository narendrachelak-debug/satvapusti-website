const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true },

    customerName: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    city: { type: String, required: true },
    district: { type: String, default: "" },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
    billingAddress: { type: String, default: "" },
    shippingAddress: { type: String, default: "" },
    billingStateName: { type: String, default: "" },
    billingStateCode: { type: String, default: "" },
    shippingStateName: { type: String, default: "" },
    shippingStateCode: { type: String, default: "" },
    placeOfSupplyState: { type: String, default: "" },
    placeOfSupplyStateCode: { type: String, default: "" },
    customerGstin: { type: String, default: "" },
    customerRegistrationType: {
      type: String,
      enum: ["UNREGISTERED_B2C", "REGISTERED_B2B"],
      default: "UNREGISTERED_B2C",
    },
    customerLegalName: { type: String, default: "" },
    customerTradeName: { type: String, default: "" },

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
    totalAmountPaise: Number,
    gatewayOrderAmountPaise: Number,
    paymentAmountPaise: Number,
    currency: { type: String, default: "INR" },
    calculationVersion: { type: String, default: "" },
    pricingSnapshot: { type: mongoose.Schema.Types.Mixed, immutable: true },
    invoiceNumber: { type: String, immutable: true, unique: true, sparse: true },
    invoiceDate: { type: Date, immutable: true },
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
    customerTrackingMessage: { type: String, default: "" },
    inventoryDeducted: { type: Boolean, default: false },
    statusHistory: [
      {
        status: String,
        note: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
