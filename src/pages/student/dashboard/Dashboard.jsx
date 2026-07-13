// react
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

// date-fns
import { format, isSameDay, formatDistanceToNow } from "date-fns";

// redux
import { selectProfile } from "../../../redux/slices/authSlice";
import { fetchMyStats, fetchMyAttempts, selectMyStats, selectMyAttempts } from "../../../redux/slices/attemptsSlice";
import { fetchStudentAssignments, selectStudentAssignments } from "../../../redux/slices/assignmentsSlice";
import { fetchMyAchievements, selectEarnedAchievements } from "../../../redux/slices/achievementsSlice";
import { selectMyRooms } from "../../../redux/slices/roomsSlice";

// components
import MainButton from "../../../components/ui/button/MainButton";

// react-icons
import {
    FiAward,
    FiBookOpen,
    FiCheckCircle,
    FiClock,
    FiZap,
    FiLock,
    FiSmile,
    FiPlay,
    FiTarget,
    FiTrendingUp,
    FiCalendar,
    FiShield,
    FiCompass,
    FiStar,
    FiRotateCw
} from "react-icons/fi";

const achievementIconMap = {
    first_quiz: <FiPlay style={{ color: "var(--blue-500)" }} />,
    perfect_score: <FiTarget style={{ color: "var(--color-accent)" }} />,
    fast_completion: <FiZap style={{ color: "var(--orange-500)" }} />,
    top_performer: <FiTrendingUp style={{ color: "var(--violet-500)" }} />,
    streak_3: <FiCalendar style={{ color: "var(--green-500)" }} />,
    streak_7: <FiCalendar style={{ color: "var(--green-600)" }} />,
    streak_30: <FiCalendar style={{ color: "var(--green-700)" }} />,
    century: <FiShield style={{ color: "var(--blue-600)" }} />,
    explorer: <FiCompass style={{ color: "var(--violet-600)" }} />,
    perfect_10: <FiStar style={{ color: "var(--color-accent)" }} />,
    quiz_master: <FiAward style={{ color: "var(--violet-500)" }} />,
    comeback_kid: <FiRotateCw style={{ color: "var(--orange-600)" }} />
};

// local
import styles from "./Dashboard.module.css";
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

const StudentDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const profile = useSelector(selectProfile);
    const rooms = useSelector(selectMyRooms);
    const stats = useSelector(selectMyStats);
    const attempts = useSelector(selectMyAttempts) || [];
    const assignments = useSelector(selectStudentAssignments) || [];
    const achievements = useSelector(selectEarnedAchievements) || [];

    const isLimited = rooms.length === 0;

    const containerRef = useRef(null);

    // GSAP Entrance animation
    usePageAnimation(containerRef, {
        ready: !!profile,
        staggerSelector: `.${styles.card}`
    });

    useEffect(() => {
        if (profile?.uid) {
            dispatch(fetchMyStats());
            dispatch(fetchMyAttempts({ page: 1, pageSize: 20 }));
            dispatch(fetchStudentAssignments({ page: 1, pageSize: 10 }));
            dispatch(fetchMyAchievements());
        }
    }, [profile, dispatch]);

    // Time-based greeting helper
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    // Calculate category averages from attempts
    const getCategoryPerformance = () => {
        const completedAttempts = attempts.filter(a => a.status === "completed" && a.quiz?.category);
        const categoriesMap = {};
        completedAttempts.forEach(a => {
            const cat = a.quiz.category;
            if (!categoriesMap[cat.name]) {
                categoriesMap[cat.name] = { totalScore: 0, count: 0 };
            }
            categoriesMap[cat.name].totalScore += a.score ?? 0;
            categoriesMap[cat.name].count += 1;
        });

        return Object.entries(categoriesMap).map(([name, val]) => ({
            name,
            score: Math.round(val.totalScore / val.count)
        }));
    };

    const categoryPerformance = getCategoryPerformance();

    // Streak Calendar helper (last 7 days)
    const getStreakCalendar = () => {
        const result = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const label = d.toLocaleDateString(undefined, { weekday: "narrow" });
            const dateStr = d.toDateString();
            
            const active = attempts.some(a => {
                if (!a.submitted_at) return false;
                return isSameDay(new Date(a.submitted_at), d);
            });

            result.push({ label, active, key: i });
        }
        return result;
    };

    const streakCalendar = getStreakCalendar();

    // Format time elapsed
    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return "";
        return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    };

    // Level Title helper based on XP
    const getLevelTitle = (lvl) => {
        if (lvl < 5) return "Novice";
        if (lvl < 10) return "Scholar";
        if (lvl < 15) return "Savant";
        return "Sage";
    };

    // Calculate XP Progress metrics
    const currentLevel = profile?.level || 1;
    const currentXp = profile?.xp || 0;
    // Simple quadratic threshold for next levels
    const getThreshold = (lvl) => lvl * 100 + (lvl - 1) * 200;
    const prevThreshold = currentLevel === 1 ? 0 : getThreshold(currentLevel - 1);
    const nextThreshold = getThreshold(currentLevel);
    const xpInLevel = currentXp - prevThreshold;
    const xpNeededForNext = nextThreshold - prevThreshold;
    const xpPercentage = Math.min(100, Math.max(0, (xpInLevel / xpNeededForNext) * 100));

    if (isLimited) {
        return (
            <div ref={containerRef} className={styles.dashboardContainer}>
                <div className={styles.welcomeCard}>
                    <div className={styles.lockIcon} role="img" aria-label="Lock">
                        <FiLock style={{ color: "var(--color-danger, #ef4444)" }} />
                    </div>
                    <h1 className="h1">Welcome, {profile?.full_name || "Student"}!</h1>
                    <p className="text-secondary" style={{ maxWidth: "450px" }}>
                        Your account is ready, but you haven't been added to a class room yet. Please contact your instructor to get started.
                    </p>
                    <div className="stats-row" style={{ width: "100%", marginTop: "2rem" }}>
                        <div className={styles.card}>
                            <span className={styles.limitedPlaceholder}>—</span>
                            <span className="text-xs text-muted">Total Quizzes Taken</span>
                        </div>
                        <div className={styles.card}>
                            <span className={styles.limitedPlaceholder}>—</span>
                            <span className="text-xs text-muted">Average Score</span>
                        </div>
                        <div className={styles.card}>
                            <span className={styles.limitedPlaceholder}>—</span>
                            <span className="text-xs text-muted">Best Score</span>
                        </div>
                        <div className={styles.card}>
                            <span className={styles.limitedPlaceholder}>—</span>
                            <span className="text-xs text-muted">Current Streak</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={styles.dashboardContainer}>
            {/* Personalized Header */}
            <div className="flex justify-between items-center" style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-4)" }}>
                <div>
                    <h1 className="h1">
                        {getGreeting()}, {profile?.full_name?.split(" ")[0]}{" "}
                        <FiSmile style={{ color: "var(--color-warning, #f59e0b)", display: "inline-block", verticalAlign: "middle" }} />
                    </h1>
                    <p className="text-sm text-secondary">
                        {format(new Date(), "EEEE, MMMM d, yyyy")}
                    </p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className={styles.card}>
                    <div className="flex items-center gap-3">
                        <div style={{ background: "var(--blue-50)", padding: "10px", borderRadius: "50%", display: "flex" }}>
                            <FiBookOpen style={{ color: "var(--blue-600)" }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="h2">{stats?.total_attempts || 0}</span>
                            <span className="text-xs text-muted">Total Quizzes Taken</span>
                        </div>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className="flex items-center gap-3">
                        <div style={{ background: "var(--green-50)", padding: "10px", borderRadius: "50%", display: "flex" }}>
                            <FiCheckCircle style={{ color: "var(--green-600)" }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="h2">{stats?.avg_score ? `${Math.round(stats.avg_score)}%` : "0%"}</span>
                            <span className="text-xs text-muted">Average Score</span>
                        </div>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className="flex items-center gap-3">
                        <div style={{ background: "var(--violet-50)", padding: "10px", borderRadius: "50%", display: "flex" }}>
                            <FiAward style={{ color: "var(--violet-600)" }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="h2">{stats?.best_score ? `${Math.round(stats.best_score)}%` : "0%"}</span>
                            <span className="text-xs text-muted">Best Score</span>
                        </div>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className="flex items-center gap-3">
                        <div style={{ background: "var(--orange-50)", padding: "10px", borderRadius: "50%", display: "flex" }}>
                            <FiZap style={{ color: "var(--orange-600)" }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="h2" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                {profile?.streak || 0} days{" "}
                                <FiZap style={{ color: "var(--orange-500)", display: "inline-block" }} />
                            </span>
                            <span className="text-xs text-muted">Current Streak</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className={styles.dashboardGrid}>
                {/* Left Column */}
                <div className="flex flex-col gap-6">
                    {/* Assigned Quizzes Pending */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>
                            <span>Assigned Quizzes Pending</span>
                            {assignments.length > 0 && (
                                <span className={styles.scoreBadge} style={{ background: "var(--blue-50)", color: "var(--blue-700)" }}>
                                    {assignments.length} pending
                                </span>
                            )}
                        </div>
                        <div className={styles.assignedList}>
                            {assignments.length === 0 ? (
                                <p className="text-sm text-muted">No pending quizzes assigned to you.</p>
                            ) : (
                                assignments.map(a => {
                                    const isOverdue = a.due_date && new Date(a.due_date) < new Date();
                                    return (
                                        <div key={a.id} className={styles.assignedItemRow}>
                                            <div className={styles.assignedInfo}>
                                                <div className={styles.quizIcon}><FiBookOpen /></div>
                                                <div className="flex flex-col">
                                                    <span className={styles.quizName}>{a.quiz?.title}</span>
                                                    <span className={styles.assignedMeta}>
                                                        Due: {a.due_date ? format(new Date(a.due_date), "PP") : "No deadline"}
                                                        {isOverdue && (
                                                            <span className="scoreBadge scoreFail" style={{ marginLeft: "var(--space-2)" }}>Overdue</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <MainButton
                                                variant="primary"
                                                size="sm"
                                                onClick={() => navigate(`/student/quizzes/${a.quiz?.id}`)}
                                            >
                                                Start Quiz →
                                            </MainButton>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Recent Activity</div>
                        <div className={styles.activityList}>
                            {attempts.length === 0 ? (
                                <p className="text-sm text-muted">You haven't taken any quizzes yet.</p>
                            ) : (
                                attempts.slice(0, 5).map(a => (
                                    <div key={a.id} className={styles.activityItemRow}>
                                        <div className={styles.activityInfo}>
                                            <div className={styles.quizIcon}><FiClock /></div>
                                            <div className="flex flex-col">
                                                <span className={styles.quizName}>{a.quiz?.title}</span>
                                                <span className={styles.activityMeta}>{formatTimeAgo(a.submitted_at || a.started_at)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`${styles.scoreBadge} ${a.passed ? styles.scorePass : styles.scoreFail}`}>
                                                {Math.round(a.score ?? 0)}% {a.passed ? "Passed" : "Failed"}
                                            </span>
                                            <MainButton
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate(`/student/quiz/${a.quiz?.id}/results/${a.id}`)}
                                            >
                                                View
                                            </MainButton>
                                        </div>
                                    </div>
                                ))
                            )}
                            {attempts.length > 5 && (
                                <button
                                    onClick={() => navigate("/student/attempts")}
                                    className="btn btn--ghost-accent btn--sm"
                                    style={{ alignSelf: "center", marginTop: "var(--space-2)" }}
                                >
                                    View all attempts →
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Performance by Category */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Performance by Category</div>
                        <div className="flex flex-col gap-4">
                            {categoryPerformance.length === 0 ? (
                                <p className="text-sm text-muted">No category insights available yet.</p>
                            ) : (
                                categoryPerformance.map(cat => {
                                    const fillCol = cat.score < 50 
                                        ? "var(--color-danger)" 
                                        : cat.score < 75 
                                            ? "var(--color-warning)" 
                                            : "var(--color-success)";
                                    return (
                                        <div key={cat.name} className={styles.categoryItem}>
                                            <div className={styles.categoryHeader}>
                                                <span className="text-secondary">{cat.name}</span>
                                                <span className="font-semibold">{cat.score}%</span>
                                            </div>
                                            <div className={styles.progressBar}>
                                                <div 
                                                    className={styles.progressFill} 
                                                    style={{ width: `${cat.score}%`, background: fillCol }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-6">
                    {/* XP & Level Card */}
                    <div className={`${styles.card} ${styles.xpCard}`}>
                        <div className="flex justify-between items-center">
                            <span className="h3" style={{ color: "var(--color-xp)" }}>
                                Level {currentLevel}
                            </span>
                            <span className={styles.xpText}>{currentXp} XP</span>
                        </div>
                        <div className="text-xs text-secondary" style={{ marginTop: "-8px" }}>
                            {getLevelTitle(currentLevel)}
                        </div>
                        <div className={styles.xpProgressBar}>
                            <div className={styles.xpProgressFill} style={{ width: `${xpPercentage}%` }} />
                        </div>
                        <div className="text-xs text-muted">
                            {Math.max(0, nextThreshold - currentXp)} XP to Level {currentLevel + 1}
                        </div>
                    </div>

                    {/* Streak Widget */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>
                            <span>Streak Widget</span>
                            <span style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "4px" }}>
                                <FiZap style={{ color: "var(--orange-500)" }} /> {profile?.streak || 0}
                            </span>
                        </div>
                        <div className={styles.streakCalendar}>
                            {streakCalendar.map(day => (
                                <div key={day.key} className={styles.streakDotContainer}>
                                    <div className={`${styles.streakDot} ${day.active ? styles.streakDotActive : ""}`}>
                                        {day.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="text-xs text-muted" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--space-3)", marginTop: "var(--space-2)" }}>
                            Longest streak: <strong className="text-primary">{profile?.longest_streak || 0} days</strong>
                        </div>
                    </div>

                    {/* Recent Achievements */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Recent Achievements</div>
                        <div className="flex flex-col gap-3">
                            {achievements.length === 0 ? (
                                <p className="text-sm text-muted">Complete quizzes to unlock achievements!</p>
                            ) : (
                                achievements.slice(0, 3).map(ach => (
                                    <div key={ach.id} className={styles.achievementItemRow}>
                                        <span className={styles.achievementIcon}>
                                            {achievementIconMap[ach.achievement?.code] || <FiAward style={{ color: "var(--color-accent)" }} />}
                                        </span>
                                        <div className={styles.achievementDetails}>
                                            <span className={styles.achievementName}>{ach.achievement?.name}</span>
                                            <span className={`${styles.achievementTier} ${styles[ach.achievement?.tier || "bronze"]}`}>
                                                {ach.achievement?.tier}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                            {achievements.length > 3 && (
                                <button
                                    onClick={() => navigate("/student/achievements")}
                                    className="btn btn--ghost-accent btn--sm"
                                    style={{ alignSelf: "center", marginTop: "var(--space-2)" }}
                                >
                                    View all achievements →
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
