import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import { API_BASE } from "../config/config";
import "./Login.css";

export default function Login({ onLogin }) {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const validate = () => {
    setError("");
    setNeedsConfirmation(false);
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
        // Check if user needs to confirm email (403 status)
        if (res.status === 403 && data?.message?.toLowerCase().includes("confirm")) {
          setError(data.message);
          setNeedsConfirmation(true);
          // Store email for confirmation page
          localStorage.setItem("pendingEmail", email);
        } else {
          setError(data?.message || "Login failed");
        }
        setLoading(false);
        return;
      }
      // Save tokens
      if (data.accesstoken) localStorage.setItem("accessToken", data.accesstoken);
      if (data.refreshtoken) localStorage.setItem("refreshToken", data.refreshtoken);

      // Notify parent component
      if (onLogin) onLogin();

      // Redirect to profile page
      navigate("/profile");
    } catch (err) {
      setError("Network error. Please try again.");
      setNeedsConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const goToConfirmation = () => {
    // Email already stored in localStorage from the error handler
    navigate("/confirm-email");
  };

  return (
    <div className={`login-root ${darkMode ? "dark-mode" : ""}`}>
      {/* Dark Mode Toggle */}
      <ThemeToggle />

      <form className="login-card" onSubmit={submit}>
        <h2>Sign in to Sarahah</h2>

        {error && (
          <div className="login-error">
            {error}
            {needsConfirmation && (
              <div style={{ marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={goToConfirmation}
                  className="confirm-email-link"
                  style={{
                    background: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseOver={(e) => (e.target.style.transform = "translateY(-2px)")}
                  onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
                >
                  Click here to confirm your email
                </button>
              </div>
            )}
          </div>
        )}

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
          <small>
            Don't have an account?<br></br>
            <a href="/register" className="login-link">
              Sign up here
            </a>
          </small>
        </div>
      </form>
    </div>
  );
}
