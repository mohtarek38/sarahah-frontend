import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import { API_BASE } from "../config/config";
import "./PublicProfile.css";

export default function PublicProfile() {
  const { darkMode } = useTheme();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/users/${userId}`);

        if (!res.ok) {
          if (res.status === 404) {
            setError("User not found");
          } else {
            const data = await res.json().catch(() => ({}));
            setError(data.message || "Failed to load user profile");
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        // Backend returns { message: "User fetched successfully", user: {...} }
        // The user object has: firstName, lastName, profileImage, bio, age, gender
        // hiddenFields are already removed by the backend
        setProfile(data.user);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    } else {
      setError("Invalid user ID");
      setLoading(false);
    }
  }, [userId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setSendError("Message cannot be empty");
      return;
    }

    setSending(true);
    setSendError("");
    setSendSuccess("");

    try {
      const res = await fetch(`${API_BASE}/messages/send/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: message.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSendError(data.message || "Failed to send message");
        setSending(false);
        return;
      }

      setSendSuccess("Message sent successfully! 🎉");
      setMessage("");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSendSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error sending message:", err);
      setSendError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className={`public-profile-root ${darkMode ? "dark-mode" : ""}`}>
        <ThemeToggle />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`public-profile-root ${darkMode ? "dark-mode" : ""}`}>
        <ThemeToggle />
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>{error}</h2>
          <button className="btn-back" onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`public-profile-root ${darkMode ? "dark-mode" : ""}`}>
      <ThemeToggle />

      <div className="public-profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile?.profileImage?.secure_url ? (
              <img src={profile.profileImage.secure_url} alt="profile" />
            ) : (
              <div className="avatar-fallback">{(profile?.firstName || "U").charAt(0)}</div>
            )}
          </div>
          <h1>{profile?.fullName || `${profile?.firstName || ""} ${profile?.lastName || ""}`}</h1>
          {profile?.createdAt && (
            <p className="profile-joined-date">
              Joined{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        <div className="profile-info-section">
          <h3>About</h3>
          {profile?.bio && (
            <div className="bio-section">
              <p className="profile-bio-text">{profile.bio}</p>
            </div>
          )}
          <div className="info-grid">
            {profile?.age && (
              <div className="info-item">
                <span className="info-label">Age</span>
                <span className="info-value">{profile.age}</span>
              </div>
            )}
            {profile?.gender && (
              <div className="info-item">
                <span className="info-label">Gender</span>
                <span className="info-value" style={{ textTransform: "capitalize" }}>
                  {profile.gender}
                </span>
              </div>
            )}
            {profile?.phoneNumber && (
              <div className="info-item">
                <span className="info-label">Phone</span>
                <span className="info-value">{profile.phoneNumber}</span>
              </div>
            )}
            {profile?.email && (
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{profile.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className="message-section">
          <h3>Send Anonymous Message</h3>
          <p className="message-hint">Your message will be sent anonymously. Be kind and respectful! 💌</p>

          <form onSubmit={handleSendMessage}>
            {sendError && <div className="send-error">{sendError}</div>}
            {sendSuccess && <div className="send-success">{sendSuccess}</div>}

            <textarea
              className="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your anonymous message here..."
              rows="6"
              maxLength={500}
              disabled={sending}
            />

            <div className="message-footer">
              <span className="char-count">{message.length} / 500</span>
              <button type="submit" className="btn-send" disabled={sending || !message.trim()}>
                {sending ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
        </div>

        <div className="login-prompt">
          <p>
            Want to receive anonymous messages too?{" "}
            <a href="/register" className="link">
              Sign up here
            </a>{" "}
            or{" "}
            <a href="/login" className="link">
              log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
