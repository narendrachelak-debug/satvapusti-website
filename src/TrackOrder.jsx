import { useState } from "react";
import "./App.css";

const API_URL = "https://satvapusti-website.onrender.com";

const timelineSteps = ["Received", "Processing", "Packed", "Shipped", "Delivered"];

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [mobile, setMobile] = useState("");
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const trackOrder = async () => {
    if (!orderId || !mobile) {
      setMessage("Please enter Order ID and mobile number.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setOrder(null);

      const params = new URLSearchParams({
        orderId: orderId.trim(),
        mobile: mobile.trim(),
      });

      const res = await fetch(`${API_URL}/api/orders/track?${params.toString()}`);
      const data = await res.json();

      if (!data.success) {
        setMessage(data.message || "Order not found.");
        return;
      }

      setOrder(data.order);
    } catch (error) {
      console.error(error);
      setMessage("Unable to track order right now.");
    } finally {
      setLoading(false);
    }
  };

  const activeIndex = Math.max(0, timelineSteps.indexOf(order?.orderStatus || "Received"));

  return (
    <div className="trackPage">
      <header className="header">
        <div className="logo">SatvaPusti Nutrition</div>
        <nav>
          <a href="/">Home</a>
          <a href="/?page=track-order">Track Order</a>
          <a href="/#contact">Contact</a>
        </nav>
      </header>

      <main className="trackWrap">
        <section className="trackPanel">
          <h1>Track Your Order</h1>
          <div className="trackForm">
            <input
              placeholder="Order ID"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
            <input
              placeholder="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <button onClick={trackOrder} disabled={loading}>
              {loading ? "Checking..." : "Track Order"}
            </button>
          </div>

          {message && <p className="trackMessage">{message}</p>}

          {order && (
            <div className="trackResult">
              <div className="trackSummary">
                <p><b>Order ID:</b> {order.orderId}</p>
                <p><b>Payment:</b> {order.paymentStatus}</p>
                <p><b>Status:</b> {order.orderStatus}</p>
                <p><b>Total:</b> Rs. {Number(order.totalAmount || 0).toLocaleString("en-IN")}</p>
              </div>

              <div className="statusTimeline">
                {timelineSteps.map((step, index) => (
                  <div
                    className={`timelineStep ${index <= activeIndex ? "done" : ""}`}
                    key={step}
                  >
                    <span>{index + 1}</span>
                    <b>{step}</b>
                  </div>
                ))}
              </div>

              {(order.courierName || order.trackingNumber || order.trackingUrl) && (
                <div className="trackSummary">
                  <p><b>Courier:</b> {order.courierName || "N/A"}</p>
                  <p><b>Tracking Number:</b> {order.trackingNumber || "N/A"}</p>
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noreferrer">
                      Open Tracking Link
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
