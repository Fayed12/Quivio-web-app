// react
import React, { useState, useMemo } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";
import {
  openConversationWith,
  selectConversations,
  selectActiveConversationId,
  selectChatContacts,
} from "../../redux/slices/chatSlice";
import { selectUser } from "../../redux/slices/authSlice";

// libraries
import Select from "react-select";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import { FiSearch, FiMessageSquare, FiUserPlus, FiUsers } from "react-icons/fi";

// local styling
import styles from "./ChatSidebar.module.css";

// Extend dayjs plugins
dayjs.extend(isToday);
dayjs.extend(isYesterday);

export default function ChatSidebar({ role }) {
  const dispatch = useDispatch();
  const currentAuthUser = useSelector(selectUser);
  const conversations = useSelector(selectConversations) || [];
  const activeConversationId = useSelector(selectActiveConversationId);
  const contacts = useSelector(selectChatContacts) || [];

  const [searchTerm, setSearchTerm] = useState("");

  const currentUid = currentAuthUser?.id;

  // Format last message timestamp cleanly
  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = dayjs(isoString);
    if (date.isToday()) return date.format("h:mm A");
    if (date.isYesterday()) return "Yesterday";
    return date.format("MMM D");
  };

  const getAvatarColor = (name = "") => {
    const char = name.trim().charAt(0).toUpperCase();
    if (char >= "A" && char <= "E") return "var(--blue-600, #2563EB)";
    if (char >= "F" && char <= "J") return "var(--violet-600, #7C3AED)";
    if (char >= "K" && char <= "O") return "var(--teal-600, #0D9488)";
    if (char >= "P" && char <= "T") return "var(--amber-600, #D97706)";
    return "var(--green-600, #16A34A)";
  };

  // Convert contacts to react-select options for quick picking at top header
  const selectOptions = useMemo(() => {
    return contacts.map((c) => ({
      value: c.uid,
      label: c.full_name || c.email,
      email: c.email,
      avatar_url: c.avatar_url,
      role: c.role,
    }));
  }, [contacts]);

  // Filter conversations list by search term
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    const term = searchTerm.toLowerCase();
    return conversations.filter((c) => {
      const partnerName = c.otherUser?.full_name?.toLowerCase() || "";
      const partnerEmail = c.otherUser?.email?.toLowerCase() || "";
      const lastMsg = c.lastMessage?.toLowerCase() || "";
      return (
        partnerName.includes(term) ||
        partnerEmail.includes(term) ||
        lastMsg.includes(term)
      );
    });
  }, [conversations, searchTerm]);

  const handleSelectContact = (option) => {
    if (!option || !currentUid) return;
    dispatch(
      openConversationWith({ currentUid, otherUid: option.value })
    );
  };

  const handleOpenConversation = (otherUid) => {
    if (!currentUid || !otherUid) return;
    dispatch(openConversationWith({ currentUid, otherUid }));
  };

  // Custom react-select style definition to match theme variables
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "var(--bg-app, #F8FAFC)",
      borderColor: state.isFocused ? "var(--blue-500, #3B82F6)" : "var(--border-color, #E2E8F0)",
      borderRadius: "8px",
      fontSize: "0.875rem",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.15)" : "none",
      "&:hover": {
        borderColor: "var(--blue-500, #3B82F6)",
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--bg-surface, #FFFFFF)",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(15, 23, 42, 0.15)",
      border: "1px solid var(--border-color, #E2E8F0)",
      zIndex: 999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "var(--blue-600, #2563EB)"
        : state.isFocused
        ? "var(--blue-50, #EFF6FF)"
        : "transparent",
      color: state.isSelected ? "#FFFFFF" : "var(--text-primary, #0F172A)",
      fontSize: "0.875rem",
      cursor: "pointer",
    }),
    placeholder: (base) => ({
      ...base,
      color: "var(--text-muted, #94A3B8)",
      fontSize: "0.8125rem",
    }),
    singleValue: (base) => ({
      ...base,
      color: "var(--text-primary, #0F172A)",
    }),
  };

  return (
    <aside className={styles.sidebar}>
      {/* ALWAYS PINNED AT THE TOP of the chat sidebar */}
      <div className={styles.topPinnedHeader}>
        <div className={styles.headerTitleRow}>
          <h3 className={styles.headerTitle}>
            <FiMessageSquare style={{ color: "var(--blue-600, #2563EB)" }} />
            <span>Messages</span>
          </h3>
          <span className={styles.contactsCountPill}>
            {contacts.length} {role === "instructor" ? "Students" : "Instructors"}
          </span>
        </div>

        {/* Quick Contact Picker using react-select */}
        <div className={styles.selectWrapper}>
          <Select
            options={selectOptions}
            onChange={handleSelectContact}
            placeholder={`+ Start chat with ${role === "instructor" ? "student" : "instructor"}...`}
            isClearable
            styles={customSelectStyles}
            formatOptionLabel={(opt) => (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: getAvatarColor(opt.label),
                    color: "#FFF",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                  }}
                >
                  {opt.label.charAt(0).toUpperCase()}
                </span>
                <span>{opt.label}</span>
              </div>
            )}
          />
        </div>

        {/* Conversation list filter */}
        <div className={styles.searchInputWrapper}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className={styles.conversationsList}>
        {filteredConversations.length === 0 ? (
          <div className={styles.emptyState}>
            <FiUsers size={32} />
            <p>No conversations found.</p>
            <span style={{ fontSize: "0.75rem" }}>
              Select a contact above to start chatting!
            </span>
          </div>
        ) : (
          filteredConversations.map((convo) => {
            const isSelected = convo.id === activeConversationId;
            const partner = convo.otherUser || {};
            const initial = (partner.full_name || partner.email || "U")
              .charAt(0)
              .toUpperCase();
            const bgAvatarColor = getAvatarColor(partner.full_name || partner.email);

            return (
              <button
                key={convo.id}
                className={`${styles.conversationItem} ${
                  isSelected ? styles.activeItem : ""
                }`}
                onClick={() => handleOpenConversation(partner.uid)}
              >
                <div className={styles.avatarWrapper}>
                  {partner.avatar_url ? (
                    <img
                      src={partner.avatar_url}
                      alt={partner.full_name || "Avatar"}
                      className={styles.avatar}
                    />
                  ) : (
                    <div
                      className={styles.avatar}
                      style={{ backgroundColor: bgAvatarColor }}
                    >
                      {initial}
                    </div>
                  )}
                  <span
                    className={styles.statusDot}
                    style={{
                      backgroundColor: "var(--color-success, #16A34A)",
                    }}
                  />
                </div>

                <div className={styles.convoDetails}>
                  <div className={styles.convoHeader}>
                    <span className={styles.partnerName}>
                      {partner.full_name || "Unknown User"}
                    </span>
                    <span className={styles.timeText}>
                      {formatTime(convo.lastMessageAt || convo.createdAt)}
                    </span>
                  </div>

                  <div className={styles.convoBody}>
                    <span className={styles.lastMessage}>
                      {convo.lastMessage || "No messages yet"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
