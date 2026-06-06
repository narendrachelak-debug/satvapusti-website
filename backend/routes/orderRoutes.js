const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const Order = require("../models/Order");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// CREATE ORDER
router.post("/create", async (req, res) => {
  try {

    const lastOrder = await Order.findOne().sort({ createdAt: -1 });

    let nextNumber = 1001;

    if (
      lastOrder &&
      lastOrder.orderId &&
      lastOrder.orderId.startsWith("SP")
    ) {
      nextNumber =
        parseInt(lastOrder.orderId.replace("SP", "")) + 1;
    }

    const orderId = `SP${nextNumber}`;

    const order = new Order({
      ...req.body,
      orderId,
    });

    await order.save();

    // CUSTOMER EMAIL
    if (order.email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: order.email,
        subject: `Order Confirmation - ${orderId}`,
        html: `
          <h2>Thank You For Ordering With SatvaPusti Nutrition</h2>

          <p><b>Order ID:</b> ${orderId}</p>
          <p><b>Product:</b> ${order.product}</p>
          <p><b>Quantity:</b> ${order.quantity}</p>
          <p><b>Amount:</b> ₹${order.totalAmount}</p>

          <p><b>Status:</b> Received</p>

          <hr>

          <p>
          We have successfully received your order and
          our team will contact you shortly.
          </p>
        `,
      });
    }

    // ADMIN EMAIL
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
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

    res.status(200).json({
      success: true,
      order,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
});

// GET ALL ORDERS
router.get("/all", async (req, res) => {
  try {

    const orders = await Order.find().sort({
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

    const updateData = {
      paymentStatus: req.body.paymentStatus,
      orderStatus: req.body.orderStatus,
      courierName: req.body.courierName || "",
      trackingNumber: req.body.trackingNumber || "",
      trackingUrl: req.body.trackingUrl || "",
    };

    // Payment Date Auto Save
    if (
      req.body.paymentStatus === "Paid" &&
      !req.body.paymentDate
    ) {
      updateData.paymentDate = new Date();
    }

    // Delivery Date Auto Save
    if (
      req.body.orderStatus === "Delivered" &&
      !req.body.deliveryDate
    ) {
      updateData.deliveryDate = new Date();
    }

    // Delivered => Auto Paid
    if (req.body.orderStatus === "Delivered") {
      updateData.paymentStatus = "Paid";
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
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
module.exports = router;