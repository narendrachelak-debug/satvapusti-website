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
  })
  .catch((error) => {
    console.log("MongoDB Connection Error:", error.message);
  });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});