const express = require("express");
const ManualCashSale = require("../models/ManualCashSale");
const { requireAdmin } = require("../middleware/security");
const { normalizeManualCashSale } = require("../services/manualCashSales");

const router = express.Router();

router.get("/", requireAdmin, async (req, res) => {
  try {
    const sales = await ManualCashSale.find().sort({ period: -1 }).lean();
    res.set("Cache-Control", "no-store");
    res.json({ success: true, sales });
  } catch (error) {
    console.log("Manual cash sales list error:", error.message);
    res.status(500).json({ success: false, message: "Manual cash sales could not be loaded" });
  }
});

router.put("/", requireAdmin, async (req, res) => {
  let payload;
  try {
    payload = normalizeManualCashSale(req.body);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  try {
    const sale = await ManualCashSale.findOneAndUpdate(
      { period: payload.period },
      {
        $set: { quantityKg: payload.quantityKg },
        $setOnInsert: {
          period: payload.period,
          productId: "family",
          paymentMethod: "Cash",
          entryType: "Manual historical aggregate",
          customerDetailsAvailable: false,
        },
      },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    res.json({ success: true, sale });
  } catch (error) {
    console.log("Manual cash sale save error:", error.message);
    res.status(500).json({ success: false, message: "Manual cash sale could not be saved" });
  }
});

module.exports = router;
