// react
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router";

// date-fns
import { format, compareDesc } from "date-fns";

// redux
import { fetchPublishedQuizzes, selectPublishedQuizzes, selectQuizLoading } from "../../../redux/slices/quizzesSlice";
import { fetchCategories, selectCategories } from "../../../redux/slices/categoriesSlice";
import { fetchMyBookmarks, addBookmarkThunk, removeBookmarkThunk, selectBookmarks } from "../../../redux/slices/bookmarksSlice";
import { fetchMyAttempts, selectMyAttempts } from "../../../redux/slices/attemptsSlice";
import { fetchStudentAssignments, selectStudentAssignments } from "../../../redux/slices/assignmentsSlice";

// components
import MainButton from "../../../components/ui/button/MainButton";
import { toast } from "react-toastify";

// react-icons
import {
    FiSearch,
    FiGrid,
    FiList,
    FiBookmark,
    FiClock,
    FiAward,
    FiChevronDown,
    FiChevronUp,
    FiFilter,
    FiX,
    FiCheck,
    FiFolder,
    FiBookOpen
} from "react-icons/fi";

// local
import styles from "./BrowseQuizzes.module.css";
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";
import { useRealtimeQuizzes } from "../../../hooks/useRealtimeQuizzes";

const BrowseQuizzes = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Subscribe to quizzes realtime changes
    useRealtimeQuizzes();

    // Selectors
    const publicQuizzes = useSelector(selectPublishedQuizzes) || [];
    const categories = useSelector(selectCategories) || [];
    const bookmarks = useSelector(selectBookmarks) || [];
    const attempts = useSelector(selectMyAttempts) || [];
    const assignments = useSelector(selectStudentAssignments) || [];
    const isLoading = useSelector(selectQuizLoading);

    // Combine public published quizzes and assigned quizzes
    const quizzes = [...publicQuizzes];
    assignments.forEach(a => {
        if (a.quiz && !quizzes.some(q => q.id === a.quiz.id)) {
            // Map status as published since it is assigned and active
            quizzes.push({
                ...a.quiz,
                status: "published"
            });
        }
    });
    
    // Layout references
    const containerRef = useRef(null);

    // Local states
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
    const [togglingBookmarkId, setTogglingBookmarkId] = useState(null);
    
    // Search input
    const initialSearch = searchParams.get("search") || "";
    const [searchQuery, setSearchQuery] = useState(initialSearch);

    // Filters
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState("All"); // All, easy, medium, hard
    const [maxTime, setMaxTime] = useState(120);
    const [selectedStatus, setSelectedStatus] = useState("All"); // All, Available, Completed, Bookmarked, Assigned
    const [sortBy, setSortBy] = useState("published_at"); // published_at, attempt_count, avg_score, title

    // Bookmark helpers
    const bookmarkedIds = bookmarks.reduce((acc, curr) => {
        if (curr.quiz?.id) acc[curr.quiz.id] = true;
        return acc;
    }, {});

    // Entrance Animation
    usePageAnimation(containerRef, {
        ready: quizzes.length > 0 && !isLoading,
        staggerSelector: `.${styles.quizCard}`
    });

    // Mount fetches
    useEffect(() => {
        dispatch(fetchPublishedQuizzes());
        dispatch(fetchCategories());
        dispatch(fetchMyBookmarks());
        dispatch(fetchMyAttempts({ page: 1, pageSize: 100 }));
        dispatch(fetchStudentAssignments({ page: 1, pageSize: 100 }));
    }, [dispatch]);

    // Sync URL search query parameter
    useEffect(() => {
        const urlSearch = searchParams.get("search") || "";
        setSearchQuery(urlSearch);
    }, [searchParams]);

    // Category click handler
    const handleCategoryToggle = (catId) => {
        setSelectedCategories(prev => 
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    // Bookmark toggle helper
    const handleBookmarkToggle = async (e, quizId) => {
        e.stopPropagation();
        if (togglingBookmarkId) return;
        setTogglingBookmarkId(quizId);

        const isBookmarked = !!bookmarkedIds[quizId];
        const promise = isBookmarked
            ? dispatch(removeBookmarkThunk(quizId)).unwrap()
            : dispatch(addBookmarkThunk(quizId)).unwrap();

        toast.promise(
            promise,
            {
                pending: isBookmarked ? "Removing bookmark..." : "Adding bookmark...",
                success: isBookmarked ? "Bookmark removed successfully! ✨" : "Quiz bookmarked successfully! 🔖",
                error: isBookmarked ? "Failed to update bookmark." : "Failed to add bookmark."
            },
            {
                autoClose: 2000,
                position: "top-right"
            }
        );

        try {
            await promise;
        } catch (err) {
            console.error(err);
        } finally {
            setTogglingBookmarkId(null);
        }
    };

    // Clear filters
    const handleClearFilters = () => {
        setSelectedCategories([]);
        setSelectedDifficulty("All");
        setMaxTime(120);
        setSelectedStatus("All");
        setSearchQuery("");
        setSearchParams({});
    };

    // Calculate details per quiz
    const getQuizDetails = (quiz) => {
        const completedAttempts = attempts.filter(a => a.quiz_id === quiz.id && a.status === "completed");
        const activeAttempt = attempts.find(a => a.quiz_id === quiz.id && a.status === "in_progress");
        const hasAssignment = assignments.some(a => a.quiz?.id === quiz.id);

        const attemptCount = completedAttempts.length;
        const bestScore = completedAttempts.reduce((max, curr) => curr.score > max ? curr.score : max, 0);
        
        const isLocked = quiz.max_attempts && attemptCount >= quiz.max_attempts;
        const isCompleted = attemptCount > 0 && completedAttempts.some(a => a.passed);

        // Date locks
        const now = new Date();
        const isAvailableFromDate = !quiz.available_from || new Date(quiz.available_from) <= now;
        const countdown = !isAvailableFromDate 
            ? format(new Date(quiz.available_from), "PP") 
            : null;

        return {
            attemptCount,
            bestScore,
            activeAttempt,
            hasAssignment,
            isLocked,
            isCompleted,
            isAvailableFromDate,
            countdown
        };
    };

    // Filter and Sort Client-side
    const filteredQuizzes = quizzes.filter(quiz => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const titleMatch = quiz.title?.toLowerCase().includes(query);
            const descMatch = quiz.description?.toLowerCase().includes(query);
            if (!titleMatch && !descMatch) return false;
        }

        // Category filter
        if (selectedCategories.length > 0) {
            if (!quiz.category || !selectedCategories.includes(quiz.category.id)) return false;
        }

        // Difficulty filter
        if (selectedDifficulty !== "All") {
            if (quiz.difficulty?.toLowerCase() !== selectedDifficulty.toLowerCase()) return false;
        }

        // Time filter
        if (quiz.time_limit_minutes > maxTime) return false;

        // Status filter
        const details = getQuizDetails(quiz);
        if (selectedStatus === "Completed") {
            if (!details.isCompleted) return false;
        } else if (selectedStatus === "Bookmarked") {
            if (!bookmarkedIds[quiz.id]) return false;
        } else if (selectedStatus === "Assigned") {
            if (!details.hasAssignment) return false;
        } else if (selectedStatus === "Available") {
            if (details.isLocked || !details.isAvailableFromDate) return false;
        }

        return true;
    }).sort((a, b) => {
        if (sortBy === "published_at") {
            return compareDesc(new Date(a.published_at || a.created_at), new Date(b.published_at || b.created_at));
        }
        if (sortBy === "attempt_count") {
            return (b.attempt_count || 0) - (a.attempt_count || 0);
        }
        if (sortBy === "avg_score") {
            return (b.avg_score || 0) - (a.avg_score || 0);
        }
        if (sortBy === "title") {
            return a.title?.localeCompare(b.title);
        }
        return 0;
    });

    const activeFilterCount = 
        (selectedCategories.length > 0 ? 1 : 0) +
        (selectedDifficulty !== "All" ? 1 : 0) +
        (maxTime < 120 ? 1 : 0) +
        (selectedStatus !== "All" ? 1 : 0);

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Page Header */}
            <div className="flex justify-between items-center" style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-4)" }}>
                <div>
                    <h1 className="h1">Browse Quizzes</h1>
                    <p className="text-sm text-secondary">Discover and take quizzes to improve your skills.</p>
                </div>
            </div>

            {/* Search and Filters Section */}
            <div className={styles.searchFilterSection}>
                <div className={styles.searchBarRow}>
                    <div className={styles.searchBar}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setSearchParams({ search: e.target.value });
                            }}
                            placeholder="Search by quiz title or description..."
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button
                                className={styles.clearBtn}
                                onClick={() => {
                                    setSearchQuery("");
                                    setSearchParams({});
                                }}
                                aria-label="Clear search"
                            >
                                <FiX />
                            </button>
                        )}
                    </div>
                    <MainButton
                        variant="secondary"
                        size="md"
                        className={styles.filterPanelToggle}
                        onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                    >
                        <FiFilter />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="badge" style={{ background: "var(--color-accent)", color: "white" }}>
                                {activeFilterCount}
                            </span>
                        )}
                        {isFilterPanelOpen ? <FiChevronUp /> : <FiChevronDown />}
                    </MainButton>
                </div>

                {/* Collapsible Filter Panel */}
                {isFilterPanelOpen && (
                    <div className={styles.filterPanel}>
                        <div className={styles.filterGrid}>
                            {/* Categories */}
                            <div className={styles.filterGroup}>
                                <span className={styles.filterLabel}>Categories</span>
                                <div className={styles.checkboxGroup}>
                                    {categories.map(cat => (
                                        <label key={cat.id} className={styles.checkboxItem}>
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(cat.id)}
                                                onChange={() => handleCategoryToggle(cat.id)}
                                            />
                                            {cat.name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Difficulties */}
                            <div className={styles.filterGroup}>
                                <span className={styles.filterLabel}>Difficulty</span>
                                <div className={styles.radioGroup}>
                                    {["All", "Easy", "Medium", "Hard"].map(diff => (
                                        <label key={diff} className={styles.radioItem}>
                                            <input
                                                type="radio"
                                                name="difficulty"
                                                checked={selectedDifficulty === diff}
                                                onChange={() => setSelectedDifficulty(diff)}
                                            />
                                            {diff}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Time Limits */}
                            <div className={styles.filterGroup}>
                                <span className={styles.filterLabel}>Max Time ({maxTime} mins)</span>
                                <input
                                    type="range"
                                    min="5"
                                    max="120"
                                    step="5"
                                    value={maxTime}
                                    onChange={(e) => setMaxTime(parseInt(e.target.value))}
                                    style={{ width: "100%", accentColor: "var(--color-accent)" }}
                                />
                                <div className="flex justify-between text-xs text-muted">
                                    <span>5m</span>
                                    <span>60m</span>
                                    <span>120m</span>
                                </div>
                            </div>

                            {/* Status */}
                            <div className={styles.filterGroup}>
                                <span className={styles.filterLabel}>Status</span>
                                <div className={styles.radioGroup}>
                                    {["All", "Available", "Completed", "Bookmarked", "Assigned"].map(status => (
                                        <label key={status} className={styles.radioItem}>
                                            <input
                                                type="radio"
                                                name="status"
                                                checked={selectedStatus === status}
                                                onChange={() => setSelectedStatus(status)}
                                            />
                                            {status}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Chips */}
                {activeFilterCount > 0 && (
                    <div className={styles.chipsRow}>
                        {selectedCategories.map(catId => {
                            const name = categories.find(c => c.id === catId)?.name || "";
                            return (
                                <span key={catId} className={styles.chip}>
                                    Category: {name}
                                    <button onClick={() => handleCategoryToggle(catId)} className={styles.chipClearBtn}>&times;</button>
                                </span>
                            );
                        })}
                        {selectedDifficulty !== "All" && (
                            <span className={styles.chip}>
                                Difficulty: {selectedDifficulty}
                                <button onClick={() => setSelectedDifficulty("All")} className={styles.chipClearBtn}>&times;</button>
                            </span>
                        )}
                        {maxTime < 120 && (
                            <span className={styles.chip}>
                                Time limit &le; {maxTime}m
                                <button onClick={() => setMaxTime(120)} className={styles.chipClearBtn}>&times;</button>
                            </span>
                        )}
                        {selectedStatus !== "All" && (
                            <span className={styles.chip}>
                                Status: {selectedStatus}
                                <button onClick={() => setSelectedStatus("All")} className={styles.chipClearBtn}>&times;</button>
                            </span>
                        )}
                        <button onClick={handleClearFilters} className={styles.clearAllLink}>
                            Clear All Filters
                        </button>
                    </div>
                )}
            </div>

            {/* View Toggles & Sorting */}
            <div className={styles.toolbarRow}>
                <span className="text-secondary text-sm">
                    Showing <strong>{filteredQuizzes.length}</strong> quizzes
                </span>
                <div className={styles.toolbarActions}>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className={styles.sortSelect}
                    >
                        <option value="published_at">Newest</option>
                        <option value="attempt_count">Most Popular</option>
                        <option value="avg_score">Highest Rated</option>
                        <option value="title">A–Z</option>
                    </select>

                    <div className="flex gap-1" style={{ background: "var(--bg-surface-2)", padding: "2px", borderRadius: "var(--radius-md)" }}>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`${styles.viewToggleBtn} ${viewMode === "grid" ? styles.viewToggleBtnActive : ""}`}
                            title="Grid View"
                        >
                            <FiGrid />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`${styles.viewToggleBtn} ${viewMode === "list" ? styles.viewToggleBtnActive : ""}`}
                            title="List View"
                        >
                            <FiList />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quiz Cards Layout */}
            {filteredQuizzes.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIllustration} role="img" aria-label="Inbox Empty">
                        <FiFolder style={{ fontSize: "3rem", color: "var(--text-muted)" }} />
                    </div>
                    <h3 className="h3">No quizzes match your filters</h3>
                    <p className="text-secondary text-sm">Try clearing your filters or choosing different options.</p>
                    <MainButton variant="outline" size="md" onClick={handleClearFilters}>
                        Clear All Filters
                    </MainButton>
                </div>
            ) : viewMode === "grid" ? (
                <div className={styles.quizzesGrid}>
                    {filteredQuizzes.map(quiz => {
                        const details = getQuizDetails(quiz);
                        const bannerCol = quiz.category?.color || "var(--blue-500)";
                        
                        return (
                            <div 
                                key={quiz.id} 
                                className={`${styles.quizCard} ${details.isCompleted ? styles.mutedCard : ""}`}
                            >
                                {/* Category banner */}
                                <div className={styles.cardBanner} style={{ backgroundColor: bannerCol }}>
                                    <span className={styles.categoryIconInBanner}><FiBookOpen /></span>
                                    <button 
                                        onClick={(e) => handleBookmarkToggle(e, quiz.id)}
                                        className={`${styles.bookmarkBtn} ${bookmarkedIds[quiz.id] ? styles.bookmarkActive : ""} ${togglingBookmarkId === quiz.id ? styles.bookmarkToggling : ""}`}
                                        disabled={togglingBookmarkId === quiz.id}
                                    >
                                        {togglingBookmarkId === quiz.id ? (
                                            <div className={styles.spinner} />
                                        ) : (
                                            <FiBookmark fill={bookmarkedIds[quiz.id] ? "currentColor" : "none"} />
                                        )}
                                    </button>
                                    
                                    {/* Overlay badges */}
                                    {details.isCompleted && (
                                        <span className={styles.overlayBadge} style={{ background: "var(--bg-success-mid)", color: "var(--text-success)" }}>
                                            <FiCheck style={{ marginRight: "4px", display: "inline" }} /> Completed
                                        </span>
                                    )}
                                    {details.activeAttempt && !details.isCompleted && (
                                        <span className={styles.overlayBadge} style={{ background: "var(--bg-warning-mid)", color: "var(--text-warning)" }}>
                                            In Progress
                                        </span>
                                    )}
                                    {details.isLocked && !details.isCompleted && (
                                        <span className={styles.overlayBadge} style={{ background: "var(--bg-danger-mid)", color: "var(--text-danger)" }}>
                                            Locked
                                        </span>
                                    )}
                                    {details.countdown && (
                                        <span className={styles.overlayBadge} style={{ background: "var(--bg-info-mid)", color: "var(--text-info)" }}>
                                            Available from {details.countdown}
                                        </span>
                                    )}
                                </div>

                                {/* Body */}
                                <div className={styles.cardBody}>
                                    <h3 className={styles.quizTitle} title={quiz.title}>{quiz.title}</h3>
                                    
                                    <div className={styles.ratingRow}>
                                        <FiAward className={styles.ratingStar} />
                                        <span>
                                            {quiz.avg_score ? `${Math.round(quiz.avg_score)}%` : "No ratings"}
                                        </span>
                                        <span>·</span>
                                        <span>{quiz.attempt_count || 0} attempts</span>
                                    </div>

                                    <div className={styles.badgesRow}>
                                        <span className="scoreBadge" style={{ background: quiz.difficulty?.toLowerCase() === "easy" ? "var(--bg-success-mid)" : quiz.difficulty?.toLowerCase() === "medium" ? "var(--bg-warning-mid)" : "var(--bg-danger-mid)", color: quiz.difficulty?.toLowerCase() === "easy" ? "var(--text-success)" : quiz.difficulty?.toLowerCase() === "medium" ? "var(--text-warning)" : "var(--text-danger)" }}>
                                            {quiz.difficulty}
                                        </span>
                                        <span className="scoreBadge" style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <FiClock /> {quiz.time_limit_minutes || "Untimed"}m
                                        </span>
                                        <span className="scoreBadge" style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)" }}>
                                            {quiz.question_count || 0} Qs
                                        </span>
                                    </div>

                                    <div className={styles.cardFooter}>
                                        <span className="text-xs text-muted">Passing score: <strong>{quiz.passing_score || 70}%</strong></span>
                                        <MainButton
                                            variant="primary"
                                            size="sm"
                                            onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                                            disabled={details.isLocked || !details.isAvailableFromDate}
                                            title={details.isLocked ? "Maximum attempts reached" : ""}
                                        >
                                            {details.activeAttempt ? "Resume →" : "Start →"}
                                        </MainButton>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.quizzesList}>
                    {filteredQuizzes.map(quiz => {
                        const details = getQuizDetails(quiz);
                        const bulletCol = quiz.category?.color || "var(--blue-500)";
                        
                        return (
                            <div key={quiz.id} className={styles.quizRow}>
                                <div className={styles.rowLeft}>
                                    <span className={styles.rowCategoryDot} style={{ backgroundColor: bulletCol }} />
                                    <span className={styles.rowTitle} title={quiz.title}>{quiz.title}</span>
                                </div>
                                <div className={styles.rowRight}>
                                    <span className="scoreBadge" style={{ background: quiz.difficulty?.toLowerCase() === "easy" ? "var(--bg-success-mid)" : quiz.difficulty?.toLowerCase() === "medium" ? "var(--bg-warning-mid)" : "var(--bg-danger-mid)", color: quiz.difficulty?.toLowerCase() === "easy" ? "var(--text-success)" : quiz.difficulty?.toLowerCase() === "medium" ? "var(--text-warning)" : "var(--text-danger)" }}>
                                        {quiz.difficulty}
                                    </span>
                                    <span className="scoreBadge" style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <FiClock /> {quiz.time_limit_minutes || "Untimed"}m
                                    </span>
                                    <span className="scoreBadge" style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)" }}>
                                        {quiz.question_count || 0} Qs
                                    </span>
                                    <span className="text-xs text-secondary" style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                                        ★ {quiz.avg_score ? Math.round(quiz.avg_score) : "No rating"}
                                    </span>
                                    <MainButton
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                                        disabled={details.isLocked || !details.isAvailableFromDate}
                                    >
                                        Start →
                                    </MainButton>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BrowseQuizzes;
