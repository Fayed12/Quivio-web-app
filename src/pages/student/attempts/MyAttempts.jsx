// react
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

// date-fns
import { format, compareDesc, compareAsc } from "date-fns";

// redux
import { fetchMyAttempts, fetchMyStats, selectMyAttempts, selectMyStats } from "../../../redux/slices/attemptsSlice";
import { fetchCategories, selectCategories } from "../../../redux/slices/categoriesSlice";

// components
import MainButton from "../../../components/ui/button/MainButton";

// react-icons
import {
    FiBookOpen,
    FiCheckCircle,
    FiXCircle,
    FiAward,
    FiSearch,
    FiEye
} from "react-icons/fi";

// local
import styles from "./MyAttempts.module.css";
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

const MyAttempts = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const attempts = useSelector(selectMyAttempts) || [];
    const stats = useSelector(selectMyStats);
    const categories = useSelector(selectCategories) || [];

    const containerRef = useRef(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All"); // All, Passed, Failed
    const [sortBy, setSortBy] = useState("newest"); // newest, oldest, highest, lowest
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Entrance Animation
    usePageAnimation(containerRef, {
        ready: attempts.length > 0
    });

    useEffect(() => {
        dispatch(fetchMyAttempts({ page: 1, pageSize: 100 })); // load history
        dispatch(fetchMyStats());
        dispatch(fetchCategories());
    }, [dispatch]);

    const formatTimeSpent = (secs) => {
        if (!secs) return "—";
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        return `${mins}m ${remSecs}s`;
    };

    // Filter & Sort client-side
    const filteredAttempts = attempts.filter(att => {
        if (!att.submitted_at && att.status !== "completed") return false; // only show completed attempts
        
        // Search
        if (searchQuery) {
            const quizTitle = att.quiz?.title?.toLowerCase() || "";
            if (!quizTitle.includes(searchQuery.toLowerCase())) return false;
        }

        // Category
        if (selectedCategory !== "All") {
            if (att.quiz?.category?.id !== selectedCategory) return false;
        }

        // Status
        if (selectedStatus !== "All") {
            const passed = att.passed;
            if (selectedStatus === "Passed" && !passed) return false;
            if (selectedStatus === "Failed" && passed) return false;
        }

        return true;
    }).sort((a, b) => {
        if (sortBy === "newest") {
            return compareDesc(new Date(a.submitted_at), new Date(b.submitted_at));
        }
        if (sortBy === "oldest") {
            return compareAsc(new Date(a.submitted_at), new Date(b.submitted_at));
        }
        if (sortBy === "highest") {
            return (b.score || 0) - (a.score || 0);
        }
        if (sortBy === "lowest") {
            return (a.score || 0) - (b.score || 0);
        }
        return 0;
    });

    // Pagination
    const totalItems = filteredAttempts.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedAttempts = filteredAttempts.slice(startIndex, startIndex + pageSize);

    // Stats calculations
    const completedAttemptsCount = attempts.filter(a => a.status === "completed").length;
    const passedCount = attempts.filter(a => a.passed).length;
    const failedCount = completedAttemptsCount - passedCount;
    const averageScore = stats?.avg_score ? Math.round(stats.avg_score) : 0;

    return (
        <div ref={containerRef} className={styles.attemptsContainer}>
            {/* Page Header */}
            <div style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-4)" }}>
                <h1 className="h1">My Attempts</h1>
                <p className="text-sm text-secondary">Review your quiz attempts, scores, and detailed correctness summaries.</p>
            </div>

            {/* Summary Stats Row */}
            <div className="stats-row">
                <div className={styles.card}>
                    <div className="flex items-center gap-3">
                        <div style={{ background: "var(--blue-50)", padding: "10px", borderRadius: "50%", display: "flex" }}>
                            <FiBookOpen style={{ color: "var(--blue-600)" }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="h2">{completedAttemptsCount}</span>
                            <span className="text-xs text-muted">Total Attempts</span>
                        </div>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className="flex items-center gap-3">
                        <div style={{ background: "var(--green-50)", padding: "10px", borderRadius: "50%", display: "flex" }}>
                            <FiCheckCircle style={{ color: "var(--green-600)" }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="h2">{passedCount}</span>
                            <span className="text-xs text-muted">Passed Attempts</span>
                        </div>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className="flex items-center gap-3">
                        <div style={{ background: "var(--red-50)", padding: "10px", borderRadius: "50%", display: "flex" }}>
                            <FiXCircle style={{ color: "var(--red-600)" }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="h2">{failedCount}</span>
                            <span className="text-xs text-muted">Failed Attempts</span>
                        </div>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className="flex items-center gap-3">
                        <div style={{ background: "var(--violet-50)", padding: "10px", borderRadius: "50%", display: "flex" }}>
                            <FiAward style={{ color: "var(--violet-600)" }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="h2">{averageScore}%</span>
                            <span className="text-xs text-muted">Average Score</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className={styles.card}>
                <div className={styles.filterBar}>
                    <div className="flex flex-1 gap-2" style={{ minWidth: "260px" }}>
                        <FiSearch style={{ alignSelf: "center", color: "var(--text-muted)", marginLeft: "var(--space-2)" }} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search by quiz name..."
                            className={styles.filterInput}
                        />
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setCurrentPage(1);
                        }}
                        className={styles.filterSelect}
                    >
                        <option value="All">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => {
                            setSelectedStatus(e.target.value);
                            setCurrentPage(1);
                        }}
                        className={styles.filterSelect}
                    >
                        <option value="All">All Results</option>
                        <option value="Passed">Passed</option>
                        <option value="Failed">Failed</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="highest">Highest Score</option>
                        <option value="lowest">Lowest Score</option>
                    </select>
                </div>
            </div>

            {/* Attempts Table */}
            <div className={styles.card}>
                {paginatedAttempts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                        No quiz attempts found matching your filters.
                    </div>
                ) : (
                    <>
                        <div className={styles.tableWrapper}>
                            <table className={styles.attemptsTable}>
                                <thead>
                                    <tr>
                                        <th>Quiz Name</th>
                                        <th>Category</th>
                                        <th>Date Taken</th>
                                        <th>Score</th>
                                        <th>Status</th>
                                        <th>Time Spent</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedAttempts.map(att => (
                                        <tr key={att.id}>
                                            <td className="font-semibold">{att.quiz?.title || "Quiz"}</td>
                                            <td>{att.quiz?.category?.name || "General"}</td>
                                            <td>{format(new Date(att.submitted_at || att.started_at), "PP")}</td>
                                            <td className="font-semibold">{Math.round(att.score)}%</td>
                                            <td>
                                                <span className={`scoreBadge ${att.passed ? "scorePass" : "scoreFail"}`}>
                                                    {att.passed ? "Passed" : "Failed"}
                                                </span>
                                            </td>
                                            <td>{formatTimeSpent(att.time_spent_secs)}</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <MainButton
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/student/attempts/${att.id}`)}
                                                        style={{ display: "flex", alignItems: "center", gap: "4px" }}
                                                    >
                                                        <FiEye /> View Details
                                                    </MainButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className={styles.paginationRow}>
                                <span className="text-xs text-secondary">
                                    Showing {startIndex + 1}–{Math.min(startIndex + pageSize, totalItems)} of {totalItems} attempts
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        className={styles.pageBtn}
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                    >
                                        Prev
                                    </button>
                                    {Array.from({ length: totalPages }, (_, idx) => (
                                        <button
                                            key={idx + 1}
                                            onClick={() => setCurrentPage(idx + 1)}
                                            className={`${styles.pageBtn} ${currentPage === idx + 1 ? styles.pageBtnActive : ""}`}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                    <button
                                        className={styles.pageBtn}
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MyAttempts;
