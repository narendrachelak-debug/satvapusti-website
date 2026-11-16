export const createDemoInvoiceOrders = (familyProduct) =>
  Array.from({ length: 120 }, (_, index) => {
    const weight = index < 20 ? "250G" : index >= 110 ? "500G" : "1KG";
    const variant = familyProduct?.weights?.[weight] || {};
    const fallbackPrices = { "250G": 499, "500G": 999, "1KG": 1799 };
    const sellingPricePaise = Number(
      variant.sellingPricePaise ?? Number(variant.offer ?? fallbackPrices[weight]) * 100
    );
    const mrpPaise = Number(
      variant.mrpPaise ?? Number(variant.mrp ?? sellingPricePaise / 100) * 100
    );
    const quantityKg = weight === "250G" ? 0.25 : weight === "500G" ? 0.5 : 1;
    const packSize = variant.packSize ||
      (weight === "250G" ? "250 g" : weight === "500G" ? "500 g" : "1 Kg");

    return {
      orderId: `DEMO-${String(index + 1).padStart(3, "0")}`,
      customerName: `Demo Customer ${String(index + 1).padStart(3, "0")}`,
      mobile: "DEMO ONLY — NO REAL NUMBER",
      email: `demo${String(index + 1).padStart(3, "0")}@example.invalid`,
      city: "Demo City",
      address: "Synthetic test data — not a real delivery address",
      pincode: "000000",
      date: `2026-10-${String((index % 30) + 1).padStart(2, "0")}`,
      weight,
      quantityKg,
      packSize,
      hsnCode: variant.hsnCode || "1106",
      gstRateBasisPoints: Number(variant.gstRateBasisPoints ?? 500),
      mrpPaise,
      sellingPricePaise,
      unitPrice: sellingPricePaise / 100,
      totalAmount: sellingPricePaise / 100,
    };
  });
