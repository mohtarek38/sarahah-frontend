import React, { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import { API_BASE, ageLimits, nameLimits } from "../config/config";
import { validateSignupForm } from "../utils/validation";
import "./Register.css";

export default function Register() {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    setError("");

    // Convert age to number if provided
    const signupData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      age: formData.age ? parseInt(formData.age) : undefined,
      gender: formData.gender || undefined,
      phoneNumber: formData.phoneNumber || undefined,
    };

    const validation = validateSignupForm(signupData);

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
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        phoneNumber: formData.phoneNumber || undefined,
      };

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Registration failed");
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Store email for confirmation page
      localStorage.setItem("pendingEmail", formData.email);

      // Redirect to confirmation page after 2 seconds
      setTimeout(() => {
        window.location.href = "/confirm-email";
      }, 2000);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`register-root ${darkMode ? "dark-mode" : ""}`}>
      {/* Dark Mode Toggle */}
      <ThemeToggle />

      <form className="register-card" onSubmit={submit}>
        <h2>Create Your Account</h2>

        {error && <div className="register-error">{error}</div>}
        {success && <div className="register-success">Registration successful! Please check your email for the confirmation code.</div>}

        <div className="form-row">
          <div className="form-group">
            <label className="register-label">First Name *</label>
            <input
              className="register-input"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              autoComplete="given-name"
              maxLength={nameLimits.MAX_NAME_LENGTH}
            />
          </div>

          <div className="form-group">
            <label className="register-label">Last Name *</label>
            <input
              className="register-input"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              autoComplete="family-name"
              maxLength={nameLimits.MAX_NAME_LENGTH}
            />
          </div>
        </div>

        <label className="register-label">Email *</label>
        <input
          className="register-input"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <div className="form-row">
          <div className="form-group">
            <label className="register-label">Age</label>
            <input
              className="register-input"
              type="text"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder={`${ageLimits.MIN_AGE}-${ageLimits.MAX_AGE}`}
            />
          </div>

          <div className="form-group">
            <label className="register-label">Gender</label>
            <select className="register-input" name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <label className="register-label">Phone Number</label>
        <input
          className="register-input"
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="+1234567890"
          autoComplete="tel"
        />

        <label className="register-label">Password *</label>
        <input
          className="register-input"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          autoComplete="new-password"
        />

        <label className="register-label">Confirm Password *</label>
        <input
          className="register-input"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          autoComplete="new-password"
        />

        <button className="register-button" type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <div className="register-help">
          <small>
            Already have an account?{" "}
            <a href="/login" className="register-link">
              Sign in here
            </a>
          </small>
        </div>
      </form>
    </div>
  );
}
