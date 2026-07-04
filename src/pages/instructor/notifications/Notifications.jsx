// local components
import PageHeader from "../components/PageHeader";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./Notifications.module.css";

// react
import { useState, useEffect, useRef } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";
import { 
    fetchMyAnnouncements, 
    selectAnnouncements, 
    createAnnouncementThunk, 
    deleteAnnouncementThunk 
} from "../../../redux/slices/announcementsSlice";
import { fetchMyRooms, selectMyRooms } from "../../../redux/slices/roomsSlice";

// gsap
import { gsap } from "gsap";

// react-icons
import { 
    FiPlus, 
    FiX, 
    FiVolume2, 
    FiBell, 
    FiCalendar, 
    FiSend, 
    FiInfo, 
    FiTrash2,
    FiCheckCircle,
    FiMessageSquare,
    FiGlobe,
    FiClock
} from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

// supabase client
import { supabase } from "../../../services/config/supabaseClient";

const Notifications = () => {
    const dispatch = useDispatch();

    // Redux selectors
    const announcements = useSelector(selectAnnouncements);
    const rooms = useSelector(selectMyRooms);

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

    // System Alert / Feed Mock
    const [systemAlerts, setSystemAlerts] = useState([
        { id: 1, type: "quiz_attempt", text: "Ahmed Samir submitted React Basics quiz", time: "10 mins ago", unread: true },
        { id: 2, type: "student_join", text: "Sara Mohamed joined Classroom Web Design", time: "1 hour ago", unread: true },
        { id: 3, type: "quiz_attempt", text: "Ali Kamel passed CSS Flexbox with 95%", time: "3 hours ago", unread: false },
        { id: 4, type: "system", text: "New backup generated successfully", time: "1 day ago", unread: false }
    ]);

    const containerRef = useRef(null);
    const modalRef = useRef(null);

    // Initial load
    useEffect(() => {
        dispatch(fetchMyAnnouncements());
        dispatch(fetchMyRooms());
    }, [dispatch]);

    // GSAP animations
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(containerRef.current,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
            );
        }, containerRef);
        return () => ctx.revert();
    }, [activeTab]);

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
            scheduled_for: isScheduled && scheduledFor ? new Date(scheduledFor).toISOString() : null
        };

        try {
            await dispatch(createAnnouncementThunk(payload)).unwrap();
            toast.success(
                payload.scheduled_for 
                    ? "Announcement scheduled successfully!" 
                    : "Announcement broadcasted immediately!"
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

    const handleDeleteAnnouncement = async (annId) => {
        if (!confirm("Are you sure you want to delete this scheduled announcement?")) return;

        try {
            await dispatch(deleteAnnouncementThunk(annId)).unwrap();
            toast.success("Scheduled announcement deleted!");
            dispatch(fetchMyAnnouncements());
        } catch (err) {
            toast.error(err || "Cannot delete already-sent announcements");
        }
    };

    const handleMarkAllRead = () => {
        setSystemAlerts(prev => prev.map(a => ({ ...a, unread: false })));
        toast.info("All system alerts marked as read.");
    };

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Page Header */}
            <PageHeader 
                title="Broadcasts & Logs"
                subtitle="Create announcements, notify classrooms, and monitor system alerts."
                breadcrumbs={["Broadcasts"]}
                actions={
                    <MainButton onClick={() => setIsCreateOpen(true)} variant="primary">
                        <FiPlus /> Send Announcement
                    </MainButton>
                }
            />

            {/* Navigation Tabs */}
            <div className={styles.tabsRow}>
                {["announcements", "logs"].map(tab => (
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
                        <div key={ann.id} className={styles.annCard} data-status={ann.status}>
                            <div className={styles.annHeader}>
                                <div className={styles.annTitleGroup}>
                                    <span className={styles.annIcon}>
                                        <FiVolume2 />
                                    </span>
                                    <h4>{ann.title}</h4>
                                </div>
                                <div className={styles.annMeta}>
                                    <span className={`${styles.statusChip} ${ann.status === "sent" ? styles.chipSent : styles.chipSched}`}>
                                        {ann.status}
                                    </span>
                                    <span className={styles.annScope}>
                                        {ann.scope === "all" ? "All Classrooms" : `Room: ${ann.room?.name || "Classroom"}`}
                                    </span>
                                    {ann.status === "scheduled" && (
                                        <button 
                                            className={styles.deleteBtn}
                                            onClick={() => handleDeleteAnnouncement(ann.id)}
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
                            <p>Announcements allow you to broadcast custom messages directly to specific rooms or all students. Click "+ Send Announcement" to create one.</p>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: SYSTEM LOGS */}
            {activeTab === "logs" && (
                <div className={styles.logsCard}>
                    <div className={styles.logsHeader}>
                        <h3>Recent System Alerts</h3>
                        <MainButton onClick={handleMarkAllRead} variant="ghost" size="sm">
                            Mark all as read
                        </MainButton>
                    </div>

                    <div className={styles.logsFeed}>
                        {systemAlerts.map((alert) => (
                            <div key={alert.id} className={styles.logItem} data-unread={alert.unread}>
                                <span className={styles.logIcon}>
                                    {alert.type === "quiz_attempt" && <FiCheckCircle style={{color: "var(--color-success)"}} />}
                                    {alert.type === "student_join" && <FiGlobe style={{color: "var(--color-accent)"}} />}
                                    {alert.type === "system" && <FiInfo style={{color: "var(--color-info)"}} />}
                                </span>
                                <div className={styles.logBody}>
                                    <p className={styles.logText}>{alert.text}</p>
                                    <span className={styles.logTime}>{alert.time}</span>
                                </div>
                                {alert.unread && <span className={styles.unreadDot} />}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* BROADCAST ANNOUNCEMENT MODAL */}
            {isCreateOpen && (
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
                            <button type="button" className={styles.closeBtn} onClick={() => setIsCreateOpen(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Title */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Announcement Title <span className={styles.req}>*</span></label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Exam postponement notification"
                                    className={styles.input}
                                    maxLength={200}
                                    required
                                />
                            </div>

                            {/* Recipient scope */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Audience Scope</label>
                                <select value={scope} onChange={(e) => setScope(e.target.value)} className={styles.select}>
                                    <option value="all">Broadcast to All Students</option>
                                    <option value="room">Limit to Specific Classroom</option>
                                </select>
                            </div>

                            {/* Classroom list dropdown (only if scope is room) */}
                            {scope === "room" && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Select Target Classroom <span className={styles.req}>*</span></label>
                                    <select 
                                        value={roomId} 
                                        onChange={(e) => setRoomId(e.target.value)}
                                        className={styles.select}
                                        required
                                    >
                                        <option value="">Choose classroom...</option>
                                        {rooms.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Message content */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Message Content <span className={styles.req}>*</span></label>
                                <textarea 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
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
                                    <label className={styles.toggleLabel}>Schedule Publication</label>
                                    <p className={styles.toggleDesc}>Broadcast message automatically at a future date and time.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={isScheduled}
                                    onChange={(e) => setIsScheduled(e.target.checked)}
                                    className={styles.toggleSwitch}
                                />
                            </div>

                            {isScheduled && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Release Date & Time</label>
                                    <input 
                                        type="datetime-local" 
                                        value={scheduledFor}
                                        onChange={(e) => setScheduledFor(e.target.value)}
                                        className={styles.input}
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <MainButton onClick={() => setIsCreateOpen(false)} variant="secondary">
                                Cancel
                            </MainButton>
                            <MainButton type="submit" variant="primary">
                                {isScheduled ? "Schedule" : "Send Announcement"}
                            </MainButton>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Notifications;
