import React from "react";
import DOMPurify from "dompurify";
import { getRelativeTime } from "../../utils/dateUtils";

export default function MessageList({ messages, onDelete, onToggleVisibility, togglingVisibility }) {
  if (messages.length === 0) {
    return <div className="no-messages">No messages yet.</div>;
  }

  return (
    <ul className="messages-list">
      {messages.map((m) => {
        const messageId = m._id || m.id;
        const isToggling = togglingVisibility === messageId;

        return (
          <li key={messageId} className="message-item">
            <div className="msg-header">
              <div className="msg-sender">From: {m.sender?.fullName || m.sender?.email || m.senderId || "Anonymous"}</div>
              <div className="msg-actions">
                {onToggleVisibility && (
                  <button
                    className={`btn-visibility ${m.hidden ? "hidden" : "visible"}`}
                    onClick={() => onToggleVisibility(messageId)}
                    disabled={isToggling}
                    title={m.hidden ? "Message is private (only you can see it)" : "Message is public (visible on profile)"}
                    aria-label={m.hidden ? "Make message public" : "Make message private"}
                  >
                    {isToggling ? "⏳" : m.hidden ? "🔒" : "🔓"}
                  </button>
                )}
                {onDelete && (
                  <button
                    className="btn-delete-message"
                    onClick={() => onDelete(messageId)}
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
        );
      })}
    </ul>
  );
}
