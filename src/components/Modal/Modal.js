import React from "react";
import "./Modal.css";

export default function Modal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", danger = false }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button className={`modal-btn modal-btn-confirm ${danger ? "danger" : ""}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
