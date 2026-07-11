// react
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

// redux
import { fetchMyBookmarks, addBookmarkThunk, removeBookmarkThunk, selectBookmarks } from "../../../redux/slices/bookmarksSlice";

// components
import MainButton from "../../../components/ui/button/MainButton";
import { toast } from "react-toastify";

// react-icons
import {
    FiSearch,
    FiBookmark,
    FiClock,
    FiAward,
    FiChevronRight
} from "react-icons/fi";

// local
import styles from "./Bookmarks.module.css";
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

const Bookmarks = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const bookmarks = useSelector(selectBookmarks) || [];
    const containerRef = useRef(null);

    const [searchQuery, setSearchQuery] = useState("");

    // Entrance Animation
    usePageAnimation(containerRef, {
        ready: bookmarks.length > 0
    });

    useEffect(() => {
        dispatch(fetchMyBookmarks());
    }, [dispatch]);

    const handleRemoveBookmark = (quizId) => {
        dispatch(removeBookmarkThunk(quizId));

        // Toast with custom undo action
        toast(
            <div className="flex justify-between items-center gap-4" style={{ width: "100%" }}>
                <span>Quiz removed from bookmarks</span>
                <button
                    onClick={() => {
                        dispatch(addBookmarkThunk(quizId));
                        toast.dismiss();
                    }}
                    className="btn btn--ghost-accent btn--sm"
                    style={{ color: "var(--color-accent)", border: "1px solid var(--color-accent)", padding: "2px 8px" }}
                >
                    Undo
                </button>
            </div>,
            { autoClose: 5000, closeOnClick: false }
        );
    };

    // Filtered bookmarks
    const filteredBookmarks = bookmarks.filter(b => {
        const title = b.quiz?.title?.toLowerCase() || "";
        const desc = b.quiz?.description?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        return title.includes(query) || desc.includes(query);
    });

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Header */}
            <div style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-4)" }}>
                <h1 className="h1">Bookmarks</h1>
                <p className="text-sm text-secondary">View and access all the quizzes you've saved for practice.</p>
            </div>

            {/* Search Bar */}
            <div className={styles.searchBarRow}>
                <div className={styles.searchBar}>
                    <FiSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search bookmarks by name..."
                        className={styles.searchInput}
                    />
                </div>
            </div>

            {/* Grid */}
            {filteredBookmarks.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIllustration} role="img" aria-label="No bookmarks">🔖</div>
                    <h3 className="h3">No bookmarks found</h3>
                    <p className="text-secondary text-sm">Save quizzes while browsing to find them here.</p>
                </div>
            ) : (
                <div className={styles.quizzesGrid}>
                    {filteredBookmarks.map(b => {
                        const quiz = b.quiz;
                        if (!quiz) return null;

                        const bannerCol = quiz.category?.color || "var(--blue-500)";

                        return (
                            <div key={b.id} className={styles.quizCard}>
                                <div className={styles.cardBanner} style={{ backgroundColor: bannerCol }}>
                                    <span className={styles.categoryIconInBanner}>{quiz.category?.icon || "📝"}</span>
                                    <button
                                        onClick={() => handleRemoveBookmark(quiz.id)}
                                        className={`${styles.bookmarkBtn} ${styles.bookmarkActive}`}
                                    >
                                        <FiBookmark fill="currentColor" />
                                    </button>
                                </div>

                                <div className={styles.cardBody}>
                                    <h3 className={styles.quizTitle} title={quiz.title}>{quiz.title}</h3>

                                    <div className={styles.ratingRow}>
                                        <FiAward className="ratingStar" style={{ color: "var(--amber-500)" }} />
                                        <span>
                                            {quiz.avg_score ? `${Math.round(quiz.avg_score)}% Average` : "No ratings"}
                                        </span>
                                        <span>·</span>
                                        <span>{quiz.attempt_count || 0} attempts</span>
                                    </div>

                                    <div className="badgesRow">
                                        <span className="scoreBadge" style={{ background: quiz.difficulty?.toLowerCase() === "easy" ? "var(--bg-success-mid)" : quiz.difficulty?.toLowerCase() === "medium" ? "var(--bg-warning-mid)" : "var(--bg-danger-mid)", color: quiz.difficulty?.toLowerCase() === "easy" ? "var(--text-success)" : quiz.difficulty?.toLowerCase() === "medium" ? "var(--text-warning)" : "var(--text-danger)" }}>
                                            {quiz.difficulty}
                                        </span>
                                        <span className="scoreBadge" style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <FiClock /> {quiz.time_limit_minutes || "Untimed"}m
                                        </span>
                                    </div>

                                    <div className={styles.cardFooter}>
                                        <span className="text-xs text-muted">Passing score: <strong>{quiz.passing_score || 70}%</strong></span>
                                        <MainButton
                                            variant="primary"
                                            size="sm"
                                            onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                                        >
                                            View Details <FiChevronRight style={{ marginLeft: "2px" }} />
                                        </MainButton>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Bookmarks;
