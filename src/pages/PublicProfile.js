import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import { API_BASE, messageLimits } from "../config/config";
import { validateMessage } from "../utils/validation";
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

    const validation = validateMessage(message);
    if (!validation.valid) {
      setSendError(validation.error);
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

      <div className="public-profile-card">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-header-left">
            <div className="profile-avatar">
              {profile?.profileImage?.secure_url ? (
                <img src={profile.profileImage.secure_url} alt="profile" />
              ) : (
                <div className="avatar-fallback">{(profile?.firstName || "U").charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div className="profile-info">
              <h2>{profile?.fullName || `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()}</h2>
              {profile?.createdAt && (
                <p className="profile-sub">
                  Joined{" "}
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Profile Body */}
        <div className="profile-body">
          <div className="profile-left">
            {/* Profile Details Section - Only show if there's any data */}
            {(profile?.bio || profile?.email || profile?.phoneNumber || profile?.gender || profile?.age) && (
              <>
                <h3>Profile Details</h3>

                {/* Bio */}
                {profile?.bio && (
                  <div className="bio-section">
                    <div className="bio-display">
                      <p className="profile-bio">{profile.bio}</p>
                    </div>
                  </div>
                )}

                {/* Profile Details List */}
                <ul className="profile-details">
                  {profile?.email && (
                    <li>
                      <div className="editable-row">
                        <strong>Email</strong>
                        <div className="editable-value">
                          <span className="field-value">{profile.email}</span>
                        </div>
                      </div>
                    </li>
                  )}
                  {profile?.phoneNumber && (
                    <li>
                      <div className="editable-row">
                        <strong>Phone</strong>
                        <div className="editable-value">
                          <span className="field-value">{profile.phoneNumber}</span>
                        </div>
                      </div>
                    </li>
                  )}
                  {profile?.gender && (
                    <li>
                      <div className="editable-row">
                        <strong>Gender</strong>
                        <div className="editable-value">
                          <span className="field-value" style={{ textTransform: "capitalize" }}>
                            {profile.gender}
                          </span>
                        </div>
                      </div>
                    </li>
                  )}
                  {profile?.age && (
                    <li>
                      <div className="editable-row">
                        <strong>Age</strong>
                        <div className="editable-value">
                          <span className="field-value">{profile.age}</span>
                        </div>
                      </div>
                    </li>
                  )}
                </ul>
              </>
            )}

            {/* Message Section */}
            <div className="message-section">
              <h3>Send Anonymous Message</h3>
              <p className="message-hint">Your message will be sent anonymously. Be kind and respectful! 💌</p>

              <form onSubmit={handleSendMessage}>
                {sendError && <div className="send-error">{sendError}</div>}
                {sendSuccess && <div className="send-success">{sendSuccess}</div>}

                <textarea
                  className="message-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your anonymous message here..."
                  rows="6"
                  maxLength={messageLimits.MAX_MESSAGE_LENGTH}
                  disabled={sending}
                />

                <div className="char-count">
                  {message.length} / {messageLimits.MAX_MESSAGE_LENGTH}
                </div>

                <button type="submit" className="btn-send" disabled={sending || !message.trim()}>
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="profile-footer">
          <p className="login-prompt">
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
