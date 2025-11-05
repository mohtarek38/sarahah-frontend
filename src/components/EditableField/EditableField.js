import React, { useState } from "react";
import { nameLimits, bioLimits } from "../../config/config";

export default function EditableField({
  label,
  value,
  fieldName,
  type = "text",
  options = null,
  isTextarea = false,
  onSave,
  showVisibility = false,
  isHidden = false,
  onToggleVisibility,
  disableEdit = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const startEdit = () => {
    setIsEditing(true);
    setEditValue(value ?? "");
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const handleSave = async () => {
    const result = await onSave(fieldName, editValue);
    if (result?.success) {
      setIsEditing(false);
      setEditValue("");
    }
  };

  const getMaxLength = () => {
    if (fieldName === "firstName" || fieldName === "lastName") return nameLimits.MAX_NAME_LENGTH;
    if (fieldName === "bio") return bioLimits.MAX_BIO_LENGTH;
    return undefined;
  };

  const renderDisplayValue = () => {
    if (fieldName === "gender") {
      if (value === "male") return "Male";
      if (value === "female") return "Female";
      return "-";
    }
    return value || "-";
  };

  if (isTextarea) {
    // Bio field has special layout
    if (isEditing) {
      return (
        <div className="bio-editing">
          <textarea
            className="edit-input bio-textarea"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows="4"
            maxLength={getMaxLength()}
          />
          <div className="char-count">
            {editValue.length} / {bioLimits.MAX_BIO_LENGTH}
          </div>
          <div className="edit-actions">
            <button className="btn-tick" onClick={handleSave}>
              ✓ Save
            </button>
            <button className="btn-cross" onClick={cancelEdit}>
              ✕ Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bio-display">
        <div className="bio-header">
          <button className="btn-edit" onClick={startEdit}>
            ✎ Edit
          </button>
        </div>
        <p className="profile-bio">{value || "No bio provided."}</p>
      </div>
    );
  }

  // Regular fields
  if (isEditing) {
    return (
      <div className="editable-field-editing">
        {options ? (
          <select className="edit-input" value={editValue} onChange={(e) => setEditValue(e.target.value)}>
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            className="edit-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            maxLength={getMaxLength()}
          />
        )}
        <div className="edit-actions">
          <button className="btn-tick" onClick={handleSave}>
            ✓
          </button>
          <button className="btn-cross" onClick={cancelEdit}>
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <span className="field-value">{renderDisplayValue()}</span>
      <div className="field-buttons">
        {showVisibility && (
          <button
            className={`btn-visibility ${isHidden ? "hidden" : "visible"}`}
            onClick={() => onToggleVisibility(fieldName)}
            title={isHidden ? "Private (Hidden from public)" : "Public (Visible on profile)"}
          >
            {isHidden ? "🔒" : "🔓"}
          </button>
        )}
        {!disableEdit && (
          <button className="btn-edit" onClick={startEdit}>
            ✎
          </button>
        )}
      </div>
    </>
  );
}
