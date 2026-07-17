// react
import { useEffect, useRef, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

// components
import CustomSelect from "../../../components/ui/select/CustomSelect";

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
import { FaCrown, FaMedal, FaFire } from "react-icons/fa";

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
    const categoriesData = useSelector(selectCategories);
    const categories = useMemo(() => categoriesData || [], [categoriesData]);

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
            const firstId = categories[0].id;
            const timer = setTimeout(() => {
                setSelectedCategoryId(firstId);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [categories, selectedCategoryId]);

    // Select correct list based on active tab
    const getActiveLeaderboard = () => {
        const board = activeTab === "global" ? globalBoard
                    : activeTab === "monthly" ? monthlyBoard
                    : activeTab === "category" ? categoryBoard
                    : [];

        return board.map((entry, index) => {
            let xp = 0;
            if (activeTab === "global") {
                xp = entry.global_score ?? entry.profile?.xp ?? entry.xp ?? 0;
            } else if (activeTab === "monthly") {
                xp = entry.global_score ?? entry.profile?.xp ?? entry.xp ?? 0;
            } else if (activeTab === "category") {
                xp = entry.global_score ?? entry.profile?.xp ?? entry.xp ?? 0;
            }

            const quizzes_completed = entry.quizzes_passed ?? entry.total_attempts ?? entry.attempt_count ?? entry.quizzes_completed ?? 0;
            const streak = entry.current_streak ?? entry.profile?.streak ?? entry.streak ?? 0;

            return {
                ...entry,
                xp,
                quizzes_completed,
                streak,
                rank: index + 1
            };
        });
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

    // Table List (show all ranks in the table)
    const tableList = filteredLeaderboard;

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
                    <CustomSelect
                        options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                        value={selectedCategoryId}
                        onChange={(val) => setSelectedCategoryId(val)}
                        placeholder="Select category..."
                        className={styles.categorySelectWrapper}
                    />
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
                                {isFirst && <div className={styles.crownIcon}><FaCrown style={{ color: "#FBBF24", fontSize: "1.5rem" }} /></div>}
                                {!isFirst && <div className={styles.crownIcon} style={{ visibility: "hidden" }}><FaMedal /></div>}
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
                                    <th>Avg Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableList.map((entry, idx) => {
                                    const rankNum = entry.rank || (idx + 1);
                                    const name = entry.profile?.full_name || entry.full_name || "Student";
                                    const avatar = entry.profile?.avatar_url || entry.avatar_url || "https://api.dicebear.com/7.x/adventurer/svg?seed=Quivio";
                                    const isMe = entry.uid === currentProfile?.uid;

                                    return (
                                        <tr 
                                            key={entry.uid}
                                            className={isMe ? styles.highlightRow : ""}
                                        >
                                            <td className="font-semibold">
                                                {rankNum === 1 ? <FaMedal style={{ color: "#F59E0B", fontSize: "1.1rem" }} />
                                                 : rankNum === 2 ? <FaMedal style={{ color: "#94A3B8", fontSize: "1.1rem" }} />
                                                 : rankNum === 3 ? <FaMedal style={{ color: "#B45309", fontSize: "1.1rem" }} />
                                                 : `#${rankNum}`}
                                            </td>
                                            <td className={styles.studentCell}>
                                                <img src={avatar} alt={name} className={styles.avatar} />
                                                <span className="font-medium">{name}</span>
                                            </td>
                                            <td className="font-semibold">{entry.xp}</td>
                                            <td>{entry.quizzes_completed}</td>
                                            <td>
                                                <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
                                                    <FaFire style={{ color: "#EF4444" }} />
                                                    <span>{entry.streak}d</span>
                                                </div>
                                            </td>
                                            <td className="font-semibold">{entry.avg_score ?? 0}%</td>
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
