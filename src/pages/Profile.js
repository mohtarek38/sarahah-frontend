import React, { useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import Avatar from "../components/Avatar/Avatar";
import EditableField from "../components/EditableField/EditableField";
import MessageList from "../components/MessageList/MessageList";
import Modal from "../components/Modal/Modal";
import Toast from "../components/Toast/Toast";
import { useProfile } from "../hooks/useProfile";
import { useImageUpload } from "../hooks/useImageUpload";
import { apiGet, apiDelete, apiPatch } from "../utils/api";
import "./Profile.css";

export default function Profile({ onLogout }) {
  const { darkMode } = useTheme();
  const [shareIdCopied, setShareIdCopied] = useState(false);
  const [messages, setMessages] = useState([]);
  const [modalState, setModalState] = useState({ isOpen: false, messageId: null });
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "info" });
  const {
    profile,
    loading,
    error,
    updateSuccess,
    hiddenFields,
    fetchProfile,
    updateProfile,
    toggleFieldVisibility,
    updateProfileImage,
    removeProfileImage,
    logout,
  } = useProfile();

  const { uploadingImage, imageUploadError, handleImageUpload, handleImageDelete } = useImageUpload();

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Fetch messages on mount
  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const inboxRes = await apiGet(`/messages/inbox`);
        if (inboxRes.ok) {
          const json = await inboxRes.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            setMessages(json.data);
          } else if (json.message && json.message.toLowerCase().includes("no messages")) {
            setMessages([]);
          } else if (Array.isArray(json)) {
            setMessages(json);
          } else {
            setMessages([]);
          }
        } else if (inboxRes.status === 404) {
          setMessages([]);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, []);

  const shareId = () => {
    const userId = profile?._id || profile?.id;
    if (!userId) {
      showToast("Profile ID not available", "error");
      return;
    }

    // Generate full URL based on current domain
    const baseUrl = window.location.origin; // Gets current domain (e.g., http://localhost:4200 or https://yourdomain.com)
    const profileUrl = `${baseUrl}/${userId}`;

    navigator.clipboard.writeText(profileUrl).then(
      () => {
        setShareIdCopied(true);
        showToast("Profile link copied to clipboard!", "success");
        setTimeout(() => setShareIdCopied(false), 3000);
      },
      (err) => {
        console.error("Failed to copy link:", err);
        showToast("Failed to copy link. Check console for the URL.", "error");
        console.log("Your Profile Link:", profileUrl);
      }
    );
  };

  const handleUpload = (event) => {
    handleImageUpload(event, (profileImage) => {
      updateProfileImage(profileImage);
    });
  };

  const handleDelete = () => {
    handleImageDelete(() => {
      removeProfileImage();
    });
  };

  const showToast = (message, type = "info") => {
    setToast({ isVisible: true, message, type });
  };

  const closeToast = () => {
    setToast({ ...toast, isVisible: false });
  };

  const handleDeleteMessage = (messageId) => {
    setModalState({ isOpen: true, messageId });
  };

  const confirmDelete = async () => {
    const { messageId } = modalState;
    setModalState({ isOpen: false, messageId: null });

    try {
      const response = await apiDelete(`/messages/delete/${messageId}`);
      
      if (response.ok) {
        // Remove the deleted message from state
        setMessages((prevMessages) => prevMessages.filter((msg) => (msg._id || msg.id) !== messageId));
        showToast("Message deleted successfully", "success");
      } else {
        const errorData = await response.json();
        showToast(errorData.message || "Failed to delete message", "error");
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      showToast("Failed to delete message. Please try again.", "error");
    }
  };

  const cancelDelete = () => {
    setModalState({ isOpen: false, messageId: null });
  };

  const handleToggleMessageVisibility = async (messageId) => {
    try {
      const response = await apiPatch(`/messages/toggle-visibility/${messageId}`);
      
      if (response.ok) {
        const data = await response.json();
        // Update the message in state with the new hidden value
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            (msg._id || msg.id) === messageId ? { ...msg, hidden: data.message.hidden } : msg
          )
        );
        showToast(
          data.message.hidden ? "Message is now private" : "Message is now public",
          "success"
        );
      } else {
        const errorData = await response.json();
        showToast(errorData.message || "Failed to toggle message visibility", "error");
      }
    } catch (err) {
      console.error("Error toggling message visibility:", err);
      showToast("Failed to toggle message visibility. Please try again.", "error");
    }
  };

  if (loading) {
    return <div className="profile-root">Loading profile...</div>;
  }

  return (
    <div className={`profile-root ${darkMode ? "dark-mode" : ""}`}>
      <ThemeToggle />

      <Modal
        isOpen={modalState.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        danger={true}
      />

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={closeToast} />

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-header-left">
            <Avatar profile={profile} onUpload={handleUpload} onDelete={handleDelete} uploading={uploadingImage} />
            <div className="profile-info">
              <h2>{profile?.fullName || `${profile?.firstName || ""} ${profile?.lastName || ""}`}</h2>
              {profile?.createdAt && (
                <p className="profile-sub">
                  Joined{" "}
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
          <div className="profile-actions">
            <button className="btn-share-id" onClick={shareId}>
              {shareIdCopied ? "✓ Link Copied!" : "🔗 Share Profile"}
            </button>
          </div>
        </div>

        {error && <div className="profile-error">{error}</div>}
        {imageUploadError && <div className="profile-error">{imageUploadError}</div>}
        {updateSuccess && <div className="profile-update-success">✓ {updateSuccess}</div>}

        <div className="profile-body">
          <div className="profile-left">
            <h3>Bio</h3>
            <div className="bio-section">
              <EditableField value={profile?.bio} fieldName="bio" isTextarea={true} onSave={updateProfile} showVisibility={false} />
            </div>

            <h3>Details</h3>
            <ul className="profile-details">
              <li className="editable-row">
                <strong>First name:</strong>
                <div className="editable-value">
                  <EditableField
                    label="First name"
                    value={profile?.firstName}
                    fieldName="firstName"
                    onSave={updateProfile}
                    showVisibility={false}
                  />
                </div>
              </li>

              <li className="editable-row">
                <strong>Last name:</strong>
                <div className="editable-value">
                  <EditableField
                    label="Last name"
                    value={profile?.lastName}
                    fieldName="lastName"
                    onSave={updateProfile}
                    showVisibility={false}
                  />
                </div>
              </li>

              <li className="editable-row">
                <strong>Email:</strong>
                <div className="editable-value">
                  <EditableField
                    label="Email"
                    value={profile?.email}
                    fieldName="email"
                    type="email"
                    onSave={() => {
                      // TODO: Implement email update functionality
                      return Promise.resolve({ success: false });
                    }}
                    showVisibility={true}
                    isHidden={hiddenFields.includes("email")}
                    onToggleVisibility={toggleFieldVisibility}
                  />
                </div>
              </li>

              <li className="editable-row">
                <strong>Phone Number:</strong>
                <div className="editable-value">
                  <EditableField
                    label="Phone Number"
                    value={profile?.phoneNumber}
                    fieldName="phoneNumber"
                    type="tel"
                    onSave={updateProfile}
                    showVisibility={true}
                    isHidden={hiddenFields.includes("phoneNumber")}
                    onToggleVisibility={toggleFieldVisibility}
                  />
                </div>
              </li>

              <li className="editable-row">
                <strong>Gender:</strong>
                <div className="editable-value">
                  <EditableField
                    label="Gender"
                    value={profile?.gender}
                    fieldName="gender"
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                    ]}
                    onSave={updateProfile}
                    showVisibility={true}
                    isHidden={hiddenFields.includes("gender")}
                    onToggleVisibility={toggleFieldVisibility}
                  />
                </div>
              </li>

              <li className="editable-row">
                <strong>Age:</strong>
                <div className="editable-value">
                  <EditableField
                    label="Age"
                    value={profile?.age}
                    fieldName="age"
                    type="text"
                    onSave={updateProfile}
                    showVisibility={true}
                    isHidden={hiddenFields.includes("age")}
                    onToggleVisibility={toggleFieldVisibility}
                  />
                </div>
              </li>
            </ul>

            <div className="inbox-section">
              <h3>
                Inbox <span className="message-count">({messages?.length || 0})</span>
              </h3>
              <MessageList messages={messages} onDelete={handleDeleteMessage} onToggleVisibility={handleToggleMessageVisibility} />
            </div>
          </div>
        </div>

        <div className="profile-footer">
          <button className="btn-logout" onClick={() => logout(onLogout)}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
