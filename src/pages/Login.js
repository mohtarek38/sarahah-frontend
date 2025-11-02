import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import { API_BASE, GOOGLE_CLIENT_ID } from "../config/config";
import { validateLoginForm } from "../utils/validation";
import "./Login.css";

export default function Login({ onLogin }) {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const googleButtonRef = useRef(null);

  const validate = () => {
    setError("");
    setNeedsConfirmation(false);

    const validation = validateLoginForm({ email, password });

    if (!validation.valid) {
      // Display the first error found
      const firstError = Object.values(validation.errors)[0];
      setError(firstError);
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

  // Handle Google Sign-In response
  const handleGoogleResponse = useCallback(
    async (response) => {
      try {
        setLoading(true);
        setError("");

        // Send the credential (JWT token) to your backend
        const res = await fetch(`${API_BASE}/auth/google-auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.message || "Google sign-in failed");
          setLoading(false);
          return;
        }

        // Save tokens
        if (data.accesstoken) localStorage.setItem("accessToken", data.accesstoken);
        if (data.refreshtoken) localStorage.setItem("refreshToken", data.refreshtoken);

        // Notify parent component
        if (onLogin) onLogin();

        // Redirect to profile page
        navigate("/");
      } catch (err) {
        console.error("Google sign-in error:", err);
        setError("Network error during Google sign-in. Please try again.");
        setLoading(false);
      }
    },
    [navigate, onLogin]
  );

  // Initialize Google Sign-In button
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn("Google Client ID not configured");
      return;
    }

    // Wait for Google API to load
    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        // Render the button
        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: darkMode ? "filled_black" : "outline",
            size: "large",
            width: googleButtonRef.current.offsetWidth,
            text: "signin_with",
            shape: "rectangular",
          });
        }
      }
    };

    // Check if script is already loaded
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Wait for script to load
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle);
          initializeGoogleSignIn();
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    }
  }, [darkMode, handleGoogleResponse]);

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
                <button type="button" onClick={goToConfirmation} className="confirm-email-link">
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

        <div className="login-forgot-password">
          <small>
            <a href="/request-password-reset" className="login-link">
              Forgot your password?
            </a>
          </small>
        </div>

        {/* Google Sign-In Button - rendered by Google */}
        {GOOGLE_CLIENT_ID && <div ref={googleButtonRef} className="google-signin-wrapper"></div>}

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
