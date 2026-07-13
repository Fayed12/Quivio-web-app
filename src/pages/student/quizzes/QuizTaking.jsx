// react
import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useSearchParams } from "react-router";

// redux
import { fetchQuizById, selectCurrentQuiz } from "../../../redux/slices/quizzesSlice";
import {
    fetchAttemptForTaking,
    selectActiveAttempt,
    selectAttemptAnswers,
    selectFlagged,
    selectCurrentIndex,
    selectTimeRemaining,
    selectSubmitting,
    setCurrentIndex,
    setTimeRemaining,
    setAnswerLocal,
    setFlaggedLocal,
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
    FiClock
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

// Helper: check if a question_type is True/False
const isTrueFalseType = (type) => type === "true_false" || type === "tf";

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
    const attemptLoading = useSelector(s => s.attempts.loading);
    const attemptError = useSelector(s => s.attempts.error);

    // Local states
    const [shuffledQuestions, setShuffledQuestions] = useState([]);
    const [showHint, setShowHint] = useState(false);
    const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showTimesUpModal, setShowTimesUpModal] = useState(false);
    
    // Auto-save indicators
    const [saveStatus, setSaveStatus] = useState("saved"); // "saved" | "saving" | "saving_local" | "error"

    // Ref to prevent double auto-submit
    const autoSubmittedRef = useRef(false);

    // Handle Auto-Submit when timer expires
    const handleAutoSubmit = useCallback(async () => {
        if (autoSubmittedRef.current) return;
        autoSubmittedRef.current = true;

        submitSound.play();
        setShowTimesUpModal(true);

        const res = await dispatch(submitAttemptThunk(activeAttempt?.id));
        if (submitAttemptThunk.fulfilled.match(res)) {
            // Short delay so the user sees the "Time's Up" message
            setTimeout(() => {
                navigate(`/student/quiz/${quizId}/results/${activeAttempt?.id}`);
            }, 2500);
        } else {
            toast.error("Auto submit failed. Trying local recovery.");
            setShowTimesUpModal(false);
            autoSubmittedRef.current = false;
        }
    }, [activeAttempt?.id, dispatch, navigate, quizId]);

    const containerRef = useRef(null);

    // Entrance Animation
    usePageAnimation(containerRef, {
        ready: shuffledQuestions.length > 0
    });

    // Mount loads
    useEffect(() => {
        if (quizId && attemptId) {
            dispatch(fetchQuizById(quizId));
            dispatch(fetchAttemptForTaking(attemptId));
        }
        return () => {
            dispatch(clearActiveAttempt());
        };
    }, [quizId, attemptId, dispatch]);

    // Handle Shuffling with consistency + filter invalid questions
    useEffect(() => {
        if (quiz?.quiz_questions && attemptId) {
            let questionsList = quiz.quiz_questions
                .map(qq => qq.question)
                .filter(q => q && q.id && q.question_text && (q.question_options?.length > 0 || isTrueFalseType(q.question_type)));

            if (quiz.shuffle_questions) {
                questionsList = seededShuffle(questionsList, attemptId);
            }

            // Shuffle options if enabled
            const processed = questionsList.map(q => {
                if (quiz.shuffle_answers && q.question_options) {
                    return {
                        ...q,
                        question_options: seededShuffle(q.question_options, attemptId + q?.id)
                    };
                }
                return q;
            });

            setShuffledQuestions(processed);
        }
    }, [quiz, attemptId]);

    // Browser lockdown: block tab/window close
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "You are in the middle of a quiz. Your progress may be lost if you leave.";
            return e.returnValue;
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    // Browser lockdown: block browser back/forward navigation
    useEffect(() => {
        // Push an extra history entry so we can intercept the back button
        window.history.pushState(null, "", window.location.href);

        const handlePopState = () => {
            // Re-push to stay on the page
            window.history.pushState(null, "", window.location.href);
            toast.warning("You cannot leave the quiz. Please submit your answers first.", { toastId: "back-blocked" });
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

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
    }, [timeRemaining, dispatch, handleAutoSubmit]);

    // 2-second auto-save cycle
    useEffect(() => {
        if (!activeAttempt || shuffledQuestions.length === 0) return;

        const interval = setInterval(async () => {
            setSaveStatus("saving");
            
            try {
                // Update time remaining in DB
                await dispatch(updateProgressThunk({
                    id: activeAttempt?.id,
                    current_question_order: currentIndex,
                    time_remaining_secs: timeRemaining
                }));

                // Save answers to database
                const currentQuestion = shuffledQuestions[currentIndex];
                const selectedOptionId = answers[currentQuestion?.id];
                
                if (selectedOptionId && currentQuestion?.id) {
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
        const currentQuestion = shuffledQuestions[currentIndex];
        const questionId = currentQuestion?.id;

        // Guard: don't dispatch if questionId is null/undefined
        if (!questionId) {
            toast.error("Cannot flag this question.");
            return;
        }

        flagSound.play();
        const isFlagged = flagged.includes(questionId);

        // Optimistic local update
        const newFlagged = isFlagged
            ? flagged.filter(id => id !== questionId)
            : [...flagged, questionId];
        dispatch(setFlaggedLocal(newFlagged));

        // Persist to server
        dispatch(toggleFlagThunk({
            attemptId: activeAttempt?.id,
            questionId,
            flagged: !isFlagged
        })).then((res) => {
            if (toggleFlagThunk.rejected.match(res)) {
                // Rollback on failure
                dispatch(setFlaggedLocal(flagged));
                toast.error("Failed to update flag. Please try again.");
            }
        });
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

    // Guard: missing attemptId in URL
    if (!attemptId) {
        return (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", gap: "var(--space-3)" }}>
                <span style={{ fontSize: "2rem" }}>⚠️</span>
                <p style={{ color: "var(--text-secondary)" }}>No attempt ID found. Please start the quiz from the quiz detail page.</p>
                <MainButton variant="primary" onClick={() => navigate(`/student/quizzes/${quizId}`)}>
                    Go to Quiz Detail
                </MainButton>
            </div>
        );
    }

    // Guard: error loading attempt
    if (attemptError && !activeAttempt) {
        return (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", gap: "var(--space-3)" }}>
                <span style={{ fontSize: "2rem" }}>❌</span>
                <p style={{ color: "var(--text-danger)" }}>Failed to load attempt: {typeof attemptError === 'string' ? attemptError : 'Unknown error'}</p>
                <MainButton variant="primary" onClick={() => navigate(`/student/quizzes/${quizId}`)}>
                    Go Back
                </MainButton>
            </div>
        );
    }

    if (shuffledQuestions.length === 0 || !activeAttempt) {
        return (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "var(--text-secondary)", gap: "var(--space-3)" }}>
                <div>Initializing attempt...</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textAlign: "center" }}>
                    <div>Quiz loaded: {quiz ? '✅' : '⏳'} {quiz ? `(${quiz.quiz_questions?.length ?? 0} questions)` : ''}</div>
                    <div>Attempt loaded: {activeAttempt ? '✅' : attemptLoading ? '⏳ Loading...' : '❌ Not loaded'}</div>
                    <div>Questions ready: {shuffledQuestions.length > 0 ? '✅' : '⏳'}</div>
                    {attemptError && <div style={{ color: "var(--text-danger)" }}>Error: {String(attemptError)}</div>}
                </div>
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

    // Check if current question is T/F
    const isCurrentTF = isTrueFalseType(currentQuestion?.question_type);

    return (
        <div ref={containerRef} className={styles.takingLayout}>
            {/* Top Bar */}
            <div className={styles.minimalTopbar}>
                <div className={styles.topbarLeft}>
                    <span className={styles.quizTitle}>
                        📝 {quiz?.title || "Quiz"}
                    </span>
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
                            <div className={styles.questionHeaderLeft}>
                                <span className={styles.questionIndex}>Question {currentIndex + 1}</span>
                                <span className={styles.questionTypeBadge}>
                                    {isCurrentTF ? "True / False" : "Multiple Choice"}
                                </span>
                            </div>
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
                            {currentQuestion?.question_text || (
                                <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                                    This question has no text. Please skip to the next question.
                                </span>
                            )}
                        </h2>

                        {/* Options depending on Question Type */}
                        {isCurrentTF ? (
                            <div className={styles.tfSplit}>
                                {["True", "False"].map((tfOpt) => {
                                    // True/False matches question option matching tfOpt text
                                    const opt = (currentQuestion?.question_options || []).find(
                                        o => o.option_text?.toLowerCase() === tfOpt.toLowerCase()
                                    ) || { id: tfOpt, option_text: tfOpt };
                                    
                                    const isSelected = answers[currentQuestion?.id] === opt?.id;

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

                <div className={styles.bottomNavActions}>
                    <button
                        onClick={handleFlagToggle}
                        className={`${styles.flagBtn} ${flagged.includes(currentQuestion?.id) ? styles.flagBtnActive : ""}`}
                        title="Flag for review"
                    >
                        <FiFlag fill={flagged.includes(currentQuestion?.id) ? "var(--color-warning)" : "none"} />
                        <span>Flag</span>
                    </button>

                    <MainButton
                        variant="primary"
                        size="md"
                        onClick={handleNext}
                        disabled={currentIndex === totalQuestions - 1 || !answers[currentQuestion?.id]}
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
                                const isAnswered = !!answers[q?.id];
                                const isFlagged = flagged.includes(q?.id);

                                let boxClass = styles.navigatorBox;
                                if (isCurrent) boxClass += ` ${styles.boxCurrent}`;
                                if (isAnswered) boxClass += ` ${styles.boxAnswered}`;
                                if (isFlagged) boxClass += ` ${styles.boxFlagged}`;

                                return (
                                    <div
                                        key={q?.id}
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

            {/* Time's Up Modal — non-dismissable */}
            {showTimesUpModal && (
                <div className={styles.modalBackdrop}>
                    <div className={`${styles.modalContent} ${styles.timesUpModal}`}>
                        <div className={styles.timesUpIcon}>
                            <FiClock />
                        </div>
                        <h3 className={styles.timesUpTitle}>Time's Up!</h3>
                        <p className={styles.timesUpText}>
                            Your quiz is being submitted automatically. You will be redirected to your results shortly.
                        </p>
                        <div className={styles.timesUpLoader}>
                            <div className={styles.timesUpLoaderBar} />
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
                                        const unAnsIdx = shuffledQuestions.findIndex(q => !answers[q?.id]);
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
