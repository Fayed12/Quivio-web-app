// react
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";

// date-fns
import { format } from "date-fns";

// redux
import { fetchAttemptById, selectCurrentAttempt, fetchMyAttempts, selectMyAttempts } from "../../../redux/slices/attemptsSlice";

// components
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// react-icons
import {
    FiChevronLeft,
    FiCheck,
    FiX,
    FiChevronDown,
    FiChevronUp,
    FiClock,
    FiTrendingUp,
    FiZap
} from "react-icons/fi";

// local
import styles from "./AttemptDetail.module.css";
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

const AttemptDetail = () => {
    const { attemptId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const attempt = useSelector(selectCurrentAttempt);
    const attemptsHistory = useSelector(selectMyAttempts) || [];

    const [expandedQuestion, setExpandedQuestion] = useState({});
    const containerRef = useRef(null);

    // Entrance Animation
    usePageAnimation(containerRef, {
        ready: !!attempt
    });

    useEffect(() => {
        if (attemptId) {
            dispatch(fetchAttemptById(attemptId));
        }
    }, [attemptId, dispatch]);

    useEffect(() => {
        const quizId = attempt?.quiz_id || attempt?.quiz?.id;
        if (quizId) {
            dispatch(fetchMyAttempts({ quizId, page: 1, pageSize: 50 }));
        }
    }, [attempt?.quiz_id, attempt?.quiz?.id, dispatch]);

    if (!attempt) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "var(--text-secondary)" }}>
                Loading attempt details...
            </div>
        );
    }

    const toggleExpand = (qId) => {
        setExpandedQuestion(prev => ({
            ...prev,
            [qId]: !prev[qId]
        }));
    };

    // Calculate charts data
    const timeChartData = (attempt.attempt_answers || []).map((ans, idx) => ({
        name: `Q${idx + 1}`,
        Seconds: ans.time_spent_secs || 0
    }));

    // Tag accuracy aggregation
    const getTagData = () => {
        const tagMap = {};
        (attempt.attempt_answers || []).forEach(ans => {
            const tags = ans.question?.tags || ["General"];
            tags.forEach(tag => {
                if (!tagMap[tag]) {
                    tagMap[tag] = { name: tag, Correct: 0, Wrong: 0 };
                }
                if (ans.is_correct) {
                    tagMap[tag].Correct += 1;
                } else {
                    tagMap[tag].Wrong += 1;
                }
            });
        });
        return Object.values(tagMap);
    };

    const tagChartData = getTagData();

    // Compare to previous attempt
    const getComparison = () => {
        // Find attempts of same quiz sorted chronologically
        const quizAttempts = attemptsHistory
            .filter(a => a.id !== attemptId && a.status === "completed")
            .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
        
        if (quizAttempts.length === 0) return null;

        // Current attempt submitted date
        const currentSubmitDate = new Date(attempt.submitted_at);
        // Find attempt completed immediately before this one
        const prevAttempt = quizAttempts.reverse().find(a => new Date(a.submitted_at) < currentSubmitDate);

        if (!prevAttempt) return null;

        const scoreDiff = attempt.score - prevAttempt.score;
        const timeDiff = prevAttempt.time_spent_secs - attempt.time_spent_secs; // positive = faster

        return {
            prevScore: prevAttempt.score,
            prevTime: prevAttempt.time_spent_secs,
            scoreDiff,
            timeDiff
        };
    };

    const comparison = getComparison();

    const formatTimeSpent = (secs) => {
        if (!secs) return "—";
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        return `${mins}m ${remSecs}s`;
    };

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Breadcrumb Header */}
            <div style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-3)" }}>
                <button
                    onClick={() => navigate("/student/attempts")}
                    className="btn btn--ghost btn--sm"
                    style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                    <FiChevronLeft /> Back to Attempts
                </button>
            </div>

            {/* Title Area */}
            <div className={styles.titleRow}>
                <div>
                    <h1 className="h1">{attempt.quiz?.title || "Quiz Detail"}</h1>
                    <p className="text-secondary text-sm">
                        Attempt taken on {format(new Date(attempt.submitted_at || attempt.started_at), "PPpp")}
                    </p>
                </div>
                <span className={`scoreBadge ${attempt.passed ? "scorePass" : "scoreFail"}`} style={{ fontSize: "var(--text-lg)", padding: "var(--space-2) var(--space-4)" }}>
                    {Math.round(attempt.score)}% {attempt.passed ? "Passed" : "Failed"}
                </span>
            </div>

            {/* Comparison card if applicable */}
            {comparison && (
                <div className={styles.card}>
                    <h4 className="h5 flex items-center gap-2 text-primary">
                        <FiTrendingUp style={{ color: "var(--color-accent)" }} /> Comparison to previous attempt
                    </h4>
                    <div className={styles.comparisonRow}>
                        <div className={styles.compMetric}>
                            <span className="text-xs text-muted">Score change</span>
                            <span className={`${styles.compVal} ${comparison.scoreDiff >= 0 ? styles.posText : styles.negText}`}>
                                {comparison.scoreDiff >= 0 ? "+" : ""}{Math.round(comparison.scoreDiff)}%
                            </span>
                            <span className="text-xs text-secondary">Previously: {Math.round(comparison.prevScore)}%</span>
                        </div>
                        <div className={styles.compMetric}>
                            <span className="text-xs text-muted">Time saving</span>
                            <span className={`${styles.compVal} ${comparison.timeDiff >= 0 ? styles.posText : styles.negText}`}>
                                {comparison.timeDiff >= 0 ? "Saved" : "Lost"} {formatTimeSpent(Math.abs(comparison.timeDiff))}
                            </span>
                            <span className="text-xs text-secondary">Previously: {formatTimeSpent(comparison.prevTime)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <div className={styles.chartGrid}>
                {/* Time spent chart */}
                <div className={styles.chartCard}>
                    <span className={styles.chartTitle}>Time spent per question</span>
                    <div style={{ width: "100%", height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timeChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis unit="s" />
                                <Tooltip />
                                <Bar dataKey="Seconds" fill="var(--color-accent, #3b82f6)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tag Accuracy Chart */}
                <div className={styles.chartCard}>
                    <span className={styles.chartTitle}>Correctness by tag/topic</span>
                    <div style={{ width: "100%", height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={tagChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Correct" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Wrong" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Question Breakdown List */}
            <div className="flex flex-col gap-4">
                <h3 className="h3">Detailed Question Breakdown</h3>

                {(attempt.attempt_answers || []).map((ans, idx) => {
                    const isExpanded = !!expandedQuestion[ans.id];
                    const correctOption = (ans.question?.question_options || []).find(o => o.is_correct);
                    const selectedOption = (ans.question?.question_options || []).find(o => o.id === ans.selected_option_id);

                    return (
                        <div
                            key={ans.id}
                            className={`${styles.reviewRow} ${ans.is_correct ? styles.correctRow : styles.incorrectRow}`}
                        >
                            <div 
                                className={styles.reviewHeader}
                                onClick={() => toggleExpand(ans.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {ans.is_correct ? (
                                        <FiCheck style={{ color: "var(--color-success)" }} />
                                    ) : (
                                        <FiX style={{ color: "var(--color-danger)" }} />
                                    )}
                                    <span className="font-semibold text-secondary">Question {idx + 1}</span>
                                </div>
                                <span className="flex-1 text-sm font-medium text-primary" style={{ paddingLeft: "var(--space-2)" }}>
                                    {ans.question?.question_text}
                                </span>
                                <span>{isExpanded ? <FiChevronUp /> : <FiChevronDown />}</span>
                            </div>

                            {isExpanded && (
                                <div className={styles.reviewBody}>
                                    <div className={`${ans.is_correct ? styles.selectedCorrect : styles.selectedIncorrect}`}>
                                        Your Answer: <strong>{selectedOption ? selectedOption.option_text : "No answer selected"}</strong>
                                    </div>

                                    {!ans.is_correct && correctOption && (
                                        <div className={styles.selectedCorrect}>
                                            Correct Answer: <strong>{correctOption.option_text}</strong>
                                        </div>
                                    )}

                                    <div className="text-xs text-muted flex gap-4" style={{ marginTop: "4px" }}>
                                        <span className="flex items-center gap-1"><FiClock /> Time Spent: {formatTimeSpent(ans.time_spent_secs)}</span>
                                        <span className="flex items-center gap-1"><FiZap /> Points Earned: {ans.points_awarded || 0}</span>
                                    </div>

                                    {ans.question?.explanation && (
                                        <div style={{ background: "var(--bg-surface-2)", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", fontSize: "var(--text-xs)", color: "var(--text-secondary)", marginTop: "var(--space-2)" }}>
                                            <strong>Explanation:</strong>
                                            <p style={{ marginTop: "2px" }}>{ans.question.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AttemptDetail;
