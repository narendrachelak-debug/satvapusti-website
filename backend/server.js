const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SatvaPusti Backend Running");
});
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;

  if (password === process.env.ADMIN_PASSWORD) {
    return res.json({
      success: true,
      token: "satvapusti-admin-login",
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid admin password",
  });
});

app.post("/api/admin/verify-password", (req, res) => {
  const { currentPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({
      success: false,
      message: "Password required",
    });
  }

  if (currentPassword === process.env.ADMIN_PASSWORD) {
    return res.json({
      success: true,
      message: "Password verified",
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid password",
  });
});

app.post("/api/admin/change-password", (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current and new password are required",
    });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 8 characters",
    });
  }

  if (currentPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Invalid current password",
    });
  }

  process.env.ADMIN_PASSWORD = newPassword;

  return res.json({
    success: true,
    message: "Password changed for this running server. Update ADMIN_PASSWORD in hosting env for persistence after redeploy.",
  });
});

// INVENTORY ENDPOINTS
app.get("/api/inventory", async (req, res) => {
  try {
    const Inventory = require("./models/Inventory");
    const inventory = await Inventory.find();
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/inventory/:productId/:weight", async (req, res) => {
  try {
    const Inventory = require("./models/Inventory");
    const item = await Inventory.findOne({
      productId: req.params.productId,
      weight: req.params.weight,
    });
    res.json(item || { stock: 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/inventory/:productId/:weight", async (req, res) => {
  try {
    const Inventory = require("./models/Inventory");
    const { stock, reorderLevel } = req.body;
    
    const item = await Inventory.findOneAndUpdate(
      { productId: req.params.productId, weight: req.params.weight },
      {
        stock: stock !== undefined ? stock : undefined,
        reorderLevel: reorderLevel !== undefined ? reorderLevel : undefined,
        lastRestocked: Date.now(),
      },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/inventory/reduce/:orderId", async (req, res) => {
  try {
    const Order = require("./models/Order");
    const Inventory = require("./models/Inventory");
    
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    for (const item of order.items || []) {
      const inventoryItem = await Inventory.findOne({
        productId: item.productId,
        weight: item.weight,
      });

      if (!inventoryItem || inventoryItem.stock < Number(item.quantity || 0)) {
        return res.status(400).json({
          success: false,
          message: `${item.name || item.productId} ${item.weight} is out of stock`,
        });
      }
    }

    for (const item of order.items || []) {
      await Inventory.findOneAndUpdate(
        { productId: item.productId, weight: item.weight },
        { $inc: { stock: -Number(item.quantity || 0) } }
      );
    }
    
    res.json({ success: true, message: "Inventory reduced" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use("/api/orders", orderRoutes);

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    dbName: "satvapusti",
  })
  .then(() => {
    console.log("MongoDB Connected");
    initializeInventory();
  })
  .catch((error) => {
    console.log("MongoDB Connection Error:", error.message);
  });

const initializeInventory = async () => {
  try {
    const Inventory = require("./models/Inventory");
    const products = [
      { productId: "family", weight: "250G" },
      { productId: "family", weight: "500G" },
      { productId: "family", weight: "1KG" },
      { productId: "kids", weight: "250G" },
      { productId: "kids", weight: "500G" },
      { productId: "kids", weight: "1KG" },
      { productId: "active", weight: "250G" },
      { productId: "active", weight: "500G" },
      { productId: "active", weight: "1KG" },
    ];

    for (const product of products) {
      await Inventory.findOneAndUpdate(
        { productId: product.productId, weight: product.weight },
        { $setOnInsert: { stock: 100 } },
        { upsert: true }
      );
    }
  } catch (error) {
    console.log("Inventory initialization error:", error.message);
  }
};

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
