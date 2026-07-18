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
import * as FiIcons from "react-icons/fi";
import {
    FiChevronLeft,
    FiBookmark,
    FiBookOpen,
    FiUser,
    FiInfo,
    FiClock,
    FiStar,
    FiArrowRight,
    FiAward,
    FiUserCheck
} from "react-icons/fi";

// local
import styles from "./QuizDetail.module.css";
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

// Helper to safely format dates
const formatDateSafe = (dateString, formatPattern = "MMM d, yyyy") => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return "N/A";
    }
    return format(date, formatPattern);
};

// Helper to render category icon dynamically
const renderCategoryIcon = (iconName, className) => {
    const IconComponent = FiIcons[iconName] || FiBookOpen;
    return <IconComponent className={className} />;
};

// Helper to render custom cover image fallback
const renderCustomCover = (quiz, bannerCol) => {
    return (
        <div className={styles.customCoverImage} style={{ 
            background: `linear-gradient(135deg, ${bannerCol} 0%, var(--bg-surface-2) 100%)` 
        }}>
            <div className={styles.gridOverlay} />
            <div className={styles.categoryIconInBanner}>
                {renderCategoryIcon(quiz.category?.icon)}
            </div>
        </div>
    );
};

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
        ready: !!quiz,
        staggerSelector: `.${styles.animateIn}`
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
    const [imageErrors, setImageErrors] = useState({});

    const handleImageError = (id) => {
        setImageErrors(prev => ({ ...prev, [id]: true }));
    };

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
                success: isBookmarked ? "Bookmark removed successfully!" : "Quiz bookmarked successfully!",
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
            <div className={styles.loadingContainer}>
                <div className={styles.spinnerWrapper}>
                    <div className={styles.spinner} />
                    <span className={styles.loadingText}>Loading quiz details...</span>
                </div>
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
                    <FiBookmark fill={isBookmarked ? "var(--color-accent)" : "none"} style={{ color: isBookmarked ? "var(--color-accent)" : "inherit" }} />
                    {isBookmarked ? "Bookmarked" : "Bookmark"}
                </button>
            </div>

            {/* Hero Section */}
            <div className={`${styles.heroSection} ${styles.animateIn}`}>
                <div className={styles.heroLayout}>
                    {/* Left Column: Cover Image / Dynamic Cover */}
                    <div className={styles.heroCoverWrapper}>
                        {quiz.cover_image_url && !imageErrors[quiz.id] ? (
                            <img 
                                src={quiz.cover_image_url} 
                                alt={quiz.title} 
                                className={styles.heroCoverImage} 
                                onError={() => handleImageError(quiz.id)}
                            />
                        ) : (
                            renderCustomCover(quiz, quiz.category?.color || "var(--blue-500)")
                        )}
                    </div>

                    {/* Right Column: Title and Details */}
                    <div className={styles.heroContent}>
                        <div className={styles.heroHeaderInfo}>
                            <div className={styles.categoryNameRow}>
                                <span className={styles.categoryBadge} style={{ 
                                    backgroundColor: `${quiz.category?.color || "var(--blue-500)"}15`,
                                    color: quiz.category?.color || "var(--blue-500)"
                                }}>
                                    {quiz.category?.icon ? renderCategoryIcon(quiz.category.icon, styles.categoryIconMini) : <FiBookOpen className={styles.categoryIconMini} />}
                                    {quiz.category?.name || "General"}
                                </span>
                            </div>
                            
                            <h1 className={styles.quizTitle} title={quiz.title}>{quiz.title}</h1>
                            
                            {/* Instructor Profile */}
                            <div className={styles.instructorProfile}>
                                {quiz.instructor?.avatar_url ? (
                                    <img src={quiz.instructor.avatar_url} alt={quiz.instructor.full_name} className={styles.instructorAvatar} />
                                ) : (
                                    <div className={styles.instructorFallback}>
                                        <FiUser />
                                    </div>
                                )}
                                <div className={styles.instructorInfo}>
                                    <span className={styles.instructorLabel}>Created By</span>
                                    <span className={styles.instructorName}>{quiz.instructor?.full_name || "Instructor"}</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.heroFooterInfo}>
                            <div className="flex items-center gap-3">
                                <Rating 
                                    value={quiz.avg_score ? (quiz.avg_score / 20) : 0} 
                                    precision={0.5} 
                                    readOnly 
                                    size="small"
                                />
                                <span className="text-xs text-secondary" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    <FiStar className={styles.ratingStarIcon} /> <strong>{quiz.avg_score ? `${Math.round(quiz.avg_score)}%` : "Not rated"}</strong> Avg Score
                                    <span>·</span>
                                    <strong>{quiz.attempt_count || 0}</strong> attempts
                                </span>
                            </div>

                            <div className={styles.heroBadgesRow}>
                                <span className={`${styles.difficultyBadge} ${styles[quiz.difficulty?.toLowerCase() || 'medium']}`}>
                                    {quiz.difficulty}
                                </span>
                                <span className={styles.metaBadge}>
                                    <FiClock /> {quiz.time_limit_minutes || "Untimed"} min
                                </span>
                                <span className={styles.metaBadge}>
                                    <FiBookOpen /> {quiz.question_count || 0} Qs
                                </span>
                                <span className={styles.metaBadgePass}>
                                    <FiAward /> Passing score: {quiz.passing_score || 70}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className={styles.mainGrid}>
                {/* Left Column */}
                <div className={styles.leftCol}>
                    {/* About */}
                    <div className={`${styles.sectionCard} ${styles.animateIn}`}>
                        <h3 className={styles.sectionTitle}>About this quiz</h3>
                        <p className="text-secondary" style={{ lineHeight: "var(--leading-normal)" }}>
                            {quiz.description || "No description provided for this quiz."}
                        </p>
                        {quiz.tags && quiz.tags.length > 0 && (
                            <div style={{ marginTop: "var(--space-3)" }}>
                                <div className="text-xs text-muted" style={{ marginBottom: "var(--space-2)" }}>Topics covered:</div>
                                <div className={styles.badgesRow}>
                                    {quiz.tags.map(tag => (
                                        <span key={tag} className={styles.tagBadge}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sample Question Preview */}
                    {sampleQuestion && (
                        <div className={`${styles.sectionCard} ${styles.animateIn}`}>
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
                        <div className={`${styles.sectionCard} ${styles.animateIn}`}>
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
                                                <td>{formatDateSafe(att.submitted_at, "PP")}</td>
                                                <td className="font-semibold">{Math.round(att.score)}%</td>
                                                <td>
                                                    <span className={`${styles.resultBadge} ${att.passed ? styles.scorePass : styles.scoreFail}`}>
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
                    <div className={`${styles.sectionCard} ${styles.actionCard} ${styles.animateIn}`}>
                        <h3 className="h3 text-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <FiUserCheck style={{ fontSize: "1.3rem", color: "var(--color-accent)" }} /> Ready to learn?
                        </h3>
                        
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
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                        >
                            {activeAttempt ? "Resume Attempt" : "Start Quiz"}
                            <FiArrowRight />
                        </MainButton>
                    </div>

                    {/* Stats Panel */}
                    <div className={`${styles.sectionCard} ${styles.statsPanel} ${styles.animateIn}`}>
                        <h4 className="h5" style={{ display: "flex", alignItems: "center", gap: "6px" }}><FiAward style={{ color: "var(--color-accent)" }} /> Global Performance</h4>
                        
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
                                {quiz.pass_rate ? `${quiz.pass_rate > 1 ? Math.round(quiz.pass_rate) : Math.round(quiz.pass_rate * 100)}%` : "—"}
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
