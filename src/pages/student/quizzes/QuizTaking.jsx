// react
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
    saveAllAnswersThunk,
    toggleFlagThunk,
    updateProgressThunk,
    submitAttemptThunk,
    clearActiveAttempt
} from "../../../redux/slices/attemptsSlice";

// components
import MainButton from "../../../components/ui/button/MainButton";
import { toast } from "react-toastify";
import CircularProgress from "@mui/material/CircularProgress";

// sweetalert2
import Swal from "sweetalert2";

// howler
import { Howler, Howl } from "howler";

// react-icons
import {
    FiFlag,
    FiHelpCircle,
    FiCheckSquare,
    FiClock,
    FiAlertTriangle,
    FiXCircle,
    FiCheckCircle,
    FiLoader,
    FiFolder,
    FiEdit3,
    FiAlertCircle,
    FiSave,
    FiWifiOff,
    FiArrowLeft,
    FiArrowRight,
    FiVolume2,
    FiVolumeX,
    FiLock,
    FiX
} from "react-icons/fi";

// local
import styles from "./QuizTaking.module.css";
import usePageAnimation from "../../../hooks/usePageAnimation";
import { seededShuffle } from "../../../utils/seededShuffle";

// Initialize sounds using Howler with generated WAV files
const selectSound = new Howl({ src: ["/sounds/select.wav"], html5: true, volume: 0.4, preload: true });
const nextSound = new Howl({ src: ["/sounds/next.wav"], html5: true, volume: 0.3, preload: true });
const flagSound = new Howl({ src: ["/sounds/flag.wav"], html5: true, volume: 0.4, preload: true });
const hintSound = new Howl({ src: ["/sounds/hint.wav"], html5: true, volume: 0.5, preload: true });
const tickSound = new Howl({ src: ["/sounds/tick.wav"], html5: true, volume: 0.2, preload: true });
const submitSound = new Howl({ src: ["/sounds/submit.wav"], html5: true, volume: 0.6, preload: true });

// Safe play wrapper — silently catch errors if sound files are missing
const safePlay = (sound) => {
    try { sound.play(); } catch { /* ignore sound errors */ }
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
    const attemptError = useSelector(s => s.attempts.error);

    // Derive shuffledQuestions via useMemo to avoid synchronous setStates in useEffect and cascading renders
    const shuffledQuestions = useMemo(() => {
        if (!quiz?.quiz_questions || !attemptId) return [];

        let questionsList = quiz.quiz_questions
            .map(qq => qq.question)
            .filter(q => q && q.id && q.question_text && (q.question_options?.length > 0 || isTrueFalseType(q.question_type)));

        if (quiz.shuffle_questions) {
            questionsList = seededShuffle(questionsList, attemptId);
        }

        // Shuffle options if enabled
        return questionsList.map(q => {
            if (quiz.shuffle_answers && q.question_options) {
                return {
                    ...q,
                    question_options: seededShuffle(q.question_options, attemptId + q?.id)
                };
            }
            return q;
        });
    }, [quiz, attemptId]);

    const [showHint, setShowHint] = useState(false);
    const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showTimesUpModal, setShowTimesUpModal] = useState(false);

    // Guide Card & Audio Mute state
    const [showGuide, setShowGuide] = useState(true);
    const [guideCountdown, setGuideCountdown] = useState(5);
    const [isMuted, setIsMuted] = useState(() => {
        try { return localStorage.getItem("quivio_quiz_muted") === "true"; } catch { return false; }
    });
    
    // Auto-save indicators
    const [saveStatus, setSaveStatus] = useState("saved"); // "saved" | "saving" | "saving_local" | "error"

    const timeRemainingRef = useRef(timeRemaining);
    const currentIndexRef = useRef(currentIndex);
    const answersRef = useRef(answers);
    const shuffledQuestionsRef = useRef(shuffledQuestions);

    useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);
    useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
    useEffect(() => { answersRef.current = answers; }, [answers]);
    useEffect(() => { shuffledQuestionsRef.current = shuffledQuestions; }, [shuffledQuestions]);

    // Ref to track cumulative time spent per question (questionId -> seconds)
    const timeSpentRef = useRef({});

    // Ref to prevent double auto-submit
    const autoSubmittedRef = useRef(false);

    // Initialize timeSpentRef from activeAttempt.attempt_answers when loaded
    useEffect(() => {
        if (activeAttempt?.attempt_answers) {
            const initialTimeSpent = {};
            activeAttempt.attempt_answers.forEach(ans => {
                if (ans.question_id) {
                    initialTimeSpent[ans.question_id] = ans.time_spent_secs ?? 0;
                }
            });
            timeSpentRef.current = initialTimeSpent;
        }
    }, [activeAttempt]);

    // Handle Auto-Submit when timer expires
    const handleAutoSubmit = useCallback(async () => {
        if (autoSubmittedRef.current) return;
        autoSubmittedRef.current = true;

        const attemptId = activeAttempt?.id;

        safePlay(submitSound);
        setShowTimesUpModal(true);

        // Save ALL answers before submitting
        if (attemptId && Object.keys(answers).length > 0) {
            await dispatch(saveAllAnswersThunk({
                attempt_id: attemptId,
                answers,
                timeSpent: timeSpentRef.current
            }));
        }

        const res = await dispatch(submitAttemptThunk(attemptId));
        if (submitAttemptThunk.fulfilled.match(res)) {
            // Short delay so the user sees the "Time's Up" message
            setTimeout(() => {
                navigate(`/student/quiz/${quizId}/results/${attemptId}`);
            }, 2500);
        } else {
            toast.error("Auto submit failed. Trying local recovery.");
            setShowTimesUpModal(false);
            autoSubmittedRef.current = false;
        }
    }, [activeAttempt, answers, dispatch, navigate, quizId]);

    // Keep a ref to the latest auto-submit handler so the countdown interval
    // can be mounted once instead of being torn down on every render/tick.
    const handleAutoSubmitRef = useRef(handleAutoSubmit);
    useEffect(() => {
        handleAutoSubmitRef.current = handleAutoSubmit;
    }, [handleAutoSubmit]);

    const containerRef = useRef(null);

    // Entrance Animation
    usePageAnimation(containerRef, {
        ready: shuffledQuestions.length > 0 && !showGuide
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

    // Restore from localStorage backup if autosave had previously failed (BUG-4 fix)
    useEffect(() => {
        if (!activeAttempt?.id) return;
        const backupKey = `attempt_backup:${activeAttempt.id}`;
        try {
            const raw = localStorage.getItem(backupKey);
            if (!raw) return;
            const backup = JSON.parse(raw);
            if (backup.answers && typeof backup.answers === "object") {
                Object.entries(backup.answers).forEach(([questionId, optionId]) => {
                    dispatch(setAnswerLocal({ question_id: questionId, selected_option_id: optionId }));
                });
            }
            if (typeof backup.timeRemaining === "number") {
                dispatch(setTimeRemaining(backup.timeRemaining));
            }
            if (typeof backup.currentIndex === "number") {
                dispatch(setCurrentIndex(backup.currentIndex));
            }
            localStorage.removeItem(backupKey);
            toast.info("Restored your previous progress from local backup", { autoClose: 4000 });
        } catch {
            // Corrupted backup — just remove it
            try { localStorage.removeItem(backupKey); } catch { /* ignore */ }
        }
    }, [activeAttempt?.id, dispatch]);


    // Guide Card Countdown Effect
    useEffect(() => {
        if (!showGuide || guideCountdown <= 0) return;

        const interval = setInterval(() => {
            setGuideCountdown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [showGuide, guideCountdown]);



    // Keyboard Navigation Arrow Listener
    useEffect(() => {
        if (showGuide) return;
        
        const handleArrowKeys = (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

            if (e.key === "ArrowLeft") {
                if (currentIndex > 0) {
                    safePlay(nextSound);
                    dispatch(setCurrentIndex(currentIndex - 1));
                    setShowHint(false);
                }
            } else if (e.key === "ArrowRight") {
                if (currentIndex < shuffledQuestions.length - 1) {
                    safePlay(nextSound);
                    dispatch(setCurrentIndex(currentIndex + 1));
                    setShowHint(false);
                }
            }
        };

        window.addEventListener("keydown", handleArrowKeys);
        return () => window.removeEventListener("keydown", handleArrowKeys);
    }, [showGuide, currentIndex, shuffledQuestions.length, dispatch]);

    // Anti-cheat exit listener (visibilitychange and blur)
    useEffect(() => {
        if (showGuide || !activeAttempt) return;

        const handleSecurityExit = async () => {
            if (autoSubmittedRef.current) return;
            autoSubmittedRef.current = true;
            
            const attemptId = activeAttempt?.id;
            if (attemptId) {
                try {
                    await dispatch(saveAllAnswersThunk({
                        attempt_id: attemptId,
                        answers: answersRef.current,
                        timeSpent: timeSpentRef.current
                    }));
                } catch { /* best-effort save */ }

                const res = await dispatch(submitAttemptThunk(attemptId));
                if (submitAttemptThunk.fulfilled.match(res)) {
                    Swal.fire({
                        icon: "error",
                        title: "Quiz Terminated",
                        text: "Exam terminated due to window blur or tab switch. Your progress was automatically submitted.",
                        confirmButtonText: "OK",
                        confirmButtonColor: "#ef4444"
                    }).then(() => {
                        navigate(`/student/quiz/${quizId}/results/${attemptId}`);
                    });
                } else {
                    // Submission failed — do NOT navigate to results (they'd spin forever).
                    autoSubmittedRef.current = false;
                    Swal.fire({
                        icon: "error",
                        title: "Submission Failed",
                        text: "Your attempt could not be auto-submitted due to a network issue. Your progress is saved locally — please stay on the quiz and submit again.",
                        confirmButtonText: "Back to Quiz",
                        confirmButtonColor: "#ef4444"
                    });
                }
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleSecurityExit();
            }
        };

        const handleWindowBlur = () => {
            handleSecurityExit();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleWindowBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleWindowBlur);
        };
    }, [showGuide, activeAttempt, navigate, quizId, dispatch]);


    // Fixed Auto-save cycle (every 3 seconds) that doesn't clear on every tick.
    // RTK thunks never throw — they return rejected action objects, so we must
    // inspect the thunk results to detect a failed save and fall back to localStorage.
    useEffect(() => {
        if (!activeAttempt?.id || shuffledQuestions.length === 0) return;

        const writeBackup = () => {
            localStorage.setItem(`attempt_backup:${activeAttempt?.id}`, JSON.stringify({
                answers: answersRef.current,
                timeRemaining: timeRemainingRef.current,
                currentIndex: currentIndexRef.current
            }));
        };

        const interval = setInterval(async () => {
            setSaveStatus("saving");

            const cIdx = currentIndexRef.current;
            const tRem = timeRemainingRef.current;
            const ans = answersRef.current;
            const currentQuestion = shuffledQuestionsRef.current[cIdx];
            const selectedOptionId = ans[currentQuestion?.id];
            const accumulatedTime = timeSpentRef.current[currentQuestion?.id] || 0;

            const progRes = await dispatch(updateProgressThunk({
                id: activeAttempt?.id,
                current_question_order: cIdx,
                time_remaining_secs: tRem
            }));
            let saveOk = updateProgressThunk.fulfilled.match(progRes);

            if (selectedOptionId && currentQuestion?.id) {
                const saveRes = await dispatch(saveAnswerThunk({
                    attempt_id: activeAttempt?.id,
                    question_id: currentQuestion?.id,
                    selected_option_id: selectedOptionId,
                    time_spent_secs: accumulatedTime
                }));
                saveOk = saveOk && saveAnswerThunk.fulfilled.match(saveRes);
            }

            if (saveOk) {
                setSaveStatus("saved");
            } else {
                console.warn("Auto save failed, writing to localStorage backup.");
                try { writeBackup(); } catch { /* storage full/blocked */ }
                setSaveStatus("saving_local");
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [activeAttempt?.id, shuffledQuestions, dispatch]);

    // Countdown Timer logic (with showGuide check).
    // Mounted once per attempt/guide state and reads latest values from refs so
    // the interval is NOT torn down on every tick (fixes wall-clock drift and
    // the stale-closure bug where handleAutoSubmit identity changed every save).
    useEffect(() => {
        if (!activeAttempt?.id || showGuide) return;

        // Resume case: an already-expired in_progress attempt must auto-submit immediately.
        if (timeRemainingRef.current !== null && timeRemainingRef.current <= 0) {
            handleAutoSubmitRef.current();
            return;
        }
        if (timeRemainingRef.current === null) return; // untimed quiz — no countdown

        const interval = setInterval(() => {
            const current = timeRemainingRef.current;
            if (current === null) return;

            const nextTime = current - 1;
            dispatch(setTimeRemaining(nextTime));

            const currentQuestionId = shuffledQuestionsRef.current[currentIndexRef.current]?.id;
            if (currentQuestionId) {
                timeSpentRef.current[currentQuestionId] = (timeSpentRef.current[currentQuestionId] || 0) + 1;
            }

            if (nextTime < 300 && nextTime > 0 && nextTime % 10 === 0) {
                safePlay(tickSound);
            }

            if (nextTime <= 0) {
                clearInterval(interval);
                handleAutoSubmitRef.current();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [activeAttempt?.id, showGuide, dispatch]);

    // Security and exit interceptors
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "You are in the middle of a quiz. Your progress may be lost if you leave.";
            return e.returnValue;
        };

        const handlePreventReload = (e) => {
            const isReload =
                e.key === "F5" ||
                (e.ctrlKey && e.key === "r") ||
                (e.ctrlKey && e.shiftKey && e.key === "R") ||
                (e.metaKey && e.key === "r");

            if (isReload) {
                e.preventDefault();
                e.stopPropagation();
                Swal.fire({
                    icon: "warning",
                    title: "Reload Disabled",
                    text: "Refreshing the browser is blocked during active quiz sessions to protect your attempt data.",
                    confirmButtonText: "Return to Quiz",
                    confirmButtonColor: "var(--color-accent, #6366f1)"
                });
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("keydown", handlePreventReload, true);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("keydown", handlePreventReload, true);
        };
    }, []);

    useEffect(() => {
        window.history.pushState(null, "", window.location.href);

        const handlePopState = () => {
            window.history.pushState(null, "", window.location.href);
            Swal.fire({
                icon: "warning",
                title: "Navigation Locked",
                text: "Browser navigation back/forward is disabled during the exam. Please use the submit button to complete the quiz.",
                confirmButtonText: "Resume Quiz",
                confirmButtonColor: "var(--color-accent, #6366f1)"
            });
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    // Input copy/paste/contextmenu lockdowns
    useEffect(() => {
        if (showGuide) return;

        const preventDefault = (e) => e.preventDefault();
        const preventRightClick = (e) => {
            e.preventDefault();
            toast.warn("Context menu (right-click) is disabled.", { toastId: "right-click-block" });
        };

        const handleLockdownKeys = (e) => {
            if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
                e.preventDefault();
                toast.warn("Context menu is disabled.", { toastId: "context-menu-block" });
            }
            if (
                e.key === "F12" ||
                (e.ctrlKey && e.shiftKey && e.key === "I") ||
                (e.metaKey && e.altKey && e.key === "i")
            ) {
                e.preventDefault();
                toast.error("Developer tools are disabled.", { toastId: "devtools-block" });
            }
            if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "a")
            ) {
                e.preventDefault();
                toast.error("Copy, paste, and text selection are disabled during the quiz.", { toastId: "shortcuts-block" });
            }
        };

        document.addEventListener("copy", preventDefault);
        document.addEventListener("paste", preventDefault);
        document.addEventListener("selectstart", preventDefault);
        document.addEventListener("dragstart", preventDefault);
        document.addEventListener("contextmenu", preventRightClick);
        window.addEventListener("keydown", handleLockdownKeys, true);

        return () => {
            document.removeEventListener("copy", preventDefault);
            document.removeEventListener("paste", preventDefault);
            document.removeEventListener("selectstart", preventDefault);
            document.removeEventListener("dragstart", preventDefault);
            document.removeEventListener("contextmenu", preventRightClick);
            window.removeEventListener("keydown", handleLockdownKeys, true);
        };
    }, [showGuide]);



    // Manual Submit Action — save ALL answers first, then submit
    const handleManualSubmit = async () => {
        safePlay(submitSound);
        setShowSubmitModal(false);

        // Batch-save all answers to DB before submitting
        if (activeAttempt?.id && Object.keys(answers).length > 0) {
            const saveRes = await dispatch(saveAllAnswersThunk({
                attempt_id: activeAttempt.id,
                answers,
                timeSpent: timeSpentRef.current
            }));
            if (saveAllAnswersThunk.rejected.match(saveRes)) {
                toast.error("Failed to save answers. Please try again.");
                return;
            }
        }

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
        safePlay(selectSound);
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

        safePlay(flagSound);
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
            safePlay(nextSound);
            dispatch(setCurrentIndex(currentIndex + 1));
            setShowHint(false);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            safePlay(nextSound);
            dispatch(setCurrentIndex(currentIndex - 1));
            setShowHint(false);
        }
    };

    // Guard: missing attemptId in URL
    if (!attemptId) {
        return (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", gap: "var(--space-3)" }}>
                <FiAlertTriangle style={{ fontSize: "2rem", color: "var(--color-warning)" }} />
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
                <FiXCircle style={{ fontSize: "2rem", color: "var(--color-danger)" }} />
                <p style={{ color: "var(--text-danger)" }}>Failed to load attempt: {typeof attemptError === 'string' ? attemptError : 'Unknown error'}</p>
                <MainButton variant="primary" onClick={() => navigate(`/student/quizzes/${quizId}`)}>
                    Go Back
                </MainButton>
            </div>
        );
    }

    if (shuffledQuestions.length === 0 || !activeAttempt) {
        return (
            <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "center", 
                alignItems: "center", 
                minHeight: "100vh", 
                color: "var(--text-secondary)", 
                gap: "var(--space-4)",
                background: "var(--bg-app)"
            }}>
                <CircularProgress size={50} style={{ color: "var(--color-accent)" }} />
                <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-semibold)", color: "var(--text-primary)" }}>
                    Initializing attempt...
                </div>
                {attemptError && (
                    <div style={{ color: "var(--text-danger)", marginTop: "var(--space-2)" }}>
                        Error: {String(attemptError)}
                    </div>
                )}
            </div>
        );
    }

    if (showGuide) {
        return (
            <div className={styles.guideContainer}>
                <div className={styles.guideCard}>
                    <div className={styles.guideHeader}>
                        <div className={styles.lockIconWrapper}>
                            <FiLock className={styles.guideAlertIcon} />
                        </div>
                        <h2>Quiz Security & Rules Check</h2>
                        <p className={styles.guideSubtitle}>Please read the rules carefully before starting the exam.</p>
                    </div>

                    <div className={styles.guideBody}>
                        <div className={styles.ruleItem}>
                            <div className={styles.ruleIconWrapper} style={{ background: "rgba(239, 68, 68, 0.08)", color: "#ef4444" }}>
                                <FiXCircle />
                            </div>
                            <div className={styles.ruleContent}>
                                <h4>
                                    Anti-Cheat Lockdown
                                </h4>
                                <p>Exiting the browser tab, switching windows, or minimizing will instantly **auto-submit and terminate** your quiz attempt.</p>
                            </div>
                        </div>

                        <div className={styles.ruleItem}>
                            <div className={styles.ruleIconWrapper} style={{ background: "rgba(245, 158, 11, 0.08)", color: "#f59e0b" }}>
                                <FiClock />
                            </div>
                            <div className={styles.ruleContent}>
                                <h4>
                                    Strict Time Limit
                                </h4>
                                <p>Your remaining time is tracked in real-time. If the countdown reaches zero, your progress will be auto-submitted.</p>
                            </div>
                        </div>

                        <div className={styles.ruleItem}>
                            <div className={styles.ruleIconWrapper} style={{ background: "rgba(59, 130, 246, 0.08)", color: "#3b82f6" }}>
                                <FiAlertTriangle />
                            </div>
                            <div className={styles.ruleContent}>
                                <h4>
                                    Lockdown Features Active
                                </h4>
                                <p>Right-click, text selection, copy, and paste are strictly disabled. Page reloading is blocked during taking.</p>
                            </div>
                        </div>

                        <div className={styles.ruleItem}>
                            <div className={styles.ruleIconWrapper} style={{ background: "rgba(16, 185, 129, 0.08)", color: "#10b981" }}>
                                <FiCheckCircle />
                            </div>
                            <div className={styles.ruleContent}>
                                <h4>
                                    Arrow Key Navigation
                                </h4>
                                <p>You can use the **Left & Right Arrow keys** on your keyboard to navigate between questions seamlessly.</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.guideFooter}>
                        <div className={styles.countdownProgressContainer}>
                            <div className={styles.countdownProgressBar} style={{ width: `${(guideCountdown / 5) * 100}%` }} />
                        </div>
                        <div className={styles.guideFooterActions}>
                            <span className={styles.countdownText}>
                                {guideCountdown > 0 ? `Unlocking in ${guideCountdown}s...` : "Quiz unlocked!"}
                            </span>
                            <MainButton
                                variant="primary"
                                onClick={() => setShowGuide(false)}
                                disabled={guideCountdown > 0}
                                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                            >
                                Let's Begin <FiArrowRight />
                            </MainButton>
                        </div>
                    </div>
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

    const getTimerColorClass = () => {
        if (timeRemaining === null) return "";
        if (timeRemaining <= 60) return styles.timerUrgent;
        if (timeRemaining <= 300) return styles.timerWarning;
        return styles.timerSafe;
    };

    const handleAudioToggle = () => {
        const newMute = !isMuted;
        setIsMuted(newMute);
        Howler.mute(newMute);
        try { localStorage.setItem("quivio_quiz_muted", String(newMute)); } catch { /* ignore */ }
    };

    // Check if current question is T/F
    const isCurrentTF = isTrueFalseType(currentQuestion?.question_type);

    return (
        <div ref={containerRef} className={styles.takingLayout} style={{ userSelect: "none", WebkitUserSelect: "none" }}>
            {/* Top Bar */}
            <div className={styles.minimalTopbar}>
                <div className={styles.topbarLeft}>
                    <span className={styles.quizTitle}>
                        <FiEdit3 style={{ marginRight: "6px", verticalAlign: "middle" }} />
                        {quiz?.title || "Quiz"}
                    </span>
                    <span className={styles.questionCounter}>
                        Question {currentIndex + 1} of {totalQuestions}
                    </span>
                </div>
                
                <div className={styles.topbarRight}>
                    <button 
                        onClick={handleAudioToggle} 
                        className={styles.audioBtn}
                        title={isMuted ? "Unmute sounds" : "Mute sounds"}
                    >
                        {isMuted ? <FiVolumeX /> : <FiVolume2 />}
                    </button>
                    
                    <div className={`${styles.timer} ${getTimerColorClass()}`}>
                        <FiClock style={{ animation: timeRemaining < 60 ? "pulse 1s infinite" : "none" , display:"inline"}} />
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
                                        safePlay(hintSound);
                                        setShowHint(!showHint);
                                    }}
                                    className={styles.hintBtn}
                                >
                                    <FiHelpCircle style={{ marginRight: "4px", verticalAlign: "middle" }} /> Hint
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
                            <div className={styles.tfSplit} role="radiogroup" aria-label="True or False options">
                                {["True", "False"].map((tfOpt) => {
                                    const opt = (currentQuestion?.question_options || []).find(
                                        o => o.option_text?.toLowerCase() === tfOpt.toLowerCase()
                                    ) || { id: tfOpt, option_text: tfOpt };
                                    
                                    const isSelected = answers[currentQuestion?.id] === opt?.id;

                                    return (
                                        <div
                                            key={`tf-${tfOpt}`}
                                            role="radio"
                                            aria-checked={isSelected}
                                            tabIndex={0}
                                            onClick={() => handleSelectOption(opt?.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === " " || e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleSelectOption(opt?.id);
                                                }
                                            }}
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
                            <div className={styles.optionsStack} role="radiogroup" aria-label="Question options">
                                {(currentQuestion?.question_options || []).map((opt, optIdx) => {
                                    const isSelected = answers[currentQuestion?.id] === opt?.id;
                                    return (
                                        <div
                                            key={opt?.id || `opt-${optIdx}`}
                                            role="radio"
                                            aria-checked={isSelected}
                                            tabIndex={0}
                                            onClick={() => handleSelectOption(opt?.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === " " || e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleSelectOption(opt?.id);
                                                }
                                            }}
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
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                    <FiArrowLeft /> Previous
                </MainButton>

                <div className={styles.autoSaveIndicator}>
                    {saveStatus === "saved" && (
                        <div className={styles.savedBadge}>
                            <span className={styles.pulsingGreenDot} />
                            <FiSave className={styles.saveIcon} /> Saved to cloud
                        </div>
                    )}
                    {saveStatus === "saving" && (
                        <div className={styles.savingBadge}>
                            <FiLoader className={styles.spinIcon} /> Saving...
                        </div>
                    )}
                    {saveStatus === "saving_local" && (
                        <div className={styles.offlineBadge}>
                            <FiWifiOff className={styles.warnIcon} /> Offline: saved locally
                        </div>
                    )}
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

                    {currentIndex === totalQuestions - 1 ? (
                        <MainButton
                            variant="primary"
                            size="md"
                            onClick={() => setShowSubmitModal(true)}
                            disabled={submitting}
                            isLoading={submitting}
                            style={{ display: "flex", alignItems: "center", gap: "6px" }}
                        >
                            Submit Quiz <FiCheckSquare />
                        </MainButton>
                    ) : (
                        <MainButton
                            variant="primary"
                            size="md"
                            onClick={handleNext}
                            disabled={!answers[currentQuestion?.id]}
                            style={{ display: "flex", alignItems: "center", gap: "6px" }}
                        >
                            Next <FiArrowRight />
                        </MainButton>
                    )}
                </div>
            </div>

            {/* Question Navigator Drawer */}
            {totalQuestions > 0 && (
                <>
                    <button 
                        className={`${styles.navigatorToggle} ${isNavigatorOpen ? styles.navigatorToggleOpen : ""}`}
                        onClick={() => setIsNavigatorOpen(!isNavigatorOpen)}
                        title={isNavigatorOpen ? "Close Question Navigator" : "Open Question Navigator"}
                        aria-label="Question Navigator"
                    >
                        {isNavigatorOpen ? <FiX /> : <FiFolder />}
                        <span className={styles.toggleBadge}>{answeredCount}/{totalQuestions}</span>
                    </button>

                    <div className={`${styles.drawer} ${isNavigatorOpen ? styles.drawerOpen : ""}`}>
                        <div className={styles.drawerHeader}>
                            <div className="flex items-center gap-2">
                                <FiFolder style={{ color: "var(--color-accent)", fontSize: "1.2rem" }} />
                                <h4 className="h5" style={{ margin: 0 }}>Question Navigator</h4>
                            </div>
                            <button 
                                onClick={() => setIsNavigatorOpen(false)}
                                className={styles.drawerCloseBtn}
                                aria-label="Close Navigator"
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className={styles.drawerSubheader}>
                            <span>Answered: <strong>{answeredCount}</strong> / {totalQuestions}</span>
                            {flagged.length > 0 && (
                                <span className={styles.flaggedCountTag}>
                                    <FiFlag /> {flagged.length}
                                </span>
                            )}
                        </div>

                        <div className={styles.navigatorGrid}>
                            {shuffledQuestions.map((q, idx) => {
                                const isCurrent = idx === currentIndex;
                                const isAnswered = !!answers[q?.id];
                                const isFlaggedQ = flagged.includes(q?.id);

                                let boxClass = styles.navigatorBox;
                                if (isCurrent) boxClass += ` ${styles.boxCurrent}`;
                                if (isAnswered) boxClass += ` ${styles.boxAnswered}`;
                                if (isFlaggedQ) boxClass += ` ${styles.boxFlagged}`;

                                return (
                                    <button
                                        key={q?.id || `nav-${idx}`}
                                        onClick={() => {
                                            safePlay(nextSound);
                                            dispatch(setCurrentIndex(idx));
                                            setIsNavigatorOpen(false);
                                        }}
                                        className={boxClass}
                                        title={`Question ${idx + 1}${isAnswered ? ' (Answered)' : ''}${isFlaggedQ ? ' (Flagged)' : ''}`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className={styles.drawerLegend}>
                            <div className={styles.legendItem}>
                                <span className={`${styles.legendDot} ${styles.dotAnswered}`} /> Answered
                            </div>
                            <div className={styles.legendItem}>
                                <span className={`${styles.legendDot} ${styles.dotCurrent}`} /> Current
                            </div>
                            <div className={styles.legendItem}>
                                <span className={`${styles.legendDot} ${styles.dotFlagged}`} /> Flagged
                            </div>
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
                                <div style={{ color: "var(--color-warning-hover)", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <FiAlertCircle /> Unanswered: <strong>{totalQuestions - answeredCount}</strong>
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
