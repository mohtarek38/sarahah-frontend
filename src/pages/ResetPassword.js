import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import { resetPassword } from "../utils/api";
import { validateEmail, validatePassword, validateConfirmPassword } from "../utils/validation";
import "./ResetPassword.css";

export default function ResetPassword() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get email from localStorage
    const storedEmail = localStorage.getItem("resetEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email found, redirect to request page
      navigate("/request-password-reset");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error);
      return;
    }

    // Validate OTP
    if (!otp || otp.trim() === "") {
      setError("Reset code is required");
      return;
    }

    if (otp.length !== 6) {
      setError("Reset code must be 6 digits");
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error);
      return;
    }

    // Validate confirm password
    const confirmPasswordValidation = validateConfirmPassword(newPassword, confirmPassword);
    if (!confirmPasswordValidation.valid) {
      setError(confirmPasswordValidation.error);
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword(email, otp, newPassword);
      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Failed to reset password");
        setLoading(false);
        return;
      }

      // Clear stored email
      localStorage.removeItem("resetEmail");
      setSuccess(true);

      // Navigate to login page after success
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`reset-password-root ${darkMode ? "dark-mode" : ""}`}>
      <ThemeToggle />

      <div className="reset-password-card">
        <h2>Reset Password</h2>
        <p className="reset-password-description">Enter the 6-digit code sent to your email and your new password.</p>

        {error && <div className="reset-password-error">{error}</div>}

        {success && <div className="reset-password-success">Password reset successfully! Redirecting to login...</div>}

        <form onSubmit={handleSubmit}>
          <label className="reset-password-label">Email Address</label>
          <input
            className="reset-password-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading || success}
            readOnly
          />

          <label className="reset-password-label">Reset Code</label>
          <input
            className="reset-password-input"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter 6-digit code"
            maxLength="6"
            disabled={loading || success}
            autoComplete="off"
          />

          <label className="reset-password-label">New Password</label>
          <input
            className="reset-password-input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            autoComplete="new-password"
            disabled={loading || success}
          />

          <label className="reset-password-label">Confirm New Password</label>
          <input
            className="reset-password-input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            disabled={loading || success}
          />

          <button className="reset-password-button" type="submit" disabled={loading || success}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="reset-password-footer">
          <small>
            Didn't receive a code?{" "}
            <a href="/request-password-reset" className="reset-password-link">
              Request new code
            </a>
          </small>
        </div>
      </div>
    </div>
  );
}
