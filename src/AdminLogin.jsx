import { useState } from "react";
import { saveAdminSession } from "./adminApi";

const API_URL = "https://satvapusti-website.onrender.com";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const login = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setErrorMessage("");
    if (!password) {
      setErrorMessage("Please enter the password");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Login failed. Please try again.");
        return;
      }

      saveAdminSession(data);
      window.location.href = "/?page=admin";
    } catch (error) {
      setErrorMessage(error.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={login}
      style={{
        maxWidth: "400px",
        margin: "100px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        background: "#fff",
      }}
    >
      <h2>SatvaPusti Admin Login</h2>

      <input
        type="password"
        autoComplete="current-password"
        aria-label="Admin password"
        placeholder="Enter Admin Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "15px",
          boxSizing: "border-box",
        }}
      />

      {errorMessage && <p role="alert">{errorMessage}</p>}
      <button
        type="submit"
        disabled={submitting}
        style={{
          width: "100%",
          padding: "10px",
          background: "#198754",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        {submitting ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
