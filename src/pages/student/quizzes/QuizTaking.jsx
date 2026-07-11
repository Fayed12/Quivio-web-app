// react
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useSearchParams } from "react-router";

// redux
import { fetchQuizById, selectCurrentQuiz } from "../../../redux/slices/quizzesSlice";
import {
    fetchActiveAttempt,
    selectActiveAttempt,
    selectAttemptAnswers,
    selectFlagged,
    selectCurrentIndex,
    selectTimeRemaining,
    selectSubmitting,
    setCurrentIndex,
    setTimeRemaining,
    setAnswerLocal,
    saveAnswerThunk,
    toggleFlagThunk,
    updateProgressThunk,
    submitAttemptThunk,
    clearActiveAttempt
} from "../../../redux/slices/attemptsSlice";

// components
import MainButton from "../../../components/ui/button/MainButton";
import { toast } from "react-toastify";

// react-icons
import {
    FiFlag,
    FiHelpCircle,
    FiAlertCircle,
    FiCheckSquare,
    FiLogOut
} from "react-icons/fi";

// howler
import { Howl } from "howler";

// local
import styles from "./QuizTaking.module.css";
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

// Initialize sounds using Howler
const selectSound = new Howl({ src: ["https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav"], html5: true, volume: 0.4 });
const nextSound = new Howl({ src: ["https://assets.mixkit.co/active_storage/sfx/2571/2571-84.wav"], html5: true, volume: 0.3 });
const flagSound = new Howl({ src: ["https://assets.mixkit.co/active_storage/sfx/893/893-84.wav"], html5: true, volume: 0.4 });
const hintSound = new Howl({ src: ["https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav"], html5: true, volume: 0.5 });
const tickSound = new Howl({ src: ["https://assets.mixkit.co/active_storage/sfx/1004/1004-84.wav"], html5: true, volume: 0.2 });
const submitSound = new Howl({ src: ["https://assets.mixkit.co/active_storage/sfx/1435/1435-84.wav"], html5: true, volume: 0.6 });

// Seeded shuffle function for consistency across page refreshes
const seededShuffle = (array, seed) => {
    let m = 0x80000000; 
    let a = 1103515245;
    let c = 12345;
    
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    let state = hash;

    const nextRandom = () => {
        state = (a * state + c) % m;
        return state / m;
    };

    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(nextRandom() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const QuizTaking = () => {
    const { quizId } = useParams();
    const [searchParams] = useSearchParams();
    const attemptId = searchParams.get("attempt");
    
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const quiz = useSelector(selectCurrentQuiz);
    const activeAttempt = useSelector(selectActiveAttempt);
    const answers = useSelector(selectAttemptAnswers);
    const flagged = useSelector(selectFlagged) || [];
    const currentIndex = useSelector(selectCurrentIndex) || 0;
    const timeRemaining = useSelector(selectTimeRemaining);
    const submitting = useSelector(selectSubmitting);

    // Local states
    const [shuffledQuestions, setShuffledQuestions] = useState([]);
    const [showHint, setShowHint] = useState(false);
    const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    
    // Auto-save indicators
    const [saveStatus, setSaveStatus] = useState("saved"); // "saved" | "saving" | "saving_local" | "error"

    // Handle Auto-Submit
    const handleAutoSubmit = async () => {
        submitSound.play();
        toast.info("Time's up! Submitting your quiz...");
        const res = await dispatch(submitAttemptThunk(activeAttempt?.id));
        if (submitAttemptThunk.fulfilled.match(res)) {
            navigate(`/student/quiz/${quizId}/results/${activeAttempt?.id}`);
        } else {
            toast.error("Auto submit failed. Trying local recovery.");
        }
    };

    const containerRef = useRef(null);

    // Entrance Animation
    usePageAnimation(containerRef, {
        ready: shuffledQuestions.length > 0
    });

    // Mount loads
    useEffect(() => {
        if (quizId && attemptId) {
            dispatch(fetchQuizById(quizId));
            dispatch(fetchActiveAttempt(quizId));
        }
        return () => {
            dispatch(clearActiveAttempt());
        };
    }, [quizId, attemptId, dispatch]);

    // Handle Shuffling with consistency
    useEffect(() => {
        if (quiz?.quiz_questions && attemptId) {
            let questionsList = quiz.quiz_questions.map(qq => qq.question).filter(Boolean);

            if (quiz.shuffle_questions) {
                questionsList = seededShuffle(questionsList, attemptId);
            }

            // Shuffle options if enabled
            const processed = questionsList.map(q => {
                if (quiz.shuffle_answers && q.question_options) {
                    return {
                        ...q,
                        question_options: seededShuffle(q.question_options, attemptId + q.id)
                    };
                }
                return q;
            });

            setShuffledQuestions(processed);
        }
    }, [quiz, attemptId]);

    // Countdown Timer logic
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        const interval = setInterval(() => {
            const nextTime = timeRemaining - 1;
            dispatch(setTimeRemaining(nextTime));

            // Tick sound warning if < 5 mins (300 secs), tick every 10s
            if (nextTime < 300 && nextTime > 0 && nextTime % 10 === 0) {
                tickSound.play();
            }

            // Trigger auto-submit when timer hits 0
            if (nextTime <= 0) {
                clearInterval(interval);
                handleAutoSubmit();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timeRemaining, dispatch]);

    // 2-second auto-save cycle
    useEffect(() => {
        if (!activeAttempt || shuffledQuestions.length === 0) return;

        const interval = setInterval(async () => {
            setSaveStatus("saving");
            
            try {
                // Update time remaining in DB
                await dispatch(updateProgressThunk({
                    id: activeAttempt.id,
                    current_question_order: currentIndex,
                    time_remaining_secs: timeRemaining
                }));

                // Save answers to database
                const currentQuestion = shuffledQuestions[currentIndex];
                const selectedOptionId = answers[currentQuestion.id];
                
                if (selectedOptionId) {
                    await dispatch(saveAnswerThunk({
                        attempt_id: activeAttempt?.id,
                        question_id: currentQuestion?.id,
                        selected_option_id: selectedOptionId,
                        time_spent_secs: 2
                    }));
                }

                setSaveStatus("saved");
            } catch (err) {
                console.error("Auto save failed, writing to localStorage:", err);
                // Save locally
                localStorage.setItem(`attempt_backup:${activeAttempt?.id}`, JSON.stringify({
                    answers,
                    timeRemaining,
                    currentIndex
                }));
                setSaveStatus("saving_local");
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [activeAttempt, shuffledQuestions, currentIndex, answers, timeRemaining, dispatch]);



    // Manual Submit Action
    const handleManualSubmit = async () => {
        submitSound.play();
        setShowSubmitModal(false);
        const res = await dispatch(submitAttemptThunk(activeAttempt?.id));
        if (submitAttemptThunk.fulfilled.match(res)) {
            toast.success("Quiz submitted successfully!");
            navigate(`/student/quiz/${quizId}/results/${activeAttempt?.id}`);
        } else {
            toast.error(res.payload || "Failed to submit attempt.");
        }
    };

    // Navigator actions
    const handleSelectOption = (optionId) => {
        selectSound.play();
        const currentQuestion = shuffledQuestions[currentIndex];
        dispatch(setAnswerLocal({
            question_id: currentQuestion?.id,
            selected_option_id: optionId
        }));
    };

    const handleFlagToggle = () => {
        flagSound.play();
        const currentQuestion = shuffledQuestions[currentIndex];
        const isFlagged = flagged.includes(currentQuestion?.id);
        dispatch(toggleFlagThunk({
            attemptId: activeAttempt?.id,
            questionId: currentQuestion?.id,
            flagged: !isFlagged
        }));
    };

    const handleNext = () => {
        if (currentIndex < shuffledQuestions.length - 1) {
            nextSound.play();
            dispatch(setCurrentIndex(currentIndex + 1));
            setShowHint(false);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            nextSound.play();
            dispatch(setCurrentIndex(currentIndex - 1));
            setShowHint(false);
        }
    };

    const handleExit = () => {
        setShowExitModal(false);
        navigate(`/student/quizzes/${quizId}`);
    };

    if (shuffledQuestions.length === 0 || !activeAttempt) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "var(--text-secondary)" }}>
                Initializing attempt...
            </div>
        );
    }

    const currentQuestion = shuffledQuestions[currentIndex];
    const totalQuestions = shuffledQuestions.length;

    // Progress bar math
    const answeredCount = Object.keys(answers).length;
    const progressPercent = (answeredCount / totalQuestions) * 100;

    // Format timer display (MM:SS)
    const formatTime = (secs) => {
        if (secs === null) return "—";
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div ref={containerRef} className={styles.takingLayout}>
            {/* Top Bar */}
            <div className={styles.minimalTopbar}>
                <div className={styles.topbarLeft}>
                    <MainButton 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setShowExitModal(true)}
                    >
                        <FiLogOut /> Exit
                    </MainButton>
                    <span className={styles.questionCounter}>
                        Question {currentIndex + 1} of {totalQuestions}
                    </span>
                </div>
                
                <div className={styles.topbarRight}>
                    <div className={`${styles.timer} ${timeRemaining < 300 ? styles.timerUrgent : ""}`}>
                        {formatTime(timeRemaining)}
                    </div>
                    <MainButton
                        variant="primary"
                        size="sm"
                        onClick={() => setShowSubmitModal(true)}
                        disabled={submitting}
                        isLoading={submitting}
                    >
                        Submit Quiz
                    </MainButton>
                </div>
            </div>

            {/* Top Progress bar */}
            <div className={styles.topProgressBar}>
                <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
            </div>

            {/* Main Area */}
            <div className={styles.contentArea}>
                <div className={styles.questionContainer}>
                    {/* Hint popover */}
                    {showHint && currentQuestion?.hint && (
                        <div className={styles.hintPopover}>
                            <FiHelpCircle className={styles.hintIcon} />
                            <div>
                                <strong style={{ color: "var(--color-warning-hover)" }}>Hint:</strong>
                                <p style={{ fontSize: "var(--text-sm)", marginTop: "4px" }}>{currentQuestion?.hint}</p>
                                <span className="text-xs text-muted" style={{ display: "block", marginTop: "8px" }}>
                                    Note: Using hints may affect your final statistics logs.
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Question Card */}
                    <div className={styles.questionCard}>
                        <div className={styles.questionHeader}>
                            <span className={styles.questionIndex}>Question {currentIndex + 1}</span>
                            {currentQuestion?.hint ? (
                                <button
                                    onClick={() => {
                                        hintSound.play();
                                        setShowHint(!showHint);
                                    }}
                                    className={styles.hintBtn}
                                >
                                    💡 Hint
                                </button>
                            ) : (
                                <span className="text-xs text-muted" title="No hint available">No hint</span>
                            )}
                        </div>

                        {currentQuestion?.image_url && (
                            <img 
                                src={currentQuestion?.image_url} 
                                alt="Question context" 
                                className={styles.questionImage} 
                            />
                        )}

                        <h2 className={styles.questionText}>
                            {currentQuestion?.question_text}
                        </h2>

                        {/* Options depending on Question Type */}
                        {currentQuestion?.question_type === "tf" ? (
                            <div className={styles.tfSplit}>
                                {["True", "False"].map((tfOpt) => {
                                    // True/False matches question option matching tfOpt text
                                    const opt = (currentQuestion?.question_options || []).find(
                                        o => o.option_text.toLowerCase() === tfOpt.toLowerCase()
                                    ) || { id: tfOpt, option_text: tfOpt };
                                    
                                    const isSelected = answers[currentQuestion?.id] === opt.id;

                                    return (
                                        <div
                                            key={opt.id}
                                            onClick={() => handleSelectOption(opt?.id)}
                                            className={`${styles.optionCard} ${styles.tfCard} ${isSelected ? styles.optionSelected : ""}`}
                                        >
                                            <span className={styles.optionText}>{tfOpt}</span>
                                            <div className={`${styles.radioDot} ${isSelected ? styles.radioDotSelected : ""}`}>
                                                {isSelected && <div className={styles.radioDotInner} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={styles.optionsStack}>
                                {(currentQuestion?.question_options || []).map((opt) => {
                                    const isSelected = answers[currentQuestion?.id] === opt?.id;
                                    return (
                                        <div
                                            key={opt?.id}
                                            onClick={() => handleSelectOption(opt?.id)}
                                            className={`${styles.optionCard} ${isSelected ? styles.optionSelected : ""}`}
                                        >
                                            <span className={styles.optionText}>{opt?.option_text}</span>
                                            <div className={`${styles.radioDot} ${isSelected ? styles.radioDotSelected : ""}`}>
                                                {isSelected && <div className={styles.radioDotInner} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Nav */}
            <div className={styles.bottomNav}>
                <MainButton
                    variant="secondary"
                    size="md"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                >
                    ← Previous
                </MainButton>

                <div className={styles.autoSaveIndicator}>
                    {saveStatus === "saved" && "✓ Saved to cloud"}
                    {saveStatus === "saving" && "Saving..."}
                    {saveStatus === "saving_local" && "⚠️ Offline: saved locally"}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleFlagToggle}
                        className="btn btn--outline btn--md"
                        style={{ display: "flex", alignItems: "center", gap: "6px", borderColor: flagged.includes(currentQuestion.id) ? "var(--color-warning)" : "" }}
                        title="Flag for review"
                    >
                        <FiFlag fill={flagged.includes(currentQuestion.id) ? "var(--color-warning)" : "none"} style={{ color: flagged.includes(currentQuestion.id) ? "var(--color-warning)" : "" }} />
                        <span style={{ color: flagged.includes(currentQuestion.id) ? "var(--color-warning-hover)" : "" }}>Flag</span>
                    </button>

                    <MainButton
                        variant="primary"
                        size="md"
                        onClick={handleNext}
                        disabled={currentIndex === totalQuestions - 1 || !answers[currentQuestion.id]}
                    >
                        Next →
                    </MainButton>
                </div>
            </div>

            {/* Question Navigator Drawer */}
            {totalQuestions > 5 && (
                <>
                    <div 
                        className={styles.navigatorToggle}
                        onClick={() => setIsNavigatorOpen(!isNavigatorOpen)}
                    >
                        {isNavigatorOpen ? "→" : "📂"}
                    </div>
                    <div className={`${styles.drawer} ${isNavigatorOpen ? styles.drawerOpen : ""}`}>
                        <h4 className="h5">Question Navigator</h4>
                        <div className={styles.navigatorGrid}>
                            {shuffledQuestions.map((q, idx) => {
                                const isCurrent = idx === currentIndex;
                                const isAnswered = !!answers[q.id];
                                const isFlagged = flagged.includes(q.id);

                                let boxClass = styles.navigatorBox;
                                if (isCurrent) boxClass += ` ${styles.boxCurrent}`;
                                if (isAnswered) boxClass += ` ${styles.boxAnswered}`;
                                if (isFlagged) boxClass += ` ${styles.boxFlagged}`;

                                return (
                                    <div
                                        key={q.id}
                                        onClick={() => {
                                            nextSound.play();
                                            dispatch(setCurrentIndex(idx));
                                            setIsNavigatorOpen(false);
                                        }}
                                        className={boxClass}
                                    >
                                        {idx + 1}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Exit confirmation modal */}
            {showExitModal && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modalContent}>
                        <div className="flex items-center gap-2" style={{ color: "var(--color-danger)" }}>
                            <FiAlertCircle style={{ fontSize: "1.5rem" }} />
                            <h3 className="h3">Exit Quiz?</h3>
                        </div>
                        <p className="text-secondary text-sm">
                            Are you sure you want to exit? Your progress is saved, and you can resume this attempt later.
                        </p>
                        <div className={styles.modalActions}>
                            <MainButton variant="ghost" onClick={() => setShowExitModal(false)}>
                                Stay
                            </MainButton>
                            <MainButton variant="danger" onClick={handleExit}>
                                Exit & Resume Later
                            </MainButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit confirmation modal */}
            {showSubmitModal && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modalContent}>
                        <div className="flex items-center gap-2" style={{ color: "var(--color-accent)" }}>
                            <FiCheckSquare style={{ fontSize: "1.5rem" }} />
                            <h3 className="h3">Ready to submit?</h3>
                        </div>
                        <div className="text-sm text-secondary flex flex-col gap-2">
                            <div>Answered: <strong>{answeredCount} / {totalQuestions}</strong></div>
                            {totalQuestions - answeredCount > 0 && (
                                <div style={{ color: "var(--color-warning-hover)" }}>
                                    ⚠️ Unanswered: <strong>{totalQuestions - answeredCount}</strong>
                                </div>
                            )}
                            <div>Flagged for review: <strong>{flagged.length}</strong></div>
                            <div>Time remaining: <strong>{formatTime(timeRemaining)}</strong></div>
                        </div>
                        <div className={styles.modalActions}>
                            {totalQuestions - answeredCount > 0 && (
                                <MainButton 
                                    variant="outline" 
                                    onClick={() => {
                                        const unAnsIdx = shuffledQuestions.findIndex(q => !answers[q.id]);
                                        if (unAnsIdx !== -1) {
                                            dispatch(setCurrentIndex(unAnsIdx));
                                        }
                                        setShowSubmitModal(false);
                                    }}
                                >
                                    Jump to unanswered
                                </MainButton>
                            )}
                            <MainButton variant="ghost" onClick={() => setShowSubmitModal(false)}>
                                Cancel
                            </MainButton>
                            <MainButton variant="primary" onClick={handleManualSubmit}>
                                Submit Quiz
                            </MainButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizTaking;
