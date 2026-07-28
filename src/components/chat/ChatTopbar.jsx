// react
import React, { useState } from "react";

// react-icons
import { FiArrowLeft, FiMoreVertical, FiInfo, FiUser } from "react-icons/fi";

// components
import UserProfileModal from "./UserProfileModal";

// styling
import styles from "./ChatTopbar.module.css";

export default function ChatTopbar({ partnerUser, onBackMobile }) {
  const [showProfileModal, setShowProfileModal] = useState(false);

  if (!partnerUser) return null;

  const { full_name, email, role, avatar_url, is_active } = partnerUser;

  const getAvatarColor = (name = "") => {
    const char = name.trim().charAt(0).toUpperCase();
    if (char >= "A" && char <= "E") return "var(--blue-600, #2563EB)";
    if (char >= "F" && char <= "J") return "var(--violet-600, #7C3AED)";
    if (char >= "K" && char <= "O") return "var(--teal-600, #0D9488)";
    if (char >= "P" && char <= "T") return "var(--amber-600, #D97706)";
    return "var(--green-600, #16A34A)";
  };

  const initial = (full_name || email || "U").charAt(0).toUpperCase();
  const bgAvatarColor = getAvatarColor(full_name || email);

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
              {avatar_url ? (
                <img
                  src={avatar_url}
                  alt={full_name || "User avatar"}
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
