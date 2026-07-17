// react
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// redux
import { fetchMyAttempts, fetchMyStats, selectMyAttempts, selectMyStats } from "../../../redux/slices/attemptsSlice";
import { fetchCategories } from "../../../redux/slices/categoriesSlice";
import { selectProfile } from "../../../redux/slices/authSlice";

// components
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, ReferenceLine
} from "recharts";

// react-icons
import {
    FiZap,
    FiAward,
    FiCheckCircle,
    FiActivity,
    FiBookOpen
} from "react-icons/fi";
import { FaCrown } from "react-icons/fa";

// local
import styles from "./ProgressAnalytics.module.css";
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

const ProgressAnalytics = () => {
    const dispatch = useDispatch();

    const profile = useSelector(selectProfile);
    const stats = useSelector(selectMyStats);
    const attempts = useSelector(selectMyAttempts) || [];

    const containerRef = useRef(null);
    const [activeTab, setActiveTab] = useState("overall"); // "overall" | "mastery" | "consistency"

    // Entrance Animation
    usePageAnimation(containerRef, {
        ready: true,
        staggerSelector: "[data-animate]"
    });

    useEffect(() => {
        dispatch(fetchMyAttempts({ page: 1, pageSize: 100 }));
        dispatch(fetchMyStats());
        dispatch(fetchCategories());
    }, [dispatch]);

    // Data structures for Recharts
    const completedAttempts = attempts.filter(a => a.status === "completed");

    // Tab 1: Overall Progression
    const progressionData = [...completedAttempts]
        .reverse()
        .map((a, idx) => ({
            name: `Quiz ${idx + 1}`,
            Score: Math.round(a.score),
            Quiz: a.quiz?.title
        }));

    // Tab 2: Category Mastery
    const getMasteryData = () => {
        const categoryMap = {};
        completedAttempts.forEach(a => {
            if (a.quiz?.category) {
                const cat = a.quiz.category;
                if (!categoryMap[cat.name]) {
                    categoryMap[cat.name] = { name: cat.name, Score: 0, Passing: 70, count: 0 };
                }
                categoryMap[cat.name].Score += a.score ?? 0;
                categoryMap[cat.name].count += 1;
            }
        });
        return Object.values(categoryMap).map(c => ({
            ...c,
            Score: Math.round(c.Score / c.count)
        }));
    };
    
    const masteryChartData = getMasteryData();

    // Tab 3: Study Consistency (last 4 weeks)
    const getStudyConsistency = () => {
        const weeks = { "Week 1": 0, "Week 2": 0, "Week 3": 0, "Week 4": 0 };
        const now = new Date();
        
        completedAttempts.forEach(a => {
            if (a.submitted_at) {
                const date = new Date(a.submitted_at);
                const diffMs = now - date;
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                if (diffDays < 7) weeks["Week 4"] += 1;
                else if (diffDays < 14) weeks["Week 3"] += 1;
                else if (diffDays < 21) weeks["Week 2"] += 1;
                else if (diffDays < 28) weeks["Week 1"] += 1;
            }
        });
        return Object.entries(weeks).map(([name, count]) => ({ name, Quizzes: count }));
    };

    const consistencyData = getStudyConsistency();

    // Level progression stats
    const currentLevel = profile?.level || 1;
    const currentXp = profile?.xp || 0;
    const getThreshold = (lvl) => lvl * 100 + (lvl - 1) * 200;
    const prevThreshold = currentLevel === 1 ? 0 : getThreshold(currentLevel - 1);
    const nextThreshold = getThreshold(currentLevel);
    const xpInLevel = currentXp - prevThreshold;
    const xpNeededForNext = nextThreshold - prevThreshold;
    const xpPercentage = Math.min(100, Math.max(0, (xpInLevel / xpNeededForNext) * 100));

    // Category master status helpers
    const getMasteryStatus = (score) => {
        if (score >= 90) return { label: "Master", icon: <FaCrown style={{ fontSize: "12px" }} />, class: styles.masteryGold };
        if (score >= 75) return { label: "Competent", icon: <FiAward style={{ fontSize: "12px" }} />, class: styles.masterySilver };
        return { label: "Needs Practice", icon: <FiBookOpen style={{ fontSize: "12px" }} />, class: styles.masteryBronze };
    };

    return (
        <div ref={containerRef} className={styles.progressContainer}>
            {/* Page Header */}
            <div data-animate style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-4)" }}>
                <h1 className="h1">Progress & Analytics</h1>
                <p className="text-sm text-secondary">Analyze your learning patterns, quiz score progression, and category mastery logs.</p>
            </div>

            {/* Top Cards Row */}
            <div className={styles.statsGrid}>
                <div data-animate className={`${styles.card} ${styles.levelCard}`}>
                    <div className="flex justify-between items-center">
                        <span className="h4 flex items-center gap-1" style={{ color: "var(--color-xp)", margin: 0 }}>
                            <FiZap /> Level {currentLevel}
                        </span>
                        <span className="text-xs text-secondary">{currentXp} XP</span>
                    </div>
                    <div style={{ height: "8px", background: "var(--violet-100)", borderRadius: "var(--radius-full)", overflow: "hidden", margin: "var(--space-2) 0" }}>
                        <div style={{ width: `${xpPercentage}%`, height: "100%", background: "var(--color-xp)" }} />
                    </div>
                    <span className="text-xs text-muted">{Math.max(0, nextThreshold - currentXp)} XP to next level</span>
                </div>

                <div data-animate className={styles.card}>
                    <div className="flex items-center gap-3">
                        <div style={{ background: "var(--blue-50)", padding: "10px", borderRadius: "50%", display: "flex" }}>
                            <FiCheckCircle style={{ color: "var(--blue-600)" }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="h2">{completedAttempts.length}</span>
                            <span className="text-xs text-muted">Completed Quizzes</span>
                        </div>
                    </div>
                </div>

                <div data-animate className={styles.card}>
                    <div className="flex items-center gap-3">
                        <div style={{ background: "var(--green-50)", padding: "10px", borderRadius: "50%", display: "flex" }}>
                            <FiAward style={{ color: "var(--green-600)" }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="h2">{stats?.avg_score ? `${Math.round(stats.avg_score)}%` : "—"}</span>
                            <span className="text-xs text-muted">Average Score</span>
                        </div>
                    </div>
                </div>

                <div data-animate className={styles.card}>
                    <div className="flex items-center gap-3">
                        <div style={{ background: "var(--orange-50)", padding: "10px", borderRadius: "50%", display: "flex" }}>
                            <FiActivity style={{ color: "var(--orange-600)" }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="h2">{profile?.streak || 0} days</span>
                            <span className="text-xs text-muted">Current Streak</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recharts Analytics Panel */}
            <div data-animate className={styles.card}>
                <div className={styles.tabsHeader}>
                    <button
                        onClick={() => setActiveTab("overall")}
                        className={`${styles.tabBtn} ${activeTab === "overall" ? styles.tabBtnActive : ""}`}
                    >
                        Overall Performance
                    </button>
                    <button
                        onClick={() => setActiveTab("mastery")}
                        className={`${styles.tabBtn} ${activeTab === "mastery" ? styles.tabBtnActive : ""}`}
                    >
                        Category Mastery
                    </button>
                    <button
                        onClick={() => setActiveTab("consistency")}
                        className={`${styles.tabBtn} ${activeTab === "consistency" ? styles.tabBtnActive : ""}`}
                    >
                        Study Consistency
                    </button>
                </div>

                <div className={styles.chartContainer}>
                    {completedAttempts.length === 0 ? (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
                            Complete quizzes to see analytics charts.
                        </div>
                    ) : activeTab === "overall" ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={progressionData}>
                                <defs>
                                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis unit="%" />
                                <Tooltip />
                                <Area type="monotone" dataKey="Score" stroke="var(--color-accent)" fillOpacity={1} fill="url(#scoreColor)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : activeTab === "mastery" ? (
                        masteryChartData.length === 0 ? (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
                                No category insights.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={masteryChartData}
                                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="var(--border-subtle)" />
                                    <XAxis type="number" domain={[0, 100]} stroke="var(--text-secondary)" unit="%" />
                                    <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" width={90} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "var(--bg-surface)",
                                            borderColor: "var(--border-default)",
                                            borderRadius: "var(--radius-md)",
                                            color: "var(--text-primary)"
                                        }}
                                        formatter={(value) => [`${value}%`, 'Your Average Score']}
                                    />
                                    <Bar dataKey="Score" fill="var(--color-accent)" radius={[0, 4, 4, 0]} maxBarSize={24} />
                                    <ReferenceLine
                                        x={70}
                                        stroke="var(--color-danger)"
                                        strokeDasharray="4 4"
                                        label={{
                                            value: 'Passing (70%)',
                                            position: 'top',
                                            fill: 'var(--color-danger)',
                                            fontSize: 10,
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={consistencyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="Quizzes" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Category mastery list cards */}
            <div className="flex flex-col gap-4">
                <h3 data-animate className="h3">Performance by Category</h3>
                
                {masteryChartData.length === 0 ? (
                    <div data-animate className="text-secondary text-sm">No category details found. Complete a quiz to get mastery logs.</div>
                ) : (
                    <div className={styles.categoryGrid}>
                        {masteryChartData.map(cat => {
                            const status = getMasteryStatus(cat.Score);
                            return (
                                <div data-animate key={cat.name} className={styles.categoryCard}>
                                    <div className="flex justify-between items-start">
                                        <h4 className="h5 text-primary" style={{ margin: 0 }}>{cat.name}</h4>
                                        <span className={`${styles.masteryBadge} ${status.class} flex items-center gap-1`}>
                                            {status.icon} <span>{status.label}</span>
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted" style={{ marginTop: "4px" }}>
                                        Quizzes taken: <strong>{cat.count}</strong>
                                    </div>
                                    <div className="flex justify-between items-center" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--space-2)", marginTop: "var(--space-2)" }}>
                                        <span className="text-xs text-secondary">Average Score</span>
                                        <span className="font-semibold" style={{ color: "var(--color-accent)" }}>{cat.Score}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressAnalytics;
