import { useEffect, useMemo, useState } from "react";

const API_URL = "https://satvapusti-website.onrender.com";

export default function Admin() {
  useEffect(() => {
    const token = localStorage.getItem("satvapustiAdminToken");

    if (token !== "admin_logged_in") {
      window.location.href = "/admin-login";
    }
  }, []);

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

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

  useEffect(() => {
    loadOrders();

    const interval = setInterval(() => {
      loadOrders();
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
        alert("Save button clicked");
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
  }, [orders, search, dateFrom, dateTo]);

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

  const copyAddress = (order) => {
    const text = `${order.customerName || ""}
${order.address || ""}
${order.city || ""}
${order.pincode || ""}
${order.mobile || ""}`;

    navigator.clipboard.writeText(text);
    alert("Address copied");
  };

  const openCustomerWhatsApp = (order) => {
    const cleanMobile = String(order.mobile || "").replace(/\D/g, "");

    if (!cleanMobile) {
      alert("Mobile number not available");
      return;
    }

    const finalMobile = cleanMobile.startsWith("91")
      ? cleanMobile
      : `91${cleanMobile}`;

    const message = `Hello ${order.customerName || ""},
Your SatvaPusti order update:

Order ID: ${order.orderId}
Payment Status: ${order.paymentStatus}
Order Status: ${order.orderStatus}
Amount: ₹${order.totalAmount}`;

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

  return (
    <div style={pageStyle}>
      <h1>SatvaPusti Admin Panel</h1>
      <button
  onClick={() => {
    localStorage.removeItem("satvapustiAdminToken");
    localStorage.removeItem("satvapustiLoginTime");
    window.location.href = "/?page=admin";
  }}
  style={{
    padding: "8px 14px",
    marginBottom: "15px",
    background: "#b00020",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  }}
>
  Logout
</button>

      <div style={summaryGridStyle}>
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
      </div>

      <input
        placeholder="Search Order ID, Mobile, Name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={searchStyle}
      />

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{ ...searchStyle, flex: 1, minWidth: "150px", marginBottom: 0 }}
          placeholder="From Date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          style={{ ...searchStyle, flex: 1, minWidth: "150px", marginBottom: 0 }}
          placeholder="To Date"
        />
        <button
          onClick={() => {
            setSearch("");
            setDateFrom("");
            setDateTo("");
          }}
          style={{
            padding: "12px 14px",
            background: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            whiteSpace: "nowrap",
          }}
        >
          🔄 Clear Filters
        </button>
        <button
          onClick={() => exportToCSV(filteredOrders)}
          style={{
            padding: "12px 14px",
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            whiteSpace: "nowrap",
          }}
        >
          📥 Export CSV
        </button>
        <button
          onClick={() => setShowPasswordModal(true)}
          style={{
            padding: "12px 14px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            whiteSpace: "nowrap",
          }}
        >
          🔐 Change Password
        </button>
      </div>

      {showPasswordModal && (
        <div style={{ ...modalBgStyle }}>
          <div style={{ ...modalBoxStyle, maxWidth: "400px" }}>
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordMessage("");
                setCurrentPassword("");
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
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Verify Password
            </button>
          </div>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        filteredOrders.map((order) => (
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
          </div>
        ))
      )}
    </div>
  );
}

const pageStyle = {
  padding: "20px",
  background: "#f7f7f7",
  minHeight: "100vh",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "10px",
  marginBottom: "20px",
};

const boxStyle = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "15px",
};

const searchStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "20px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontSize: "16px",
  boxSizing: "border-box",
};

const orderCardStyle = {
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "15px",
  marginBottom: "15px",
  background: "#fff",
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
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px",
  marginBottom: "8px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  boxSizing: "border-box",
};

const buttonStyle = {
  padding: "9px 14px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  cursor: "pointer",
  background: "#f5f5f5",
};

const productStyle = {
  background: "#f9f9f9",
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