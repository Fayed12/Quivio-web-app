// react
import React from "react";
// redux
import { useSelector } from "react-redux";
import { selectUnreadCount } from "../../redux/slices/chatSlice";

export default function ChatUnreadBadge({ customClass = "", max = 99 }) {
  const unreadCount = useSelector(selectUnreadCount);

  if (!unreadCount || unreadCount <= 0) return null;

  const displayValue = unreadCount > max ? `${max}+` : unreadCount;

  return (
    <span
      className={`chat-unread-badge ${customClass}`}
      style={{
        backgroundColor: "var(--color-danger, #DC2626)",
        color: "#FFFFFF",
        fontSize: "0.6875rem",
        fontWeight: "var(--fw-bold, 700)",
        padding: "2px 6px",
        borderRadius: "9999px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "18px",
        height: "18px",
        lineHeight: 1,
        boxShadow: "0 2px 4px rgba(220, 38, 38, 0.3)",
      }}
    >
      {displayValue}
    </span>
  );
}
