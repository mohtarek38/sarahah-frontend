import React, { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import { requestPasswordReset } from "../utils/api";
import { validateEmail } from "../utils/validation";
import "./RequestPasswordReset.css";

export default function RequestPasswordReset() {
  const { darkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email using the validation utility
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await requestPasswordReset(email);
      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Failed to send reset code");
        setLoading(false);
        return;
      }

      // Store email for the reset page
      localStorage.setItem("resetEmail", email);
      setSuccess(true);

      // Don't auto-redirect - user will manually go to reset page when they get the code
    } catch (err) {
      console.error("Request password reset error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`request-reset-root ${darkMode ? "dark-mode" : ""}`}>
      <ThemeToggle />

      <div className="request-reset-card">
        <h2>Reset Your Password</h2>
        <p className="request-reset-description">Enter your email address and we'll send you a code to reset your password.</p>

        {error && <div className="request-reset-error">{error}</div>}

        {success && (
          <div className="request-reset-success">
            If your email is registered, you will receive a password reset code. Please check your email and{" "}
            <a href="/reset-password" className="request-reset-link-inline">
              click here to reset your password
            </a>
            .
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="request-reset-label">Email Address</label>
          <input
            className="request-reset-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading || success}
          />

          <button className="request-reset-button" type="submit" disabled={loading || success}>
            {loading ? "Sending..." : "Send Reset Code"}
          </button>
        </form>

        <div className="request-reset-footer">
          <small>
            Remember your password?{" "}
            <a href="/login" className="request-reset-link">
              Back to login
            </a>
          </small>
        </div>
      </div>
    </div>
  );
}
