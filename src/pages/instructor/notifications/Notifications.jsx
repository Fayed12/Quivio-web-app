// local components
import PageHeader from "../components/PageHeader";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./Notifications.module.css";
import { useNotificationsData } from "../../../hooks/instructor/useNotificationsData";

// react
import { useState, useRef } from "react";

// redux
import { useDispatch } from "react-redux";
import {
    fetchMyAnnouncements,
    createAnnouncementThunk,
    deleteAnnouncementThunk,
} from "../../../redux/slices/announcementsSlice";
import { markAllAsReadThunk } from "../../../redux/slices/notificationsSlice";

// animation
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";
import ModalPortal from "../components/ModalPortal";

// react-icons
import {
    FiPlus,
    FiX,
    FiVolume2,
    FiInfo,
    FiTrash2,
    FiCheckCircle,
    FiMessageSquare,
    FiGlobe,
    FiClock,
} from "react-icons/fi";

import { formatDistanceToNow } from "date-fns";

// react-toastify
import { toast } from "react-toastify";

// sweetalert2
import Swal from "sweetalert2";

// custom select
import CustomSelect from "../../../components/ui/select/CustomSelect";

const Notifications = () => {
    const dispatch = useDispatch();

    // Use custom hook
    const { announcements, rooms, systemLogs } = useNotificationsData();

    // Tab states
    const [activeTab, setActiveTab] = useState("announcements");

    // Modal state
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form states
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [scope, setScope] = useState("all"); // all or room
    const [roomId, setRoomId] = useState("");
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledFor, setScheduledFor] = useState("");

    // Tracks local read alerts override
    const [readAlertIds, setReadAlertIds] = useState(new Set());

    const formatRelativeTime = (date) => {
        if (!date) return "";
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true });
        } catch (err) {
            console.error("Error formatting date with date-fns", err);
            return "";
        }
    };

    const containerRef = useRef(null);
    const modalRef = useRef(null);

    // Page entrance animation
    usePageAnimation(containerRef);

    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            toast.error("Title and Message are required");
            return;
        }

        if (scope === "room" && !roomId) {
            toast.error("Please select a target Classroom");
            return;
        }

        const payload = {
            title,
            message,
            scope,
            room_id: scope === "room" ? roomId : null,
            scheduled_for:
                isScheduled && scheduledFor
                    ? new Date(scheduledFor).toISOString()
                    : null,
        };

        try {
            await dispatch(createAnnouncementThunk(payload)).unwrap();
            toast.success(
                payload.scheduled_for
                    ? "Announcement scheduled successfully!"
                    : "Announcement broadcasted immediately!",
            );
            setIsCreateOpen(false);
            setTitle("");
            setMessage("");
            setScope("all");
            setRoomId("");
            setIsScheduled(false);
            setScheduledFor("");
            dispatch(fetchMyAnnouncements());
        } catch (err) {
            toast.error(err || "Failed to broadcast announcement");
        }
    };

    const handleDeleteAnnouncement = (annId) => {
        const isDark = document.documentElement.classList.contains("dark");
        Swal.fire({
            title: "Delete Scheduled Announcement?",
            text: "Are you sure you want to delete this scheduled announcement?",
            icon: "warning",
            background: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            showCancelButton: true,
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "var(--color-danger, #ef4444)",
            cancelButtonColor: isDark ? "#475569" : "#94a3b8",
            customClass: {
                popup: "premium-swal-popup",
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await dispatch(deleteAnnouncementThunk(annId)).unwrap();
                    toast.success("Scheduled announcement deleted!");
                    dispatch(fetchMyAnnouncements());
                } catch (err) {
                    toast.error(
                        err || "Cannot delete already-sent announcements",
                    );
                }
            }
        });
    };

    const handleMarkAllRead = async () => {
        try {
            await dispatch(markAllAsReadThunk()).unwrap();
            setReadAlertIds(new Set(systemLogs.map(a => a.id)));
            toast.info("All system alerts marked as read.");
        } catch (err) {
            console.error("Failed to mark alerts as read:", err);
            toast.error("Failed to mark all alerts as read");
        }
    };

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Page Header */}
            <PageHeader
                title="Broadcasts & Logs"
                subtitle="Create announcements, notify classrooms, and monitor system alerts."
                breadcrumbs={["Broadcasts"]}
                actions={
                    <MainButton
                        onClick={() => setIsCreateOpen(true)}
                        variant="primary"
                    >
                        <FiPlus /> Send Announcement
                    </MainButton>
                }
            />

            {/* Navigation Tabs */}
            <div className={styles.tabsRow}>
                {["announcements", "logs"].map((tab) => (
                    <button
                        key={tab}
                        className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === "announcements" && "Announcements"}
                        {tab === "logs" && "System Logs & Alerts"}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT: ANNOUNCEMENTS */}
            {activeTab === "announcements" && (
                <div className={styles.announcementsList}>
                    {announcements.map((ann) => (
                        <div
                            key={ann.id}
                            className={styles.annCard}
                            data-status={ann.status}
                        >
                            <div className={styles.annHeader}>
                                <div className={styles.annTitleGroup}>
                                    <span className={styles.annIcon}>
                                        <FiVolume2 />
                                    </span>
                                    <h4>{ann.title}</h4>
                                </div>
                                <div className={styles.annMeta}>
                                    <span
                                        className={`${styles.statusChip} ${ann.status === "sent" ? styles.chipSent : styles.chipSched}`}
                                    >
                                        {ann.status}
                                    </span>
                                    <span className={styles.annScope}>
                                        {ann.scope === "all"
                                            ? "All Classrooms"
                                            : `Room: ${ann.room?.name || "Classroom"}`}
                                    </span>
                                    {ann.status === "scheduled" && (
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() =>
                                                handleDeleteAnnouncement(ann.id)
                                            }
                                            title="Delete Scheduled Announcement"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className={styles.annMessage}>{ann.message}</p>
                            <div className={styles.annFooter}>
                                <FiClock />
                                <span>
                                    {ann.status === "sent"
                                        ? `Sent on ${new Date(ann.sent_at).toLocaleString()}`
                                        : `Scheduled for ${new Date(ann.scheduled_for).toLocaleString()}`}
                                </span>
                            </div>
                        </div>
                    ))}
                    {announcements.length === 0 && (
                        <div className={styles.emptyState}>
                            <FiMessageSquare className={styles.emptyIcon} />
                            <h3>No Announcements sent yet</h3>
                            <p>
                                Announcements allow you to broadcast custom
                                messages directly to specific rooms or all
                                students. Click "+ Send Announcement" to create
                                one.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: SYSTEM LOGS */}
            {activeTab === "logs" && (
                <div className={styles.logsCard}>
                    <div className={styles.logsHeader}>
                        <h3>Recent System Alerts</h3>
                        <MainButton
                            onClick={handleMarkAllRead}
                            variant="ghost"
                            size="sm"
                        >
                            Mark all as read
                        </MainButton>
                    </div>

                    <div className={styles.logsFeed}>
                        {(systemLogs || []).map((alert) => {
                            const isUnread = alert.unread && !readAlertIds.has(alert.id);
                            return (
                                <div
                                    key={alert.id}
                                    className={styles.logItem}
                                    data-unread={isUnread}
                                >
                                    <span className={styles.logIcon}>
                                        {alert.type === "quiz_attempt" && (
                                            <FiCheckCircle
                                                style={{
                                                    color: "var(--color-success)",
                                                }}
                                            />
                                        )}
                                        {alert.type === "student_join" && (
                                            <FiGlobe
                                                style={{
                                                    color: "var(--color-accent)",
                                                }}
                                            />
                                        )}
                                        {alert.type === "system" && (
                                            <FiInfo
                                                style={{
                                                    color: "var(--color-info)",
                                                }}
                                            />
                                        )}
                                    </span>
                                    <div className={styles.logBody}>
                                        <p className={styles.logText}>
                                            {alert.text}
                                        </p>
                                        <span className={styles.logTime}>
                                            {formatRelativeTime(alert.date)}
                                        </span>
                                    </div>
                                    {isUnread && (
                                        <span className={styles.unreadDot} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* BROADCAST ANNOUNCEMENT MODAL */}
            {isCreateOpen && (
                <ModalPortal onClose={() => setIsCreateOpen(false)}>
                    <div
                        className={styles.modalOverlay}
                        onClick={() => setIsCreateOpen(false)} // Close on outside click
                    >
                        <form
                            className={styles.modal}
                            ref={modalRef}
                            onClick={(e) => e.stopPropagation()} // Prevent bubble
                            onSubmit={handleCreateAnnouncement}
                        >
                            <div className={styles.modalHeader}>
                                <h3>Broadcast New Announcement</h3>
                                <button
                                    type="button"
                                    className={styles.closeBtn}
                                    onClick={() => setIsCreateOpen(false)}
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className={styles.modalBody}>
                                {/* Title */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Announcement Title{" "}
                                        <span className={styles.req}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) =>
                                            setTitle(e.target.value)
                                        }
                                        placeholder="e.g. Exam postponement notification"
                                        className={styles.input}
                                        maxLength={200}
                                        required
                                    />
                                </div>

                                {/* Recipient scope */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Audience Scope
                                    </label>
                                    <CustomSelect
                                        options={[
                                            {
                                                value: "all",
                                                label: "Broadcast to All Students",
                                            },
                                            {
                                                value: "room",
                                                label: "Limit to Specific Classroom",
                                            },
                                        ]}
                                        value={scope}
                                        onChange={setScope}
                                    />
                                </div>

                                {/* Classroom list dropdown (only if scope is room) */}
                                {scope === "room" && (
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>
                                            Select Target Classroom{" "}
                                            <span className={styles.req}>
                                                *
                                            </span>
                                        </label>
                                        <CustomSelect
                                            options={rooms.map((r) => ({
                                                value: r.id,
                                                label: r.name,
                                            }))}
                                            value={roomId}
                                            onChange={setRoomId}
                                            placeholder="Choose classroom..."
                                        />
                                    </div>
                                )}

                                {/* Message content */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Message Content{" "}
                                        <span className={styles.req}>*</span>
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) =>
                                            setMessage(e.target.value)
                                        }
                                        placeholder="Write your announcement details here..."
                                        rows={4}
                                        className={styles.textarea}
                                        required
                                    />
                                </div>

                                <div className={styles.divider} />

                                {/* Scheduling check */}
                                <div className={styles.toggleRow}>
                                    <div>
                                        <label className={styles.toggleLabel}>
                                            Schedule Publication
                                        </label>
                                        <p className={styles.toggleDesc}>
                                            Broadcast message automatically at a
                                            future date and time.
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isScheduled}
                                        onChange={(e) =>
                                            setIsScheduled(e.target.checked)
                                        }
                                        className={styles.toggleSwitch}
                                    />
                                </div>

                                {isScheduled && (
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>
                                            Release Date & Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={scheduledFor}
                                            onChange={(e) =>
                                                setScheduledFor(e.target.value)
                                            }
                                            className={styles.input}
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            <div className={styles.modalFooter}>
                                <MainButton
                                    onClick={() => setIsCreateOpen(false)}
                                    variant="secondary"
                                >
                                    Cancel
                                </MainButton>
                                <MainButton type="submit" variant="primary">
                                    {isScheduled
                                        ? "Schedule"
                                        : "Send Announcement"}
                                </MainButton>
                            </div>
                        </form>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default Notifications;
