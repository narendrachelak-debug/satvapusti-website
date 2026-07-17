require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");

async function run() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  await mongoose.connect(process.env.MONGO_URI, { dbName: "satvapusti" });
  const result = await Product.updateOne(
    { productId: "family" },
    {
      $set: {
        name: "SatvaPusti Family Nutrition Formula",
        "weights.1KG.mrp": 1999,
        "weights.1KG.offer": 1799,
        "weights.1KG.mrpPaise": 199900,
        "weights.1KG.sellingPricePaise": 179900,
        "weights.1KG.gstRateBasisPoints": 500,
        "weights.1KG.taxInclusive": true,
        "weights.1KG.hsnCode": "1106",
        "weights.1KG.discountLabel": "10% OFF",
        "weights.1KG.packSize": "1 Kg",
        "weights.1KG.sku": "FAMILY-1KG",
      },
    },
    { runValidators: true }
  );
  if (result.matchedCount !== 1) {
    throw new Error("Existing family product was not found; migration did not create a duplicate");
  }
  console.log("Family product GST-inclusive pricing updated", result.modifiedCount);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
