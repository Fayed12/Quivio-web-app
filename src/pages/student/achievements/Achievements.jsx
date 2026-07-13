// react
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

// date-fns
import { format } from "date-fns";

// redux
import {
    fetchAllAchievements,
    fetchMyAchievements,
    selectAllAchievements,
    selectEarnedAchievements,
    selectEarnedIds
} from "../../../redux/slices/achievementsSlice";

// components
import MainButton from "../../../components/ui/button/MainButton";
import { toast } from "react-toastify";

// react-icons
import {
    FiDownload,
    FiAward
} from "react-icons/fi";

// xlsx
import * as XLSX from "xlsx";

// local
import styles from "./Achievements.module.css";
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

const Achievements = () => {
    const dispatch = useDispatch();

    const allAchievements = useSelector(selectAllAchievements) || [];
    const earnedAchievements = useSelector(selectEarnedAchievements) || [];
    const earnedIds = useSelector(selectEarnedIds) || new Set();

    const containerRef = useRef(null);

    // Entrance Animation
    usePageAnimation(containerRef, {
        ready: allAchievements.length > 0
    });

    useEffect(() => {
        dispatch(fetchAllAchievements());
        dispatch(fetchMyAchievements());
    }, [dispatch]);

    // Handle excel download
    const handleExportExcel = () => {
        if (earnedAchievements.length === 0) {
            toast.warn("No achievements unlocked yet to export.");
            return;
        }

        const data = earnedAchievements.map((ea, idx) => ({
            "No.": idx + 1,
            "Achievement Name": ea.achievement?.name || "N/A",
            "Description": ea.achievement?.description || "N/A",
            "Tier": (ea.achievement?.tier || "Bronze").toUpperCase(),
            "XP Earned": ea.achievement?.xp_reward || 0,
            "Date Unlocked": format(new Date(ea.earned_at), "PP")
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "My Achievements");
        XLSX.writeFile(workbook, "quivio_unlocked_achievements.xlsx");
        toast.success("Achievements logs exported successfully!");
    };

    // Math metrics
    const totalCount = allAchievements.length;
    const earnedCount = earnedAchievements.length;
    const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

    // Helper to get tier class
    const getTierClass = (tier) => {
        switch (tier?.toLowerCase()) {
            case "bronze": return styles.bronzeBadge;
            case "silver": return styles.silverBadge;
            case "gold": return styles.goldBadge;
            case "platinum": return styles.platinumBadge;
            default: return styles.bronzeBadge;
        }
    };

    return (
        <div ref={containerRef} className={styles.achievementsContainer}>
            {/* Header */}
            <div className="flex justify-between items-center" style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-4)" }}>
                <div>
                    <h1 className="h1">Achievements</h1>
                    <p className="text-sm text-secondary">Earn achievements by completing quizzes, setting high streaks, and leveling up.</p>
                </div>
                <MainButton
                    variant="outline"
                    size="md"
                    onClick={handleExportExcel}
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                    <FiDownload /> Export to Excel
                </MainButton>
            </div>

            {/* Unlocked stats bar */}
            <div className={styles.statsCard}>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-secondary flex items-center gap-2">
                        <FiAward style={{ color: "var(--color-accent)" }} /> Achievements Progress
                    </span>
                    <span className="text-sm font-bold text-primary">
                        {earnedCount} / {totalCount} Unlocked
                    </span>
                </div>
                <div className={styles.progressContainer}>
                    <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
                </div>
            </div>

            {/* Achievements Grid */}
            <div className={styles.achievementsGrid}>
                {allAchievements.map(ach => {
                    const isUnlocked = earnedIds.has(ach.id);
                    const earnedDetails = earnedAchievements.find(ea => ea.achievement_id === ach.id);
                    
                    return (
                        <div
                            key={ach.id}
                            className={`${styles.achievementCard} ${isUnlocked ? styles.unlockedCard : styles.lockedCard} ${getTierClass(ach.tier)}`}
                        >
                            <div className={styles.headerRow}>
                                <span className={styles.badgeIcon}>
                                    {isUnlocked ? (ach.icon || "🏆") : "🔒"}
                                </span>
                                {isUnlocked ? (
                                    <span className={styles.xpBadge}>
                                        +{ach.xp_reward || 0} XP
                                    </span>
                                ) : (
                                    <span className={`${styles.xpBadge} ${styles.xpBadgeLocked}`}>
                                        +{ach.xp_reward || 0} XP
                                    </span>
                                )}
                            </div>

                            <div className={styles.name}>{ach.name}</div>
                            <div className={styles.description}>{ach.description}</div>

                            {isUnlocked && earnedDetails?.earned_at && (
                                <div className={styles.earnedDate}>
                                    Unlocked on {format(new Date(earnedDetails.earned_at), "PPP")}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Achievements;
