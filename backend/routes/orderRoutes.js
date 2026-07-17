const express = require("express");
const router = express.Router();
const { BrevoClient } = require("@getbrevo/brevo");

const Order = require("../models/Order");
const Inventory = require("../models/Inventory");
const Counter = require("../models/Counter");
const { calculateOrder, validateGstin } = require("../services/pricingService");

const brevoClient = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY || "",
});

const hasEmailConfig = () =>
  Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);

const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const sendEmail = async ({ to, subject, html }) => {
  if (!hasEmailConfig()) {
    throw new Error("Email config missing: BREVO_API_KEY or EMAIL_FROM is not set");
  }

  if (!to) {
    throw new Error("Email recipient is missing");
  }

  try {
    const info = await brevoClient.transactionalEmails.sendTransacEmail({
      sender: {
        name: "SatvaPusti Nutrition",
        email: process.env.EMAIL_FROM,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });
    const messageId = info?.body?.messageId || info?.messageId || info?.id;

    console.log("Email sent:", {
      to,
      subject,
      messageId,
    });

    return {
      messageId,
      accepted: [to],
      rejected: [],
      response: "Brevo API accepted message",
      raw: info?.body || info,
    };
  } catch (error) {
    console.log("Email send error:", {
      to,
      subject,
      message: error.message,
      statusCode: error.statusCode || error.status,
      response: error.response || error.body,
    });
    throw error;
  }
};

const getOrderItemsHtml = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "<p>No product details available.</p>";
  }

  return items
    .map(
      (item) =>
        `<p><b>${item.name || item.productId || "Product"}</b> - ${
          item.weight || ""
        } x ${item.quantity || 0} = ${money(
          Number(item.offer || 0) * Number(item.quantity || 0)
        )}</p>`
    )
    .join("");
};

const sendOrderEmail = async (order, type) => {
  const templates = {
    order: {
      subject: `Order Received - ${order.orderId}`,
      text:
        `Order Received Successfully\n\n` +
        `Dear ${order.customerName || "Customer"},\n` +
        `Your order has been received.\n\n` +
        `Order ID: ${order.orderId}\n` +
        `Total Amount: ${money(order.totalAmount)}\n` +
        `Payment Method: ${order.paymentMethod || "N/A"}\n` +
        `Status: Received\n\n` +
        `Thank you,\nSatvaPusti Nutrition`,
      html: `
        <h2>Order Received Successfully</h2>
        <p>Dear ${order.customerName || "Customer"},</p>
        <p>Your order has been received.</p>
        <p><b>Order ID:</b> ${order.orderId}</p>
        <p><b>Total Amount:</b> ${money(order.totalAmount)}</p>
        <p><b>Payment Method:</b> ${order.paymentMethod || "N/A"}</p>
        <p><b>Status:</b> Received</p>
        <br/>
        <p>Thank you,<br/>SatvaPusti Nutrition</p>
      `,
    },
    payment: {
      subject: `Payment Confirmed - ${order.orderId}`,
      text:
        `Payment Confirmed\n\n` +
        `Dear ${order.customerName || "Customer"},\n` +
        `Your payment has been confirmed. We will process your order shortly.\n\n` +
        `Order ID: ${order.orderId}\n` +
        `Total Amount: ${money(order.totalAmount)}\n\n` +
        `Thank you,\nSatvaPusti Nutrition`,
      html: `
        <h2>Payment Confirmed</h2>
        <p>Dear ${order.customerName || "Customer"},</p>
        <p>Your payment has been confirmed. We will process your order shortly.</p>
        <p><b>Order ID:</b> ${order.orderId}</p>
        <p><b>Total Amount:</b> ${money(order.totalAmount)}</p>
        <br/>
        <p>Thank you,<br/>SatvaPusti Nutrition</p>
      `,
    },
    shipping: {
      subject: `Your Order Has Been Shipped - ${order.orderId}`,
      text:
        `Your Order Has Been Shipped\n\n` +
        `Dear ${order.customerName || "Customer"},\n` +
        `Your SatvaPusti order has been shipped.\n\n` +
        `Order ID: ${order.orderId}\n` +
        `Status: Shipped\n` +
        `${order.courierName ? `Courier: ${order.courierName}\n` : ""}` +
        `${order.trackingNumber ? `Tracking Number: ${order.trackingNumber}\n` : ""}` +
        `${order.trackingUrl ? `Track Here: ${order.trackingUrl}\n` : ""}` +
        `\nThank you,\nSatvaPusti Nutrition`,
      html: `
        <h2>Your Order Has Been Shipped</h2>
        <p>Dear ${order.customerName || "Customer"},</p>
        <p>Your SatvaPusti order has been shipped.</p>
        <p><b>Order ID:</b> ${order.orderId}</p>
        <p><b>Status:</b> Shipped</p>
        ${
          order.courierName
            ? `<p><b>Courier:</b> ${order.courierName}</p>`
            : ""
        }
        ${
          order.trackingNumber
            ? `<p><b>Tracking Number:</b> ${order.trackingNumber}</p>`
            : ""
        }
        ${
          order.trackingUrl
            ? `<p><a href="${order.trackingUrl}">Track your order</a></p>`
            : ""
        }
        <br/>
        <p>Thank you,<br/>SatvaPusti Nutrition</p>
      `,
    },
    delivery: {
      subject: `Order Delivered - ${order.orderId}`,
      text:
        `Order Delivered Successfully\n\n` +
        `Dear ${order.customerName || "Customer"},\n` +
        `Your SatvaPusti order has been delivered.\n\n` +
        `Order ID: ${order.orderId}\n\n` +
        `Thank you for choosing SatvaPusti Nutrition.`,
      html: `
        <h2>Order Delivered Successfully</h2>
        <p>Dear ${order.customerName || "Customer"},</p>
        <p>Your SatvaPusti order has been delivered.</p>
        <p><b>Order ID:</b> ${order.orderId}</p>
        <br/>
        <p>Thank you for choosing SatvaPusti Nutrition.</p>
      `,
    },
  };

  const template = templates[type];
  if (!template) return;

  await sendEmail({
    to: order.email,
    subject: template.subject,
    html: template.html,
  });
};

const safeSendOrderEmail = async (order, type) => {
  try {
    const info = await sendOrderEmail(order, type);
    return {
      sent: true,
      accepted: info?.accepted || [],
      rejected: info?.rejected || [],
    };
  } catch (error) {
    console.log("Order email skipped/failed:", {
      orderId: order?.orderId,
      type,
      to: order?.email,
      message: error.message,
    });
    return {
      sent: false,
      error: error.message,
    };
  }
};

const safeSendAdminEmail = async (mailOptions) => {
  try {
    if (!process.env.ADMIN_EMAIL) {
      console.log("Admin email skipped: ADMIN_EMAIL is not set");
      return {
        sent: false,
        error: "ADMIN_EMAIL is not set",
      };
    }

    const info = await sendEmail(mailOptions);
    return {
      sent: true,
      accepted: info?.accepted || [],
      rejected: info?.rejected || [],
    };
  } catch (error) {
    console.log("Admin email skipped/failed:", {
      to: mailOptions?.to,
      subject: mailOptions?.subject,
      message: error.message,
    });
    return {
      sent: false,
      error: error.message,
    };
  }
};

const getCustomerTrackingMessage = (order) => {
  const lines = [
    `Hello ${order.customerName || ""},`,
    "Your SatvaPusti order update:",
    `Order ID: ${order.orderId}`,
    `Payment Status: ${order.paymentStatus}`,
    `Order Status: ${order.orderStatus}`,
    `Amount: ${money(order.totalAmount)}`,
  ];

  if (order.courierName) lines.push(`Courier: ${order.courierName}`);
  if (order.trackingNumber) lines.push(`Tracking Number: ${order.trackingNumber}`);
  if (order.trackingUrl) lines.push(`Track Here: ${order.trackingUrl}`);

  return lines.join("\n");
};

const normalizeDateRange = (from, to) => {
  const range = {};

  if (from) range.$gte = new Date(from);

  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }

  return Object.keys(range).length ? range : null;
};

const buildOrderQuery = (query) => {
  const filter = {};
  const orderRange = normalizeDateRange(query.orderDateFrom, query.orderDateTo);
  const paymentRange = normalizeDateRange(query.paymentDateFrom, query.paymentDateTo);
  const deliveryRange = normalizeDateRange(query.deliveryDateFrom, query.deliveryDateTo);

  if (orderRange) filter.createdAt = orderRange;
  if (paymentRange) filter.paymentDate = paymentRange;
  if (deliveryRange) filter.deliveryDate = deliveryRange;
  if (query.orderStatus) filter.orderStatus = query.orderStatus;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

  return filter;
};

const reduceInventoryForOrder = async (order) => {
  if (order.inventoryDeducted) return;

  for (const item of order.items || []) {
    const quantity = Number(item.quantity || 0);
    if (!item.productId || !item.weight || quantity <= 0) continue;

    const inventoryItem = await Inventory.findOne({
      productId: item.productId,
      weight: item.weight,
    });

    if (!inventoryItem || inventoryItem.stock < quantity) {
      throw new Error(`${item.name || item.productId} ${item.weight} is out of stock`);
    }
  }

  for (const item of order.items || []) {
    await Inventory.findOneAndUpdate(
      { productId: item.productId, weight: item.weight },
      { $inc: { stock: -Number(item.quantity || 0) } }
    );
  }

  order.inventoryDeducted = true;
};

const getNextOrderId = async () => {
  let counter = await Counter.findById("order");
  if (!counter) {
    const existingIds = await Order.find({ orderId: /^SP\d+$/ }).select("orderId").lean();
    const highest = existingIds.reduce(
      (max, item) => Math.max(max, Number(String(item.orderId).slice(2)) || 1000),
      1000
    );
    try {
      counter = await Counter.create({ _id: "order", seq: highest });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  const next = await Counter.findOneAndUpdate(
    { _id: "order" },
    { $inc: { seq: 1 } },
    { new: true }
  );
  return `SP${next.seq}`;
};

const getFinancialYear = (date = new Date()) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit",
    }).formatToParts(date).map((part) => [part.type, part.value])
  );
  const year = Number(parts.year);
  const startYear = Number(parts.month) >= 4 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
};

// CREATE ORDER
router.post("/create", async (req, res) => {
  try {
    const shippingStateCode = String(req.body.shippingStateCode || "");
    const billingStateCode = String(req.body.billingStateCode || shippingStateCode);
    if (!/^\d{6}$/.test(String(req.body.pincode || ""))) {
      return res.status(400).json({ success: false, message: "PIN code must be six digits" });
    }
    const pricing = await calculateOrder({
      items: req.body.items,
      shippingStateCode,
      billingStateCode,
      couponDiscountPaise: 0,
    });
    const customerGstin = validateGstin({
      gstin: req.body.customerGstin,
      billingStateCode: pricing.billingStateCode,
    });
    if (req.body.businessCustomer && (!customerGstin || !String(req.body.customerLegalName || "").trim())) {
      return res.status(400).json({
        success: false,
        message: "GSTIN and registered legal name are required for a business invoice",
      });
    }
    const completeShippingAddress = [
      req.body.address,
      req.body.addressLine2,
      req.body.district,
      `${String(req.body.city || "").trim()} - ${String(req.body.pincode || "").trim()}`,
    ].map((part) => String(part || "").trim()).filter(Boolean).join(", ");
    const completeBillingAddress = String(
      req.body.billingAddress || completeShippingAddress
    ).trim();
    const orderId = await getNextOrderId();
    const snapshot = {
      ...pricing,
      billingAddress: completeBillingAddress,
      shippingAddress: completeShippingAddress,
      customerGstin,
      customerRegistrationType: customerGstin ? "REGISTERED_B2B" : "UNREGISTERED_B2C",
      customerLegalName: String(req.body.customerLegalName || "").trim(),
      customerTradeName: String(req.body.customerTradeName || "").trim(),
    };
    const orderItems = pricing.lines.map((line) => ({
      cartId: `${line.productId}-${line.weight}`,
      productId: line.productId,
      name: line.productName,
      weight: line.weight,
      quantity: line.quantity,
      mrp: line.mrpPaise / 100,
      offer: line.sellingPricePaise / 100,
      image: line.image,
    }));

    const order = new Order({
      orderId,
      customerName: String(req.body.customerName || "").trim(),
      email: String(req.body.email || "").trim(),
      mobile: String(req.body.mobile || "").trim(),
      address: String(req.body.address || "").trim(),
      addressLine2: String(req.body.addressLine2 || "").trim(),
      city: String(req.body.city || "").trim(),
      district: String(req.body.district || "").trim(),
      pincode: String(req.body.pincode || "").trim(),
      country: "India",
      billingAddress: completeBillingAddress,
      shippingAddress: completeShippingAddress,
      billingStateName: pricing.billingStateName,
      billingStateCode: pricing.billingStateCode,
      shippingStateName: pricing.shippingStateName,
      shippingStateCode: pricing.shippingStateCode,
      placeOfSupplyState: pricing.placeOfSupplyState,
      placeOfSupplyStateCode: pricing.placeOfSupplyStateCode,
      customerGstin,
      customerRegistrationType: snapshot.customerRegistrationType,
      customerLegalName: snapshot.customerLegalName,
      customerTradeName: snapshot.customerTradeName,
      items: orderItems,
      totalAmount: pricing.finalPayablePaise / 100,
      totalAmountPaise: pricing.finalPayablePaise,
      gatewayOrderAmountPaise: pricing.finalPayablePaise,
      currency: pricing.currency,
      calculationVersion: pricing.calculationVersion,
      pricingSnapshot: snapshot,
      invoiceNumber: `SP/${getFinancialYear()}/${orderId}`,
      invoiceDate: new Date(),
      paymentMethod: req.body.paymentMethod,
      paymentStatus: req.body.paymentStatus === "Awaiting Verification"
        ? "Awaiting Verification"
        : "Pending",
      orderStatus: "Received",
      statusHistory: [
        {
          status: "Received",
          note: "Order received",
          date: new Date(),
        },
      ],
    });

    await reduceInventoryForOrder(order);
    await order.save();
    console.log("ORDER SAVED");

    console.log("Sending order received email:", {
      orderId: order.orderId,
      to: order.email,
    });
    console.log("EMAIL SENDING");
    const customerEmailSent = await safeSendOrderEmail(order, "order");
    if (customerEmailSent.sent) {
      console.log("EMAIL SENT");
    } else {
      console.log(`Error: ${customerEmailSent.error || "Email was not sent"}`);
    }

    // ADMIN EMAIL
    const adminEmailSent = await safeSendAdminEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New Order Received - ${orderId}`,
      html: `
        <h2>New Order Received</h2>

        <p><b>Order ID:</b> ${orderId}</p>
        <p><b>Customer:</b> ${order.customerName}</p>
        <p><b>Email:</b> ${order.email}</p>
        <p><b>Mobile:</b> ${order.mobile}</p>
        <p><b>Amount:</b> ₹${order.totalAmount}</p>
        <p><b>Payment:</b> ${order.paymentMethod}</p>
      `,
    });

    res.status(201).json({
      success: true,
      order,
      quote: pricing,
      email: {
        customer: customerEmailSent,
        admin: adminEmailSent,
      },
    });

  } catch (error) {

    console.log(error);

    res.status(400).json({
      success: false,
      message: error.message,
    });

  }
});

// GET ALL ORDERS
router.get("/all", async (req, res) => {
  try {

    const orders = await Order.find(buildOrderQuery(req.query)).sort({
      createdAt: -1,
    });

    res.json(orders);

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
});

router.get("/track", async (req, res) => {
  try {
    const { orderId, mobile } = req.query;

    if (!orderId || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Order ID and mobile number are required",
      });
    }

    const order = await Order.findOne({
      orderId: String(orderId).trim(),
      mobile: String(mobile).trim(),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/reports/sales", async (req, res) => {
  try {
    const groupFormat = req.query.type === "monthly" ? "%Y-%m" : "%Y-%m-%d";
    const match = {
      paymentStatus: "Paid",
      ...buildOrderQuery(req.query),
    };

    const report = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$paymentDate" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
          averageOrderValue: { $avg: "$totalAmount" },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    res.json({
      success: true,
      report: report.map((item) => ({
        period: item._id,
        revenue: item.revenue,
        orders: item.orders,
        averageOrderValue: item.averageOrderValue,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// CUSTOMER ORDERS
router.get("/customer/:mobile", async (req, res) => {
  try {

    const orders = await Order.find({
      mobile: req.params.mobile,
    }).sort({
      createdAt: -1,
    });

    res.json(orders);

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
});

// UPDATE STATUS
router.put("/status/:id", async (req, res) => {
  try {

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        orderStatus: req.body.orderStatus,
      },
      {
        new: true,
      }
    );

    res.json({
      success: true,
      order,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
});

// UPDATE PAYMENT + ORDER STATUS

router.put("/admin/update/:id", async (req, res) => {
  try {
    const oldOrder = await Order.findById(req.params.id);

    if (!oldOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const updateData = {
      paymentStatus: req.body.paymentStatus,
      orderStatus: req.body.orderStatus,
      courierName: req.body.courierName || "",
      trackingNumber: req.body.trackingNumber || "",
      trackingUrl: req.body.trackingUrl || "",
      customerTrackingMessage: req.body.customerTrackingMessage || "",
    };

    const statusHistory = Array.isArray(oldOrder.statusHistory)
      ? [...oldOrder.statusHistory]
      : [];

    if (req.body.orderStatus && req.body.orderStatus !== oldOrder.orderStatus) {
      statusHistory.push({
        status: req.body.orderStatus,
        note: req.body.customerTrackingMessage || `Order marked as ${req.body.orderStatus}`,
        date: new Date(),
      });
      updateData.statusHistory = statusHistory;
    }

    if (req.body.orderStatus === "Delivered") {
      updateData.paymentStatus = "Paid";

      if (!oldOrder.deliveryDate) {
        updateData.deliveryDate = new Date();
      }

      if (!oldOrder.paymentDate) {
        updateData.paymentDate = new Date();
      }
    }

    if (req.body.paymentStatus === "Paid" && !oldOrder.paymentDate) {
      updateData.paymentDate = new Date();
      updateData.paymentAmountPaise = oldOrder.gatewayOrderAmountPaise || oldOrder.totalAmountPaise;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    const email = {};

    if (oldOrder.paymentStatus !== "Paid" && order.paymentStatus === "Paid") {
      email.payment = await safeSendOrderEmail(order, "payment");
    }

    const forceStatusEmail = req.body.notifyCustomerEmail === true;

    if (
      order.orderStatus === "Shipped" &&
      (forceStatusEmail || oldOrder.orderStatus !== "Shipped")
    ) {
      email.shipping = await safeSendOrderEmail(order, "shipping");
    }

    if (
      order.orderStatus === "Delivered" &&
      (forceStatusEmail || oldOrder.orderStatus !== "Delivered")
    ) {
      email.delivery = await safeSendOrderEmail(order, "delivery");
    }

    res.json({
      success: true,
      order,
      email,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/whatsapp-template/:id/:template", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const templates = {
      received: `Hello ${order.customerName || ""}, your SatvaPusti order ${
        order.orderId
      } has been received. Amount: ${money(order.totalAmount)}.`,
      payment: `Hello ${order.customerName || ""}, payment for your SatvaPusti order ${
        order.orderId
      } is confirmed. We will process it shortly.`,
      processing: `Hello ${order.customerName || ""}, your SatvaPusti order ${
        order.orderId
      } is now being processed.`,
      shipped: getCustomerTrackingMessage({
        ...order.toObject(),
        orderStatus: "Shipped",
      }),
      delivered: `Hello ${order.customerName || ""}, your SatvaPusti order ${
        order.orderId
      } has been delivered. Thank you for shopping with us.`,
    };

    res.json({
      success: true,
      message: templates[req.params.template] || getCustomerTrackingMessage(order),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/admin/test-email", async (req, res) => {
  try {
    const { password, to } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin password",
      });
    }

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Recipient email is required",
      });
    }

    const info = await sendEmail({
      to,
      subject: `SatvaPusti Live Email Test - ${new Date().toISOString()}`,
      html: `
        <h2>SatvaPusti Live Email Test</h2>
        <p>This email was sent by the live backend to confirm Brevo delivery.</p>
      `,
    });

    res.json({
      success: true,
      email: {
        accepted: info.accepted || [],
        rejected: info.rejected || [],
        response: info.response,
        messageId: info.messageId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code,
      response: error.response,
    });
  }
});

module.exports = router;
