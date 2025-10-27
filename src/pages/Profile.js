import React, { useEffect, useState, useCallback } from "react";
import { fetchWithAuth, apiPost, apiPatch } from "../utils/api";
import DOMPurify from "dompurify";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import { API_BASE, POLLING_INTERVAL } from "../config/config";
import "./Profile.css";

// Helper function to format relative time
const getRelativeTime = (timestamp) => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const diffInMs = now - messageDate;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Less than 1 hour - show minutes
  if (diffInMinutes < 60) {
    if (diffInMinutes === 0) return "Just now";
    if (diffInMinutes === 1) return "Sent 1 minute ago";
    return `Sent ${diffInMinutes} minutes ago`;
  }

  // Less than 24 hours - show hours
  if (diffInHours < 24) {
    if (diffInHours === 1) return "Sent 1 hour ago";
    return `Sent ${diffInHours} hours ago`;
  }

  // Less than 7 days - show days
  if (diffInDays < 7) {
    if (diffInDays === 1) return "Sent 1 day ago";
    return `Sent ${diffInDays} days ago`;
  }

  // 7 days or more - show the actual date
  return `On ${messageDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: messageDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })}`;
};

export default function Profile({ onLogout }) {
  const { darkMode } = useTheme();
  const [profile, setProfile] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [composeText, setComposeText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");
  const [shareIdCopied, setShareIdCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    // Clear search when closing
    if (showSearch) {
      setUserQuery("");
      setUserResults([]);
    }
  };

  const fetchInbox = useCallback(async (signal) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const inboxRes = await fetchWithAuth(`${API_BASE}/messages/inbox`, { signal });
      if (inboxRes.ok) {
        const json = await inboxRes.json();
        // Backend may return:
        // - { message: 'Messages fetched successfully', data: [ ... ] }
        // - OR when empty: { message: 'No messages found' } (per your latest change)
        if (Array.isArray(json.data) && json.data.length > 0) {
          setMessages(json.data);
        } else if (json.message && json.message.toLowerCase().includes("no messages")) {
          // explicit empty response
          setMessages([]);
        } else if (Array.isArray(json)) {
          // fallback in case server returned an array directly
          setMessages(json);
        } else {
          // no messages or unknown shape -> empty
          setMessages([]);
        }
      } else if (inboxRes.status === 404) {
        // older backend behavior: 404 meant no messages — treat as empty
        setMessages([]);
      } else if (inboxRes.status === 401) {
        // Auth error - stop polling by clearing interval
        console.warn("Auth error in fetchInbox, user may need to re-login");
      }
      // Don't show errors for background refresh
    } catch (err) {
      // Ignore AbortError when request is cancelled
      if (err.name === "AbortError") {
        console.log("Fetch inbox aborted");
        return;
      }
      console.error("Error fetching inbox:", err);
      // Silently fail for background updates
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("No access token found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      // 1) Try to fetch profile from backend using fetchWithAuth (handles token refresh)
      const profileRes = await fetchWithAuth(`${API_BASE}/users/me`);
      if (profileRes.ok) {
        const p = await profileRes.json();
        setProfile(p.user || p);
      } else if (profileRes.status === 404) {
        setError("Profile endpoint not implemented on backend (GET /api/users/me).");
      } else {
        const t = await profileRes.json().catch(() => ({}));
        setError(t.message || "Failed to fetch profile");
      }

      // 2) Fetch received messages from inbox endpoint
      await fetchInbox();
    } catch (err) {
      console.error(err);
      setError("Network error while fetching profile.");
    } finally {
      setLoading(false);
    }
  }, [fetchInbox]);

  // Set up polling after fetchInbox is defined
  useEffect(() => {
    const controller = new AbortController();

    fetchData();

    // Set up polling to refresh inbox every 10 seconds
    const intervalId = setInterval(() => {
      fetchInbox(controller.signal);
    }, POLLING_INTERVAL);

    // Clean up interval and abort pending requests on component unmount
    return () => {
      clearInterval(intervalId);
      controller.abort();
    };
  }, [fetchInbox, fetchData]);

  const logout = async () => {
    const token = localStorage.getItem("accessToken");

    // Call backend logout endpoint to blacklist the token
    if (token) {
      try {
        await apiPost(`/auth/logout`, {});
        // Even if logout fails on backend, we still clear local tokens
      } catch (err) {
        console.error("Logout error:", err);
        // Continue with local cleanup even if backend call fails
      }
    }

    // Clear tokens from localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    // Notify parent to update hasToken state
    if (onLogout) onLogout();

    // Redirect to login page
    window.location.href = "/login";
  };

  const shareId = () => {
    const userId = profile?._id || profile?.id;
    if (!userId) {
      alert("Profile ID not available");
      return;
    }

    // Copy to clipboard
    navigator.clipboard.writeText(userId).then(
      () => {
        setShareIdCopied(true);
        setTimeout(() => setShareIdCopied(false), 3000);
      },
      (err) => {
        console.error("Failed to copy ID:", err);
        // Fallback: show alert with ID
        alert(`Your Profile ID: ${userId}\n\nCopy this ID to share with others!`);
      }
    );
  };

  const copyEmail = () => {
    const email = profile?.email;
    if (!email) {
      return;
    }

    // Copy to clipboard
    navigator.clipboard.writeText(email).then(
      () => {
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
      },
      (err) => {
        console.error("Failed to copy email:", err);
        alert(`Email: ${email}`);
      }
    );
  };

  const startEdit = (fieldName) => {
    setEditingField(fieldName);
    setEditValue(profile?.[fieldName] ?? "");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  // Debounced users search
  const fetchUsers = useCallback(
    async (q) => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setUserResults([]);
        setSearchingUsers(false);
        return;
      }
      try {
        const res = await fetchWithAuth(`${API_BASE}/users/all?search=${encodeURIComponent(q)}`);
        if (!res.ok) {
          setUserResults([]);
          setSearchingUsers(false);
          return;
        }
        const json = await res.json().catch(() => ({}));
        const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : json.users || [];
        // filter out current user
        const filtered = list.filter((u) => u._id !== profile?._id);
        setUserResults(filtered);
      } catch (err) {
        console.error(err);
        setUserResults([]);
      } finally {
        setSearchingUsers(false);
      }
    },
    [profile?._id]
  );

  useEffect(() => {
    if (!userQuery || userQuery.length < 2) {
      setUserResults([]);
      setSearchingUsers(false);
      return;
    }
    setSearchingUsers(true);
    const id = setTimeout(() => fetchUsers(userQuery), 500);
    return () => clearTimeout(id);
  }, [userQuery, fetchUsers]);

  const openComposer = (user) => {
    setSelectedReceiver(user);
    setComposeText("");
    setSendError("");
    setSendSuccess("");
  };

  const closeComposer = () => {
    setSelectedReceiver(null);
    setComposeText("");
    setSendError("");
    setSendSuccess("");
  };

  const sendMessage = async () => {
    if (!selectedReceiver) return;
    if (!composeText || composeText.trim().length === 0) {
      setSendError("Message cannot be empty");
      return;
    }

    // Check if trying to send to self
    if (selectedReceiver._id === profile?._id) {
      setSendError("You cannot send a message to yourself");
      return;
    }

    setSending(true);
    setSendError("");
    setSendSuccess("");

    try {
      // backend route: POST /api/messages/send/:recieverId
      const res = await apiPost(`/messages/send/${selectedReceiver._id}`, { content: composeText.trim() });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSendError(json.message || "Failed to send message");
        setSending(false);
        return;
      }

      setSendSuccess("Message sent successfully!");
      setComposeText("");
      // Close composer after a short delay
      setTimeout(() => closeComposer(), 1500);
    } catch (err) {
      console.error(err);
      setSendError("Network error while sending message");
      setSending(false);
    } finally {
      setSending(false);
    }
  };

  const saveEdit = async (fieldName) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Not authenticated");
      return;
    }

    // Validate age if that's what we're editing
    if (fieldName === "age") {
      const ageNum = Number(editValue);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
        setError("Please enter a valid age between 0 and 120");
        return;
      }
    }

    // Prepare payload: send only the updated field
    const payload = {};
    // for age, send as number; for other fields, send as string
    payload[fieldName] = fieldName === "age" ? Number(editValue) || 0 : editValue;

    try {
      const res = await apiPatch(`/users/me/updateprofile`, payload);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || "Failed to update profile");
        return;
      }
      // Success: update local profile state
      setProfile((prev) => ({ ...prev, [fieldName]: payload[fieldName] }));
      setEditingField(null);
      setEditValue("");

      // Show success message
      setUpdateSuccess("Profile updated successfully!");
      setTimeout(() => setUpdateSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Network error while updating profile");
    }
  };

  if (loading) {
    return <div className="profile-root">Loading profile...</div>;
  }

  return (
    <div className={`profile-root ${darkMode ? "dark-mode" : ""}`}>
      {/* Dark Mode Toggle */}
      <ThemeToggle />

      {/* Search Toggle Icon */}
      <button className="search-toggle" onClick={toggleSearch} title={showSearch ? "Hide Search" : "Search Users"}>
        {showSearch ? "✕" : "🔍"}
      </button>

      {/* Search Bar Container - Show/Hide based on state */}
      <div className={`search-bar-container ${showSearch ? "search-visible" : "search-hidden"}`}>
        <div className="search-input-wrapper">
          <input
            className="search-input"
            placeholder="Find users to message (min 2 chars)"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
          />
          {userQuery && (
            <button className="btn-clear-search" onClick={() => setUserQuery("")} title="Clear search">
              ✕
            </button>
          )}
        </div>

        {/* Search results & composer */}
        <div className="user-search-results">
          {searchingUsers && <div className="searching">Searching...</div>}
          {!searchingUsers && userResults.length === 0 && userQuery.length >= 2 && <div className="no-results">No users found</div>}
          {!searchingUsers && userResults.length > 0 && (
            <ul className="user-results-list">
              {userResults.map((u) => (
                <li key={u._id || u.id} className="user-result">
                  <div className="user-avatar-fallback">
                    {u.profileImage?.secure_url ? (
                      <img className="user-avatar" src={u.profileImage.secure_url} alt="avatar" />
                    ) : (
                      <div className="user-avatar-placeholder">{(u.firstName || u.email || "U").charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div className="user-meta">
                    <div className="user-name">{u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim()}</div>
                    {u.bio && <div className="user-bio">{u.bio}</div>}
                  </div>
                  <div className="user-actions">
                    <button className="btn-send" onClick={() => openComposer(u)}>
                      Send anonymously
                    </button>
                  </div>

                  {/* Inline composer */}
                  {selectedReceiver && selectedReceiver._id === u._id && (
                    <div className="composer">
                      <textarea
                        className="compose-input"
                        value={composeText}
                        onChange={(e) => setComposeText(e.target.value)}
                        placeholder={`Write an anonymous message to ${u.firstName || u.email}`}
                      />
                      <div className="composer-actions">
                        <button className="btn-send-confirm" onClick={sendMessage} disabled={sending}>
                          {sending ? "Sending..." : "Send"}
                        </button>
                        <button className="btn-send-cancel" onClick={closeComposer}>
                          Cancel
                        </button>
                      </div>
                      {sendError && <div className="send-error">{sendError}</div>}
                      {sendSuccess && <div className="send-success">{sendSuccess}</div>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile?.profileImage?.secure_url ? (
              <img src={profile.profileImage.secure_url} alt="profile" />
            ) : (
              <div className="avatar-fallback">{(profile?.firstName || "U").charAt(0)}</div>
            )}
          </div>
          <div className="profile-info">
            <h2>{profile?.fullName || `${profile?.firstName || ""} ${profile?.lastName || ""}`}</h2>
            <div className="profile-sub">
              {profile?.email}
              {profile?.email && (
                <button className="btn-copy-email" onClick={copyEmail} title="Copy email">
                  {emailCopied ? "✓" : "📋"}
                </button>
              )}
            </div>
          </div>
          <div className="profile-actions">
            <button className="btn-share-id" onClick={shareId}>
              {shareIdCopied ? "✓ ID Copied!" : "📋 Share ID"}
            </button>
          </div>
        </div>

        {error && <div className="profile-error">{error}</div>}
        {updateSuccess && <div className="profile-update-success">✓ {updateSuccess}</div>}

        <div className="profile-body">
          <div className="profile-left">
            <h3>About</h3>
            <div className="bio-section">
              {editingField === "bio" ? (
                <div className="bio-editing">
                  <label>Bio</label>
                  <textarea className="edit-input bio-textarea" value={editValue} onChange={(e) => setEditValue(e.target.value)} rows="4" />
                  <div className="edit-actions">
                    <button className="btn-tick" onClick={() => saveEdit("bio")}>
                      ✓ Save
                    </button>
                    <button className="btn-cross" onClick={cancelEdit}>
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bio-display">
                  <div className="bio-header">
                    <label>Bio</label>
                    <button className="btn-edit" onClick={() => startEdit("bio")}>
                      ✎ Edit
                    </button>
                  </div>
                  <p className="profile-bio">{profile?.bio || "No bio provided."}</p>
                </div>
              )}
            </div>

            <h3>Details</h3>
            <ul className="profile-details">
              <li className="editable-row">
                <strong>First name:</strong>
                <div className="editable-value">
                  {editingField === "firstName" ? (
                    <>
                      <input className="edit-input" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                      <div className="edit-actions">
                        <button className="btn-tick" onClick={() => saveEdit("firstName")}>
                          ✓
                        </button>
                        <button className="btn-cross" onClick={cancelEdit}>
                          ✕
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="field-value">{profile?.firstName || "-"}</span>
                      <button className="btn-edit" onClick={() => startEdit("firstName")}>
                        ✎
                      </button>
                    </>
                  )}
                </div>
              </li>

              <li className="editable-row">
                <strong>Last name:</strong>
                <div className="editable-value">
                  {editingField === "lastName" ? (
                    <>
                      <input className="edit-input" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                      <div className="edit-actions">
                        <button className="btn-tick" onClick={() => saveEdit("lastName")}>
                          ✓
                        </button>
                        <button className="btn-cross" onClick={cancelEdit}>
                          ✕
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="field-value">{profile?.lastName || "-"}</span>
                      <button className="btn-edit" onClick={() => startEdit("lastName")}>
                        ✎
                      </button>
                    </>
                  )}
                </div>
              </li>

              <li className="editable-row">
                <strong>Age:</strong>
                <div className="editable-value">
                  {editingField === "age" ? (
                    <>
                      <input type="number" className="edit-input" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                      <div className="edit-actions">
                        <button className="btn-tick" onClick={() => saveEdit("age")}>
                          ✓
                        </button>
                        <button className="btn-cross" onClick={cancelEdit}>
                          ✕
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="field-value">{profile?.age ?? "-"}</span>
                      <button className="btn-edit" onClick={() => startEdit("age")}>
                        ✎
                      </button>
                    </>
                  )}
                </div>
              </li>

              <li className="editable-row">
                <strong>Gender:</strong>
                <div className="editable-value">
                  {editingField === "gender" ? (
                    <>
                      <select className="edit-input" value={editValue} onChange={(e) => setEditValue(e.target.value)}>
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                      <div className="edit-actions">
                        <button className="btn-tick" onClick={() => saveEdit("gender")}>
                          ✓
                        </button>
                        <button className="btn-cross" onClick={cancelEdit}>
                          ✕
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="field-value gender-display">
                        {profile?.gender === "male" && "Male"}
                        {profile?.gender === "female" && "Female"}
                        {!profile?.gender && "-"}
                      </span>
                      <button className="btn-edit" onClick={() => startEdit("gender")}>
                        ✎
                      </button>
                    </>
                  )}
                </div>
              </li>
            </ul>
          </div>

          <div className="profile-right">
            <h3>Inbox</h3>
            {messages.length === 0 ? (
              <div className="no-messages">No messages yet.</div>
            ) : (
              <ul className="messages-list">
                {messages.map((m) => (
                  <li key={m._id || m.id} className="message-item">
                    <div className="msg-sender">From: {m.sender?.fullName || m.sender?.email || m.senderId || "Anonymous"}</div>
                    <div
                      className="msg-content"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(m.content, {
                          ALLOWED_TAGS: [],
                          ALLOWED_ATTR: [],
                        }),
                      }}
                    />
                    <div className="msg-time">
                      <small>{getRelativeTime(m.createdAt || Date.now())}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="profile-footer">
          <button className="btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
