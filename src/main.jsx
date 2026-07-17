import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Admin from "./Admin.jsx";
import AdminLogin from "./AdminLogin.jsx";
import TrackOrder from "./TrackOrder.jsx";
import { adminFetch, getAdminToken } from "./adminApi.js";

const API_URL = "https://satvapusti-website.onrender.com";

const path = window.location.pathname;
const params = new URLSearchParams(window.location.search);
const page = params.get("page");

function AdminGate() {
  const [state, setState] = useState(getAdminToken() ? "checking" : "login");

  useEffect(() => {
    if (state !== "checking") return;
    adminFetch(`${API_URL}/api/admin/session`)
      .then((response) => setState(response.ok ? "admin" : "login"))
      .catch(() => setState("login"));
  }, [state]);

  if (state === "checking") return <div style={{ padding: 40 }}>Checking secure session...</div>;
  return state === "admin" ? <Admin /> : <AdminLogin />;
}

let Page = <App />;

if (path === "/admin-login" || page === "admin-login") {
  Page = <AdminLogin />;
}

if (path === "/admin" || page === "admin") {
  Page = <AdminGate />;
}

if (path === "/track-order" || page === "track-order") {
  Page = <TrackOrder />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>{Page}</StrictMode>
);
