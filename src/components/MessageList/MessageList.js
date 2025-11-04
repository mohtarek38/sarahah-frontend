import React from "react";
import DOMPurify from "dompurify";
import { getRelativeTime } from "../../utils/dateUtils";

export default function MessageList({ messages, onDelete, onToggleVisibility }) {
  if (messages.length === 0) {
    return <div className="no-messages">No messages yet.</div>;
  }

  return (
    <ul className="messages-list">
      {messages.map((m) => (
        <li key={m._id || m.id} className="message-item">
          <div className="msg-header">
            <div className="msg-sender">From: {m.sender?.fullName || m.sender?.email || m.senderId || "Anonymous"}</div>
            <div className="msg-actions">
              {onToggleVisibility && (
                <button
                  className={`btn-visibility ${m.hidden ? "hidden" : "visible"}`}
                  onClick={() => onToggleVisibility(m._id || m.id)}
                  title={m.hidden ? "Message is private (only you can see it)" : "Message is public (visible on profile)"}
                  aria-label={m.hidden ? "Make message public" : "Make message private"}
                >
                  {m.hidden ? "🔒" : "🔓"}
                </button>
              )}
              {onDelete && (
                <button
                  className="btn-delete-message"
                  onClick={() => onDelete(m._id || m.id)}
                  title="Delete message"
                  aria-label="Delete message"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
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
  );
}
