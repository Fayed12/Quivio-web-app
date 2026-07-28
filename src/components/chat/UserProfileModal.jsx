// react
import React, { useEffect } from "react";
import { createPortal } from "react-dom";

// react-icons
import { FiX, FiMail, FiUser, FiCheckCircle, FiShield } from "react-icons/fi";

// local styling
import styles from "./UserProfileModal.module.css";

export default function UserProfileModal({ user, onClose }) {
  const portalRoot = document.getElementById("popup-modal") || document.body;

  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!user) return null;

  const { full_name, email, role, avatar_url, is_active } = user;

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

  const modalContent = (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.headerBanner}>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close user details modal"
          >
            <FiX />
          </button>
        </div>

        <div className={styles.profileBody}>
          <div className={styles.avatarWrapper}>
            {avatar_url ? (
              <img
                src={avatar_url}
                alt={full_name || "User"}
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
              className={styles.statusIndicator}
              style={{
                backgroundColor: is_active !== false ? "var(--color-success, #16A34A)" : "var(--text-muted, #94A3B8)"
              }}
              title={is_active !== false ? "Active now" : "Offline"}
            />
          </div>

          <h3 className={styles.fullName}>{full_name || "User Details"}</h3>

          <div
            className={`${styles.roleBadge} ${
              role === "instructor" ? styles.roleInstructor : styles.roleStudent
            }`}
          >
            <FiShield size={12} />
            <span>{role || "Participant"}</span>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <FiMail className={styles.infoIcon} />
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Email Address</span>
                <span className={styles.infoValue}>{email || "Not specified"}</span>
              </div>
            </div>

            <div className={styles.infoRow}>
              <FiUser className={styles.infoIcon} />
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>User Role</span>
                <span className={styles.infoValue} style={{ textTransform: "capitalize" }}>
                  {role || "User"}
                </span>
              </div>
            </div>

            <div className={styles.infoRow}>
              <FiCheckCircle className={styles.infoIcon} style={{ color: "var(--color-success, #16A34A)" }} />
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Status</span>
                <span className={styles.infoValue}>
                  {is_active !== false ? "Active & Linked" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalRoot);
}
