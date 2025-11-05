import React, { useEffect, useState, useCallback } from "react";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import Avatar from "../components/Avatar/Avatar";
import EditableField from "../components/EditableField/EditableField";
import MessageList from "../components/MessageList/MessageList";
import Modal from "../components/Modal/Modal";
import Toast from "../components/Toast/Toast";
import { useProfile } from "../hooks/useProfile";
import { useImageUpload } from "../hooks/useImageUpload";
import { useFetchMessages } from "../hooks/useFetchMessages";
import { genderOptions } from "../config/config";
import { apiDelete, apiPatch } from "../utils/api";
import "./Profile.css";

export default function Profile({ onLogout }) {
  const { darkMode } = useTheme();
  const [shareIdCopied, setShareIdCopied] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, messageId: null, type: "deleteMessage" });
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "info" });
  const [togglingVisibility, setTogglingVisibility] = useState(null); // Track which message is being toggled

  const { messages, setMessages } = useFetchMessages(null, false, true);
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

  // Toast functions - defined early to avoid 'use before define' errors
  const showToast = useCallback((message, type = "info") => {
    setToast({ isVisible: true, message, type });
  }, []);

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  // Fetch profile on mount
  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchProfile]);

  // Show error toast when profile fetch fails
  useEffect(() => {
    if (error) {
      showToast(error, "error");
    }
  }, [error, showToast]);

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
    handleImageDelete(
      () => {
        removeProfileImage();
      },
      (confirmCallback) => {
        setModalState({ isOpen: true, type: "deleteImage", confirmCallback });
      }
    );
  };

  const handleDeleteMessage = (messageId) => {
    setModalState({ isOpen: true, messageId, type: "deleteMessage" });
  };

  const confirmDelete = async () => {
    const { messageId, type, confirmCallback } = modalState;
    setModalState({ isOpen: false, messageId: null, type: null, confirmCallback: null });

    if (type === "deleteImage" && confirmCallback) {
      await confirmCallback();
      return;
    }

    if (type === "deleteMessage" && messageId) {
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
    }
  };

  const cancelDelete = () => {
    setModalState({ isOpen: false, messageId: null, type: null, confirmCallback: null });
  };

  const handleToggleMessageVisibility = async (messageId) => {
    if (togglingVisibility === messageId) return; // Prevent concurrent toggles

    setTogglingVisibility(messageId);
    try {
      const response = await apiPatch(`/messages/toggle-visibility/${messageId}`);

      if (response.ok) {
        const data = await response.json();
        // Update the message in state with the new hidden value
        setMessages((prevMessages) =>
          prevMessages.map((msg) => ((msg._id || msg.id) === messageId ? { ...msg, hidden: data.message.hidden } : msg))
        );
        showToast(data.message.hidden ? "Message is now private" : "Message is now public", "success");
      } else {
        const errorData = await response.json();
        showToast(errorData.message || "Failed to toggle message visibility", "error");
      }
    } catch (err) {
      console.error("Error toggling message visibility:", err);
      showToast("Failed to toggle message visibility. Please try again.", "error");
    } finally {
      setTogglingVisibility(null);
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
        title={modalState.type === "deleteImage" ? "Remove Profile Picture" : "Delete Message"}
        message={
          modalState.type === "deleteImage"
            ? "Are you sure you want to remove your profile picture? This action cannot be undone."
            : "Are you sure you want to delete this message? This action cannot be undone."
        }
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
                    onSave={null}
                    showVisibility={true}
                    isHidden={hiddenFields.includes("email")}
                    onToggleVisibility={toggleFieldVisibility}
                    disableEdit={true}
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
                    options={genderOptions}
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
              <MessageList
                messages={messages}
                onDelete={handleDeleteMessage}
                onToggleVisibility={handleToggleMessageVisibility}
                togglingVisibility={togglingVisibility}
              />
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
