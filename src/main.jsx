import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Admin from "./Admin.jsx";
import AdminLogin from "./AdminLogin.jsx";

const path = window.location.pathname;
const token = localStorage.getItem("satvapustiAdminToken");

let Page = <App />;

if (path === "/admin-login") {
  Page = <AdminLogin />;
}

if (path === "/admin") {
  Page = token === "admin_logged_in"
    ? <Admin />
    : <AdminLogin />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {Page}
  </StrictMode>
);