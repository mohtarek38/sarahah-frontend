import React from "react";
import DOMPurify from "dompurify";
import { getRelativeTime } from "../../utils/dateUtils";

export default function MessageList({ messages }) {
  if (messages.length === 0) {
    return <div className="no-messages">No messages yet.</div>;
  }

  return (
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
  );
}
