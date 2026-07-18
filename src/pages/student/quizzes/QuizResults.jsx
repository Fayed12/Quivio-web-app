// react
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";

// date-fns
import { format } from "date-fns";

// react-pdf
import { pdf } from "@react-pdf/renderer";
import CertificatePDF from "../profile/CertificatePDF";

// redux
import { fetchAttemptById, selectCurrentAttempt } from "../../../redux/slices/attemptsSlice";
import { fetchMyCertificates, selectMyCertificates } from "../../../redux/slices/certificatesSlice";
import { selectUser } from "../../../redux/slices/authSlice";
import { fetchMyProfile, selectMyProfile } from "../../../redux/slices/profilesSlice";

// components
import MainButton from "../../../components/ui/button/MainButton";
import { toast } from "react-toastify";
import CircularProgress from "@mui/material/CircularProgress";

// react-icons
import {
    FiClock,
    FiCheck,
    FiX,
    FiChevronDown,
    FiChevronUp,
    FiBookOpen,
    FiArrowLeft,
    FiDownload,
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
    const user = useSelector(selectUser);
    const profile = useSelector(selectMyProfile);

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
        ready: !!attempt,
        staggerSelector: `.${styles.staggerItem}`
    });

    useEffect(() => {
        if (attemptId) {
            dispatch(fetchAttemptById(attemptId));
            dispatch(fetchMyCertificates());
            dispatch(fetchMyProfile());
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
            <div style={{ 
                display: "flex", 
                flexDirection: "column",
                justifyContent: "center", 
                alignItems: "center", 
                minHeight: "60vh", 
                color: "var(--text-secondary)",
                gap: "var(--space-4)"
            }}>
                <CircularProgress size={40} style={{ color: "var(--color-accent)" }} />
                <div>Loading attempt results...</div>
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
    const cert = (certificates || []).find(c => c.quiz?.id === quizId || c.quiz_id === quizId);

    const handleDownloadCert = async () => {
        if (!cert) return;
        setLoadingCert(true);
        try {
            toast.info("Generating certificate PDF...");
            
            // Render document to blob
            const doc = <CertificatePDF cert={cert} profileName={profile?.full_name || user?.email || "Student"} />;
            const blob = await pdf(doc).toBlob();
            
            // Create object URL and download
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Certificate_${cert.quiz?.title?.replace(/\s+/g, "_") || "Completion"}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast.success("Certificate downloaded successfully!");
        } catch (err) {
            console.error("PDF generation failed:", err);
            toast.error("Could not generate certificate PDF. Please try again.");
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
            {/* Modern Page Header & Results Overview with animated opening */}
            <div className={`${styles.pageHeader} ${styles.staggerItem}`}>
                <div className={styles.headerTop}>
                    <button
                        onClick={() => navigate("/student/quizzes")}
                        className={styles.backBtn}
                    >
                        <FiArrowLeft /> Back to Browse
                    </button>
                    <span className={styles.breadcrumbDivider}>/</span>
                    <span className={styles.breadcrumbCurrent}>Quiz Results</span>
                </div>
                
                <div className={styles.headerMain}>
                    <div className={styles.headerInfo}>
                        <h1 className={styles.quizTitle}>{attempt.quiz?.title || "Quiz"}</h1>
                        <p className={styles.completionDate}>
                            Completed on {format(new Date(attempt.submitted_at || attempt.started_at), "PPpp")}
                        </p>
                        
                        <div className={styles.heroStats}>
                            <div className={`${styles.statusBadge} ${attempt.passed ? styles.passedBadge : styles.failedBadge}`}>
                                {attempt.passed ? <FiAward /> : <FiX />}
                                {attempt.passed ? "Passed" : "Failed"}
                            </div>
                            <span className={styles.statChip}>
                                <FiClock /> Time Spent: {formatTimeSpent(attempt.time_spent_secs)}
                            </span>
                            <span className={styles.statChip} style={{ borderLeft: "3px solid var(--color-success)" }}>
                                <FiCheck style={{ color: "var(--color-success)" }} /> {correctCount} Correct
                            </span>
                            <span className={styles.statChip} style={{ borderLeft: "3px solid var(--color-danger)" }}>
                                <FiX style={{ color: "var(--color-danger)" }} /> {wrongCount} Incorrect
                            </span>
                        </div>
                    </div>

                    <div className={styles.headerGaugeSection} ref={heroCardRef}>
                        <div className={styles.gaugeContainer}>
                            <svg width="100" height="100" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="50"
                                    stroke="var(--bg-surface-3)"
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
                    </div>
                </div>

                {/* Certificate Banner Card inside Page Header if passed */}
                {attempt.passed && cert && (
                    <div className={styles.headerCertCard}>
                        <div className={styles.certIconWrapper}>
                            <FiFileText className={styles.certAwardIcon} />
                        </div>
                        <div className={styles.certInfo}>
                            <h3>Certificate Issued</h3>
                            <p>Congratulations! You passed this quiz and earned a verified certificate of completion.</p>
                            <div className={styles.certCode}>
                                Certificate Code: <code>{cert.certificate_code}</code>
                            </div>
                        </div>
                        <div className={styles.certActions}>
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
            </div>

            {/* XP and Level Up Panel */}
            {attempt.xp_earned > 0 && (
                <div className={`${styles.xpEarnedCard} ${styles.staggerItem}`}>
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

            {/* Answer Review Section */}
            <div className={`${styles.reviewSection} ${styles.staggerItem}`}>
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
            <div className={`${styles.actionsRow} ${styles.staggerItem}`}>
                <MainButton
                    variant="primary"
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
