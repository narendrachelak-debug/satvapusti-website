import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Admin from "./Admin.jsx";
import AdminLogin from "./AdminLogin.jsx";

const path = window.location.pathname;
const params = new URLSearchParams(window.location.search);
const page = params.get("page");
const token = localStorage.getItem("satvapustiAdminToken");

let Page = <App />;

if (path === "/admin-login" || page === "admin-login") {
  Page = <AdminLogin />;
}

if (path === "/admin" || page === "admin") {
  Page = token === "admin_logged_in" ? <Admin /> : <AdminLogin />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>{Page}</StrictMode>
);