// react
import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";

// react-icons
import { FiX, FiSend, FiUsers, FiSearch, FiCheckSquare, FiSquare } from "react-icons/fi";
import { toast } from "react-toastify";

// redux
import { useDispatch } from "react-redux";
import { fetchConversations } from "../../redux/slices/chatSlice";

// services & helpers
import { getOrCreateConversation, sendMessage } from "../../services/chatService";
import { getAvatarUrl } from "../../utils/avatarUtils";
import styles from "./BroadcastMessageModal.module.css";

export default function BroadcastMessageModal({
  instructorUid,
  students = [],
  conversations = [],
  onClose,
}) {
  const dispatch = useDispatch();
  const portalRoot = document.getElementById("popup-modal") || document.body;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentUids, setSelectedStudentUids] = useState([]);
  const [messageContent, setMessageContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSending && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSending]);

  // Strictly filter input list to ensure only student contacts are listed
  const myStudentsOnly = useMemo(() => {
    return (students || []).filter((s) => s.role === "student" || s.role !== "instructor");
  }, [students]);

  // Filter students list by search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return myStudentsOnly;
    const term = searchTerm.toLowerCase();
    return myStudentsOnly.filter((s) => {
      const name = s.full_name?.toLowerCase() || "";
      const email = s.email?.toLowerCase() || "";
      return name.includes(term) || email.includes(term);
    });
  }, [myStudentsOnly, searchTerm]);

  // Toggle single student selection
  const handleToggleStudent = (uid) => {
    setSelectedStudentUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  // Select all or deselect all
  const handleToggleSelectAll = () => {
    if (selectedStudentUids.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentUids([]);
    } else {
      setSelectedStudentUids(filteredStudents.map((s) => s.uid || s.id));
    }
  };

  // Handle Multi-Send Broadcast
  const handleSendBroadcast = async () => {
    if (selectedStudentUids.length === 0) {
      toast.warning("Please select at least one student.");
      return;
    }
    if (!messageContent.trim()) {
      toast.warning("Please enter a message to send.");
      return;
    }

    setIsSending(true);
    const count = selectedStudentUids.length;
    const toastId = toast.loading(`Sending message to ${count} student${count > 1 ? "s" : ""}...`);

    try {
      // Loop through selected students and send direct message
      for (const studentUid of selectedStudentUids) {
        let targetConvoId = null;

        // 1. Check if an active conversation already exists in Redux conversations
        const existingConvo = (conversations || []).find(
          (c) =>
            (c.otherUser && (c.otherUser.uid === studentUid || c.otherUser.id === studentUid)) ||
            c.user1_uid === studentUid ||
            c.user2_uid === studentUid
        );

        if (existingConvo && existingConvo.id) {
          targetConvoId = existingConvo.id;
        } else {
          // 2. Fallback: check Supabase DB for existing row or create new conversation
          const convo = await getOrCreateConversation(instructorUid, studentUid);
          targetConvoId = convo.id;
        }

        if (targetConvoId) {
          await sendMessage(targetConvoId, instructorUid, messageContent.trim());
        }
      }

      toast.update(toastId, {
        render: `Successfully sent message to ${count} student${count > 1 ? "s" : ""}!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      // Refresh conversations list in Redux
      dispatch(fetchConversations(instructorUid));
      onClose();
    } catch (err) {
      console.error("Broadcast send error:", err);
      toast.update(toastId, {
        render: err.message || "Failed to send broadcast message.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsSending(false);
    }
  };

  const isAllSelected =
    filteredStudents.length > 0 && selectedStudentUids.length === filteredStudents.length;

  const modalContent = (
    <div className={styles.backdrop} onClick={() => !isSending && onClose()}>
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleGroup}>
            <div className={styles.iconWrapper}>
              <FiSend size={20} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>Broadcast Message to Students</h3>
              <p className={styles.modalSubtitle}>
                Select specific students to send a direct message simultaneously.
              </p>
            </div>
          </div>

          <button
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isSending}
            aria-label="Close modal"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* Section 1: Student Selection */}
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <FiUsers size={14} /> 1. Select Recipients ({selectedStudentUids.length} selected)
            </span>
            <button
              type="button"
              className={styles.selectAllBtn}
              onClick={handleToggleSelectAll}
              disabled={isSending || filteredStudents.length === 0}
            >
              {isAllSelected ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isSending}
            />
          </div>

          <div className={styles.studentsList}>
            {filteredStudents.length === 0 ? (
              <div className={styles.emptyList}>No students found matching your search.</div>
            ) : (
              filteredStudents.map((s) => {
                const uid = s.uid || s.id;
                const isChecked = selectedStudentUids.includes(uid);
                return (
                  <div
                    key={uid}
                    className={`${styles.studentItem} ${isChecked ? styles.studentItemSelected : ""}`}
                    onClick={() => !isSending && handleToggleStudent(uid)}
                  >
                    <div className={styles.checkboxWrapper}>
                      {isChecked ? (
                        <FiCheckSquare className={styles.checkboxIconChecked} />
                      ) : (
                        <FiSquare className={styles.checkboxIcon} />
                      )}
                    </div>
                    <img
                      src={getAvatarUrl(s)}
                      alt={s.full_name || "Student"}
                      className={styles.studentAvatar}
                    />
                    <div className={styles.studentInfo}>
                      <span className={styles.studentName}>{s.full_name || "Student"}</span>
                      <span className={styles.studentEmail}>{s.email || "No email"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Section 2: Message Content */}
          <div className={styles.sectionHeader} style={{ marginTop: "16px" }}>
            <span className={styles.sectionTitle}>
              <FiSend size={14} /> 2. Message Content
            </span>
            <span className={styles.charCount}>{messageContent.length}/1000</span>
          </div>

          <textarea
            className={styles.messageTextarea}
            placeholder="Write your announcement or message here..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            maxLength={1000}
            rows={4}
            disabled={isSending}
          />
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.sendBtn}
            onClick={handleSendBroadcast}
            disabled={isSending || selectedStudentUids.length === 0 || !messageContent.trim()}
          >
            <FiSend size={16} />
            <span>
              {isSending
                ? "Sending..."
                : `Send to ${selectedStudentUids.length} Student${
                    selectedStudentUids.length !== 1 ? "s" : ""
                  }`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalRoot);
}
