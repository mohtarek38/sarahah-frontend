import React, { useEffect, useState } from "react";
import "./Profile.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // listen for login event in case App didn't refresh
    const handler = () => {
      fetchData();
    };
    window.addEventListener("sarahah:login", handler);
    fetchData();
    return () => window.removeEventListener("sarahah:login", handler);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("No access token found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      // 1) Try to fetch profile from backend
      const profileRes = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const p = await profileRes.json();
        setProfile(p.user || p);
      } else if (profileRes.status === 404) {
        setError("Profile endpoint not implemented on backend (GET /api/users/me).");
      } else if (profileRes.status === 401) {
        setError("Unauthorized. Token may be expired.");
      } else {
        const t = await profileRes.json().catch(() => ({}));
        setError(t.message || "Failed to fetch profile");
      }

      // 2) Fetch received messages from inbox endpoint
      // Endpoint: GET /api/messages/inbox — returns { message, data: [ ... ] }
      const inboxRes = await fetch(`${API_BASE}/messages/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      } else {
        const t = await inboxRes.json().catch(() => ({}));
        // For other non-OK statuses, surface a helpful error
        setError(t.message || "Failed to fetch messages");
      }
    } catch (err) {
      console.error(err);
      setError("Network error while fetching profile.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    // reload app to show login
    window.location.reload();
  };

  const startEdit = (fieldName) => {
    setEditingField(fieldName);
    setEditValue(profile?.[fieldName] ?? "");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveEdit = async (fieldName) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Not authenticated");
      return;
    }
    // Prepare payload: send only the updated field
    const payload = {};
    // for age, try to send number
    payload[fieldName] = fieldName === "age" ? Number(editValue) || 0 : editValue;
    try {
      const res = await fetch(`${API_BASE}/users/me/updateprofile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || "Failed to update profile");
        return;
      }
      // Success: update local profile state
      setProfile((prev) => ({ ...prev, [fieldName]: payload[fieldName] }));
      setEditingField(null);
      setEditValue("");
    } catch (err) {
      console.error(err);
      setError("Network error while updating profile");
    }
  };

  if (loading) {
    return <div className="profile-root">Loading profile...</div>;
  }

  return (
    <div className="profile-root">
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
            <div className="profile-sub">{profile?.email}</div>
          </div>
          <div className="profile-actions">
            <button className="btn-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {error && <div className="profile-error">{error}</div>}

        <div className="profile-body">
          <div className="profile-left">
            <h3>About</h3>
            <div className="editable-row">
              <label>Bio</label>
              <div className="editable-value">
                {editingField === "bio" ? (
                  <>
                    <textarea className="edit-input" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                    <div className="edit-actions">
                      <button className="btn-tick" onClick={() => saveEdit("bio")}>
                        ✓
                      </button>
                      <button className="btn-cross" onClick={cancelEdit}>
                        ✕
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="profile-bio">{profile?.bio || "No bio provided."}</p>
                    <button className="btn-edit" onClick={() => startEdit("bio")}>
                      ✎
                    </button>
                  </>
                )}
              </div>
            </div>

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
                        <option value="">Select</option>
                        <option value="male">male</option>
                        <option value="female">female</option>
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
                      <span className="field-value">{profile?.gender || "-"}</span>
                      <button className="btn-edit" onClick={() => startEdit("gender")}>
                        ✎
                      </button>
                    </>
                  )}
                </div>
              </li>

              <li>
                <strong>Email:</strong> {profile?.email || "-"}
              </li>
            </ul>
          </div>

          <div className="profile-right">
            <h3>Messages</h3>
            {messages.length === 0 ? (
              <div className="no-messages">No messages yet.</div>
            ) : (
              <ul className="messages-list">
                {messages.map((m) => (
                  <li key={m._id || m.id} className="message-item">
                    <div className="msg-sender">From: {m.sender?.fullName || m.sender?.email || m.senderId || "Anonymous"}</div>
                    <div className="msg-content">{m.content}</div>
                    <div className="msg-time">
                      <small>{new Date(m.createdAt || m.createdAt || Date.now()).toLocaleString()}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
