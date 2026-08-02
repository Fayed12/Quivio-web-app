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
import PracticeRecommendations from "./components/PracticeRecommendations";

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
            {/* Modern Page Header & Results Overview */}
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
                                <FiClock /> {formatTimeSpent(attempt.time_spent_secs)}
                            </span>
                            <span className={`${styles.statChip} ${styles.chipCorrect}`}>
                                <FiCheck /> {correctCount} Correct
                            </span>
                            <span className={`${styles.statChip} ${styles.chipIncorrect}`}>
                                <FiX /> {wrongCount} Incorrect
                            </span>
                        </div>
                    </div>

                    <div className={styles.headerGaugeSection} ref={heroCardRef}>
                        <div className={styles.gaugeCard}>
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
                                <div className={styles.gaugeTextGroup}>
                                    <div className={styles.gaugeText}>{animatedScore}%</div>
                                    <span className={styles.gaugeLabel}>Score</span>
                                </div>
                            </div>
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
                    <div className={styles.xpCardContent}>
                        <span className={styles.xpBadge}>
                            <FiZap /> +{attempt.xp_earned} XP
                        </span>
                        <div className={styles.xpText}>
                            XP added to your profile level tracker!
                        </div>
                    </div>
                </div>
            )}

            {/* Answer Review Section */}
            <div className={`${styles.reviewSection} ${styles.staggerItem}`}>
                <div className={styles.reviewSectionHeader}>
                    <h3 className={styles.reviewSectionTitle}>Answer Review</h3>
                    <span className={styles.reviewSectionSubtitle}>
                        Click any question to view detailed options and explanations
                    </span>
                </div>
                
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
                                <div className={`${styles.questionIndicator} ${ans.is_correct ? styles.indicatorCorrect : styles.indicatorIncorrect}`}>
                                    {ans.is_correct ? <FiCheck /> : <FiX />}
                                </div>
                                <div className={styles.questionTitleGroup}>
                                    <span className={styles.questionNumber}>Question {idx + 1}</span>
                                    <div className={styles.questionText}>{qText}</div>
                                </div>
                                <div className={styles.expandBadge}>
                                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                </div>
                            </div>

                            {/* Body */}
                            {isExpanded && (
                                <div className={styles.reviewBody}>
                                    {ans.question?.image_url && (
                                        <div className={styles.imageContainer}>
                                            <img 
                                                src={ans.question.image_url} 
                                                alt="Question reference" 
                                                className={styles.questionImg}
                                            />
                                        </div>
                                    )}

                                    {/* Selected answer row */}
                                    <div 
                                        className={`${styles.optionSelectedRow} ${ans.is_correct ? styles.selectedCorrect : styles.selectedIncorrect}`}
                                    >
                                        <div className={styles.answerTextLabel}>
                                            <span className={styles.labelText}>Your Answer:</span>
                                            <strong>{selectedOption ? selectedOption.option_text : "No answer selected"}</strong>
                                        </div>
                                        <span className={`${styles.resultBadge} ${ans.is_correct ? styles.resultBadgePass : styles.resultBadgeFail}`}>
                                            {ans.is_correct ? <><FiCheck /> Correct</> : <><FiX /> Incorrect</>}
                                        </span>
                                    </div>

                                    {/* Correct answer if wrong */}
                                    {!ans.is_correct && correctOption && (
                                        <div className={styles.correctAnswerLabel}>
                                            <span className={styles.labelText}>Correct Answer:</span>
                                            <strong>{correctOption.option_text}</strong>
                                        </div>
                                    )}

                                    {/* Explanation */}
                                    {ans.question?.explanation && (
                                        <div className={styles.explanationPanel}>
                                            <strong>Explanation:</strong>
                                            <p>{ans.question.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Practice Recommendations & Skill Breakdown */}
            <div className={styles.staggerItem}>
                <PracticeRecommendations attempt={attempt} />
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
