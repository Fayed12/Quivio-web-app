// local
import { getQuizById } from "../../../services/quizzesService";
import ModalPortal from "./ModalPortal";
import styles from "./QuizPreviewModal.module.css";

// react
import { useState, useEffect, useRef, useCallback } from "react";

// gsap
import { gsap } from "gsap";

// icons
import {
    FiX,
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
    FiEye,
    FiChevronLeft,
    FiChevronRight,
    FiRotateCcw,
    FiHelpCircle,
    FiAward,
    FiBookOpen,
    FiCheck 
} from "react-icons/fi";

// Helper to extract questions array cleanly
function normalizeQuizQuestions(qObj) {
    if (!qObj) return [];
    if (qObj.normalizedQuestions) return qObj.normalizedQuestions;
    if (qObj.quiz_questions && Array.isArray(qObj.quiz_questions)) {
        return qObj.quiz_questions.map((qq, idx) => {
            const q = qq.question || qq;
            return {
                id: q.id || `q_${idx}`,
                question_text: q.question_text || "",
                question_type: q.question_type || "mcq",
                points: qq.points_override || q.points || 1,
                difficulty: q.difficulty || "medium",
                hint: q.hint || "",
                explanation: q.explanation || "",
                options: q.question_options || q.options || []
            };
        });
    }
    if (qObj.questions && Array.isArray(qObj.questions)) {
        return qObj.questions.map((q, idx) => ({
            id: q.id || `q_${idx}`,
            question_text: q.question_text || "",
            question_type: q.question_type || "mcq",
            points: q.points || 1,
            difficulty: q.difficulty || "medium",
            hint: q.hint || "",
            explanation: q.explanation || "",
            options: q.question_options || q.options || []
        }));
    }
    return [];
}

const QuizPreviewModal = ({ isOpen, onClose, quiz: passedQuiz, quizId }) => {
    const [loading, setLoading] = useState(false);
    const [quizData, setQuizData] = useState(null);
    const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showExplanations, setShowExplanations] = useState({});
    const [previewMode, setPreviewMode] = useState("student"); // "student" | "answerKey"
    
    // Timer simulation state
    const [simulatedTimeLeft, setSimulatedTimeLeft] = useState(null);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    const modalContentRef = useRef(null);
    const questionCardRef = useRef(null);

    const initTimer = useCallback((minutes) => {
        if (minutes && minutes > 0) {
            setSimulatedTimeLeft(minutes * 60);
            setIsTimerRunning(true);
        } else {
            setSimulatedTimeLeft(null);
            setIsTimerRunning(false);
        }
    }, []);

    const handleClose = () => {
        setActiveQuestionIdx(0);
        setSelectedAnswers({});
        setShowExplanations({});
        if (onClose) onClose();
    };

    // Load full quiz details if only quizId is passed
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;

        const loadData = async () => {
            if (passedQuiz && (passedQuiz.questions || passedQuiz.quiz_questions)) {
                // Normalize quiz questions structure
                const normalizedQuestions = normalizeQuizQuestions(passedQuiz);
                setQuizData({ ...passedQuiz, normalizedQuestions });
                initTimer(passedQuiz.time_limit_minutes);
            } else if (quizId) {
                setLoading(true);
                try {
                    const { data, error } = await getQuizById(quizId);
                    if (!error && data && isMounted) {
                        const normalizedQuestions = normalizeQuizQuestions(data);
                        setQuizData({ ...data, normalizedQuestions });
                        initTimer(data.time_limit_minutes);
                    }
                } catch (err) {
                    console.error("Failed to load preview quiz", err);
                } finally {
                    if (isMounted) setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [isOpen, quizId, passedQuiz, initTimer]);

    // Timer countdown effect
    useEffect(() => {
        let timer = null;
        if (isTimerRunning && simulatedTimeLeft !== null && simulatedTimeLeft > 0) {
            timer = setInterval(() => {
                setSimulatedTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isTimerRunning, simulatedTimeLeft]);

    // GSAP Entrance animation
    useEffect(() => {
        if (isOpen && modalContentRef.current) {
            gsap.fromTo(
                modalContentRef.current,
                { opacity: 0, scale: 0.93, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.2)" }
            );
        }
    }, [isOpen]);

    // GSAP Question Change animation
    useEffect(() => {
        if (questionCardRef.current) {
            gsap.fromTo(
                questionCardRef.current,
                { opacity: 0, x: 15 },
                { opacity: 1, x: 0, duration: 0.25, ease: "power2.out" }
            );
        }
    }, [activeQuestionIdx]);

    if (!isOpen) return null;

    const questions = quizData?.normalizedQuestions || [];
    const currentQ = questions[activeQuestionIdx];

    const handleSelectOption = (qId, optionId) => {
        if (previewMode === "answerKey") return;
        setSelectedAnswers(prev => ({
            ...prev,
            [qId]: optionId
        }));
    };

    const toggleExplanation = (qId) => {
        setShowExplanations(prev => ({
            ...prev,
            [qId]: !prev[qId]
        }));
    };

    const resetPreview = () => {
        setSelectedAnswers({});
        setShowExplanations({});
        setActiveQuestionIdx(0);
        if (quizData?.time_limit_minutes) {
            initTimer(quizData.time_limit_minutes);
        }
    };

    const formatTimer = (secs) => {
        if (secs === null) return "No limit";
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);

    return (
        <ModalPortal isOpen={isOpen} onClose={handleClose}>
            <div className={styles.overlay} onClick={handleClose}>
                <div 
                    className={styles.modalContainer} 
                    ref={modalContentRef} 
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerTitleGroup}>
                            <span className={styles.previewBadge}>
                                <FiEye /> Instructor Preview
                            </span>
                            <h2>{quizData?.title || "Quiz Preview"}</h2>
                        </div>
                        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
                            <FiX />
                        </button>
                    </div>

                    {/* Sub-header Controls Bar */}
                    <div className={styles.controlsBar}>
                        {/* Mode Selector */}
                        <div className={styles.modeToggle}>
                            <button
                                className={`${styles.modeBtn} ${previewMode === "student" ? styles.activeMode : ""}`}
                                onClick={() => setPreviewMode("student")}
                            >
                                <FiEye /> Interactive Student View
                            </button>
                            <button
                                className={`${styles.modeBtn} ${previewMode === "answerKey" ? styles.activeMode : ""}`}
                                onClick={() => setPreviewMode("answerKey")}
                            >
                                <FiCheckCircle /> Instructor Answer Key
                            </button>
                        </div>

                        {/* Quiz Stats & Timer */}
                        <div className={styles.metaBadgeGroup}>
                            <div className={styles.metaBadge}>
                                <FiBookOpen /> {questions.length} Questions
                            </div>
                            <div className={styles.metaBadge}>
                                <FiAward /> {totalPoints} Total Pts
                            </div>
                            <div className={styles.metaBadge}>
                                <FiClock /> {formatTimer(simulatedTimeLeft)}
                            </div>
                            <button className={styles.iconResetBtn} onClick={resetPreview} title="Reset Preview State">
                                <FiRotateCcw /> Reset
                            </button>
                        </div>
                    </div>

                    {/* Main Content Body */}
                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.spinner} />
                            <p>Loading Quiz Preview...</p>
                        </div>
                    ) : questions.length === 0 ? (
                        <div className={styles.emptyContainer}>
                            <FiAlertCircle className={styles.emptyIcon} />
                            <h3>No Questions Added Yet</h3>
                            <p>Add questions to this quiz in the question editor to preview them here.</p>
                        </div>
                    ) : (
                        <div className={styles.previewBody}>
                            {/* Questions Stepper Sidebar */}
                            <div className={styles.stepperContainer}>
                                <h4 className={styles.stepperTitle}>Questions List</h4>
                                <div className={styles.stepperList}>
                                    {questions.map((q, idx) => {
                                        const isAnswered = selectedAnswers[q.id] !== undefined;
                                        const isActive = idx === activeQuestionIdx;

                                        return (
                                            <button
                                                key={q.id || idx}
                                                className={`${styles.stepBtn} ${isActive ? styles.stepActive : ""} ${isAnswered ? styles.stepAnswered : ""}`}
                                                onClick={() => setActiveQuestionIdx(idx)}
                                            >
                                                <span className={styles.stepNum}>{idx + 1}</span>
                                                <span className={styles.stepText} title={q.question_text}>
                                                    {q.question_text || `Question ${idx + 1}`}
                                                </span>
                                                <span className={styles.stepPts}>{q.points}pt</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Active Question Display Card */}
                            <div className={styles.questionContainer} ref={questionCardRef}>
                                <div className={styles.questionHeader}>
                                    <div className={styles.qHeaderMeta}>
                                        <span className={styles.qBadge}>
                                            Question {activeQuestionIdx + 1} of {questions.length}
                                        </span>
                                        <span className={`${styles.diffTag} ${styles[currentQ?.difficulty || "medium"]}`}>
                                            {currentQ?.difficulty || "medium"}
                                        </span>
                                        <span className={styles.ptsTag}>
                                            {currentQ?.points || 1} {currentQ?.points === 1 ? "Point" : "Points"}
                                        </span>
                                    </div>
                                    <h3 className={styles.questionText}>{currentQ?.question_text}</h3>
                                </div>

                                {/* Options List */}
                                <div className={styles.optionsList}>
                                    {currentQ?.options?.map((opt, optIdx) => {
                                        const isSelected = selectedAnswers[currentQ.id] === opt.id;
                                        const isCorrect = opt.is_correct === true;
                                        
                                        let optionClass = styles.optionCard;
                                        if (previewMode === "student" && isSelected) {
                                            optionClass += ` ${styles.selectedOption}`;
                                        } else if (previewMode === "answerKey") {
                                            if (isCorrect) optionClass += ` ${styles.correctOption}`;
                                            else if (isSelected && !isCorrect) optionClass += ` ${styles.wrongOption}`;
                                        }

                                        return (
                                            <div
                                                key={opt.id || optIdx}
                                                className={optionClass}
                                                onClick={() => handleSelectOption(currentQ.id, opt.id)}
                                            >
                                                <div className={styles.optionRadio}>
                                                    {previewMode === "answerKey" ? (
                                                        isCorrect ? <FiCheck className={styles.checkIcon} /> : <span className={styles.radioDot} />
                                                    ) : (
                                                        <span className={`${styles.radioDot} ${isSelected ? styles.radioSelected : ""}`} />
                                                    )}
                                                </div>
                                                <div className={styles.optionLabel}>
                                                    {opt.option_text}
                                                </div>
                                                {previewMode === "answerKey" && isCorrect && (
                                                    <span className={styles.correctBadge}>
                                                        <FiCheckCircle /> Correct Answer
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Hint & Explanation Section */}
                                <div className={styles.explanationBox}>
                                    {currentQ?.hint && (
                                        <div className={styles.hintCard}>
                                            <FiHelpCircle className={styles.hintIcon} />
                                            <div>
                                                <strong>Hint:</strong> {currentQ.hint}
                                            </div>
                                        </div>
                                    )}

                                    {currentQ?.explanation && (
                                        <div className={styles.explanationCard}>
                                            <div className={styles.expHeader}>
                                                <span><strong>Explanation & Notes:</strong></span>
                                                {previewMode === "student" && (
                                                    <button
                                                        className={styles.toggleExpBtn}
                                                        onClick={() => toggleExplanation(currentQ.id)}
                                                    >
                                                        {showExplanations[currentQ.id] ? "Hide Explanation" : "Show Explanation"}
                                                    </button>
                                                )}
                                            </div>
                                            {(previewMode === "answerKey" || showExplanations[currentQ.id]) && (
                                                <p className={styles.expText}>{currentQ.explanation}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Controls */}
                    <div className={styles.footer}>
                        <button
                            className={styles.navBtn}
                            disabled={activeQuestionIdx === 0}
                            onClick={() => setActiveQuestionIdx(prev => Math.max(0, prev - 1))}
                        >
                            <FiChevronLeft /> Previous
                        </button>

                        <div className={styles.footerInfo}>
                            Quiz Preview Mode &bull; No attempt data will be saved
                        </div>

                        <button
                            className={styles.navBtn}
                            disabled={activeQuestionIdx === questions.length - 1}
                            onClick={() => setActiveQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
                        >
                            Next <FiChevronRight />
                        </button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
};

export default QuizPreviewModal;
