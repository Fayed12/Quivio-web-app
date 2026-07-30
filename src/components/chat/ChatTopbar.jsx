// react
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

// react-icons
import { FiArrowLeft, FiInfo, FiMoreVertical, FiTrash, FiTrash2 } from "react-icons/fi";
import Swal from "sweetalert2";

// components & helpers
import UserProfileModal from "./UserProfileModal";
import { getAvatarUrl } from "../../utils/avatarUtils";
import { clearAllMessagesInConversation, deleteConversation } from "../../redux/slices/chatSlice";

// styling
import styles from "./ChatTopbar.module.css";

export default function ChatTopbar({ partnerUser, activeConversationId, onBackMobile }) {
  const dispatch = useDispatch();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const close = () => setShowMenu(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  if (!partnerUser) return null;

  const { full_name, role, is_active } = partnerUser;

  const handleClearAll = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (!activeConversationId) return;
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
        dispatch(clearAllMessagesInConversation(activeConversationId));
      }
    });
  };

  const handleDeleteConvo = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (!activeConversationId) return;
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
        dispatch(deleteConversation(activeConversationId));
      }
    });
  };

  return (
    <>
      <header className={styles.topbar}>
        <div className={styles.leftSection}>
          {onBackMobile && (
            <button
              className={styles.backButton}
              onClick={onBackMobile}
              title="Back to conversations list"
              aria-label="Back to conversations"
            >
              <FiArrowLeft size={18} />
            </button>
          )}

          <div
            className={styles.userCardClickable}
            onClick={() => setShowProfileModal(true)}
            title="Click to view full user profile details"
          >
            <div className={styles.avatarWrapper}>
              <img
                src={getAvatarUrl(partnerUser)}
                alt={full_name || "User avatar"}
                className={styles.avatar}
              />
              <span
                className={styles.statusDot}
                style={{
                  backgroundColor:
                    is_active !== false ? "var(--color-success, #16A34A)" : "var(--text-muted, #94A3B8)",
                }}
              />
            </div>

            <div className={styles.userInfo}>
              <h4 className={styles.userName}>{full_name || "Chat Partner"}</h4>
              <div className={styles.userMeta}>
                {role && <span className={styles.roleChip}>{role}</span>}
                <span>• {is_active !== false ? "Online" : "Offline"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightSection}>
          <button
            className={styles.actionButton}
            onClick={() => setShowProfileModal(true)}
            title="View User Info"
            aria-label="View User Info"
          >
            <FiInfo size={18} />
          </button>

          {activeConversationId && (
            <div className={styles.menuWrapper} onClick={(e) => e.stopPropagation()}>
              <button
                className={styles.actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((prev) => !prev);
                }}
                title="Conversation Options"
              >
                <FiMoreVertical size={18} />
              </button>

              {showMenu && (
                <div className={styles.topbarDropdown}>
                  <button className={styles.topbarMenuItem} onClick={handleClearAll}>
                    <FiTrash size={14} /> Clear Messages
                  </button>
                  <button
                    className={`${styles.topbarMenuItem} ${styles.topbarMenuItemDanger}`}
                    onClick={handleDeleteConvo}
                  >
                    <FiTrash2 size={14} /> Delete Conversation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {showProfileModal && (
        <UserProfileModal
          user={partnerUser}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
}
