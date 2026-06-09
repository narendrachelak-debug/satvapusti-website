import { useEffect, useMemo, useState } from "react";

const API_URL = "https://satvapusti-website.onrender.com";
const ADMIN_SESSION_MS = 30 * 60 * 1000;
const SELLER_DETAILS = {
  brand: "SatvaPusti Nutrition",
  fboName: "Satvapusti Nutrition",
  businessType: "General Manufacturing",
  address:
    "H No 59, Pendri, Pandri, Berla, Bemetara, Chhattisgarh - 491335",
  phone: "+91 96396 30828",
  email: "info@satvapusti.com",
  website: "www.satvapusti.com",
  fssai: "20526034000204",
  upi: "9993265857@ybl",
  gstStatus: "GST Unregistered",
};

const emptyProductForm = {
  productId: "",
  name: "",
  subtitle: "",
  desc: "",
  bestFor: "",
  benefits: "",
  usage: "",
  sortOrder: 0,
  isActive: true,
  weights: {
    "1KG": { mrp: "", offer: "", image: "" },
    "500G": { mrp: "", offer: "", image: "" },
    "250G": { mrp: "", offer: "", image: "" },
  },
};

const productToForm = (product) => ({
  productId: product.productId || "",
  name: product.name || "",
  subtitle: product.subtitle || "",
  desc: product.desc || "",
  bestFor: Array.isArray(product.bestFor) ? product.bestFor.join(", ") : "",
  benefits: Array.isArray(product.benefits) ? product.benefits.join(", ") : "",
  usage: product.usage || "",
  sortOrder: product.sortOrder || 0,
  isActive: product.isActive !== false,
  weights: {
    "1KG": {
      mrp: product.weights?.["1KG"]?.mrp || "",
      offer: product.weights?.["1KG"]?.offer || "",
      image: product.weights?.["1KG"]?.image || "",
    },
    "500G": {
      mrp: product.weights?.["500G"]?.mrp || "",
      offer: product.weights?.["500G"]?.offer || "",
      image: product.weights?.["500G"]?.image || "",
    },
    "250G": {
      mrp: product.weights?.["250G"]?.mrp || "",
      offer: product.weights?.["250G"]?.offer || "",
      image: product.weights?.["250G"]?.image || "",
    },
  },
});

export default function Admin() {
  useEffect(() => {
    const token = localStorage.getItem("satvapustiAdminToken");
    const loginTime = Number(localStorage.getItem("satvapustiLoginTime") || 0);

    if (token !== "admin_logged_in" || !loginTime || Date.now() - loginTime > ADMIN_SESSION_MS) {
      localStorage.removeItem("satvapustiAdminToken");
      localStorage.removeItem("satvapustiLoginTime");
      window.location.href = "/admin-login";
    }

    const timeoutCheck = setInterval(() => {
      const activeLoginTime = Number(localStorage.getItem("satvapustiLoginTime") || 0);
      if (!activeLoginTime || Date.now() - activeLoginTime > ADMIN_SESSION_MS) {
        localStorage.removeItem("satvapustiAdminToken");
        localStorage.removeItem("satvapustiLoginTime");
        window.location.href = "/admin-login";
      }
    }, 60000);

    return () => clearInterval(timeoutCheck);
  }, []);

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeAdminView, setActiveAdminView] = useState("dashboard");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [filters, setFilters] = useState({
    orderDateFrom: "",
    orderDateTo: "",
    paymentDateFrom: "",
    paymentDateTo: "",
    deliveryDateFrom: "",
    deliveryDateTo: "",
    orderStatus: "",
    paymentStatus: "",
    customerName: "",
    customerMobile: "",
    customerEmail: "",
  });

  const loadOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/all`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setOrders(data);
      } else if (Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.log("Load orders error:", error);
    }
  };

  const loadInventory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/inventory`);
      const data = await res.json();
      setInventory(data);
    } catch (error) {
      console.log("Load inventory error:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products?includeInactive=true`);
      const data = await res.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (error) {
      console.log("Load products error:", error);
    }
  };

  useEffect(() => {
    loadOrders();
    loadInventory();
    loadProducts();

    const interval = setInterval(() => {
      loadOrders();
      loadInventory();
      loadProducts();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getKolkataDateParts = (dateValue) => {
    if (!dateValue) return null;

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(date).map((part) => [part.type, part.value])
    );

    return {
      day: `${parts.year}-${parts.month}-${parts.day}`,
      month: `${parts.year}-${parts.month}`,
    };
  };

  const updateLocalOrder = (id, field, value) => {
    setOrders((prev) =>
      prev.map((order) =>
        order._id === id ? { ...order, [field]: value } : order
      )
    );
  };

  const saveOrder = async (order, options = {}) => {
    const { showAlert = true, notifyCustomerEmail = false } = options;

    try {
      setSavingId(order._id);

      const res = await fetch(
        `${API_URL}/api/orders/admin/update/${order._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            courierName: order.courierName || "",
            trackingNumber: order.trackingNumber || "",
            trackingUrl: order.trackingUrl || "",
            customerTrackingMessage: order.customerTrackingMessage || "",
            notifyCustomerEmail,
          }),
        }
      );

      const data = await res.json();

     if (!data.success) {
  if (showAlert) alert(data.message || "Order update failed");
  return null;
}

setOrders((prev) =>
  prev.map((item) =>
    item._id === order._id ? data.order : item
  )
);

if (showAlert) alert("Order updated successfully");
return data.order;
    } catch (error) {
      console.log("Save order error:", error);
      if (showAlert) alert("Order update failed");
      return null;
    } finally {
      setSavingId("");
    }
  };
  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim();
    let filtered = orders;

    if (q) {
      filtered = orders.filter((order) => {
        return (
          String(order.orderId || "").toLowerCase().includes(q) ||
          String(order.customerName || "").toLowerCase().includes(q) ||
          String(order.mobile || "").toLowerCase().includes(q) ||
          String(order.email || "").toLowerCase().includes(q) ||
          String(order.paymentMethod || "").toLowerCase().includes(q) ||
          String(order.paymentStatus || "").toLowerCase().includes(q) ||
          String(order.orderStatus || "").toLowerCase().includes(q)
        );
      });
    }

    if (filters.customerName) {
      filtered = filtered.filter((order) =>
        String(order.customerName || "")
          .toLowerCase()
          .includes(filters.customerName.toLowerCase().trim())
      );
    }

    if (filters.customerMobile) {
      filtered = filtered.filter((order) =>
        String(order.mobile || "").includes(filters.customerMobile.trim())
      );
    }

    if (filters.customerEmail) {
      filtered = filtered.filter((order) =>
        String(order.email || "")
          .toLowerCase()
          .includes(filters.customerEmail.toLowerCase().trim())
      );
    }

    if (filters.orderStatus) {
      filtered = filtered.filter((order) => order.orderStatus === filters.orderStatus);
    }

    if (filters.paymentStatus) {
      filtered = filtered.filter((order) => order.paymentStatus === filters.paymentStatus);
    }

    const applyDateRange = (data, field, fromValue, toValue) => {
      if (!fromValue && !toValue) return data;

      return data.filter((order) => {
        if (!order[field]) return false;
        const fieldDate = new Date(order[field]);
        const from = fromValue ? new Date(fromValue) : new Date(0);
        const to = toValue ? new Date(toValue) : new Date();
        to.setHours(23, 59, 59, 999);
        return fieldDate >= from && fieldDate <= to;
      });
    };

    filtered = applyDateRange(
      filtered,
      "createdAt",
      filters.orderDateFrom || dateFrom,
      filters.orderDateTo || dateTo
    );
    filtered = applyDateRange(
      filtered,
      "paymentDate",
      filters.paymentDateFrom,
      filters.paymentDateTo
    );
    filtered = applyDateRange(
      filtered,
      "deliveryDate",
      filters.deliveryDateFrom,
      filters.deliveryDateTo
    );

    if (dateFrom || dateTo) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        const from = dateFrom ? new Date(dateFrom) : new Date(0);
        const to = dateTo ? new Date(dateTo) : new Date();
        to.setHours(23, 59, 59, 999);
        return orderDate >= from && orderDate <= to;
      });
    }

    return filtered;
  }, [orders, search, dateFrom, dateTo, filters]);

  const totalOrders = orders.length;

  const pendingPayments = orders.filter(
    (o) => o.paymentStatus === "Pending"
  ).length;

  const paidOrders = orders.filter(
    (o) => o.paymentStatus === "Paid"
  ).length;

  const failedPayments = orders.filter(
    (o) => o.paymentStatus === "Failed"
  ).length;

  const processingOrders = orders.filter(
    (o) => o.orderStatus === "Processing"
  ).length;

  const shippedOrders = orders.filter(
    (o) => o.orderStatus === "Shipped"
  ).length;

  const deliveredOrders = orders.filter(
    (o) => o.orderStatus === "Delivered"
  ).length;

  const totalRevenue = orders
    .filter(o => o.paymentStatus === "Paid")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const todayParts = getKolkataDateParts(new Date());
  const todayKey = todayParts?.day;
  const thisMonthKey = todayParts?.month;

  const revenueToday = orders
    .filter((o) => {
      const parts = getKolkataDateParts(o.paymentDate || o.createdAt);
      return o.paymentStatus === "Paid" && parts?.day === todayKey;
    })
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const revenueThisMonth = orders
    .filter((o) => {
      const parts = getKolkataDateParts(o.paymentDate || o.createdAt);
      return o.paymentStatus === "Paid" && parts?.month === thisMonthKey;
    })
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const totalCODOrders = orders.filter(o => o.paymentMethod === "COD").length;

  const totalPaidOrders = orders.filter(o => o.paymentStatus === "Paid").length;

  const averageOrderValue = totalPaidOrders > 0 ? totalRevenue / totalPaidOrders : 0;

  const buildSalesReport = (type) => {
    const paid = orders.filter((order) => order.paymentStatus === "Paid");
    const grouped = paid.reduce((acc, order) => {
      const sourceDate = order.paymentDate || order.createdAt;
      if (!sourceDate) return acc;

      const parts = getKolkataDateParts(sourceDate);
      if (!parts) return acc;

      const key =
        type === "monthly"
          ? parts.month
          : parts.day;

      if (!acc[key]) {
        acc[key] = { period: key, orders: 0, revenue: 0 };
      }

      acc[key].orders += 1;
      acc[key].revenue += Number(order.totalAmount || 0);
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => b.period.localeCompare(a.period))
      .slice(0, 8);
  };

  const dailySalesReport = buildSalesReport("daily");
  const monthlySalesReport = buildSalesReport("monthly");

  const customerSummaries = useMemo(() => {
    const customerMap = new Map();

    orders.forEach((order) => {
      const key = order.mobile || order.email || order.customerName || order._id;
      const existing = customerMap.get(key) || {
        name: order.customerName || "Unknown Customer",
        mobile: order.mobile || "N/A",
        email: order.email || "N/A",
        orders: 0,
        paidOrders: 0,
        totalSpent: 0,
      };

      existing.orders += 1;
      if (order.paymentStatus === "Paid") {
        existing.paidOrders += 1;
        existing.totalSpent += Number(order.totalAmount || 0);
      }

      customerMap.set(key, existing);
    });

    return Array.from(customerMap.values()).sort((a, b) => b.orders - a.orders);
  }, [orders]);

  const filteredCustomerSummaries = useMemo(() => {
    const customerMap = new Map();

    filteredOrders.forEach((order) => {
      const key = order.mobile || order.email || order.customerName || order._id;
      const existing = customerMap.get(key) || {
        name: order.customerName || "Unknown Customer",
        mobile: order.mobile || "N/A",
        email: order.email || "N/A",
        orders: 0,
        paidOrders: 0,
        totalSpent: 0,
      };

      existing.orders += 1;
      if (order.paymentStatus === "Paid") {
        existing.paidOrders += 1;
        existing.totalSpent += Number(order.totalAmount || 0);
      }

      customerMap.set(key, existing);
    });

    return Array.from(customerMap.values()).sort((a, b) => b.orders - a.orders);
  }, [filteredOrders]);

  const lowStockItems = inventory.filter((item) => Number(item.stock || 0) < 10);
  const paymentOrders = filteredOrders.filter((order) =>
    ["Pending", "Awaiting Verification"].includes(
      order.paymentStatus || "Pending"
    )
  );
  const latestFilteredOrders = [...filteredOrders].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  const visibleOrders =
    activeAdminView === "payments" ? paymentOrders : latestFilteredOrders;
  const showSummary = activeAdminView === "dashboard";
  const showControls =
    activeAdminView === "dashboard" ||
    activeAdminView === "orders" ||
    activeAdminView === "payments" ||
    activeAdminView === "customers";
  const showReports = activeAdminView === "dashboard" || activeAdminView === "reports";
  const showOrders =
    activeAdminView === "dashboard" ||
    activeAdminView === "orders" ||
    activeAdminView === "payments" ||
    activeAdminView === "customers";
  const viewTitleMap = {
    dashboard: "Dashboard Overview",
    orders: "Order Management",
    payments: "Payment Review",
    products: "Product Management",
    inventory: "Inventory Control",
    reports: "Sales Reports",
    customers: "Customer Directory",
  };

  const copyAddress = (order) => {
    const text = `${order.customerName || ""}
${order.address || ""}
${order.city || ""}
${order.pincode || ""}
${order.mobile || ""}`;

    navigator.clipboard.writeText(text);
    alert("Address copied");
  };

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const getFinancialYear = (dateValue) => {
    const date = dateValue ? new Date(dateValue) : new Date();
    const parts = getKolkataDateParts(date);
    const year = Number(parts?.month?.slice(0, 4) || date.getFullYear());
    const month = Number(parts?.month?.slice(5, 7) || date.getMonth() + 1);
    const startYear = month >= 4 ? year : year - 1;
    return `${startYear}-${String(startYear + 1).slice(-2)}`;
  };

  const buildBillNumber = (order) =>
    `SP/${getFinancialYear(order.createdAt)}/${String(order.orderId || order._id || "").replace(/[^a-zA-Z0-9-]/g, "")}`;

  const getPaymentClassification = (order) => {
    const method = String(order.paymentMethod || "").toUpperCase();
    const status = order.paymentStatus || "Pending";
    const isCOD = method === "COD";

    if (isCOD) {
      return {
        type: "Cash on Delivery (COD)",
        status: status === "Paid" ? "Paid / Collected" : "To be collected on delivery",
      };
    }

    return {
      type: "Prepaid",
      status:
        status === "Paid"
          ? "Paid"
          : status === "Awaiting Verification"
            ? "Awaiting Payment Verification"
            : status,
    };
  };

  const numberToIndianWords = (amount) => {
    const num = Math.round(Number(amount || 0));
    if (num === 0) return "Zero Rupees Only";

    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const twoDigits = (value) =>
      value < 20
        ? ones[value]
        : `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${ones[value % 10]}` : ""}`;

    const threeDigits = (value) => {
      const hundred = Math.floor(value / 100);
      const rest = value % 100;
      return `${hundred ? `${ones[hundred]} Hundred` : ""}${hundred && rest ? " " : ""}${rest ? twoDigits(rest) : ""}`;
    };

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const hundred = num % 1000;
    const words = [];

    if (crore) words.push(`${threeDigits(crore)} Crore`);
    if (lakh) words.push(`${threeDigits(lakh)} Lakh`);
    if (thousand) words.push(`${threeDigits(thousand)} Thousand`);
    if (hundred) words.push(threeDigits(hundred));

    return `${words.join(" ")} Rupees Only`;
  };

  const buildInvoiceHtml = (order) => {
    const payment = getPaymentClassification(order);
    const items = Array.isArray(order.items) && order.items.length > 0
      ? order.items
      : [{ name: "SatvaPusti Nutrition Product", weight: "", quantity: 1, offer: order.totalAmount || 0 }];
    const totalAmount = Number(order.totalAmount || 0);
    const rows = items
      .map((item, index) => {
        const quantity = Number(item.quantity || 1);
        const unitPrice = Number(item.offer || item.price || 0);
        const lineTotal = unitPrice * quantity;
        return `
          <tr>
            <td>${index + 1}</td>
            <td>
              <strong>${escapeHtml(item.name || "SatvaPusti Nutrition Product")}</strong>
              ${item.weight ? `<br><span>${escapeHtml(item.weight)}</span>` : ""}
            </td>
            <td>${escapeHtml(item.weight || "Unit")}</td>
            <td class="num">${quantity}</td>
            <td class="num">${formatCurrency(unitPrice)}</td>
            <td class="num">${formatCurrency(lineTotal)}</td>
          </tr>
        `;
      })
      .join("");

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bill of Supply - ${escapeHtml(order.orderId || "")}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f3f4f6; color: #111827; font-family: Arial, sans-serif; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm; background: #fff; }
    .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111827; padding-bottom: 14px; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 28px; color: #06451f; }
    h2 { font-size: 20px; text-align: right; text-transform: uppercase; }
    .muted { color: #4b5563; font-size: 12px; line-height: 1.55; }
    .meta { margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; }
    .box h3 { margin-bottom: 8px; font-size: 14px; color: #06451f; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #d1d5db; padding: 9px; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef9f0; color: #06451f; }
    .num { text-align: right; white-space: nowrap; }
    .totals { margin-top: 14px; display: grid; grid-template-columns: 1fr 260px; gap: 16px; align-items: start; }
    .totalLine { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .grand { font-size: 18px; font-weight: 800; }
    .note { margin-top: 16px; padding: 10px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; font-size: 12px; line-height: 1.5; }
    .footer { margin-top: 28px; display: flex; justify-content: space-between; gap: 20px; align-items: end; font-size: 12px; }
    .sign { min-width: 220px; border-top: 1px solid #111827; padding-top: 8px; text-align: center; }
    .actions { position: sticky; top: 0; padding: 10px; background: #111827; text-align: center; }
    .actions button { border: 0; border-radius: 6px; padding: 9px 14px; background: #0f9d58; color: white; font-weight: 700; cursor: pointer; }
    @media print {
      body { background: #fff; }
      .page { width: auto; min-height: auto; margin: 0; padding: 0; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="actions"><button onclick="window.print()">Print / Save PDF</button></div>
  <main class="page">
    <section class="top">
      <div>
        <h1>${escapeHtml(SELLER_DETAILS.brand)}</h1>
        <p class="muted">
          FBO Name: ${escapeHtml(SELLER_DETAILS.fboName)}<br>
          Business Type: ${escapeHtml(SELLER_DETAILS.businessType)}<br>
          ${escapeHtml(SELLER_DETAILS.address)}<br>
          Phone: ${escapeHtml(SELLER_DETAILS.phone)} | Email: ${escapeHtml(SELLER_DETAILS.email)}<br>
          Website: ${escapeHtml(SELLER_DETAILS.website)} | UPI: ${escapeHtml(SELLER_DETAILS.upi)}<br>
          FSSAI Registration No: ${escapeHtml(SELLER_DETAILS.fssai)} | ${escapeHtml(SELLER_DETAILS.gstStatus)}
        </p>
      </div>
      <div>
        <h2>Bill of Supply</h2>
        <p class="muted">
          Bill No: <strong>${escapeHtml(buildBillNumber(order))}</strong><br>
          Order ID: ${escapeHtml(order.orderId || "N/A")}<br>
          Bill Date: ${escapeHtml(formatDate(order.paymentDate || order.createdAt))}<br>
          Payment Type: <strong>${escapeHtml(payment.type)}</strong><br>
          Collection Status: <strong>${escapeHtml(payment.status)}</strong>
        </p>
      </div>
    </section>

    <section class="meta">
      <div class="box">
        <h3>Bill To</h3>
        <p>
          <strong>${escapeHtml(order.customerName || "Customer")}</strong><br>
          ${escapeHtml(order.address || "N/A")}<br>
          ${escapeHtml(order.city || "N/A")} - ${escapeHtml(order.pincode || "N/A")}<br>
          Mobile: ${escapeHtml(order.mobile || "N/A")}<br>
          Email: ${escapeHtml(order.email || "N/A")}
        </p>
      </div>
      <div class="box">
        <h3>Shipped To</h3>
        <p>
          <strong>${escapeHtml(order.customerName || "Customer")}</strong><br>
          ${escapeHtml(order.address || "N/A")}<br>
          ${escapeHtml(order.city || "N/A")} - ${escapeHtml(order.pincode || "N/A")}<br>
          Mobile: ${escapeHtml(order.mobile || "N/A")}
        </p>
      </div>
      <div class="box">
        <h3>Payment Classification</h3>
        <p>
          <strong>${escapeHtml(payment.type)}</strong><br>
          Status: ${escapeHtml(payment.status)}<br>
          Mode Recorded: ${escapeHtml(order.paymentMethod || "N/A")}
        </p>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th style="width: 42px;">#</th>
          <th>Description</th>
          <th style="width: 95px;">Unit</th>
          <th style="width: 70px;">Qty</th>
          <th style="width: 110px;">Rate</th>
          <th style="width: 120px;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <section class="totals">
      <div class="box">
        <h3>Amount in Words</h3>
        <p>${escapeHtml(numberToIndianWords(totalAmount))}</p>
      </div>
      <div class="box">
        <div class="totalLine"><span>Subtotal</span><strong>${formatCurrency(totalAmount)}</strong></div>
        <div class="totalLine"><span>GST</span><strong>Not Applicable</strong></div>
        <div class="totalLine grand"><span>Total</span><strong>${formatCurrency(totalAmount)}</strong></div>
      </div>
    </section>

    <p class="note">
      Seller is GST unregistered. GST has not been charged or collected on this Bill of Supply.
      This document is generated from SatvaPusti admin order records.
    </p>

    <section class="footer">
      <p class="muted">This is a computer generated bill.</p>
      <div class="sign">Authorized Signatory<br>${escapeHtml(SELLER_DETAILS.brand)}</div>
    </section>
  </main>
</body>
</html>`;
  };

  const buildPackingSlipHtml = (order) => {
    const items = Array.isArray(order.items) && order.items.length > 0
      ? order.items
      : [{ name: "SatvaPusti Nutrition Product", weight: "", quantity: 1 }];
    const rows = items
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>
              <strong>${escapeHtml(item.name || "SatvaPusti Nutrition Product")}</strong>
              ${item.weight ? `<br><span>${escapeHtml(item.weight)}</span>` : ""}
            </td>
            <td>${escapeHtml(item.weight || "Unit")}</td>
            <td class="num">${Number(item.quantity || 1)}</td>
            <td class="check"></td>
          </tr>
        `
      )
      .join("");

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Packing Slip - ${escapeHtml(order.orderId || "")}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f3f4f6; color: #111827; font-family: Arial, sans-serif; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm; background: #fff; }
    .actions { position: sticky; top: 0; padding: 10px; background: #111827; text-align: center; }
    .actions button { border: 0; border-radius: 6px; padding: 9px 14px; background: #0b7285; color: white; font-weight: 700; cursor: pointer; }
    .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111827; padding-bottom: 14px; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 28px; color: #06451f; }
    h2 { font-size: 20px; text-align: right; text-transform: uppercase; }
    .muted { color: #4b5563; font-size: 12px; line-height: 1.55; }
    .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; margin-top: 14px; }
    .box h3 { margin-bottom: 8px; font-size: 14px; color: #06451f; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; vertical-align: top; font-size: 14px; }
    th { background: #eef9f0; color: #06451f; }
    .num { text-align: right; white-space: nowrap; }
    .check { width: 64px; height: 38px; }
    .checks { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px; }
    .checkline { min-height: 42px; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; font-weight: 700; }
    .footer { margin-top: 28px; display: flex; justify-content: space-between; gap: 20px; font-size: 12px; }
    @media print {
      body { background: #fff; }
      .page { width: auto; min-height: auto; margin: 0; padding: 0; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="actions"><button onclick="window.print()">Print Packing Slip</button></div>
  <main class="page">
    <section class="top">
      <div>
        <h1>${escapeHtml(SELLER_DETAILS.brand)}</h1>
        <p class="muted">
          Phone: ${escapeHtml(SELLER_DETAILS.phone)} | ${escapeHtml(SELLER_DETAILS.website)}<br>
          FSSAI Registration No: ${escapeHtml(SELLER_DETAILS.fssai)}
        </p>
      </div>
      <div>
        <h2>Packing Slip</h2>
        <p class="muted">
          Order ID: <strong>${escapeHtml(order.orderId || "N/A")}</strong><br>
          Order Date: ${escapeHtml(formatDate(order.createdAt))}<br>
          Order Status: ${escapeHtml(order.orderStatus || "Received")}
        </p>
      </div>
    </section>

    <div class="box">
      <h3>Ship To</h3>
      <p>
        <strong>${escapeHtml(order.customerName || "Customer")}</strong><br>
        ${escapeHtml(order.address || "N/A")}<br>
        ${escapeHtml(order.city || "N/A")} - ${escapeHtml(order.pincode || "N/A")}<br>
        Mobile: ${escapeHtml(order.mobile || "N/A")}
      </p>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 42px;">#</th>
          <th>Product</th>
          <th style="width: 110px;">Unit</th>
          <th style="width: 80px;">Qty</th>
          <th style="width: 80px;">Packed</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <section class="checks">
      <div class="checkline">Address checked: ____</div>
      <div class="checkline">Products checked: ____</div>
      <div class="checkline">Packed by: ____</div>
      <div class="checkline">Dispatch ready: ____</div>
    </section>

    <section class="footer">
      <p class="muted">Internal packing document. No price or tax information included.</p>
      <p>Generated: ${escapeHtml(formatDate(new Date()))}</p>
    </section>
  </main>
</body>
</html>`;
  };

  const openInvoice = (order) => {
    const invoiceWindow = window.open("", "_blank");
    if (!invoiceWindow) {
      alert("Please allow popups to generate invoice");
      return;
    }

    invoiceWindow.document.open();
    invoiceWindow.document.write(buildInvoiceHtml(order));
    invoiceWindow.document.close();
    invoiceWindow.focus();
  };

  const openPackingSlip = (order) => {
    const slipWindow = window.open("", "_blank");
    if (!slipWindow) {
      alert("Please allow popups to generate packing slip");
      return;
    }

    slipWindow.document.open();
    slipWindow.document.write(buildPackingSlipHtml(order));
    slipWindow.document.close();
    slipWindow.focus();
  };

  const openCustomerWhatsApp = (order, template = "update") => {
    const cleanMobile = String(order.mobile || "").replace(/\D/g, "");

    if (!cleanMobile) {
      alert("Mobile number not available");
      return;
    }

    const finalMobile = cleanMobile.startsWith("91")
      ? cleanMobile
      : `91${cleanMobile}`;

    const statusByTemplate = {
      received: "Received",
      payment: order.orderStatus || "Received",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      update: order.orderStatus || "Received",
    };
    const displayStatus = statusByTemplate[template] || order.orderStatus || "Received";
    const displayPaymentStatus =
      template === "payment" ? "Paid" : order.paymentStatus || "Pending";

    const baseUpdate = `Hello ${order.customerName || ""},
Your SatvaPusti order update:

Order ID: ${order.orderId}
Payment Method: ${order.paymentMethod || "N/A"}
Payment Status: ${displayPaymentStatus}
Order Status: ${displayStatus}
Amount: ₹${order.totalAmount}
${order.courierName ? `Courier: ${order.courierName}` : ""}
${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : ""}
${order.trackingUrl ? `Track Here: ${order.trackingUrl}` : ""}`;

    const templates = {
      received: `Hello ${order.customerName || ""}, your SatvaPusti order ${order.orderId} has been received. Amount: ₹${order.totalAmount}.`,
      payment: `Hello ${order.customerName || ""}, payment for your SatvaPusti order ${order.orderId} is confirmed. We will process it shortly.`,
      processing: `Hello ${order.customerName || ""}, your SatvaPusti order ${order.orderId} is now being processed.`,
      shipped: baseUpdate,
      delivered: `Hello ${order.customerName || ""}, your SatvaPusti order ${order.orderId} has been delivered. Thank you for shopping with us.`,
      update: order.customerTrackingMessage || baseUpdate,
    };

    const message = templates[template] || baseUpdate;

    window.open(
      `https://wa.me/${finalMobile}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const updateStatusAndOpenWhatsApp = async (order, template) => {
    const statusByTemplate = {
      shipped: "Shipped",
      delivered: "Delivered",
    };
    const orderStatus = statusByTemplate[template];

    if (!orderStatus) {
      openCustomerWhatsApp(order, template);
      return;
    }

    const updatedOrder = {
      ...order,
      orderStatus,
    };

    updateLocalOrder(order._id, "orderStatus", orderStatus);
    const savedOrder = await saveOrder(updatedOrder, {
      showAlert: false,
      notifyCustomerEmail: true,
    });

    if (!savedOrder) {
      alert("Order update failed. WhatsApp message was not opened.");
      return;
    }

    openCustomerWhatsApp(savedOrder, template);
  };

  const verifyPassword = async () => {
    if (!currentPassword) {
      setPasswordMessage("Please enter your password");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setPasswordMessage("✅ Password verified! To change password, update ADMIN_PASSWORD in your .env file and redeploy.");
        setCurrentPassword("");
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordMessage("");
        }, 3000);
      } else {
        setPasswordMessage("❌ " + (data.message || "Incorrect password"));
      }
    } catch (error) {
      setPasswordMessage("❌ Error verifying password");
      console.error(error);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordMessage("Please enter current and new password");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setPasswordMessage("Password changed. Update ADMIN_PASSWORD in hosting env before redeploy.");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPasswordMessage(data.message || "Password change failed");
      }
    } catch (error) {
      setPasswordMessage("Error changing password");
      console.error(error);
    }
  };

  const exportToCSV = (data) => {
    if (!data || data.length === 0) {
      alert("No orders to export");
      return;
    }

    const headers = [
      "Order ID",
      "Customer Name",
      "Mobile",
      "Email",
      "Address",
      "City",
      "Pincode",
      "Total Amount",
      "Payment Method",
      "Payment Status",
      "Order Status",
      "Courier Name",
      "Tracking Number",
      "Order Date",
      "Payment Date",
      "Delivery Date",
    ];

    const rows = data.map((order) => [
      order.orderId || "",
      order.customerName || "",
      order.mobile || "",
      order.email || "",
      order.address || "",
      order.city || "",
      order.pincode || "",
      order.totalAmount || "",
      order.paymentMethod || "",
      order.paymentStatus || "",
      order.orderStatus || "",
      order.courierName || "",
      order.trackingNumber || "",
      order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "",
      order.paymentDate ? new Date(order.paymentDate).toLocaleDateString() : "",
      order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const escaped = String(cell).replace(/"/g, '""');
            return escaped.includes(",") ? `"${escaped}"` : escaped;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `satvapusti_orders_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (data) => {
    if (!data || data.length === 0) {
      alert("No orders to export");
      return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `satvapusti_orders_${new Date().toISOString().split("T")[0]}.json`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateInventoryStock = async (productId, weight, newStock) => {
    try {
      const res = await fetch(`${API_URL}/api/inventory/${productId}/${weight}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      
      const data = await res.json();
      if (data.success) {
        alert("Stock updated successfully");
        loadInventory();
      }
    } catch (error) {
      alert("Error updating stock");
      console.error(error);
    }
  };

  const updateProductWeight = (weight, field, value) => {
    setProductForm((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        [weight]: {
          ...prev.weights[weight],
          [field]: value,
        },
      },
    }));
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setEditingProductId("");
  };

  const saveProduct = async () => {
    if (!productForm.productId || !productForm.name) {
      alert("Product ID and name are required");
      return;
    }

    try {
      setSavingProduct(true);
      const payload = {
        ...productForm,
        bestFor: productForm.bestFor,
        benefits: productForm.benefits,
        sortOrder: Number(productForm.sortOrder || 0),
        weights: Object.fromEntries(
          ["1KG", "500G", "250G"].map((weight) => [
            weight,
            {
              mrp: Number(productForm.weights[weight].mrp || 0),
              offer: Number(productForm.weights[weight].offer || 0),
              image: productForm.weights[weight].image || "",
            },
          ])
        ),
      };
      const url = editingProductId
        ? `${API_URL}/api/products/${editingProductId}`
        : `${API_URL}/api/products`;
      const res = await fetch(url, {
        method: editingProductId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Product save failed");
        return;
      }

      alert("Product saved successfully");
      resetProductForm();
      loadProducts();
      loadInventory();
    } catch (error) {
      console.error(error);
      alert("Product save failed");
    } finally {
      setSavingProduct(false);
    }
  };

  const editProduct = (product) => {
    setProductForm(productToForm(product));
    setEditingProductId(product.productId);
    setActiveAdminView("products");
  };

  return (
    <div className="adminDashboardShell" style={pageStyle}>
      <aside className="adminSidebar">
        <div className="adminBrandMark">SP</div>
        <nav className="adminSidebarNav" aria-label="Admin sections">
          <button
            className={activeAdminView === "dashboard" ? "active" : ""}
            onClick={() => setActiveAdminView("dashboard")}
          >
            <span>Dashboard</span>
            <b>{totalOrders}</b>
          </button>
          <button
            className={activeAdminView === "orders" ? "active" : ""}
            onClick={() => setActiveAdminView("orders")}
          >
            <span>Orders</span>
            <b>{filteredOrders.length}</b>
          </button>
          <button
            className={activeAdminView === "payments" ? "active" : ""}
            onClick={() => setActiveAdminView("payments")}
          >
            <span>Payments</span>
            <b>{pendingPayments}</b>
          </button>
          <button
            className={activeAdminView === "inventory" ? "active" : ""}
            onClick={() => setActiveAdminView("inventory")}
          >
            <span>Inventory</span>
            <b>{lowStockItems.length}</b>
          </button>
          <button
            className={activeAdminView === "products" ? "active" : ""}
            onClick={() => setActiveAdminView("products")}
          >
            <span>Products</span>
            <b>{products.length}</b>
          </button>
          <button
            className={activeAdminView === "reports" ? "active" : ""}
            onClick={() => setActiveAdminView("reports")}
          >
            <span>Reports</span>
            <b>{dailySalesReport.length}</b>
          </button>
          <button
            className={activeAdminView === "customers" ? "active" : ""}
            onClick={() => setActiveAdminView("customers")}
          >
            <span>Customers</span>
            <b>{customerSummaries.length}</b>
          </button>
        </nav>
      </aside>

      <main className="adminMainPanel">
      <div className="adminTopBar">
        <div>
          <h1>SatvaPusti Admin Panel</h1>
          <p className="adminViewSubtitle">{viewTitleMap[activeAdminView]}</p>
        </div>
        <button
          className="adminLogoutBtn"
          onClick={() => {
            localStorage.removeItem("satvapustiAdminToken");
            localStorage.removeItem("satvapustiLoginTime");
            window.location.href = "/?page=admin";
          }}
        >
          Logout
        </button>
      </div>

      {activeAdminView === "inventory" && (
        <div className="adminViewActions">
          <button
            onClick={() => setShowInventoryModal(true)}
            className="admin-action-button admin-inventory-button"
          >
            Manage Inventory
          </button>
        </div>
      )}

      {activeAdminView === "inventory" && (
        <div className="adminInfoGrid">
          <div className="adminInfoPanel">
            <h3>Inventory Snapshot</h3>
            <p>Total inventory items: <b>{inventory.length}</b></p>
            <p>Low or out of stock: <b>{lowStockItems.length}</b></p>
          </div>
          {lowStockItems.slice(0, 8).map((item) => (
            <div className="adminInfoPanel" key={`${item.productId}-${item.weight}`}>
              <h3>{String(item.productId || "").toUpperCase()} - {item.weight}</h3>
              <p>Stock: <b>{item.stock}</b></p>
              <button
                onClick={() => setShowInventoryModal(true)}
                className="adminSecondaryBtn"
              >
                Update Stock
              </button>
            </div>
          ))}
        </div>
      )}

      {activeAdminView === "products" && (
        <div className="adminProductsManager">
          <div className="adminInfoPanel">
            <h3>{editingProductId ? "Edit Product" : "Add Product"}</h3>
            <div style={gridStyle}>
              <input
                placeholder="Product ID"
                value={productForm.productId}
                disabled={Boolean(editingProductId)}
                onChange={(e) =>
                  setProductForm({ ...productForm, productId: e.target.value })
                }
                style={inputStyle}
              />
              <input
                placeholder="Product Name"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
                style={inputStyle}
              />
              <input
                placeholder="Subtitle"
                value={productForm.subtitle}
                onChange={(e) =>
                  setProductForm({ ...productForm, subtitle: e.target.value })
                }
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Sort order"
                value={productForm.sortOrder}
                onChange={(e) =>
                  setProductForm({ ...productForm, sortOrder: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <textarea
              placeholder="Description"
              value={productForm.desc}
              onChange={(e) =>
                setProductForm({ ...productForm, desc: e.target.value })
              }
              style={{ ...inputStyle, minHeight: "70px" }}
            />
            <textarea
              placeholder="Best for tags, comma separated"
              value={productForm.bestFor}
              onChange={(e) =>
                setProductForm({ ...productForm, bestFor: e.target.value })
              }
              style={{ ...inputStyle, minHeight: "58px" }}
            />
            <textarea
              placeholder="Benefits, comma separated"
              value={productForm.benefits}
              onChange={(e) =>
                setProductForm({ ...productForm, benefits: e.target.value })
              }
              style={{ ...inputStyle, minHeight: "58px" }}
            />
            <textarea
              placeholder="Usage"
              value={productForm.usage}
              onChange={(e) =>
                setProductForm({ ...productForm, usage: e.target.value })
              }
              style={{ ...inputStyle, minHeight: "70px" }}
            />
            <div className="adminInfoGrid" style={{ marginBottom: "12px" }}>
              {["1KG", "500G", "250G"].map((weight) => (
                <div className="adminInfoPanel" key={weight}>
                  <h3>{weight}</h3>
                  <input
                    type="number"
                    placeholder="MRP"
                    value={productForm.weights[weight].mrp}
                    onChange={(e) => updateProductWeight(weight, "mrp", e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    placeholder="Offer price"
                    value={productForm.weights[weight].offer}
                    onChange={(e) => updateProductWeight(weight, "offer", e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Image URL"
                    value={productForm.weights[weight].image}
                    onChange={(e) => updateProductWeight(weight, "image", e.target.value)}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
            <label style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
              <input
                type="checkbox"
                checked={productForm.isActive}
                onChange={(e) =>
                  setProductForm({ ...productForm, isActive: e.target.checked })
                }
              />
              Active
            </label>
            <div className="adminButtonRow">
              <button
                onClick={saveProduct}
                disabled={savingProduct}
                className="admin-action-button admin-inventory-button"
              >
                {savingProduct ? "Saving..." : editingProductId ? "Update Product" : "Add Product"}
              </button>
              <button onClick={resetProductForm} className="adminSecondaryBtn">
                Clear
              </button>
            </div>
          </div>

          <div className="adminInfoGrid">
            {products.map((product) => (
              <div className="adminInfoPanel" key={product.productId}>
                <h3>{product.name}</h3>
                <p>ID: <b>{product.productId}</b></p>
                <p>{product.subtitle}</p>
                <p>Status: <b>{product.isActive === false ? "Inactive" : "Active"}</b></p>
                <div style={{ display: "grid", gap: "6px", margin: "10px 0" }}>
                  {["1KG", "500G", "250G"].map((weight) => (
                    <span key={weight}>
                      {weight}: MRP {product.weights?.[weight]?.mrp || 0}, Offer {product.weights?.[weight]?.offer || 0}
                    </span>
                  ))}
                </div>
                <button onClick={() => editProduct(product)} className="adminSecondaryBtn">
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSummary && (
      <div className="admin-summary-grid" style={{ marginBottom: "18px" }}>
        <div style={boxStyle}>
          Total Orders
          <br />
          <b>{totalOrders}</b>
        </div>

        <div style={boxStyle}>
          Pending Payment
          <br />
          <b>{pendingPayments}</b>
        </div>

        <div style={boxStyle}>
          Paid Orders
          <br />
          <b>{paidOrders}</b>
        </div>

        <div style={boxStyle}>
          Failed Payment
          <br />
          <b>{failedPayments}</b>
        </div>

        <div style={boxStyle}>
          Processing
          <br />
          <b>{processingOrders}</b>
        </div>

        <div style={boxStyle}>
          Shipped
          <br />
          <b>{shippedOrders}</b>
        </div>

        <div style={boxStyle}>
          Delivered
          <br />
          <b>{deliveredOrders}</b>
        </div>

        <div style={boxStyle}>
          Total Revenue
          <br />
          <b>₹{totalRevenue.toLocaleString()}</b>
        </div>

        <div style={boxStyle}>
          Revenue Today
          <br />
          <b>₹{revenueToday.toLocaleString()}</b>
        </div>

        <div style={boxStyle}>
          Revenue This Month
          <br />
          <b>₹{revenueThisMonth.toLocaleString()}</b>
        </div>

        <div style={boxStyle}>
          COD Orders
          <br />
          <b>{totalCODOrders}</b>
        </div>

        <div style={boxStyle}>
          Average Order Value
          <br />
          <b>₹{Math.round(averageOrderValue).toLocaleString()}</b>
        </div>

      </div>
      )}

      {showControls && (
      <div className="adminControls">
        <div className="adminSearchRow">
      <input
        placeholder="Search Order ID, Mobile, Name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={searchStyle}
      />

      <button
        className="adminSecondaryBtn"
        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
      >
        {showAdvancedFilters ? "Hide Advanced Filters" : "Advanced Filters"}
      </button>
        </div>

      {activeAdminView !== "customers" && (
      <div className="adminButtonRow">
        <button
          onClick={() => exportToCSV(filteredOrders)}
          className="admin-action-button admin-csv-button"
        >
          Export CSV
        </button>
        <button
          onClick={() => exportToJSON(filteredOrders)}
          className="admin-action-button admin-json-button"
        >
          Export JSON
        </button>
        <button
          onClick={() => setShowInventoryModal(true)}
          className="admin-action-button admin-inventory-button"
        >
          Manage Inventory
        </button>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="admin-action-button admin-password-button"
        >
          Change Password
        </button>
      </div>
      )}
      </div>
      )}

      {showControls && showAdvancedFilters && (
        <div className="adminAdvancedFilters">
          <input
            placeholder="Customer name"
            value={filters.customerName}
            onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
            style={filterInputStyle}
          />
            <input
              placeholder="Customer mobile"
              value={filters.customerMobile}
              onChange={(e) => setFilters({ ...filters, customerMobile: e.target.value })}
              style={filterInputStyle}
            />
            <input
              placeholder="Customer email"
              value={filters.customerEmail}
              onChange={(e) => setFilters({ ...filters, customerEmail: e.target.value })}
              style={filterInputStyle}
            />
            <select
              value={filters.orderStatus}
              onChange={(e) => setFilters({ ...filters, orderStatus: e.target.value })}
              style={filterInputStyle}
            >
              <option value="">All Order Status</option>
              <option>Received</option>
              <option>Processing</option>
              <option>Packed</option>
              <option>Shipped</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              style={filterInputStyle}
            >
              <option value="">All Payment Status</option>
              <option>Pending</option>
              <option>Awaiting Verification</option>
              <option>Paid</option>
              <option>Failed</option>
            </select>
            <input
              type="date"
              value={filters.orderDateFrom}
              onChange={(e) => setFilters({ ...filters, orderDateFrom: e.target.value })}
              style={filterInputStyle}
              title="Order date from"
            />
            <input
              type="date"
              value={filters.orderDateTo}
              onChange={(e) => setFilters({ ...filters, orderDateTo: e.target.value })}
              style={filterInputStyle}
              title="Order date to"
            />
            <input
              type="date"
              value={filters.paymentDateFrom}
              onChange={(e) => setFilters({ ...filters, paymentDateFrom: e.target.value })}
              style={filterInputStyle}
              title="Payment date from"
            />
            <input
              type="date"
              value={filters.paymentDateTo}
              onChange={(e) => setFilters({ ...filters, paymentDateTo: e.target.value })}
              style={filterInputStyle}
              title="Payment date to"
            />
            <input
              type="date"
              value={filters.deliveryDateFrom}
              onChange={(e) => setFilters({ ...filters, deliveryDateFrom: e.target.value })}
              style={filterInputStyle}
              title="Delivery date from"
            />
            <input
              type="date"
              value={filters.deliveryDateTo}
              onChange={(e) => setFilters({ ...filters, deliveryDateTo: e.target.value })}
              style={filterInputStyle}
              title="Delivery date to"
            />
            <button
              onClick={() => {
                setSearch("");
                setDateFrom("");
                setDateTo("");
                setFilters({
                  orderDateFrom: "",
                  orderDateTo: "",
                  paymentDateFrom: "",
                  paymentDateTo: "",
                  deliveryDateFrom: "",
                  deliveryDateTo: "",
                  orderStatus: "",
                  paymentStatus: "",
                  customerName: "",
                  customerMobile: "",
                  customerEmail: "",
                });
              }}
              className="adminSecondaryBtn"
            >
              Clear Filters
            </button>
        </div>
      )}

      {activeAdminView === "customers" && (
        <div className="adminInfoGrid adminCustomersGrid">
          {filteredCustomerSummaries.length === 0 ? (
            <div className="adminInfoPanel">
              <h3>No customers found.</h3>
            </div>
          ) : (
            filteredCustomerSummaries.map((customer) => (
              <div className="adminInfoPanel" key={`${customer.mobile}-${customer.email}`}>
                <h3>{customer.name}</h3>
                <p>Mobile: <b>{customer.mobile}</b></p>
                <p>Email: <b>{customer.email}</b></p>
                <p>Orders: <b>{customer.orders}</b> | Paid: <b>{customer.paidOrders}</b></p>
                <p>Total spent: <b>₹{customer.totalSpent.toLocaleString()}</b></p>
              </div>
            ))
          )}
        </div>
      )}

      {showReports && (
      <div style={reportsGridStyle}>
        <div style={reportBoxStyle}>
          <h3>Daily Sales Report</h3>
          {dailySalesReport.length === 0 ? (
            <p>No paid sales yet.</p>
          ) : (
            dailySalesReport.map((item) => (
              <p key={item.period}>
                <b>{item.period}</b> | Orders: {item.orders} | Revenue: ₹{item.revenue.toLocaleString()}
              </p>
            ))
          )}
        </div>

        <div style={reportBoxStyle}>
          <h3>Monthly Sales Report</h3>
          {monthlySalesReport.length === 0 ? (
            <p>No paid sales yet.</p>
          ) : (
            monthlySalesReport.map((item) => (
              <p key={item.period}>
                <b>{item.period}</b> | Orders: {item.orders} | Revenue: ₹{item.revenue.toLocaleString()}
              </p>
            ))
          )}
        </div>
      </div>
      )}

      {showPasswordModal && (
        <div style={{ ...modalBgStyle }}>
          <div style={{ ...modalBoxStyle, maxWidth: "400px" }}>
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordMessage("");
                setCurrentPassword("");
                setNewPassword("");
              }}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <h2>Change Password</h2>
            <p style={{ color: "#666", fontSize: "14px" }}>
              Enter your current password to verify. To set a new password, update ADMIN_PASSWORD in your .env file.
            </p>

            <input
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                boxSizing: "border-box",
              }}
            />

            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                boxSizing: "border-box",
              }}
            />

            {passwordMessage && (
              <p style={{ marginBottom: "10px", fontSize: "14px", color: passwordMessage.includes("✅") ? "green" : "red" }}>
                {passwordMessage}
              </p>
            )}

            <button
              onClick={verifyPassword}
              style={{
                width: "100%",
                padding: "10px",
                background: "#0f9d58",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Verify Password
            </button>

            <button
              onClick={changePassword}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "10px",
                background: "#198754",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Change Password
            </button>
          </div>
        </div>
      )}

      {showInventoryModal && (
        <div style={modalBgStyle}>
          <div style={{ ...modalBoxStyle, maxWidth: "700px" }}>
            <button
              onClick={() => setShowInventoryModal(false)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <h2>Manage Inventory</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", maxHeight: "400px", overflowY: "auto" }}>
              {inventory.map((item) => (
                <div
                  key={`${item.productId}-${item.weight}`}
                  style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    borderRadius: "6px",
                    background: item.stock === 0 ? "#ffebee" : item.stock < 10 ? "#fff3cd" : "#fff",
                  }}
                >
                  <p><b>{item.productId.toUpperCase()} - {item.weight}</b></p>
                  <p>Stock: <b style={{ color: item.stock === 0 ? "red" : item.stock < 10 ? "orange" : "green" }}>{item.stock}</b></p>
                  {item.stock === 0 && <p style={{ color: "red", fontWeight: "bold", margin: "5px 0" }}>🔴 OUT OF STOCK</p>}
                  {item.stock > 0 && item.stock < 10 && <p style={{ color: "orange", fontWeight: "bold", margin: "5px 0" }}>⚠️ LOW STOCK</p>}
                  <input
                    type="number"
                    placeholder="New stock"
                    defaultValue={item.stock}
                    style={{ width: "100%", padding: "5px", marginTop: "5px", boxSizing: "border-box" }}
                    onChange={(e) => setEditingInventory({ ...item, stock: parseInt(e.target.value) })}
                  />
                  <button
                    onClick={() => updateInventoryStock(item.productId, item.weight, editingInventory?.stock || item.stock)}
                    style={{
                      width: "100%",
                      padding: "5px",
                      marginTop: "5px",
                      background: "#0f9d58",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Update Stock
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showOrders && (
        <>
          <div className="adminSectionHeader">
            <h2>
              {activeAdminView === "payments"
                ? "Payment Orders"
                : activeAdminView === "customers"
                  ? "Customer Order Results"
                  : "Recent Orders"}
            </h2>
            <span>{visibleOrders.length} visible</span>
          </div>
          {visibleOrders.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            <div className="adminOrderList">
              <div className="adminOrderHeader">
                <span>Order</span>
                <span>Customer</span>
                <span>Amount</span>
                <span>Payment</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {visibleOrders.map((order) => (
                <div key={order._id} className="adminOrderCard">
                  <div className="adminOrderSummary">
                    <div>
                      <h3>{order.orderId}</h3>
                      <p>{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <b>{order.customerName}</b>
                      <p>{order.mobile}</p>
                    </div>
                    <div>
                      <b>₹{Number(order.totalAmount || 0).toLocaleString()}</b>
                      <p>{order.paymentMethod || "N/A"}</p>
                    </div>
                    <div>
                      <span className={"adminStatusPill status-" + String(order.paymentStatus || "Pending").toLowerCase().replace(/\s+/g, "-")}>
                        {order.paymentStatus || "Pending"}
                      </span>
                      {order.paymentMethod === "UPI" && order.paymentStatus !== "Paid" && (
                        <p className="adminAlertText">Verify UPI</p>
                      )}
                    </div>
                    <div>
                      <span className={"adminStatusPill status-" + String(order.orderStatus || "Received").toLowerCase().replace(/\s+/g, "-")}>
                        {order.orderStatus || "Received"}
                      </span>
                      <p>{formatDate(order.deliveryDate)}</p>
                    </div>
                    <div className="adminInlineActions">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOrders((prev) => ({
                            ...prev,
                            [order._id]: !prev[order._id],
                          }))
                        }
                      >
                        {expandedOrders[order._id] ? "Hide Details" : "View Details"}
                      </button>
                    </div>
                  </div>

                  {expandedOrders[order._id] && (
                    <>
                  <div className="adminOrderDetails">
                    <div className="adminDetailPanel">
                      <h4>Customer</h4>
                      <p><b>Email:</b> {order.email || "N/A"}</p>
                      <p><b>Address:</b> {order.address || "N/A"}</p>
                      <p><b>City:</b> {order.city || "N/A"} | <b>Pincode:</b> {order.pincode || "N/A"}</p>
                      {order.paymentMethod === "UPI" && (
                        <p><b>UPI Note:</b> {order.orderId}|{order.totalAmount}</p>
                      )}
                    </div>

                    <div className="adminDetailPanel">
                      <h4>Update</h4>
                      <label><b>Payment Status</b></label>
                      <select
                        value={order.paymentStatus || "Pending"}
                        onChange={(e) => {
                          const updatedOrder = {
                            ...order,
                            paymentStatus: e.target.value,
                          };

                          updateLocalOrder(order._id, "paymentStatus", e.target.value);
                          saveOrder(updatedOrder);
                        }}
                        style={selectStyle}
                      >
                        <option>Pending</option>
                        <option>Paid</option>
                        <option>Failed</option>
                      </select>

                      <label><b>Order Status</b></label>
                      <select
                        value={order.orderStatus || "Received"}
                        onChange={(e) => {
                          const updatedOrder = {
                            ...order,
                            orderStatus: e.target.value,
                          };

                          updateLocalOrder(order._id, "orderStatus", e.target.value);
                          saveOrder(updatedOrder);
                        }}
                        style={selectStyle}
                      >
                        <option>Received</option>
                        <option>Processing</option>
                        <option>Packed</option>
                        <option>Shipped</option>
                        <option>Delivered</option>
                        <option>Cancelled</option>
                      </select>
                    </div>

                    <div className="adminDetailPanel">
                      <h4>Shipping</h4>
                      <input
                        placeholder="Courier Name"
                        value={order.courierName || ""}
                        onChange={(e) =>
                          updateLocalOrder(order._id, "courierName", e.target.value)
                        }
                        style={inputStyle}
                      />

                      <input
                        placeholder="Tracking Number"
                        value={order.trackingNumber || ""}
                        onChange={(e) =>
                          updateLocalOrder(order._id, "trackingNumber", e.target.value)
                        }
                        style={inputStyle}
                      />

                      <input
                        placeholder="Tracking URL"
                        value={order.trackingUrl || ""}
                        onChange={(e) =>
                          updateLocalOrder(order._id, "trackingUrl", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <textarea
                    placeholder="Customer tracking message"
                    value={order.customerTrackingMessage || ""}
                    onChange={(e) =>
                      updateLocalOrder(order._id, "customerTrackingMessage", e.target.value)
                    }
                    style={{ ...inputStyle, minHeight: "78px" }}
                  />

                  {Array.isArray(order.items) && order.items.length > 0 && (
                    <div className="adminProductsStrip">
                      {order.items.map((item, index) => (
                        <div key={index} className="adminProductChip">
                          <b>{item.name}</b>
                          <span>{item.weight} | Qty {item.quantity} | ₹{item.offer}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="adminOrderFooter">
                    <button onClick={() => saveOrder(order)} disabled={savingId === order._id} style={buttonStyle}>
                      {savingId === order._id ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => copyAddress(order)} style={buttonStyle}>
                      Copy Address
                    </button>
                    <button onClick={() => openInvoice(order)} style={buttonStyle}>
                      Invoice
                    </button>
                    <button onClick={() => openPackingSlip(order)} style={buttonStyle}>
                      Packing Slip
                    </button>
                    <button onClick={() => openCustomerWhatsApp(order, "received")} style={smallButtonStyle}>
                      Order Received
                    </button>
                    <button onClick={() => openCustomerWhatsApp(order, "payment")} style={smallButtonStyle}>
                      Payment Confirmed
                    </button>
                    <button onClick={() => openCustomerWhatsApp(order, "processing")} style={smallButtonStyle}>
                      Processing
                    </button>
                    <button onClick={() => updateStatusAndOpenWhatsApp(order, "shipped")} style={smallButtonStyle}>
                      Shipped
                    </button>
                    <button onClick={() => updateStatusAndOpenWhatsApp(order, "delivered")} style={smallButtonStyle}>
                      Delivered
                    </button>
                  </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      </main>
    </div>
  );
}

const pageStyle = {
  padding: 0,
  background: "#07150f",
  minHeight: "100vh",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "10px",
  marginBottom: "18px",
};

const boxStyle = {
  background: "#0f2419",
  border: "1px solid #1f4a34",
  borderRadius: "8px",
  padding: "10px 12px",
  minHeight: "56px",
  boxShadow: "0 8px 18px rgba(0, 0, 0, 0.12)",
};

const searchStyle = {
  width: "100%",
  padding: "9px 12px",
  marginBottom: 0,
  border: "1px solid #1f4a34",
  borderRadius: "8px",
  fontSize: "14px",
  boxSizing: "border-box",
  background: "#0b1b13",
  color: "#f7f8ff",
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px",
  marginBottom: "15px",
};

const filterInputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #1f4a34",
  borderRadius: "6px",
  fontSize: "14px",
  boxSizing: "border-box",
  background: "#0b1b13",
  color: "#f7f8ff",
};

const reportsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "10px",
  marginBottom: "14px",
};

const reportBoxStyle = {
  background: "#0f2419",
  border: "1px solid #1f4a34",
  borderRadius: "8px",
  padding: "12px",
  color: "#f7f8ff",
};

const templateButtonWrapStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "12px",
};

const smallButtonStyle = {
  padding: "7px 10px",
  border: "1px solid #2d6a4f",
  borderRadius: "6px",
  background: "#0b1b13",
  color: "#d8dcff",
  cursor: "pointer",
  fontSize: "12px",
};

const orderCardStyle = {
  border: "1px solid #1f4a34",
  borderRadius: "10px",
  padding: "14px",
  marginBottom: "12px",
  background: "#0f2419",
  color: "#f7f8ff",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "10px",
};

const alertStyle = {
  color: "red",
  fontWeight: "bold",
};

const selectStyle = {
  padding: "8px",
  marginTop: "5px",
  minWidth: "220px",
  background: "#0b1b13",
  color: "#f7f8ff",
  border: "1px solid #1f4a34",
  borderRadius: "6px",
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px",
  marginBottom: "8px",
  border: "1px solid #1f4a34",
  borderRadius: "6px",
  boxSizing: "border-box",
  background: "#0b1b13",
  color: "#f7f8ff",
};

const buttonStyle = {
  padding: "9px 14px",
  border: "1px solid #2d6a4f",
  borderRadius: "6px",
  cursor: "pointer",
  background: "#0b1b13",
  color: "#f7f8ff",
};

const productStyle = {
  background: "#0b1b13",
  padding: "8px",
  borderRadius: "6px",
  marginBottom: "8px",
};

const modalBgStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalBoxStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  position: "relative",
  maxWidth: "500px",
  width: "90%",
};

