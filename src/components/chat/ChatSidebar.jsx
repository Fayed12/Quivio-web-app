// react
import { useState, useMemo, useEffect } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";
import {
  openConversationWith,
  selectConversations,
  selectActiveConversationId,
  selectChatContacts,
  clearAllMessagesInConversation,
  deleteConversation,
} from "../../redux/slices/chatSlice";
import { selectUser } from "../../redux/slices/authSlice";

// libraries
import Select from "react-select";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import {
  FiSearch,
  FiMessageSquare,
  FiUsers,
  FiSend,
  FiMoreVertical,
  FiEye,
  FiEyeOff,
  FiTrash,
  FiTrash2,
  FiArrowLeft,
} from "react-icons/fi";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// components
import BroadcastMessageModal from "./BroadcastMessageModal";

// helpers
import { getAvatarUrl } from "../../utils/avatarUtils";

// local styling
import styles from "./ChatSidebar.module.css";

// Extend dayjs plugins
dayjs.extend(isToday);
dayjs.extend(isYesterday);

export default function ChatSidebar({ role, onSelectConversation }) {
  const dispatch = useDispatch();
  const currentAuthUser = useSelector(selectUser);
  const rawConversations = useSelector(selectConversations);
  const activeConversationId = useSelector(selectActiveConversationId);
  const rawContacts = useSelector(selectChatContacts);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [openMenuConvoId, setOpenMenuConvoId] = useState(null);
  const [showHiddenView, setShowHiddenView] = useState(false);

  const [hiddenConvoIds, setHiddenConvoIds] = useState(() => {
    try {
      const saved = localStorage.getItem("quivio_hidden_convos");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("quivio_hidden_convos", JSON.stringify(hiddenConvoIds));
    } catch (e) {
      console.warn("Failed to persist hidden convos:", e);
    }
  }, [hiddenConvoIds]);

  const currentUid = currentAuthUser?.id;

  // Close context dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuConvoId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Format last message timestamp cleanly
  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = dayjs(isoString);
    if (date.isToday()) return date.format("h:mm A");
    if (date.isYesterday()) return "Yesterday";
    return date.format("MMM D");
  };

  // Convert contacts to react-select options for quick picking at top header
  const selectOptions = useMemo(() => {
    const contactsList = rawContacts || [];
    return contactsList.map((c) => ({
      value: c.uid || c.id,
      label: c.full_name || c.email || "User",
      email: c.email,
      avatar_url: c.avatar_url,
      role: c.role,
      rawContact: c,
    }));
  }, [rawContacts]);

  // Filter conversations list by search term
  const filteredConversations = useMemo(() => {
    const convoList = rawConversations || [];
    if (!searchTerm.trim()) return convoList;
    const term = searchTerm.toLowerCase();
    return convoList.filter((c) => {
      const partnerName = c.otherUser?.full_name?.toLowerCase() || "";
      const partnerEmail = c.otherUser?.email?.toLowerCase() || "";
      const lastMsg = c.lastMessage?.toLowerCase() || "";
      return (
        partnerName.includes(term) ||
        partnerEmail.includes(term) ||
        lastMsg.includes(term)
      );
    });
  }, [rawConversations, searchTerm]);

  // Filter list by hidden mode state
  const displayedConversations = useMemo(() => {
    return filteredConversations.filter((c) => {
      const isHidden = hiddenConvoIds.includes(c.id);
      return showHiddenView ? isHidden : !isHidden;
    });
  }, [filteredConversations, hiddenConvoIds, showHiddenView]);

  const handleToggleHideConvo = (convoId, e) => {
    e.stopPropagation();
    setOpenMenuConvoId(null);
    setHiddenConvoIds((prev) => {
      const isHidden = prev.includes(convoId);
      if (isHidden) {
        toast.info("Conversation restored to active inbox");
        const updated = prev.filter((id) => id !== convoId);
        if (updated.length === 0) {
          setShowHiddenView(false);
        }
        return updated;
      } else {
        toast.info("Conversation moved to hidden mode");
        return [...prev, convoId];
      }
    });
  };

  const handleClearAllMessages = (convoId, e) => {
    e.stopPropagation();
    setOpenMenuConvoId(null);
    Swal.fire({
      title: "Delete all messages?",
      text: "All messages in this conversation will be permanently deleted. You cannot undo this task!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Yes, delete all messages",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(clearAllMessagesInConversation(convoId))
          .unwrap()
          .then(() => {
            Swal.fire("Cleared!", "All messages have been deleted.", "success");
          })
          .catch((err) => {
            Swal.fire(
              "Error!",
              typeof err === "string" ? err : "Failed to clear messages.",
              "error"
            );
          });
      }
    });
  };

  const handleDeleteConversation = (convoId, e) => {
    e.stopPropagation();
    setOpenMenuConvoId(null);
    Swal.fire({
      title: "Delete conversation?",
      text: "This conversation and all its messages will be permanently deleted. You cannot undo this task!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Yes, delete conversation",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteConversation(convoId))
          .unwrap()
          .then(() => {
            Swal.fire("Deleted!", "Conversation deleted permanently.", "success");
          })
          .catch((err) => {
            Swal.fire(
              "Error!",
              typeof err === "string" ? err : "Failed to delete conversation.",
              "error"
            );
          });
      }
    });
  };

  const handleSelectContact = (option) => {
    if (!option || !currentUid) return;
    const otherUid = option.value;
    setSelectedOption(null);
    onSelectConversation?.();
    dispatch(openConversationWith({ currentUid, otherUid }));
  };

  const handleOpenConversation = (otherUid) => {
    if (!currentUid || !otherUid) return;
    onSelectConversation?.();
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
        borderColor: "var(--blue-400, #60A5FA)",
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--bg-surface, #FFFFFF)",
      borderRadius: "8px",
      boxShadow: "0 10px 25px rgba(15, 23, 42, 0.15)",
      border: "1px solid var(--border-color, #E2E8F0)",
      zIndex: 99,
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

          <div className={styles.headerActionsGroup}>
            <span
              className={styles.contactsCountPill}
              title={`${rawContacts?.length || 0} ${role === "instructor" ? "Students" : "Instructors"}`}
            >
              <FiUsers size={12} />
              <span>{rawContacts?.length || 0}</span>
              <span className={styles.countLabelText}>
                {role === "instructor" ? "Students" : "Instructors"}
              </span>
            </span>

            {role === "instructor" && (
              <button
                className={styles.broadcastActionBtn}
                onClick={() => setShowBroadcastModal(true)}
                title="Send message to multiple specific students"
              >
                <FiSend size={12} />
                <span>Multi-Send</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Contact Picker using react-select */}
        <div className={styles.selectWrapper}>
          <Select
            value={selectedOption}
            options={selectOptions}
            onChange={handleSelectContact}
            placeholder={`+ Start chat with ${role === "instructor" ? "student" : "instructor"}...`}
            isClearable
            styles={customSelectStyles}
            formatOptionLabel={(opt) => (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img
                  src={getAvatarUrl(opt)}
                  alt={opt.label}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: "1px solid var(--border-color, #E2E8F0)",
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.2 }}>
                    {opt.label}
                  </span>
                  {opt.role && (
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted, #94A3B8)", textTransform: "capitalize" }}>
                      {opt.role}
                    </span>
                  )}
                </div>
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
        {/* Pull / Toggle Hidden Conversations Drawer */}
        {(hiddenConvoIds.length > 0 || showHiddenView) && (
          <button
            type="button"
            className={`${styles.toggleHiddenBar} ${
              showHiddenView ? styles.activeHiddenBar : ""
            }`}
            onClick={() => setShowHiddenView((prev) => !prev)}
            title={showHiddenView ? "Return to active inbox" : "View hidden conversations"}
          >
            <div className={styles.hiddenBarLeft}>
              {showHiddenView ? <FiArrowLeft size={14} /> : <FiEyeOff size={14} />}
              <span>{showHiddenView ? "Back to Active Inbox" : "Hidden Conversations"}</span>
            </div>
            {hiddenConvoIds.length > 0 && (
              <span className={styles.hiddenBadgeCount}>{hiddenConvoIds.length}</span>
            )}
          </button>
        )}

        {displayedConversations.length === 0 ? (
          <div className={styles.emptyState}>
            <FiUsers size={32} />
            <p>{showHiddenView ? "No hidden conversations." : "No conversations found."}</p>
            <span style={{ fontSize: "0.75rem" }}>
              {showHiddenView
                ? "Conversations marked as hidden will appear here."
                : "Select a contact above to start chatting!"}
            </span>
            {showHiddenView && (
              <button
                type="button"
                className={styles.backToInboxBtn}
                onClick={() => setShowHiddenView(false)}
              >
                <FiArrowLeft size={13} />
                <span>Back to Active Inbox</span>
              </button>
            )}
          </div>
        ) : (
          displayedConversations.map((convo, index) => {
            const isSelected = convo.id === activeConversationId;
            const partner = convo.otherUser || {};
            const partnerUid =
              partner.uid || (convo.user1_uid === currentUid ? convo.user2_uid : convo.user1_uid);
            const hasUnread = Boolean(convo.unreadCount && convo.unreadCount > 0);
            const isHidden = hiddenConvoIds.includes(convo.id);

            return (
              <button
                key={convo.id}
                style={{ animationDelay: `${Math.min(index * 0.04, 0.3)}s` }}
                className={`${styles.conversationItem} ${
                  isSelected ? styles.activeItem : ""
                } ${hasUnread ? styles.unreadItem : ""}`}
                onClick={() => handleOpenConversation(partnerUid)}
              >
                <div className={styles.avatarWrapper}>
                  <img
                    src={getAvatarUrl(partner)}
                    alt={partner.full_name || "Avatar"}
                    className={styles.avatar}
                  />
                  <span
                    className={styles.statusDot}
                    style={{
                      backgroundColor: "var(--color-success, #16A34A)",
                    }}
                  />
                </div>

                <div className={styles.convoDetails}>
                  <div className={styles.convoHeader}>
                    <span
                      className={`${styles.partnerName} ${
                        hasUnread ? styles.unreadNameBold : ""
                      }`}
                    >
                      {partner.full_name || "Unknown User"}
                    </span>
                    <span
                      className={`${styles.timeText} ${
                        hasUnread ? styles.unreadTimeText : ""
                      }`}
                    >
                      {formatTime(convo.lastMessageAt || convo.createdAt)}
                    </span>
                  </div>

                  <div className={styles.convoBody}>
                    <span
                      className={`${styles.lastMessage} ${
                        hasUnread ? styles.unreadMessageText : ""
                      }`}
                    >
                      {convo.lastMessage || "No messages yet"}
                    </span>

                    {hasUnread && (
                      <span className={styles.unreadBadgePill}>
                        {convo.unreadCount > 99 ? "99+" : convo.unreadCount} NEW
                      </span>
                    )}
                  </div>
                </div>

                {/* Context Options Dropdown Menu */}
                <div
                  className={styles.convoMenuWrapper}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={styles.menuTriggerBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuConvoId((prev) => (prev === convo.id ? null : convo.id));
                    }}
                    title="Conversation options"
                  >
                    <FiMoreVertical size={16} />
                  </button>

                  {openMenuConvoId === convo.id && (
                    <div className={styles.dropdownMenu}>
                      <button
                        type="button"
                        className={styles.menuItem}
                        onClick={(e) => handleToggleHideConvo(convo.id, e)}
                      >
                        {isHidden ? (
                          <>
                            <FiEye size={13} /> <span>Unhide</span>
                          </>
                        ) : (
                          <>
                            <FiEyeOff size={13} /> <span>Hide</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className={styles.menuItem}
                        onClick={(e) => handleClearAllMessages(convo.id, e)}
                      >
                        <FiTrash size={13} /> <span>Clear Messages</span>
                      </button>

                      <button
                        type="button"
                        className={`${styles.menuItem} ${styles.menuItemDanger}`}
                        onClick={(e) => handleDeleteConversation(convo.id, e)}
                      >
                        <FiTrash2 size={13} /> <span>Delete Conversation</span>
                      </button>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {showBroadcastModal && (
        <BroadcastMessageModal
          instructorUid={currentUid}
          students={rawContacts || []}
          conversations={rawConversations || []}
          onClose={() => setShowBroadcastModal(false)}
        />
      )}
    </aside>
  );
}
