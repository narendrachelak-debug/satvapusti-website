const express = require("express");
const router = express.Router();

const Order = require("../models/Order");

router.post("/create", async (req, res) => {

    try {

        const order = new Order(req.body);

        await order.save();

        res.status(200).json({
            success: true,
            message: "Order Saved Successfully",
            order
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});

router.get("/test", async (req, res) => {
  try {
    const order = new Order({
      customerName: "Narendra",
      mobile: "9999999999",
      address: "Test Address",
      city: "Raipur",
      pincode: "493559",
      product: "SatvaPusti Family",
      weight: "1KG",
      quantity: 1,
      mrp: 1999,
      offerPrice: 1799,
      totalAmount: 1799,
      paymentMethod: "COD",
    });

    await order.save();

    res.json({
      success: true,
      message: "Test Order Saved",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/all", async (req, res) => {

    try {

        const orders = await Order.find().sort({
            createdAt: -1
        });

        res.json(orders);

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});

module.exports = router;