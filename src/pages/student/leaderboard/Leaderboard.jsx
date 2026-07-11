// react
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// redux
import {
    fetchGlobalLeaderboard,
    fetchMonthlyLeaderboard,
    fetchCategoryLeaderboard,
    fetchMyPosition,
    selectGlobalLeaderboard,
    selectMonthlyLeaderboard,
    selectCategoryLeaderboard,
} from "../../../redux/slices/leaderboardSlice";
import { fetchCategories, selectCategories } from "../../../redux/slices/categoriesSlice";
import { selectProfile } from "../../../redux/slices/authSlice";

// react-icons
import { FiSearch } from "react-icons/fi";

// gsap
import { gsap } from "gsap";

// local
import styles from "./Leaderboard.module.css";
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

const Leaderboard = () => {
    const dispatch = useDispatch();

    const currentProfile = useSelector(selectProfile);
    const globalBoard = useSelector(selectGlobalLeaderboard) || [];
    const monthlyBoard = useSelector(selectMonthlyLeaderboard) || [];
    const categoryBoard = useSelector(selectCategoryLeaderboard) || [];
    const categories = useSelector(selectCategories) || [];

    const containerRef = useRef(null);
    const podiumRef = useRef(null);

    // States
    const [activeTab, setActiveTab] = useState("global"); // "global" | "monthly" | "category"
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Entrance Animation
    usePageAnimation(containerRef, {
        ready: globalBoard.length > 0
    });

    useEffect(() => {
        dispatch(fetchGlobalLeaderboard());
        dispatch(fetchMonthlyLeaderboard());
        dispatch(fetchMyPosition());
        dispatch(fetchCategories());
    }, [dispatch]);

    useEffect(() => {
        if (activeTab === "category" && selectedCategoryId) {
            dispatch(fetchCategoryLeaderboard({ categoryId: selectedCategoryId }));
        }
    }, [activeTab, selectedCategoryId, dispatch]);

    // Set first category when loading categories
    useEffect(() => {
        if (categories.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(categories[0].id);
        }
    }, [categories, selectedCategoryId]);

    // Select correct list based on active tab
    const getActiveLeaderboard = () => {
        if (activeTab === "global") return globalBoard;
        if (activeTab === "monthly") return monthlyBoard;
        if (activeTab === "category") return categoryBoard;
        return [];
    };

    const activeLeaderboard = getActiveLeaderboard();

    // GSAP Podium columns animation
    useEffect(() => {
        if (activeLeaderboard.length > 0) {
            const ctx = gsap.context(() => {
                gsap.from(`.${styles.podiumBar}`, {
                    scaleY: 0,
                    transformOrigin: "bottom",
                    duration: 1,
                    stagger: 0.1,
                    ease: "power2.out"
                });
                
                // Floating medals
                gsap.to(`.${styles.crownIcon}`, {
                    y: -4,
                    repeat: -1,
                    yoyo: true,
                    duration: 1.5,
                    ease: "sine.inOut"
                });
            }, podiumRef);
            return () => ctx.revert();
        }
    }, [activeLeaderboard, activeTab]);

    // Filter list by search query
    const filteredLeaderboard = activeLeaderboard.filter(entry => {
        if (!searchQuery) return true;
        const name = entry.profile?.full_name || entry.full_name || "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Extract Top 3 Podium
    const podiumList = activeLeaderboard.slice(0, 3);
    // Rearrange as: 2nd, 1st, 3rd for correct podium alignment
    const orderedPodium = [];
    if (podiumList[1]) orderedPodium.push({ ...podiumList[1], rank: 2 });
    if (podiumList[0]) orderedPodium.push({ ...podiumList[0], rank: 1 });
    if (podiumList[2]) orderedPodium.push({ ...podiumList[2], rank: 3 });

    // Table List (ranks 4+)
    const tableList = filteredLeaderboard.slice(3);

    // Current student sticky banner stats
    const getMyCurrentRankDetails = () => {
        if (!currentProfile) return null;
        // Search current student in active leaderboard list
        const myIndex = activeLeaderboard.findIndex(entry => entry.uid === currentProfile.uid);
        if (myIndex === -1) return null;
        
        const myRank = myIndex + 1;
        const myEntry = activeLeaderboard[myIndex];

        // Distance to next rank (if not first)
        let nextRankDistance = null;
        if (myIndex > 0) {
            const nextEntry = activeLeaderboard[myIndex - 1];
            nextRankDistance = (nextEntry.xp || nextEntry.total_xp || 0) - (myEntry.xp || myEntry.total_xp || 0);
        }

        return {
            rank: myRank,
            xp: myEntry.xp || myEntry.total_xp || 0,
            distance: nextRankDistance
        };
    };

    const myRankDetails = getMyCurrentRankDetails();

    return (
        <div ref={containerRef} className={styles.leaderboardContainer}>
            {/* Page Header */}
            <div style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-4)" }}>
                <h1 className="h1">Leaderboard</h1>
                <p className="text-sm text-secondary">See how you rank against other students globally, monthly, or by category.</p>
            </div>

            {/* Tabs Header */}
            <div className={styles.tabsRow}>
                <div className={styles.tabsList}>
                    <button
                        onClick={() => setActiveTab("global")}
                        className={`${styles.tabBtn} ${activeTab === "global" ? styles.tabBtnActive : ""}`}
                    >
                        Global
                    </button>
                    <button
                        onClick={() => setActiveTab("monthly")}
                        className={`${styles.tabBtn} ${activeTab === "monthly" ? styles.tabBtnActive : ""}`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setActiveTab("category")}
                        className={`${styles.tabBtn} ${activeTab === "category" ? styles.tabBtnActive : ""}`}
                    >
                        Category
                    </button>
                </div>

                {activeTab === "category" && categories.length > 0 && (
                    <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className={styles.categorySelect}
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Podium (Top 3) */}
            {activeLeaderboard.length > 0 && (
                <div ref={podiumRef} className={styles.podiumContainer}>
                    {orderedPodium.map(entry => {
                        const isFirst = entry.rank === 1;
                        const isSecond = entry.rank === 2;
                        
                        const barClass = isFirst
                            ? `${styles.podiumBar} ${styles.goldBar}`
                            : isSecond
                                ? `${styles.podiumBar} ${styles.silverBar}`
                                : `${styles.podiumBar} ${styles.bronzeBar}`;
                        const borderColor = isFirst ? "#F59E0B" : isSecond ? "#94A3B8" : "#B45309";

                        const name = entry.profile?.full_name || entry.full_name || "Student";
                        const avatar = entry.profile?.avatar_url || entry.avatar_url || "https://api.dicebear.com/7.x/adventurer/svg?seed=Quivio";

                        return (
                            <div key={entry.uid} className={styles.podiumColumn}>
                                {isFirst && <div className={styles.crownIcon}>👑</div>}
                                {!isFirst && <div className={styles.crownIcon} style={{ visibility: "hidden" }}>🥇</div>}
                                <img
                                    src={avatar}
                                    alt={name}
                                    className={styles.podiumAvatar}
                                    style={{ borderColor: borderColor }}
                                />
                                <div className={barClass}>
                                    <span>#{entry.rank}</span>
                                </div>
                                <div className={styles.podiumName}>{name}</div>
                                <div className={styles.podiumXp}>{entry.xp || entry.total_xp || 0} XP</div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Search and Table */}
            <div className={styles.tableCard}>
                <div className={styles.searchBarRow}>
                    <FiSearch style={{ position: "absolute", left: "10px", color: "var(--text-muted)" }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search student name..."
                        className={styles.searchInput}
                    />
                </div>

                {activeLeaderboard.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                        No leaderboard entries found.
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.leaderboardTable}>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Student</th>
                                    <th>XP</th>
                                    <th>Quizzes Done</th>
                                    <th>Streak</th>
                                    <th>Trend</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableList.map((entry, idx) => {
                                    const rankNum = idx + 4;
                                    const name = entry.profile?.full_name || entry.full_name || "Student";
                                    const avatar = entry.profile?.avatar_url || entry.avatar_url || "https://api.dicebear.com/7.x/adventurer/svg?seed=Quivio";
                                    const isMe = entry.uid === currentProfile?.uid;

                                    return (
                                        <tr 
                                            key={entry.uid}
                                            className={isMe ? styles.highlightRow : ""}
                                        >
                                            <td className="font-semibold">#{rankNum}</td>
                                            <td className={styles.studentCell}>
                                                <img src={avatar} alt={name} className={styles.avatar} />
                                                <span className="font-medium">{name}</span>
                                            </td>
                                            <td className="font-semibold">{entry.xp || entry.total_xp || 0}</td>
                                            <td>{entry.quizzes_completed || entry.quizzes_taken || 0}</td>
                                            <td>🔥 {entry.profile?.streak || entry.streak || 0}d</td>
                                            <td>
                                                <span style={{ color: "var(--color-success)" }}>▲</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Current Student Sticky Banner */}
            {myRankDetails && myRankDetails.rank > 3 && (
                <div className={styles.stickyBanner}>
                    <div className="flex items-center gap-3">
                        <strong style={{ fontSize: "var(--text-lg)" }}>#{myRankDetails.rank}</strong>
                        <span>(You) {currentProfile?.full_name}</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <strong>{myRankDetails.xp} XP</strong>
                        {myRankDetails.distance !== null && (
                            <span className="text-xs" style={{ background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "var(--radius-sm)" }}>
                                {myRankDetails.distance} XP to next rank
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
