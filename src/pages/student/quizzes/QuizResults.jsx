// react
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";

// date-fns
import { format } from "date-fns";

// redux
import { fetchAttemptById, selectCurrentAttempt } from "../../../redux/slices/attemptsSlice";
import { fetchMyCertificates, selectMyCertificates } from "../../../redux/slices/certificatesSlice";

// components
import MainButton from "../../../components/ui/button/MainButton";
import { toast } from "react-toastify";

// react-icons
import {
    FiClock,
    FiCheck,
    FiX,
    FiChevronDown,
    FiChevronUp,
    FiRotateCcw,
    FiBookOpen,
    FiArrowLeft,
    FiDownload,
    FiLink,
    FiZap,
    FiAward,
    FiFileText
} from "react-icons/fi";

// howler
import { Howl } from "howler";

// gsap
import { gsap } from "gsap";

// local
import styles from "./QuizResults.module.css";
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

// Initialize sounds with local fallbacks
const passSound = new Howl({ src: ["/sounds/pass.mp3", "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA="], html5: true, volume: 0.6, preload: true });
const failSound = new Howl({ src: ["/sounds/fail.mp3", "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA="], html5: true, volume: 0.6, preload: true });

// Safe play wrapper
const safePlay = (sound) => {
    try { sound.play(); } catch { /* ignore */ }
};

// Confetti burst helper using GSAP
const triggerConfetti = (element) => {
    if (!element) return;
    const colors = ["#22C55E", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899"];
    
    for (let i = 0; i < 70; i++) {
        const piece = document.createElement("div");
        piece.style.position = "absolute";
        piece.style.width = `${gsap.utils.random(6, 12)}px`;
        piece.style.height = `${gsap.utils.random(6, 12)}px`;
        piece.style.background = gsap.utils.random(colors);
        piece.style.borderRadius = gsap.utils.random(["50%", "0%"]);
        piece.style.top = "50%";
        piece.style.left = "50%";
        piece.style.pointerEvents = "none";
        piece.style.zIndex = "100";
        element.appendChild(piece);

        // Animate each particle outwards
        gsap.to(piece, {
            x: gsap.utils.random(-400, 400),
            y: gsap.utils.random(-350, 150),
            rotation: gsap.utils.random(0, 720),
            opacity: 0,
            scale: gsap.utils.random(0.5, 1.5),
            duration: gsap.utils.random(1.5, 2.8),
            ease: "power3.out",
            onComplete: () => piece.remove()
        });
    }
};

const QuizResults = () => {
    const { quizId, attemptId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const attempt = useSelector(selectCurrentAttempt);
    const certificates = useSelector(selectMyCertificates);

    // Local states
    const [animatedScore, setAnimatedScore] = useState(0);
    const [expandedQuestion, setExpandedQuestion] = useState({});
    const [loadingCert, setLoadingCert] = useState(false);

    const containerRef = useRef(null);
    const heroCardRef = useRef(null);
    const soundPlayedRef = useRef(false);
    const animTriggeredRef = useRef(false);

    // Entrance Animation
    usePageAnimation(containerRef, {
        ready: !!attempt
    });

    useEffect(() => {
        if (attemptId) {
            dispatch(fetchAttemptById(attemptId));
            dispatch(fetchMyCertificates());
        }
    }, [attemptId, dispatch]);

    // Score animated count-up + Confetti burst + Audio triggers
    useEffect(() => {
        if (attempt && !animTriggeredRef.current) {
            animTriggeredRef.current = true;

            // 1. GSAP count-up
            const scoreObj = { val: 0 };
            gsap.to(scoreObj, {
                val: attempt.score ?? 0,
                duration: 1.5,
                ease: "power3.out",
                onUpdate: () => setAnimatedScore(Math.round(scoreObj.val))
            });

            // 2. Play celebratory sounds (once)
            if (!soundPlayedRef.current) {
                soundPlayedRef.current = true;
                if (attempt.passed) {
                    safePlay(passSound);
                    // Custom GSAP confetti burst!
                    setTimeout(() => triggerConfetti(heroCardRef.current), 200);
                } else {
                    safePlay(failSound);
                }
            }
        }
    }, [attempt]);

    if (!attempt) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "var(--text-secondary)" }}>
                Loading attempt results...
            </div>
        );
    }

    // Toggle row expansion
    const toggleExpand = (qId) => {
        setExpandedQuestion(prev => ({
            ...prev,
            [qId]: !prev[qId]
        }));
    };

    // Find certificate for this attempt if exists
    const cert = (certificates || []).find(c => c.quiz?.id === quizId);

    const handleCopyVerifyLink = () => {
        if (cert) {
            const link = `${window.location.origin}/verify/${cert.certificate_code}`;
            navigator.clipboard.writeText(link);
            toast.success("Verification link copied to clipboard!");
        }
    };

    const handleDownloadCert = async () => {
        if (!cert?.pdf_url) return;
        setLoadingCert(true);
        try {
            // Since PDF storage URL is direct, we can open it in new tab or download
            window.open(cert.pdf_url, "_blank");
            toast.success("Opening certificate PDF...");
        } catch (err) {
            console.error(err);
            toast.error("Failed to load certificate link.");
        } finally {
            setLoadingCert(false);
        }
    };

    const formatTimeSpent = (secs) => {
        if (!secs) return "—";
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        return `${mins}m ${remSecs}s`;
    };

    const totalQuestions = attempt.total_questions || 0;
    const correctCount = attempt.correct_count || 0;
    const wrongCount = attempt.wrong_count || (totalQuestions - correctCount);

    return (
        <div ref={containerRef} className={styles.resultsLayout}>
            {/* Page Header Breadcrumb */}
            <div className="flex justify-between items-center" style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-3)" }}>
                <button
                    onClick={() => navigate("/student/quizzes")}
                    className="btn btn--ghost btn--sm"
                    style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                    <FiArrowLeft /> Back to Browse
                </button>
            </div>

            {/* Results Hero Card */}
            <div 
                ref={heroCardRef}
                className={`${styles.heroCard} ${attempt.passed ? styles.passHero : styles.failHero}`}
            >
                <div className={styles.gaugeContainer}>
                    <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                        <circle
                            cx="60"
                            cy="60"
                            r="50"
                            stroke="var(--border-default)"
                            strokeWidth="10"
                            fill="transparent"
                        />
                        <circle
                            cx="60"
                            cy="60"
                            r="50"
                            stroke={attempt.passed ? "var(--color-success)" : "var(--color-danger)"}
                            strokeWidth="10"
                            fill="transparent"
                            strokeDasharray={314}
                            strokeDashoffset={314 - (314 * animatedScore) / 100}
                            style={{ transition: "stroke-dashoffset 0.1s ease-out" }}
                        />
                    </svg>
                    <div className={styles.gaugeText}>{animatedScore}%</div>
                </div>

                <h1 className={`${styles.heroHeading} ${attempt.passed ? styles.passHeading : styles.failHeading}`}>
                    {attempt.passed ? <><FiAward style={{ marginRight: "8px", verticalAlign: "middle" }} /> Passed!</> : <><FiX style={{ marginRight: "8px", verticalAlign: "middle" }} /> Failed</>}
                </h1>

                <h3 className="h3" style={{ margin: 0 }}>{attempt.quiz?.title}</h3>
                
                <p className="text-xs text-muted" style={{ marginTop: "-4px" }}>
                    Completed on {format(new Date(attempt.submitted_at || attempt.started_at), "PPpp")}
                </p>

                {/* Stat Chips */}
                <div className={styles.statChips}>
                    <span className={styles.statChip}>
                        <FiClock /> Time Spent: {formatTimeSpent(attempt.time_spent_secs)}
                    </span>
                    <span className={styles.statChip} style={{ borderColor: "var(--border-success)" }}>
                        <FiCheck style={{ color: "var(--color-success)" }} /> Correct: {correctCount}
                    </span>
                    <span className={styles.statChip} style={{ borderColor: "var(--border-danger)" }}>
                        <FiX style={{ color: "var(--color-danger)" }} /> Incorrect: {wrongCount}
                    </span>
                </div>
            </div>

            {/* XP and Level Up Panel */}
            {attempt.xp_earned > 0 && (
                <div className={styles.xpEarnedCard}>
                    <div className="flex items-center gap-3">
                        <span className={styles.xpBadge}>
                            <FiZap /> +{attempt.xp_earned} XP
                        </span>
                        <div className="text-sm text-secondary font-semibold">
                            XP added to your profile level tracker!
                        </div>
                    </div>
                </div>
            )}

            {/* Certificate Section */}
            {attempt.passed && cert && (
                <div className={styles.certificateCard}>
                    <div className={styles.certThumb} role="img" aria-label="Certificate Badge">
                        <FiFileText style={{ fontSize: "2rem", color: "var(--color-accent)" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 className="h4 text-primary" style={{ margin: 0 }}>Certificate Issued</h4>
                        <p className="text-secondary text-xs" style={{ marginTop: "4px" }}>
                            Congratulations! You passed this quiz and earned a verified certificate.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCopyVerifyLink}
                            className="btn btn--outline btn--sm"
                            style={{ display: "flex", alignItems: "center", gap: "6px" }}
                        >
                            <FiLink /> Copy verify link
                        </button>
                        <MainButton
                            variant="primary"
                            size="sm"
                            onClick={handleDownloadCert}
                            isLoading={loadingCert}
                            style={{ display: "flex", alignItems: "center", gap: "6px" }}
                        >
                            <FiDownload /> Download Certificate
                        </MainButton>
                    </div>
                </div>
            )}

            {/* Answer Review Section */}
            <div className={styles.reviewSection}>
                <h3 className="h3">Answer Review</h3>
                
                {(attempt.attempt_answers || []).map((ans, idx) => {
                    const isExpanded = !!expandedQuestion[ans.id];
                    const qText = ans.question?.question_text || `Question ${idx + 1}`;
                    const correctOption = (ans.question?.question_options || []).find(o => o.is_correct);
                    const selectedOption = (ans.question?.question_options || []).find(o => o.id === ans.selected_option_id);

                    return (
                        <div 
                            key={ans.id} 
                            className={`${styles.reviewRow} ${ans.is_correct ? styles.correctRow : styles.incorrectRow}`}
                        >
                            {/* Header */}
                            <div 
                                className={styles.reviewHeader}
                                onClick={() => toggleExpand(ans.id)}
                            >
                                <span className={styles.questionIndicator}>
                                    {ans.is_correct ? (
                                        <FiCheck style={{ color: "var(--color-success)" }} />
                                    ) : (
                                        <FiX style={{ color: "var(--color-danger)" }} />
                                    )}
                                </span>
                                <div className={styles.questionText}>
                                    {qText}
                                </div>
                                <span>
                                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                </span>
                            </div>

                            {/* Body */}
                            {isExpanded && (
                                <div className={styles.reviewBody}>
                                    {ans.question?.image_url && (
                                        <img 
                                            src={ans.question.image_url} 
                                            alt="Question reference" 
                                            style={{ maxHeight: "160px", width: "auto", borderRadius: "var(--radius-sm)", marginBottom: "var(--space-2)" }} 
                                        />
                                    )}

                                    {/* Selected answer row */}
                                    <div 
                                        className={`${styles.optionSelectedRow} ${ans.is_correct ? styles.selectedCorrect : styles.selectedIncorrect}`}
                                    >
                                        <span>
                                            Your answer: <strong>{selectedOption ? selectedOption.option_text : "No answer selected"}</strong>
                                        </span>
                                        <span>{ans.is_correct ? <><FiCheck style={{ color: "var(--color-success)", marginRight: "4px" }} />Correct</> : <><FiX style={{ color: "var(--color-danger)", marginRight: "4px" }} />Incorrect</>}</span>
                                    </div>

                                    {/* Correct answer if wrong */}
                                    {!ans.is_correct && correctOption && (
                                        <div className={styles.correctAnswerLabel}>
                                            Correct answer: <strong>{correctOption.option_text}</strong>
                                        </div>
                                    )}

                                    {/* Explanation */}
                                    {ans.question?.explanation && (
                                        <div className={styles.explanationPanel}>
                                            <strong>Explanation:</strong>
                                            <p style={{ marginTop: "4px" }}>{ans.question.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Action Row */}
            <div className={styles.actionsRow}>
                <MainButton
                    variant="primary"
                    size="md"
                    onClick={() => navigate(`/student/quizzes/${quizId}`)}
                >
                    <FiRotateCcw /> Retake Quiz
                </MainButton>
                <MainButton
                    variant="secondary"
                    size="md"
                    onClick={() => navigate("/student/attempts")}
                >
                    <FiBookOpen /> View All Attempts
                </MainButton>
            </div>
        </div>
    );
};

export default QuizResults;
