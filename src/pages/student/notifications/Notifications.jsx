// react
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

// redux
import {
    fetchMyNotifications,
    markAsReadThunk,
    markAllAsReadThunk,
    deleteNotifThunk,
    selectNotifications
} from "../../../redux/slices/notificationsSlice";

// components
import MainButton from "../../../components/ui/button/MainButton";
import { toast } from "react-toastify";

// react-icons
import {
    FiBell,
    FiCheckSquare,
    FiTrash2,
} from "react-icons/fi";

// local
import styles from "./Notifications.module.css";
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

const Notifications = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const notifications = useSelector(selectNotifications) || [];
    const containerRef = useRef(null);

    const [activeFilter, setActiveFilter] = useState("all"); // all | unread | read

    // Entrance Animation
    usePageAnimation(containerRef, {
        ready: notifications.length > 0
    });

    useEffect(() => {
        dispatch(fetchMyNotifications());
    }, [dispatch]);

    // Handle single notification click
    const handleNotifClick = (n) => {
        if (!n.read_at) {
            dispatch(markAsReadThunk(n.id));
        }

        // Routing logic
        if (n.quiz_id) {
            navigate(`/student/quizzes/${n.quiz_id}`);
        } else if (n.type === "assignment_reminder") {
            navigate("/student/quizzes");
        }
    };

    const handleDeleteNotif = (e, id) => {
        e.stopPropagation();
        dispatch(deleteNotifThunk(id));
        toast.info("Notification deleted.");
    };

    const handleMarkAllRead = () => {
        dispatch(markAllAsReadThunk());
        toast.success("All notifications marked as read.");
    };

    // Filters
    const filteredNotifs = notifications.filter(n => {
        if (activeFilter === "unread") return !n.read_at;
        if (activeFilter === "read") return !!n.read_at;
        return true;
    });

    // Date Grouping Helper
    const groupNotificationsByDate = (items) => {
        const today = [];
        const yesterday = [];
        const older = [];

        const todayStr = new Date().toDateString();
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toDateString();

        items.forEach(item => {
            const date = new Date(item.created_at);
            const dateStr = date.toDateString();

            if (dateStr === todayStr) {
                today.push(item);
            } else if (dateStr === yesterdayStr) {
                yesterday.push(item);
            } else {
                older.push(item);
            }
        });

        return { today, yesterday, older };
    };

    const grouped = groupNotificationsByDate(filteredNotifs);

    const renderNotifRow = (n) => {
        const isUnread = !n.read_at;
        return (
            <div
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={`${styles.notificationRow} ${isUnread ? styles.unreadRow : ""}`}
            >
                <div className={styles.notifLeft}>
                    {isUnread && <span className={styles.dot} />}
                    <div className={styles.contentCol}>
                        <span className={styles.title}>{n.title}</span>
                        <span className={styles.body}>{n.body}</span>
                        <span className={styles.time}>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                </div>
                <div className={styles.actionsCol}>
                    <button
                        onClick={(e) => handleDeleteNotif(e, n.id)}
                        className={styles.deleteBtn}
                        title="Delete notification"
                    >
                        <FiTrash2 />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Header */}
            <div className="flex justify-between items-center" style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-4)" }}>
                <div>
                    <h1 className="h1">Notifications</h1>
                    <p className="text-sm text-secondary">Stay updated with classroom assignment releases and reminders.</p>
                </div>
                {notifications.some(n => !n.read_at) && (
                    <MainButton
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllRead}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                        <FiCheckSquare /> Mark all as read
                    </MainButton>
                )}
            </div>

            {/* Filter toolbar */}
            <div className={styles.filtersRow}>
                <div className={styles.filterList}>
                    <button
                        onClick={() => setActiveFilter("all")}
                        className={`${styles.filterBtn} ${activeFilter === "all" ? styles.filterBtnActive : ""}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setActiveFilter("unread")}
                        className={`${styles.filterBtn} ${activeFilter === "unread" ? styles.filterBtnActive : ""}`}
                    >
                        Unread
                    </button>
                    <button
                        onClick={() => setActiveFilter("read")}
                        className={`${styles.filterBtn} ${activeFilter === "read" ? styles.filterBtnActive : ""}`}
                    >
                        Read
                    </button>
                </div>
                <span className="text-xs text-muted">
                    Total: {filteredNotifs.length}
                </span>
            </div>

            {/* List with Grouping */}
            {filteredNotifs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                    <FiBell style={{ fontSize: "3rem", color: "var(--text-muted)", marginBottom: "var(--space-3)" }} />
                    <h3 className="h3">No notifications found</h3>
                    <p className="text-sm text-secondary">You're all caught up!</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {grouped.today.length > 0 && (
                        <div className={styles.sectionGroup}>
                            <h4 className={styles.sectionHeader}>Today</h4>
                            {grouped.today.map(renderNotifRow)}
                        </div>
                    )}
                    {grouped.yesterday.length > 0 && (
                        <div className={styles.sectionGroup}>
                            <h4 className={styles.sectionHeader}>Yesterday</h4>
                            {grouped.yesterday.map(renderNotifRow)}
                        </div>
                    )}
                    {grouped.older.length > 0 && (
                        <div className={styles.sectionGroup}>
                            <h4 className={styles.sectionHeader}>Older</h4>
                            {grouped.older.map(renderNotifRow)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Notifications;
