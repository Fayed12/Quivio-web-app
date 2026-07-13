// react
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";

// date-fns
import { format } from "date-fns";

// redux
import { fetchQuizById, selectCurrentQuiz, clearCurrentQuiz } from "../../../redux/slices/quizzesSlice";
import { fetchMyAttempts, startAttemptThunk, selectMyAttempts } from "../../../redux/slices/attemptsSlice";
import { fetchMyBookmarks, addBookmarkThunk, removeBookmarkThunk, selectBookmarks } from "../../../redux/slices/bookmarksSlice";

// components
import MainButton from "../../../components/ui/button/MainButton";
import { Rating } from "@mui/material";
import { toast } from "react-toastify";

// react-icons
import {
    FiChevronLeft,
    FiBookmark,
    FiBookOpen,
    FiUser,
    FiInfo
} from "react-icons/fi";

// local
import styles from "./QuizDetail.module.css";
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

const QuizDetail = () => {
    const { quizId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const quiz = useSelector(selectCurrentQuiz);
    const attempts = useSelector(selectMyAttempts) || [];
    const bookmarks = useSelector(selectBookmarks) || [];

    const containerRef = useRef(null);

    // Entrance Animation
    usePageAnimation(containerRef, {
        ready: !!quiz
    });

    useEffect(() => {
        if (quizId) {
            dispatch(fetchQuizById(quizId));
            dispatch(fetchMyAttempts({ quizId, page: 1, pageSize: 50 }));
            dispatch(fetchMyBookmarks());
        }
        return () => {
            dispatch(clearCurrentQuiz());
        };
    }, [quizId, dispatch]);

    // Bookmark status
    const isBookmarked = bookmarks.some(b => b.quiz?.id === quizId);
    const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);

    const handleBookmarkToggle = async () => {
        if (isTogglingBookmark) return;
        setIsTogglingBookmark(true);

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
            setIsTogglingBookmark(false);
        }
    };

    // Calculate attempt metrics
    const completedAttempts = attempts.filter(a => a.quiz_id === quizId && a.status === "completed");
    const activeAttempt = attempts.find(a => a.quiz_id === quizId && a.status === "in_progress");
    const bestScore = completedAttempts.reduce((max, a) => a.score > max ? a.score : max, 0);

    const isLocked = quiz?.max_attempts && completedAttempts.length >= quiz.max_attempts;

    const handleStartQuiz = async () => {
        if (activeAttempt) {
            navigate(`/student/quiz/${quizId}/take?attempt=${activeAttempt.id}`);
            return;
        }
        if (isLocked) {
            toast.error("Maximum attempts reached for this quiz.");
            return;
        }

        const res = await dispatch(startAttemptThunk(quizId));
        if (startAttemptThunk.fulfilled.match(res)) {
            toast.success("Attempt started!");
            navigate(`/student/quiz/${quizId}/take?attempt=${res.payload.id}`);
        } else {
            toast.error(res.payload || "Failed to start quiz.");
        }
    };

    if (!quiz) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "var(--text-secondary)" }}>
                Loading quiz details...
            </div>
        );
    }

    // Get sample question
    const sampleQuizQuestion = quiz.quiz_questions?.[0];
    const sampleQuestion = sampleQuizQuestion?.question;

    const formatTimeSpent = (secs) => {
        if (!secs) return "—";
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        return `${mins}m ${remSecs}s`;
    };

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Breadcrumb / Page Header Actions */}
            <div className="flex justify-between items-center" style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-3)" }}>
                <button
                    onClick={() => navigate("/student/quizzes")}
                    className="btn btn--ghost btn--sm"
                    style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                    <FiChevronLeft /> Browse Quizzes
                </button>
                <button
                    onClick={handleBookmarkToggle}
                    disabled={isTogglingBookmark}
                    className="btn btn--outline btn--sm"
                    style={{ display: "flex", alignItems: "center", gap: "6px", opacity: isTogglingBookmark ? 0.7 : 1 }}
                >
                    <FiBookmark fill={isBookmarked ? "var(--color-accent)" : "none"} />
                    {isBookmarked ? "Bookmarked" : "Bookmark"}
                </button>
            </div>

            {/* Hero Section */}
            <div className={styles.heroSection}>
                <div className={styles.heroHeader}>
                    <span 
                        className={styles.categoryIcon}
                        style={{ color: quiz.category?.color || "var(--color-accent)" }}
                    >
                        {quiz.category?.icon || "📝"}
                    </span>
                    <div className={styles.titleArea}>
                        <h1 className="h1 styles.title">{quiz.title}</h1>
                        <div className={styles.metaRow}>
                            <span className="flex items-center gap-1"><FiUser /> By: Instructor</span>
                            <span>·</span>
                            <span className="flex items-center gap-1"><FiBookOpen /> Category: {quiz.category?.name || "General"}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Rating 
                        value={quiz.avg_score ? (quiz.avg_score / 20) : 0} 
                        precision={0.5} 
                        readOnly 
                        size="small"
                    />
                    <span className="text-xs text-secondary">
                        {quiz.avg_score ? `${Math.round(quiz.avg_score)}% Average` : "Not rated yet"} · {quiz.attempt_count || 0} attempts
                    </span>
                </div>

                <div className={styles.badgesRow} style={{ marginTop: "var(--space-2)" }}>
                    <span className="scoreBadge" style={{ background: "var(--color-accent-light)", color: "var(--text-accent)", padding: "4px 10px ", borderRadius: "6px"  }}>
                        Difficulty: {quiz.difficulty}
                    </span>
                    <span className="scoreBadge" style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)", padding: "4px 10px ", borderRadius: "6px"  }}>
                        ⏱ {quiz.time_limit_minutes || "Untimed"} minutes
                    </span>
                    <span className="scoreBadge" style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)", padding: "4px 10px ", borderRadius: "6px"  }}>
                        {quiz.question_count || 0} questions
                    </span>
                    <span className="scoreBadge" style={{ background: "var(--bg-success-mid)", color: "var(--text-success)", padding: "4px 10px ", borderRadius: "6px"  }}>
                        {quiz.passing_score || 70}% passing score
                    </span>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className={styles.mainGrid}>
                {/* Left Column */}
                <div className={styles.leftCol}>
                    {/* About */}
                    <div className={styles.sectionCard}>
                        <h3 className={styles.sectionTitle}>About this quiz</h3>
                        <p className="text-secondary" style={{ lineHeight: "var(--leading-normal)" }}>
                            {quiz.description || "No description provided for this quiz."}
                        </p>
                        {quiz.tags && quiz.tags.length > 0 && (
                            <div style={{ marginTop: "var(--space-3)" }}>
                                <div className="text-xs text-muted" style={{ marginBottom: "var(--space-2)" }}>Topics covered:</div>
                                <div className={styles.badgesRow}>
                                    {quiz.tags.map(tag => (
                                        <span key={tag} className="scoreBadge" style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)", padding: "4px 10px ", borderRadius: "6px" }}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sample Question Preview */}
                    {sampleQuestion && (
                        <div className={styles.sectionCard}>
                            <h3 className={styles.sectionTitle}>Sample question preview</h3>
                            <div className={styles.sampleQuestion}>
                                <div className="text-sm font-semibold text-primary" style={{ marginBottom: "var(--space-2)" }}>
                                    {sampleQuestion.question_text}
                                </div>
                                <div className={`${styles.blurAnswers} flex flex-col gap-2`}>
                                    {(sampleQuestion.question_options || []).map((opt, oIdx) => (
                                        <div 
                                            key={opt.id || oIdx}
                                            style={{
                                                padding: "var(--space-2) var(--space-3)",
                                                border: "1px solid var(--border-default)",
                                                borderRadius: "var(--radius-sm)",
                                                background: "var(--bg-surface)",
                                                fontSize: "var(--text-sm)"
                                            }}
                                        >
                                            {opt.option_text}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-xs text-muted flex items-center gap-1" style={{ marginTop: "var(--space-3)" }}>
                                    <FiInfo /> Answers are hidden until you start the quiz.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Attempt History */}
                    {completedAttempts.length > 0 && (
                        <div className={styles.sectionCard}>
                            <h3 className={styles.sectionTitle}>Attempt History</h3>
                            <div className={styles.historyTableWrapper}>
                                <table className={styles.historyTable}>
                                    <thead>
                                        <tr>
                                            <th>Attempt #</th>
                                            <th>Date</th>
                                            <th>Score</th>
                                            <th>Result</th>
                                            <th>Time Spent</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {completedAttempts.map((att, idx) => (
                                            <tr key={att.id}>
                                                <td>{completedAttempts.length - idx}</td>
                                                <td>{format(new Date(att.submitted_at), "PP")}</td>
                                                <td className="font-semibold">{Math.round(att.score)}%</td>
                                                <td>
                                                    <span className={`scoreBadge ${att.passed ? styles.scorePass : styles.scoreFail}`}>
                                                        {att.passed ? "Passed" : "Failed"}
                                                    </span>
                                                </td>
                                                <td>{formatTimeSpent(att.time_spent_secs)}</td>
                                                <td>
                                                    <MainButton
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/student/quiz/${quizId}/results/${att.id}`)}
                                                    >
                                                        View Details
                                                    </MainButton>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className={styles.rightCol}>
                    {/* Action Card */}
                    <div className={`${styles.sectionCard} ${styles.actionCard}`}>
                        <h3 className="h3 text-primary">Ready to learn?</h3>
                        
                        <div className={styles.actionStats}>
                            {completedAttempts.length > 0 && (
                                <div className={styles.actionStatRow}>
                                    <span className="text-secondary">Your Best Score:</span>
                                    <strong className="text-success">{Math.round(bestScore)}%</strong>
                                </div>
                            )}
                            <div className={styles.actionStatRow}>
                                <span className="text-secondary">Attempts:</span>
                                <strong>
                                    {quiz.max_attempts 
                                        ? `${completedAttempts.length} / ${quiz.max_attempts}` 
                                        : "Unlimited"
                                    }
                                </strong>
                            </div>
                            <div className={styles.actionStatRow}>
                                <span className="text-secondary">Estimated Time:</span>
                                <strong>{quiz.time_limit_minutes || "No limit"} mins</strong>
                            </div>
                            <div className={styles.actionStatRow}>
                                <span className="text-secondary">Questions:</span>
                                <strong>{quiz.question_count || 0} questions</strong>
                            </div>
                        </div>

                        <MainButton
                            variant="primary"
                            size="lg"
                            className="btn--full"
                            onClick={handleStartQuiz}
                            disabled={isLocked && !activeAttempt}
                        >
                            {activeAttempt ? "Resume Attempt →" : "Start Quiz →"}
                        </MainButton>
                    </div>

                    {/* Stats Panel */}
                    <div className={`${styles.sectionCard} ${styles.statsPanel}`}>
                        <h4 className="h5">Global Performance</h4>
                        
                        <div className={styles.statRow}>
                            <span className={styles.statVal}>
                                {quiz.avg_score ? `${Math.round(quiz.avg_score)}%` : "—"}
                            </span>
                            <div className={styles.statLabel}>
                                Average Score
                                <div className="text-muted text-xs">All students average score</div>
                            </div>
                        </div>

                        <div className={styles.statRow}>
                            <span className={styles.statVal}>
                                {quiz.pass_rate ? `${Math.round(quiz.pass_rate * 100)}%` : "—"}
                            </span>
                            <div className={styles.statLabel}>
                                Pass Rate
                                <div className="text-muted text-xs">Students passing on first attempt</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizDetail;
