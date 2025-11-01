import React from "react";

export default function Avatar({ profile, onUpload, onDelete, uploading }) {
  return (
    <div className="profile-avatar-wrapper">
      <div className="profile-avatar">
        {profile?.profileImage?.secure_url ? (
          <img src={profile.profileImage.secure_url} alt="profile" />
        ) : (
          <div className="avatar-fallback">{(profile?.firstName || "U").charAt(0)}</div>
        )}
      </div>
      <div className="avatar-overlay">
        <input type="file" id="profile-image-input" accept="image/*" style={{ display: "none" }} onChange={onUpload} disabled={uploading} />
        <label htmlFor="profile-image-input" className="avatar-btn avatar-upload">
          {uploading ? "Uploading..." : profile?.profileImage ? "Change Photo" : "Add Photo"}
        </label>
        {profile?.profileImage && (
          <button className="avatar-btn avatar-remove" onClick={onDelete} disabled={uploading}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
