// react
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";

// react-icons
import {
  FiX,
  FiMail,
  FiUser,
  FiCheckCircle,
  FiShield,
  FiZap,
  FiAward,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";

// services & helpers
import { getProfileById } from "../../services/profilesService";
import { getAvatarUrl } from "../../utils/avatarUtils";
import styles from "./UserProfileModal.module.css";

export default function UserProfileModal({ user, onClose }) {
  const portalRoot = document.getElementById("popup-modal") || document.body;
  const [profileDetails, setProfileDetails] = useState(null);

  const uid = user?.uid || user?.id;

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

  // Fetch full profile details (XP, level, streak, etc.)
  useEffect(() => {
    let isMounted = true;
    if (!uid) return;

    getProfileById(uid)
      .then((res) => {
        if (!isMounted) return;
        if (res && !res.error && res.data) {
          setProfileDetails(res.data);
        } else {
          setProfileDetails(null);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch profile details:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [uid]);

  if (!user) return null;

  const merged = { ...user, ...profileDetails };
  const { full_name, email, role, is_active, level, xp, streak, longest_streak, created_at } = merged;

  const joinedFormatted = created_at ? dayjs(created_at).format("MMMM YYYY") : "Member";

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
            <img
              src={getAvatarUrl(merged)}
              alt={full_name || "User"}
              className={styles.avatar}
            />
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

          {/* Gamified Stats Summary Bar - Displayed for students only */}
          {role !== "instructor" && (
            <div className={styles.statsSummaryGrid}>
              <div className={styles.statCard}>
                <div className={`${styles.statIconWrapper} ${styles.levelIconBg}`}>
                  <FiAward size={18} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>Lvl {level ?? 1}</span>
                  <span className={styles.statLabel}>Level</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIconWrapper} ${styles.xpIconBg}`}>
                  <FiZap size={18} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{xp ?? 0}</span>
                  <span className={styles.statLabel}>Total XP</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIconWrapper} ${styles.streakIconBg}`}>
                  <FiTrendingUp size={18} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{streak ?? 0}d</span>
                  <span className={styles.statLabel}>Streak</span>
                </div>
              </div>
            </div>
          )}

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
              <FiCalendar className={styles.infoIcon} />
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Member Since</span>
                <span className={styles.infoValue}>{joinedFormatted}</span>
              </div>
            </div>

            {role !== "instructor" && longest_streak !== undefined && longest_streak !== null && (
              <div className={styles.infoRow}>
                <FiTrendingUp className={styles.infoIcon} style={{ color: "#F59E0B" }} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Longest Streak Record</span>
                  <span className={styles.infoValue}>{longest_streak} Days</span>
                </div>
              </div>
            )}

            <div className={styles.infoRow}>
              <FiCheckCircle className={styles.infoIcon} style={{ color: "var(--color-success, #16A34A)" }} />
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Status</span>
                <span className={styles.infoValue}>
                  {is_active !== false ? "Active & Connected" : "Offline"}
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
