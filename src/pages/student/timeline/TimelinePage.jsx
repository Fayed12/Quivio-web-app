// react
import { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

// date-fns
import {
    format,
    formatDistanceToNow,
    isToday,
    isYesterday,
    isThisWeek} from "date-fns";

// react-icons
import {
    FiActivity,
    FiClock,
    FiCheckCircle,
    FiXCircle,
    FiAward,
    FiBookmark,
    FiArrowRight,
    FiCalendar
} from "react-icons/fi";

// redux
import { fetchMyAttempts, selectMyAttempts } from "../../../redux/slices/attemptsSlice";
import { fetchMyAchievements, selectEarnedAchievements } from "../../../redux/slices/achievementsSlice";
import { fetchStudentAssignments, selectStudentAssignments } from "../../../redux/slices/assignmentsSlice";
import { fetchMyBookmarks, selectBookmarks } from "../../../redux/slices/bookmarksSlice";

// gsap
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

// local
import styles from "./TimelinePage.module.css";

const EMPTY_ARRAY = [];

const TimelinePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const containerRef = useRef(null);

    const rawAttempts = useSelector(selectMyAttempts);
    const rawAchievements = useSelector(selectEarnedAchievements);
    const rawAssignments = useSelector(selectStudentAssignments);
    const rawBookmarks = useSelector(selectBookmarks);

    const attempts = useMemo(() => rawAttempts || EMPTY_ARRAY, [rawAttempts]);
    const achievements = useMemo(() => rawAchievements || EMPTY_ARRAY, [rawAchievements]);
    const assignments = useMemo(() => rawAssignments || EMPTY_ARRAY, [rawAssignments]);
    const bookmarks = useMemo(() => rawBookmarks || EMPTY_ARRAY, [rawBookmarks]);

    const [filterCategory, setFilterCategory] = useState("all");

    // GSAP Entrance animation
    usePageAnimation(containerRef, {
        ready: true,
        staggerSelector: `.${styles.timelineItem}`
    });

    useEffect(() => {
        dispatch(fetchMyAttempts({ page: 1, pageSize: 50 }));
        dispatch(fetchMyAchievements());
        dispatch(fetchStudentAssignments({ page: 1, pageSize: 20 }));
        dispatch(fetchMyBookmarks());
    }, [dispatch]);

    // Build Unified Chronological Stream
    const timelineEvents = useMemo(() => {
        const events = [];

        // 1. Quiz Attempts
        attempts.forEach((att) => {
            if (att.submitted_at) {
                events.push({
                    id: `att-${att.id}`,
                    category: "attempts",
                    timestamp: new Date(att.submitted_at),
                    title: `Attempted Quiz: ${att.quiz?.title || "Quiz"}`,
                    description: `Scored ${att.score}% • ${att.correct_count ?? 0}/${att.total_questions ?? 0} correct answers`,
                    passed: att.passed,
                    score: att.score,
                    xp: att.xp_earned || (att.passed ? 50 : 10),
                    quizId: att.quiz?.id,
                    attemptId: att.id
                });
            }
        });

        // 2. Achievements Unlocked
        achievements.forEach((ach) => {
            const rawDate = ach.earned_at || ach.created_at || "2026-01-01T00:00:00.000Z";
            events.push({
                id: `ach-${ach.id}`,
                category: "achievements",
                timestamp: new Date(rawDate),
                title: `Badge Unlocked: ${ach.badge?.name || ach.title || "Achievement"}`,
                description: ach.badge?.description || "Milestone reached!",
                icon: <FiAward />
            });
        });

        // 3. Room Assignments Received
        assignments.forEach((asg) => {
            if (asg.created_at) {
                events.push({
                    id: `asg-${asg.id}`,
                    category: "assignments",
                    timestamp: new Date(asg.created_at),
                    title: `New Assignment: ${asg.quiz?.title || "Assigned Quiz"}`,
                    description: asg.note || `Due date: ${asg.due_date ? format(new Date(asg.due_date), "MMM d, h:mm a") : "Open schedule"}`,
                    quizId: asg.quiz?.id
                });
            }
        });

        // 4. Bookmarks Added
        bookmarks.forEach((bm) => {
            if (bm.created_at) {
                events.push({
                    id: `bm-${bm.id}`,
                    category: "bookmarks",
                    timestamp: new Date(bm.created_at),
                    title: `Bookmarked Quiz: ${bm.quiz?.title || "Quiz"}`,
                    description: `Saved for offline practice and revision`,
                    quizId: bm.quiz?.id
                });
            }
        });

        // Sort descending by timestamp
        return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [attempts, achievements, assignments, bookmarks]);

    // Group Timeline Events by Date Bucket
    const groupedEvents = useMemo(() => {
        const filtered = timelineEvents.filter((ev) => {
            if (filterCategory === "all") return true;
            return ev.category === filterCategory;
        });

        const groups = {
            today: [],
            yesterday: [],
            thisWeek: [],
            earlier: []
        };

        filtered.forEach((ev) => {
            if (isToday(ev.timestamp)) {
                groups.today.push(ev);
            } else if (isYesterday(ev.timestamp)) {
                groups.yesterday.push(ev);
            } else if (isThisWeek(ev.timestamp, { weekStartsOn: 0 })) {
                groups.thisWeek.push(ev);
            } else {
                groups.earlier.push(ev);
            }
        });

        return groups;
    }, [timelineEvents, filterCategory]);

    const renderEventCard = (ev) => {
        const isAttempt = ev.category === "attempts";
        const isAchievement = ev.category === "achievements";
        const isAssignment = ev.category === "assignments";

        return (
            <div key={ev.id} className={styles.timelineItem}>
                <div
                    className={`${styles.nodeIcon} ${
                        isAttempt
                            ? styles.nodeIconAttempt
                            : isAchievement
                            ? styles.nodeIconAchievement
                            : isAssignment
                            ? styles.nodeIconAssignment
                            : styles.nodeIconBookmark
                    }`}
                >
                    {isAttempt ? (
                        ev.passed ? <FiCheckCircle /> : <FiXCircle />
                    ) : isAchievement ? (
                        <FiAward />
                    ) : isAssignment ? (
                        <FiCalendar />
                    ) : (
                        <FiBookmark />
                    )}
                </div>

                <div className={styles.itemCard}>
                    <div className={styles.itemMeta}>
                        <div className={styles.itemTitleRow}>
                            <span className={styles.itemTitle}>{ev.title}</span>
                            {isAttempt && (
                                <span
                                    className={`${styles.badgePill} ${
                                        ev.passed ? styles.badgePassed : styles.badgeFailed
                                    }`}
                                >
                                    {ev.passed ? "Passed" : "Needs Retake"}
                                </span>
                            )}
                            {ev.xp && (
                                <span className={`${styles.badgePill} ${styles.badgeXp}`}>
                                    +{ev.xp} XP
                                </span>
                            )}
                        </div>

                        <p className={styles.itemDesc}>{ev.description}</p>
                        <span className={styles.timestamp}>
                            {formatDistanceToNow(ev.timestamp, { addSuffix: true })} •{" "}
                            {format(ev.timestamp, "h:mm a")}
                        </span>
                    </div>

                    {ev.quizId && (
                        <button
                            className={styles.actionBtn}
                            onClick={() => {
                                if (ev.attemptId) {
                                    navigate(`/student/quiz/${ev.quizId}/results/${ev.attemptId}`);
                                } else {
                                    navigate(`/student/quizzes/${ev.quizId}`);
                                }
                            }}
                        >
                            {ev.attemptId ? "View Results" : "Open Quiz"} <FiArrowRight />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.container} ref={containerRef}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleArea}>
                    <h1 className={styles.pageTitle}>
                        <span className={styles.titleIcon}><FiActivity /></span>
                        Activity Timeline
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Complete chronological record of all quiz attempts, achievements, room assignments, and study milestones.
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className={styles.controlsCard}>
                <div className={styles.filterTabs}>
                    <button
                        className={`${styles.tabBtn} ${filterCategory === "all" ? styles.tabBtnActive : ""}`}
                        onClick={() => setFilterCategory("all")}
                    >
                        All Activity ({timelineEvents.length})
                    </button>
                    <button
                        className={`${styles.tabBtn} ${filterCategory === "attempts" ? styles.tabBtnActive : ""}`}
                        onClick={() => setFilterCategory("attempts")}
                    >
                        Quiz Attempts ({attempts.length})
                    </button>
                    <button
                        className={`${styles.tabBtn} ${filterCategory === "achievements" ? styles.tabBtnActive : ""}`}
                        onClick={() => setFilterCategory("achievements")}
                    >
                        Badges Unlocked ({achievements.length})
                    </button>
                    <button
                        className={`${styles.tabBtn} ${filterCategory === "assignments" ? styles.tabBtnActive : ""}`}
                        onClick={() => setFilterCategory("assignments")}
                    >
                        Assignments ({assignments.length})
                    </button>
                    <button
                        className={`${styles.tabBtn} ${filterCategory === "bookmarks" ? styles.tabBtnActive : ""}`}
                        onClick={() => setFilterCategory("bookmarks")}
                    >
                        Saved Bookmarks ({bookmarks.length})
                    </button>
                </div>
            </div>

            {/* Vertical Timeline Stream */}
            <div className={styles.timelineWrapper}>
                <div className={styles.timelineLine} />

                {groupedEvents.today.length > 0 && (
                    <div className={styles.timeGroup}>
                        <span className={styles.groupLabel}>
                            <FiClock /> Today
                        </span>
                        {groupedEvents.today.map(renderEventCard)}
                    </div>
                )}

                {groupedEvents.yesterday.length > 0 && (
                    <div className={styles.timeGroup}>
                        <span className={styles.groupLabel}>
                            <FiClock /> Yesterday
                        </span>
                        {groupedEvents.yesterday.map(renderEventCard)}
                    </div>
                )}

                {groupedEvents.thisWeek.length > 0 && (
                    <div className={styles.timeGroup}>
                        <span className={styles.groupLabel}>
                            <FiClock /> Earlier This Week
                        </span>
                        {groupedEvents.thisWeek.map(renderEventCard)}
                    </div>
                )}

                {groupedEvents.earlier.length > 0 && (
                    <div className={styles.timeGroup}>
                        <span className={styles.groupLabel}>
                            <FiClock /> Previous History
                        </span>
                        {groupedEvents.earlier.map(renderEventCard)}
                    </div>
                )}

                {timelineEvents.length === 0 && (
                    <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "60px 0" }}>
                        No activity records found yet. Start taking quizzes to populate your timeline!
                    </p>
                )}
            </div>
        </div>
    );
};

export default TimelinePage;
