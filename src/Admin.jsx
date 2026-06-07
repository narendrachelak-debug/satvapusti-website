import { useEffect, useMemo, useState } from "react";

const API_URL = "https://satvapusti-website.onrender.com";
const ADMIN_SESSION_MS = 30 * 60 * 1000;

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
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeAdminView, setActiveAdminView] = useState("dashboard");
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

  useEffect(() => {
    loadOrders();
    loadInventory();

    const interval = setInterval(() => {
      loadOrders();
      loadInventory();
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

  const updateLocalOrder = (id, field, value) => {
    setOrders((prev) =>
      prev.map((order) =>
        order._id === id ? { ...order, [field]: value } : order
      )
    );
  };

  const saveOrder = async (order) => {
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
          }),
        }
      );

      const data = await res.json();

     if (!data.success) {
  alert(data.message || "Order update failed");
  return;
}

setOrders((prev) =>
  prev.map((item) =>
    item._id === order._id ? data.order : item
  )
);

alert("Order updated successfully");
    } catch (error) {
      console.log("Save order error:", error);
      alert("Order update failed");
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const revenueToday = orders
    .filter(o => o.paymentStatus === "Paid" && new Date(o.paymentDate || o.createdAt) >= today)
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const revenueThisMonth = orders
    .filter(o => o.paymentStatus === "Paid" && new Date(o.paymentDate || o.createdAt) >= thisMonthStart)
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const totalCODOrders = orders.filter(o => o.paymentMethod === "COD").length;

  const totalPaidOrders = orders.filter(o => o.paymentStatus === "Paid").length;

  const averageOrderValue = totalPaidOrders > 0 ? totalRevenue / totalPaidOrders : 0;

  const buildSalesReport = (type) => {
    const paid = orders.filter((order) => order.paymentStatus === "Paid");
    const grouped = paid.reduce((acc, order) => {
      const sourceDate = order.paymentDate || order.createdAt;
      if (!sourceDate) return acc;

      const date = new Date(sourceDate);
      const key =
        type === "monthly"
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          : date.toISOString().slice(0, 10);

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

  const lowStockItems = inventory.filter((item) => Number(item.stock || 0) < 10);
  const paymentOrders = filteredOrders.filter((order) =>
    ["Pending", "Awaiting Verification", "Paid", "Failed"].includes(
      order.paymentStatus || "Pending"
    )
  );
  const visibleOrders =
    activeAdminView === "payments" ? paymentOrders : filteredOrders;
  const showSummary = activeAdminView === "dashboard" || activeAdminView === "payments";
  const showControls =
    activeAdminView === "dashboard" ||
    activeAdminView === "orders" ||
    activeAdminView === "payments";
  const showReports = activeAdminView === "dashboard" || activeAdminView === "reports";
  const showOrders =
    activeAdminView === "dashboard" ||
    activeAdminView === "orders" ||
    activeAdminView === "payments";
  const viewTitleMap = {
    dashboard: "Dashboard Overview",
    orders: "Order Management",
    payments: "Payment Review",
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

  const openCustomerWhatsApp = (order, template = "update") => {
    const cleanMobile = String(order.mobile || "").replace(/\D/g, "");

    if (!cleanMobile) {
      alert("Mobile number not available");
      return;
    }

    const finalMobile = cleanMobile.startsWith("91")
      ? cleanMobile
      : `91${cleanMobile}`;

    const baseUpdate = `Hello ${order.customerName || ""},
Your SatvaPusti order update:

Order ID: ${order.orderId}
Payment Status: ${order.paymentStatus}
Order Status: ${order.orderStatus}
Amount: ₹${order.totalAmount}
${order.courierName ? `Courier: ${order.courierName}` : ""}
${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : ""}
${order.trackingUrl ? `Track Here: ${order.trackingUrl}` : ""}`;

    const templates = {
      received: `Hello ${order.customerName || ""}, your SatvaPusti order ${order.orderId} has been received. Amount: Rs. ${order.totalAmount}.`,
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

      {(activeAdminView === "inventory" || activeAdminView === "customers") && (
        <div className="adminViewActions">
          {activeAdminView === "inventory" && (
            <button
              onClick={() => setShowInventoryModal(true)}
              className="admin-action-button admin-inventory-button"
            >
              ðŸ“¦ Manage Inventory
            </button>
          )}
          {activeAdminView === "customers" && (
            <button
              className="adminSecondaryBtn"
              onClick={() => {
                setActiveAdminView("orders");
                setShowAdvancedFilters(true);
              }}
            >
              Search Customer Orders
            </button>
          )}
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

      {activeAdminView === "customers" && (
        <div className="adminInfoGrid">
          {customerSummaries.length === 0 ? (
            <div className="adminInfoPanel">
              <h3>No customers found.</h3>
            </div>
          ) : (
            customerSummaries.map((customer) => (
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
          💰 Total Revenue
          <br />
          <b>₹{totalRevenue.toLocaleString()}</b>
        </div>

        <div style={boxStyle}>
          📊 Revenue Today
          <br />
          <b>₹{revenueToday.toLocaleString()}</b>
        </div>

        <div style={boxStyle}>
          📈 Revenue This Month
          <br />
          <b>₹{revenueThisMonth.toLocaleString()}</b>
        </div>

        <div style={boxStyle}>
          📦 COD Orders
          <br />
          <b>{totalCODOrders}</b>
        </div>

        <div style={boxStyle}>
          Average Order Value
          <br />
          <b>Rs. {Math.round(averageOrderValue).toLocaleString()}</b>
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

      <div className="adminButtonRow">
        <button
          onClick={() => exportToCSV(filteredOrders)}
          className="admin-action-button admin-csv-button"
        >
          📥 Export CSV
        </button>
        <button
          onClick={() => exportToJSON(filteredOrders)}
          className="admin-action-button admin-json-button"
        >
          📄 Export JSON
        </button>
        <button
          onClick={() => setShowInventoryModal(true)}
          className="admin-action-button admin-inventory-button"
        >
          📦 Manage Inventory
        </button>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="admin-action-button admin-password-button"
        >
          🔐 Change Password
        </button>
      </div>
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
              🔄 Clear Filters
            </button>
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

            <h2>🔐 Change Password</h2>
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

            <h2>📦 Manage Inventory</h2>

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
            <h2>{activeAdminView === "payments" ? "Payment Orders" : "Orders"}</h2>
            <span>{visibleOrders.length} visible</span>
          </div>
      {visibleOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        visibleOrders.map((order) => (
          <div key={order._id} style={orderCardStyle}>
            <h3>{order.orderId}</h3>

            {order.paymentMethod === "UPI" &&
              order.paymentStatus !== "Paid" && (
                <p style={alertStyle}>🔴 Verify UPI Payment</p>
              )}

            <div style={gridStyle}>
              <div>
                <p><b>Customer:</b> {order.customerName}</p>
                <p><b>Mobile:</b> {order.mobile}</p>
                <p><b>Email:</b> {order.email}</p>
                <p><b>Address:</b> {order.address}</p>
                <p><b>City:</b> {order.city}</p>
                <p><b>Pincode:</b> {order.pincode}</p>
              </div>

              <div>
                <p><b>Order Date:</b> {formatDate(order.createdAt)}</p>
                <p><b>Payment Date:</b> {formatDate(order.paymentDate)}</p>
                <p><b>Delivery Date:</b> {formatDate(order.deliveryDate)}</p>
                <p><b>Amount:</b> ₹{order.totalAmount}</p>
                <p><b>Payment Method:</b> {order.paymentMethod}</p>

                {order.paymentMethod === "UPI" && (
                  <p><b>UPI Note:</b> {order.orderId}|{order.totalAmount}</p>
                )}
              </div>
            </div>

            <hr />

            <label><b>Payment Status</b></label>
            <br />
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

            <br />
            <br />

            <label><b>Order Status</b></label>
            <br />
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

            <br />
            <br />

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

            <textarea
              placeholder="Customer tracking message"
              value={order.customerTrackingMessage || ""}
              onChange={(e) =>
                updateLocalOrder(order._id, "customerTrackingMessage", e.target.value)
              }
              style={{ ...inputStyle, minHeight: "78px" }}
            />

            {Array.isArray(order.items) && order.items.length > 0 && (
              <>
                <hr />
                <h4>Products</h4>

                {order.items.map((item, index) => (
                  <div key={index} style={productStyle}>
                    <p><b>{item.name}</b></p>
                    <p>
                      Pack: {item.weight} | Qty: {item.quantity} | Price: ₹
                      {item.offer}
                    </p>
                    <p>
                      Amount: ₹
                      {Number(item.offer || 0) * Number(item.quantity || 0)}
                    </p>
                  </div>
                ))}
              </>
            )}

            <hr />

            <button
              onClick={() => saveOrder(order)}
              style={buttonStyle}
              disabled={savingId === order._id}
            >
              {savingId === order._id ? "Saving..." : "Save Changes"}
            </button>

            <button
              onClick={() => openCustomerWhatsApp(order)}
              style={{ ...buttonStyle, marginLeft: "10px" }}
            >
              WhatsApp Customer
            </button>

            <button
              onClick={() => copyAddress(order)}
              style={{ ...buttonStyle, marginLeft: "10px" }}
            >
              Copy Address
            </button>

            <div style={templateButtonWrapStyle}>
              <button onClick={() => openCustomerWhatsApp(order, "received")} style={smallButtonStyle}>
                Order Received
              </button>
              <button onClick={() => openCustomerWhatsApp(order, "payment")} style={smallButtonStyle}>
                Payment Confirmed
              </button>
              <button onClick={() => openCustomerWhatsApp(order, "processing")} style={smallButtonStyle}>
                Processing
              </button>
              <button onClick={() => openCustomerWhatsApp(order, "shipped")} style={smallButtonStyle}>
                Shipped
              </button>
              <button onClick={() => openCustomerWhatsApp(order, "delivered")} style={smallButtonStyle}>
                Delivered
              </button>
            </div>
          </div>
        ))
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
  borderRadius: "10px",
  padding: "14px 16px",
  minHeight: "78px",
  boxShadow: "0 12px 24px rgba(0, 0, 0, 0.14)",
};

const searchStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: 0,
  border: "1px solid #1f4a34",
  borderRadius: "8px",
  fontSize: "16px",
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
  gap: "12px",
  marginBottom: "20px",
};

const reportBoxStyle = {
  background: "#0f2419",
  border: "1px solid #1f4a34",
  borderRadius: "10px",
  padding: "15px",
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

