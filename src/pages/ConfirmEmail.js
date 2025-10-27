import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import { API_BASE } from "../config/config";
import "./ConfirmEmail.css";

export default function ConfirmEmail() {
  const { darkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Get email from localStorage if coming from registration
    const pendingEmail = localStorage.getItem("pendingEmail");
    if (pendingEmail) {
      setEmail(pendingEmail);
    }
  }, []);

  const validate = () => {
    setError("");

    if (!email) {
      setError("Email is required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP code");
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
      const res = await fetch(`${API_BASE}/auth/confirm-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Confirmation failed");
        setLoading(false);
        return;
      }

      setSuccess(true);
      localStorage.removeItem("pendingEmail");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`confirm-root ${darkMode ? "dark-mode" : ""}`}>
      {/* Dark Mode Toggle */}
      <ThemeToggle />

      <form className="confirm-card" onSubmit={submit}>
        <div className="confirm-icon">📧</div>
        <h2>Confirm Your Email</h2>
        <p className="confirm-description">
          We've sent a 6-digit confirmation code to your email address. Please enter it below to verify your account.
        </p>

        {error && <div className="confirm-error">{error}</div>}
        {success && <div className="confirm-success">Email confirmed successfully! Redirecting to login...</div>}

        <label className="confirm-label">Email</label>
        <input
          className="confirm-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <label className="confirm-label">Confirmation Code</label>
        <input
          className="confirm-input otp-input"
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          maxLength="6"
          autoComplete="off"
        />

        <button className="confirm-button" type="submit" disabled={loading}>
          {loading ? "Confirming..." : "Confirm Email"}
        </button>

        <div className="confirm-help">
          <small>
            Didn't receive the code?{" "}
            <a href="#" className="confirm-link" onClick={(e) => e.preventDefault()}>
              Resend code
            </a>
          </small>
        </div>
      </form>
    </div>
  );
}
