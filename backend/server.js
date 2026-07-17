const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const orderRoutes = require("./routes/orderRoutes");
const business = require("./config/business");
const { GST_STATES } = require("./data/gstStates");
const { calculateOrder, rupeesToPaise } = require("./services/pricingService");
const {
  createAdminSession,
  createRateLimiter,
  destroyAdminSession,
  optionalAdmin,
  requireAdmin,
  safePasswordEqual,
} = require("./middleware/security");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const defaultProducts = [
  {
    productId: "family",
    name: "SatvaPusti Family Nutrition Formula",
    subtitle: "Premium Nutrition Powder",
    desc: "Complete nutrition for every member of your family.",
    bestFor: ["Family Nutrition", "Daily Energy", "Balanced Routine"],
    benefits: ["Real dry fruits and seeds", "Daily nutrition support", "No artificial colours"],
    usage: "Mix 2 spoons with 200 ml milk or warm water and consume daily.",
    weights: {
      "1KG": {
        mrp: 1999, offer: 1799, mrpPaise: 199900, sellingPricePaise: 179900,
        gstRateBasisPoints: 500, taxInclusive: true, hsnCode: "1106",
        discountLabel: "10% OFF", packSize: "1 Kg", sku: "FAMILY-1KG",
        image: "/products/family-1kg.png",
      },
      "500G": { mrp: 1099, offer: 999, image: "/products/family-500g.png" },
      "250G": { mrp: 599, offer: 499, image: "/products/family-250g.png" },
    },
    sortOrder: 1,
  },
  {
    productId: "kids",
    name: "SatvaPusti+ Active Kids",
    subtitle: "Premium Kids Nutrition Powder",
    desc: "Growth, brain, immunity and daily energy support.",
    bestFor: ["Kids Growth", "Brain Support", "Daily Immunity"],
    benefits: ["Kids-focused nutrition", "Real banana and nuts", "Tasty daily drink"],
    usage: "Mix 1-2 spoons with milk daily. Adjust quantity based on age and appetite.",
    weights: {
      "1KG": { mrp: 2099, offer: 1999, image: "/products/active-kids-1kg.png" },
      "500G": { mrp: 1199, offer: 1099, image: "/products/active-kids-500g.png" },
      "250G": { mrp: 649, offer: 549, image: "/products/active-kids-250g.png" },
    },
    sortOrder: 2,
  },
  {
    productId: "active",
    name: "SatvaPusti+ Active",
    subtitle: "Premium Natural Protein Formula",
    desc: "Fuel your strength, boost recovery and achieve your best.",
    bestFor: ["Protein Support", "Recovery", "Active Lifestyle"],
    benefits: ["Strength routine support", "Natural protein formula", "Energy and recovery"],
    usage: "Mix 2 spoons with 200 ml milk or water daily. Use after workouts or as part of your morning routine.",
    weights: {
      "1KG": { mrp: 2299, offer: 2099, image: "/products/active-1kg.png" },
      "500G": { mrp: 1249, offer: 1199, image: "/products/active-500g.png" },
      "250G": { mrp: 699, offer: 599, image: "/products/active-250g.png" },
    },
    sortOrder: 3,
  },
];

const configuredOrigins = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  "https://satvapusti.com",
  "https://www.satvapusti.com",
  "https://satvapusti-website.onrender.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...configuredOrigins,
]);

app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin) ? origin || false : false);
  },
  methods: ["GET", "POST", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Resource-Policy": "same-site",
  });
  next();
});
app.use(express.json({ limit: "100kb" }));

const adminLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again after 15 minutes.",
});
const quoteLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 60 });

app.get("/", (req, res) => {
  res.send("SatvaPusti Backend Running");
});
app.post("/api/admin/login", adminLoginLimiter, (req, res) => {
  const { password } = req.body;

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ success: false, message: "Admin login is not configured" });
  }

  if (safePasswordEqual(password, process.env.ADMIN_PASSWORD)) {
    const session = createAdminSession();
    return res.json({
      success: true,
      token: session.token,
      expiresAt: session.expiresAt,
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid admin password",
  });
});

app.get("/api/admin/session", requireAdmin, (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ success: true, expiresAt: req.adminSession.expiresAt });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  destroyAdminSession(req);
  res.json({ success: true });
});

app.post("/api/admin/verify-password", requireAdmin, (req, res) => {
  const { currentPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({
      success: false,
      message: "Password required",
    });
  }

  if (safePasswordEqual(currentPassword, process.env.ADMIN_PASSWORD)) {
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

app.post("/api/admin/change-password", requireAdmin, (req, res) => {
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

  if (!safePasswordEqual(currentPassword, process.env.ADMIN_PASSWORD)) {
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

app.put("/api/inventory/:productId/:weight", requireAdmin, async (req, res) => {
  try {
    const Inventory = require("./models/Inventory");
    const { stock, reorderLevel } = req.body;
    for (const [label, value] of [["stock", stock], ["reorderLevel", reorderLevel]]) {
      if (value !== undefined && (!Number.isSafeInteger(Number(value)) || Number(value) < 0 || Number(value) > 1000000)) {
        return res.status(400).json({ success: false, message: `${label} must be a non-negative integer` });
      }
    }
    
    const item = await Inventory.findOneAndUpdate(
      { productId: req.params.productId, weight: req.params.weight },
      {
        stock: stock !== undefined ? Number(stock) : undefined,
        reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : undefined,
        lastRestocked: Date.now(),
      },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/inventory/reduce/:orderId", requireAdmin, async (req, res) => {
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
app.get("/api/gst-states", (req, res) => {
  res.set("Cache-Control", "public, max-age=86400, immutable");
  res.json({ success: true, states: GST_STATES });
});
app.get("/api/business-config", (req, res) => {
  res.json({ success: true, business });
});
app.post("/api/checkout/quote", quoteLimiter, async (req, res) => {
  try {
    const quote = await calculateOrder(req.body || {});
    res.set("Cache-Control", "no-store");
    res.json({ success: true, quote });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PRODUCT ENDPOINTS
const normalizeList = (value) => {
  const items = Array.isArray(value) ? value : String(value || "").split(",");
  return items
    .slice(0, 20)
    .map((item) => String(item).replace(/[<>\u0000-\u001F\u007F]/g, " ").trim().slice(0, 150))
    .filter(Boolean);
};

const normalizeProductText = (value, maxLength) =>
  String(value || "")
    .replace(/[<>\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const normalizeProductPayload = (body) => {
  const productId = String(body.productId || body.id || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const weights = body.weights || {};
  const normalizedWeights = {};

  for (const weight of ["1KG", "500G", "250G"]) {
    const data = weights[weight] || {};
    const mrpPaise = data.mrpPaise !== undefined
      ? Number(data.mrpPaise)
      : rupeesToPaise(data.mrp || 0);
    const sellingPricePaise = data.sellingPricePaise !== undefined
      ? Number(data.sellingPricePaise)
      : rupeesToPaise(data.offer || data.sellingPrice || 0);
    if (!Number.isSafeInteger(mrpPaise) || !Number.isSafeInteger(sellingPricePaise)) {
      throw new Error("Prices must resolve to integer paise");
    }
    if (mrpPaise < 0 || sellingPricePaise < 0 || mrpPaise > 100000000) {
      throw new Error("Prices must be within the allowed range");
    }
    if (sellingPricePaise > mrpPaise) throw new Error("Selling price cannot exceed MRP");
    const gstRateBasisPoints = Number(data.gstRateBasisPoints ?? 500);
    if (!Number.isInteger(gstRateBasisPoints) || gstRateBasisPoints < 0 || gstRateBasisPoints > 2800) {
      throw new Error("GST rate must be between 0% and 28%");
    }
    normalizedWeights[weight] = {
      mrp: mrpPaise / 100,
      offer: sellingPricePaise / 100,
      mrpPaise,
      sellingPricePaise,
      gstRateBasisPoints,
      taxInclusive: data.taxInclusive !== false,
      hsnCode: normalizeProductText(data.hsnCode || "1106", 20),
      discountLabel: normalizeProductText(data.discountLabel, 50),
      packSize: normalizeProductText(data.packSize || (weight === "1KG" ? "1 Kg" : weight), 30),
      sku: normalizeProductText(data.sku || `${productId}-${weight}`, 60),
      image: normalizeProductText(data.image, 300),
    };
  }

  return {
    productId,
    name: normalizeProductText(body.name, 150),
    subtitle: normalizeProductText(body.subtitle, 200),
    desc: normalizeProductText(body.desc, 1000),
    bestFor: normalizeList(body.bestFor),
    benefits: normalizeList(body.benefits),
    usage: normalizeProductText(body.usage, 1000),
    weights: normalizedWeights,
    isActive: body.isActive !== false,
    sortOrder: Math.max(0, Math.min(10000, Number(body.sortOrder || 0))),
  };
};

const ensureInventoryForProduct = async (productId) => {
  const Inventory = require("./models/Inventory");

  for (const weight of ["250G", "500G", "1KG"]) {
    await Inventory.findOneAndUpdate(
      { productId, weight },
      { $setOnInsert: { stock: 0, reorderLevel: 10 } },
      { upsert: true }
    );
  }
};

const serializeProduct = (productDocument) => {
  const product = productDocument.toObject ? productDocument.toObject() : productDocument;
  const weights = Object.fromEntries(["1KG", "500G", "250G"].map((weight) => {
    const variant = product.weights?.[weight] || {};
    const mrpPaise = variant.mrpPaise ?? Number(variant.mrp || 0) * 100;
    const sellingPricePaise = variant.sellingPricePaise ?? Number(variant.offer || 0) * 100;
    return [weight, {
      ...variant,
      mrpPaise,
      sellingPricePaise,
      selling_price: sellingPricePaise / 100,
      formatted_mrp: `₹${(mrpPaise / 100).toLocaleString("en-IN")}`,
      formatted_selling_price: `₹${(sellingPricePaise / 100).toLocaleString("en-IN")}`,
      tax_rate: Number(variant.gstRateBasisPoints ?? 500) / 100,
      tax_inclusive: variant.taxInclusive !== false,
      hsn_code: variant.hsnCode || "1106",
      discount_label: variant.discountLabel || "",
      pack_size: variant.packSize || weight,
    }];
  }));
  return { ...product, weights };
};

app.get("/api/products", async (req, res) => {
  try {
    const Product = require("./models/Product");
    const includeInactive = req.query.includeInactive === "true";
    if (includeInactive && !optionalAdmin(req)) {
      return res.status(401).json({ success: false, message: "Admin login required" });
    }
    const query = includeInactive ? {} : { isActive: true };
    const products = await Product.find(query).sort({ sortOrder: 1, createdAt: 1 });
    res.set("Cache-Control", "no-store");
    res.json({ success: true, products: products.map(serializeProduct) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/products", requireAdmin, async (req, res) => {
  try {
    const Product = require("./models/Product");
    const payload = normalizeProductPayload(req.body);

    if (!payload.productId || !payload.name) {
      return res.status(400).json({
        success: false,
        message: "Product ID and name are required",
      });
    }

    const product = await Product.findOneAndUpdate(
      { productId: payload.productId },
      payload,
      { new: true, upsert: true, runValidators: true }
    );

    await ensureInventoryForProduct(product.productId);
    res.json({ success: true, product: serializeProduct(product) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    const Product = require("./models/Product");
    const payload = normalizeProductPayload({
      ...req.body,
      productId: req.params.id,
    });

    const product = await Product.findOneAndUpdate(
      { productId: req.params.id },
      payload,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await ensureInventoryForProduct(product.productId);
    res.json({ success: true, product: serializeProduct(product) });
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
    const Product = require("./models/Product");

    for (const product of defaultProducts) {
      await Product.findOneAndUpdate(
        { productId: product.productId },
        { $setOnInsert: product },
        { upsert: true }
      );
    }

    const productIds = await Product.find({ isActive: true }).distinct("productId");
    const inventoryProducts = productIds.flatMap((productId) =>
      ["250G", "500G", "1KG"].map((weight) => ({ productId, weight }))
    );

    for (const product of inventoryProducts) {
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
