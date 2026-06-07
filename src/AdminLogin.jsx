import { useState } from "react";

const API_URL = "https://satvapusti-website.onrender.com";

export default function AdminLogin() {
  const [password, setPassword] = useState("");

  const login = async () => {
    if (!password) {
      alert("Password enter karo");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Invalid password");
        return;
      }

     localStorage.setItem("satvapustiAdminToken", "admin_logged_in");
localStorage.setItem("satvapustiLoginTime", Date.now());

window.location.href = "/?page=admin";
    } catch (error) {
      console.error(error);
      alert("Login failed");
    }
  };

  return (
    <div
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

      <button
        onClick={login}
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
        Login
      </button>
    </div>
  );
}