import React, { useState } from "react";
import "./Login.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    setError("");
    if (!email || !password) {
      setError("Email and password are required");
      return false;
    }
    // simple email regex
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Login failed");
        setLoading(false);
        return;
      }
      // Save tokens
      if (data.accesstoken) localStorage.setItem("accessToken", data.accesstoken);
      if (data.refreshtoken) localStorage.setItem("refreshToken", data.refreshtoken);
      setSuccess(true);
      // notify parent that login happened (optional)
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent("sarahah:login"));
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <form className="login-card" onSubmit={submit}>
        <h2>Sign in to Sarahah</h2>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-success">Signed in successfully — tokens saved to localStorage.</div>}

        <label className="login-label">Email</label>
        <input
          className="login-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <label className="login-label">Password</label>
        <input
          className="login-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        <button className="login-button" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="login-help">
          <small>If you don't have an account, register through the app's register flow.</small>
        </div>
      </form>
    </div>
  );
}
