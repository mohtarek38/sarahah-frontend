import React, { useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import Avatar from "../components/Avatar/Avatar";
import EditableField from "../components/EditableField/EditableField";
import MessageList from "../components/MessageList/MessageList";
import { useProfile } from "../hooks/useProfile";
import { useMessages } from "../hooks/useMessages";
import { useImageUpload } from "../hooks/useImageUpload";
import "./Profile.css";

export default function Profile({ onLogout }) {
  const { darkMode } = useTheme();
  const [shareIdCopied, setShareIdCopied] = useState(false);
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

  const { messages } = useMessages();

  const { uploadingImage, imageUploadError, handleImageUpload, handleImageDelete } = useImageUpload();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const shareId = () => {
    const userId = profile?._id || profile?.id;
    if (!userId) {
      alert("Profile ID not available");
      return;
    }

    // Generate full URL based on current domain
    const baseUrl = window.location.origin; // Gets current domain (e.g., http://localhost:4200 or https://yourdomain.com)
    const profileUrl = `${baseUrl}/${userId}`;

    navigator.clipboard.writeText(profileUrl).then(
      () => {
        setShareIdCopied(true);
        setTimeout(() => setShareIdCopied(false), 3000);
      },
      (err) => {
        console.error("Failed to copy link:", err);
        alert(`Your Profile Link:\n${profileUrl}\n\nShare this link with others!`);
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

  if (loading) {
    return <div className="profile-root">Loading profile...</div>;
  }

  return (
    <div className={`profile-root ${darkMode ? "dark-mode" : ""}`}>
      <ThemeToggle />

      <div className="profile-card">
        <div className="profile-header">
          <Avatar profile={profile} onUpload={handleUpload} onDelete={handleDelete} uploading={uploadingImage} />
          <div className="profile-info">
            <h2>{profile?.fullName || `${profile?.firstName || ""} ${profile?.lastName || ""}`}</h2>
            <div className="profile-sub">
              {profile?.email}
              {profile?.email && (
                <button
                  className={`btn-visibility ${hiddenFields.includes("email") ? "hidden" : "visible"}`}
                  onClick={() => toggleFieldVisibility("email")}
                  title={hiddenFields.includes("email") ? "Private (Hidden from public)" : "Public (Visible on profile)"}
                >
                  {hiddenFields.includes("email") ? "🔒" : "🔓"}
                </button>
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
            <h3>About</h3>
            <label>Bio</label>
            <div className="bio-section">
              <EditableField
                value={profile?.bio}
                fieldName="bio"
                isTextarea={true}
                onSave={updateProfile}
                showVisibility={false}
              />
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
            </ul>
          </div>

          <div className="profile-right">
            <h3>Inbox</h3>
            <MessageList messages={messages} />
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
