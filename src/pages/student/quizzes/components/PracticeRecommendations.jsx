// react
import { useMemo } from "react";
import { useNavigate } from "react-router";

// react-icons
import {
    FiZap,
    FiCheckCircle,
    FiAlertTriangle,
    FiArrowRight,
    FiAward,
    FiBookOpen,
    FiTarget
} from "react-icons/fi";

// local
import styles from "./PracticeRecommendations.module.css";

const PracticeRecommendations = ({ attempt }) => {
    const navigate = useNavigate();

    // Analyze Attempt Answers & Question Categories
    const analysis = useMemo(() => {
        if (!attempt) return null;

        const answers = attempt.attempt_answers || [];
        const categoryMap = {};

        answers.forEach((ans) => {
            const q = ans.question;
            if (!q) return;

            // Default category name or question type
            const categoryName = q.question_type ? q.question_type.toUpperCase() : "General";

            if (!categoryMap[categoryName]) {
                categoryMap[categoryName] = {
                    name: categoryName,
                    total: 0,
                    correct: 0,
                    timeSpent: 0
                };
            }

            categoryMap[categoryName].total += 1;
            if (ans.is_correct) {
                categoryMap[categoryName].correct += 1;
            }
            categoryMap[categoryName].timeSpent += ans.time_spent_secs || 0;
        });

        // Calculate scores per category
        const strongSides = [];
        const weakSides = [];

        Object.values(categoryMap).forEach((cat) => {
            const accuracy = Math.round((cat.correct / cat.total) * 100);
            const item = { ...cat, accuracy };

            if (accuracy >= 70) {
                strongSides.push(item);
            } else {
                weakSides.push(item);
            }
        });

        // Fallback analysis based on overall score if detailed question categories aren't present
        if (strongSides.length === 0 && weakSides.length === 0) {
            const overallScore = attempt.score ?? 0;
            const quizTitle = attempt.quiz?.title || "Quiz Topic";

            if (overallScore >= 70) {
                strongSides.push({
                    name: quizTitle,
                    accuracy: Math.round(overallScore),
                    correct: attempt.correct_count || 1,
                    total: attempt.total_questions || 1
                });
            } else {
                weakSides.push({
                    name: quizTitle,
                    accuracy: Math.round(overallScore),
                    correct: attempt.correct_count || 0,
                    total: attempt.total_questions || 1
                });
            }
        }

        return { strongSides, weakSides };
    }, [attempt]);

    if (!analysis) return null;

    const { strongSides, weakSides } = analysis;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <div className={styles.iconBadge}>
                        <FiZap />
                    </div>
                    <div>
                        <h3 className={styles.title}>Practice Recommendations & Skill Analysis</h3>
                        <p className={styles.subtitle}>
                            AI-driven breakdown of your performance strengths and areas requiring revision.
                        </p>
                    </div>
                </div>

                <button
                    className={styles.practiceBtn}
                    onClick={() => navigate("/student/recommendations")}
                >
                    View All Skill Recommendations <FiArrowRight />
                </button>
            </div>

            <div className={styles.grid}>
                {/* Strong Sides Column */}
                <div className={styles.sectionCard}>
                    <div className={`${styles.sectionHeader} ${styles.headerStrong}`}>
                        <FiCheckCircle /> Mastered Strengths ({strongSides.length})
                    </div>

                    {strongSides.length === 0 ? (
                        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                            Keep practicing to build your strong mastery skills!
                        </p>
                    ) : (
                        <div className={styles.topicList}>
                            {strongSides.map((item, idx) => (
                                <div key={idx} className={styles.topicItem}>
                                    <div className={styles.topicHeader}>
                                        <span className={styles.topicName}>{item.name}</span>
                                        <span className={`${styles.topicScore} ${styles.scoreGreen}`}>
                                            {item.accuracy}% Accuracy
                                        </span>
                                    </div>
                                    <div className={styles.progressBarBg}>
                                        <div
                                            className={styles.progressBarFill}
                                            style={{
                                                width: `${item.accuracy}%`,
                                                backgroundColor: "var(--green-500)"
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={styles.adviceBox}>
                        <FiAward style={{ color: "var(--green-500)", fontSize: "1.2rem", flexShrink: 0 }} />
                        <span>
                            Excellent accuracy on these topics! You have demonstrated high mastery and speed.
                        </span>
                    </div>
                </div>

                {/* Weak Sides Column */}
                <div className={styles.sectionCard}>
                    <div className={`${styles.sectionHeader} ${styles.headerWeak}`}>
                        <FiAlertTriangle /> Recommended Focus Areas ({weakSides.length})
                    </div>

                    {weakSides.length === 0 ? (
                        <div className={styles.adviceBox} style={{ background: "rgba(34, 197, 94, 0.08)", borderColor: "var(--green-500)" }}>
                            <FiTarget style={{ color: "var(--green-500)", fontSize: "1.2rem", flexShrink: 0 }} />
                            <span>
                                Outstanding work! No weak topics identified in this quiz attempt.
                            </span>
                        </div>
                    ) : (
                        <div className={styles.topicList}>
                            {weakSides.map((item, idx) => (
                                <div key={idx} className={styles.topicItem}>
                                    <div className={styles.topicHeader}>
                                        <span className={styles.topicName}>{item.name}</span>
                                        <span className={`${styles.topicScore} ${styles.scoreRed}`}>
                                            {item.accuracy}% Accuracy
                                        </span>
                                    </div>
                                    <div className={styles.progressBarBg}>
                                        <div
                                            className={styles.progressBarFill}
                                            style={{
                                                width: `${item.accuracy}%`,
                                                backgroundColor: "var(--red-500)"
                                            }}
                                        />
                                    </div>

                                    <button
                                        className={styles.practiceBtn}
                                        onClick={() => navigate("/student/quizzes")}
                                        style={{ marginTop: "6px" }}
                                    >
                                        <FiBookOpen /> Practice Similar Questions
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PracticeRecommendations;
