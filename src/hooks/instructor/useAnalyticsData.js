import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "../../redux/slices/authSlice";
import { supabase } from "../../services/config/supabaseClient";

export const useAnalyticsData = (dateRange = "all", customRange = null, selectedQuizId = "all") => {
    const user = useSelector(selectProfile);
    const [loading, setLoading] = useState(true);
    const [quizzes, setQuizzes] = useState([]);
    
    const [stats, setStats] = useState({
        avgScore: 0,
        totalCompletions: 0,
        totalAttempts: 0,
        passRate: 0,
        avgTimeMins: 0,
        completionRate: 0
    });

    const [scoreDistribution, setScoreDistribution] = useState([]);
    const [passFailRatio, setPassFailRatio] = useState([]);
    const [completionRatio, setCompletionRatio] = useState([]);
    const [categoryPerformance, setCategoryPerformance] = useState([]);
    const [studentProgress, setStudentProgress] = useState([]);
    const [quizPerformanceData, setQuizPerformanceData] = useState([]);
    const [attemptsOverTime, setAttemptsOverTime] = useState([]);
    const [questionPerformances, setQuestionPerformances] = useState({
        hardest: [],
        easiest: [],
        avgTimePerQuestion: []
    });
    const [performanceGroups, setPerformanceGroups] = useState({
        topPerformers: [],
        needsAttention: [],
        noActivity: []
    });
    const [categoryHighlights, setCategoryHighlights] = useState({
        best: null,
        worst: null
    });

    useEffect(() => {
        const userId = user?.uid || user?.id;
        if (!userId) return;

        const loadAnalytics = async () => {
            try {
                setLoading(true);

                // 1. Fetch instructor's quizzes list for the dropdown
                const { data: quizzesData, error: quizzesError } = await supabase
                    .from("quizzes")
                    .select("id, title")
                    .eq("instructor_uid", userId)
                    .order("title", { ascending: true });

                if (quizzesError) throw quizzesError;
                setQuizzes(quizzesData || []);

                // 2. Fetch all student profiles connected to this instructor
                const { data: allStudents, error: studentsError } = await supabase
                    .from("instructor_students")
                    .select(`
                        id, student_uid, student_code, created_at,
                        profile:profiles!student_uid(uid, full_name, email, avatar_url, is_active, last_activity_date)
                    `)
                    .eq("instructor_uid", userId);

                if (studentsError) throw studentsError;

                // 3. Fetch attempts related to instructor's quizzes
                const { data: attempts, error: attemptsError } = await supabase
                    .from("attempts")
                    .select(`
                        id, status, score, passed, started_at, submitted_at, time_spent_secs, correct_count, total_questions,
                        quiz:quizzes!inner(id, title, instructor_uid, category:categories(id, name)),
                        profile:profiles!uid(uid, full_name, email, avatar_url, is_active, last_activity_date),
                        attempt_answers(
                            id, question_id, is_correct, time_spent_secs,
                            question:questions(id, question_text)
                        )
                    `)
                    .eq("quiz.instructor_uid", userId);

                if (attemptsError) throw attemptsError;

                // Apply date filters dynamically
                let filteredAttempts = attempts || [];
                if (dateRange === "7days") {
                    const limit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    filteredAttempts = filteredAttempts.filter(a => new Date(a.started_at) >= limit);
                } else if (dateRange === "30days") {
                    const limit = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    filteredAttempts = filteredAttempts.filter(a => new Date(a.started_at) >= limit);
                } else if (dateRange === "90days") {
                    const limit = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                    filteredAttempts = filteredAttempts.filter(a => new Date(a.started_at) >= limit);
                } else if (dateRange === "custom" && customRange?.startDate && customRange?.endDate) {
                    const start = new Date(customRange.startDate);
                    const end = new Date(customRange.endDate);
                    end.setHours(23, 59, 59, 999);
                    filteredAttempts = filteredAttempts.filter(a => {
                        const date = new Date(a.started_at);
                        return date >= start && date <= end;
                    });
                }

                // Apply Quiz Selector filter
                if (selectedQuizId && selectedQuizId !== "all") {
                    filteredAttempts = filteredAttempts.filter(a => a.quiz?.id === selectedQuizId);
                }

                const completed = filteredAttempts.filter(a => a.status === "completed");
                const totalScore = completed.reduce((sum, curr) => sum + (curr.score || 0), 0);
                const passedCount = completed.filter(a => a.passed).length;
                const totalTime = completed.reduce((sum, curr) => sum + (curr.time_spent_secs || 0), 0);
                const totalAttemptsCount = filteredAttempts.length;
                const completionRate = totalAttemptsCount ? Math.round((completed.length / totalAttemptsCount) * 100) : 0;

                setStats({
                    avgScore: completed.length ? Math.round(totalScore / completed.length) : 0,
                    totalCompletions: completed.length,
                    totalAttempts: totalAttemptsCount,
                    passRate: completed.length ? Math.round((passedCount / completed.length) * 100) : 0,
                    avgTimeMins: completed.length ? Math.round((totalTime / completed.length) / 60) : 0,
                    completionRate
                });

                // A. Score Distribution (buckets of 10 deciles)
                const buckets = {
                    "0-10%": 0, "11-20%": 0, "21-30%": 0, "31-40%": 0, "41-50%": 0,
                    "51-60%": 0, "61-70%": 0, "71-80%": 0, "81-90%": 0, "91-100%": 0
                };

                completed.forEach(att => {
                    const score = att.score || 0;
                    if (score <= 10) buckets["0-10%"]++;
                    else if (score <= 20) buckets["11-20%"]++;
                    else if (score <= 30) buckets["21-30%"]++;
                    else if (score <= 40) buckets["31-40%"]++;
                    else if (score <= 50) buckets["41-50%"]++;
                    else if (score <= 60) buckets["51-60%"]++;
                    else if (score <= 70) buckets["61-70%"]++;
                    else if (score <= 80) buckets["71-80%"]++;
                    else if (score <= 90) buckets["81-90%"]++;
                    else buckets["91-100%"]++;
                });

                const distributionData = Object.keys(buckets).map(range => ({
                    range,
                    count: buckets[range]
                }));
                setScoreDistribution(distributionData);

                // B. Pass Fail Ratio
                setPassFailRatio([
                    { name: "Passed", value: passedCount },
                    { name: "Failed", value: completed.length - passedCount }
                ]);

                // C. Completion Ratio
                const abandonedCount = filteredAttempts.filter(a => a.status === "abandoned").length;
                const inProgressCount = filteredAttempts.filter(a => a.status === "in_progress").length;
                setCompletionRatio([
                    { name: "Completed", value: completed.length },
                    { name: "In Progress / Abandoned", value: abandonedCount + inProgressCount }
                ]);

                // D. Attempts over Time (daily counts)
                const attemptsByDate = {};
                filteredAttempts.forEach(a => {
                    const dateStr = new Date(a.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
                    if (!attemptsByDate[dateStr]) {
                        attemptsByDate[dateStr] = { date: dateStr, count: 0, passed: 0 };
                    }
                    attemptsByDate[dateStr].count++;
                    if (a.passed && a.status === "completed") {
                        attemptsByDate[dateStr].passed++;
                    }
                });
                const sortedAttemptsOverTime = Object.values(attemptsByDate).sort((a, b) => {
                    return new Date(a.date) - new Date(b.date);
                });
                setAttemptsOverTime(sortedAttemptsOverTime);

                // E. Category Radar/Insights (Scores & unique participants per category)
                const catAgg = {};
                completed.forEach(att => {
                    const catId = att.quiz?.category?.id || "general";
                    const catName = att.quiz?.category?.name || "General";
                    const quizId = att.quiz?.id;
                    const studentId = att.profile?.uid;

                    if (!catAgg[catId]) {
                        catAgg[catId] = {
                            id: catId,
                            name: catName,
                            totalScore: 0,
                            count: 0,
                            quizzes: new Set(),
                            students: new Set()
                        };
                    }
                    catAgg[catId].totalScore += att.score || 0;
                    catAgg[catId].count++;
                    if (quizId) catAgg[catId].quizzes.add(quizId);
                    if (studentId) catAgg[catId].students.add(studentId);
                });

                const radarData = Object.values(catAgg).map(c => ({
                    id: c.id,
                    subject: c.name,
                    avgScore: Math.round(c.totalScore / c.count),
                    quizCount: c.quizzes.size,
                    studentCount: c.students.size
                }));
                setCategoryPerformance(radarData);

                // Compute Best/Worst categories
                if (radarData.length > 0) {
                    const sortedCats = [...radarData].sort((a, b) => b.avgScore - a.avgScore);
                    setCategoryHighlights({
                        best: sortedCats[0],
                        worst: sortedCats.length > 1 ? sortedCats[sortedCats.length - 1] : null
                    });
                } else {
                    setCategoryHighlights({ best: null, worst: null });
                }

                // F. Student Progress Aggregation
                const stuAgg = {};
                completed.forEach(att => {
                    const sUid = att.profile?.uid;
                    const sName = att.profile?.full_name || "Student";
                    const email = att.profile?.email || "";
                    const avatarUrl = att.profile?.avatar_url || "";
                    
                    if (sUid) {
                        if (!stuAgg[sUid]) {
                            stuAgg[sUid] = {
                                id: sUid,
                                name: sName,
                                email,
                                avatarUrl,
                                attempts: [],
                                passedCount: 0
                            };
                        }
                        stuAgg[sUid].attempts.push(att);
                        if (att.passed) {
                            stuAgg[sUid].passedCount++;
                        }
                    }
                });

                const progressRows = Object.values(stuAgg).map(s => {
                    const sortedStudentAttempts = [...s.attempts].sort((a, b) => new Date(a.started_at) - new Date(b.started_at));
                    const firstAttempt = sortedStudentAttempts[0];
                    const lastAttempt = sortedStudentAttempts[sortedStudentAttempts.length - 1];

                    const totalScore = s.attempts.reduce((sum, a) => sum + (a.score || 0), 0);
                    const avgScore = Math.round(totalScore / s.attempts.length);
                    const passRate = Math.round((s.passedCount / s.attempts.length) * 100);

                    // Improvement trend vs first attempt
                    const firstScore = firstAttempt?.score || 0;
                    const lastScore = lastAttempt?.score || 0;
                    const improvementVal = lastScore - firstScore;

                    const lastActive = lastAttempt ? lastAttempt.started_at : null;

                    const diffDays = lastActive ? (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24) : 0;
                    const needsAttentionVal = avgScore < 50 || diffDays >= 7;

                    return {
                        id: s.id,
                        name: s.name,
                        email: s.email,
                        avatarUrl: s.avatarUrl,
                        attemptsCount: s.attempts.length,
                        avgScore,
                        passRate,
                        improvement: improvementVal,
                        lastActive,
                        needsAttention: needsAttentionVal,
                        attempts: sortedStudentAttempts.map(a => ({
                            id: a.id,
                            quizTitle: a.quiz?.title || "Quiz",
                            score: a.score,
                            passed: a.passed,
                            timeSpentSecs: a.time_spent_secs,
                            startedAt: a.started_at,
                            submittedAt: a.submitted_at
                        }))
                    };
                });

                // Find students with 0 attempts
                const activeStudentIds = new Set(Object.keys(stuAgg));
                const noActivityRows = (allStudents || [])
                    .filter(s => s.profile?.uid && !activeStudentIds.has(s.profile.uid))
                    .map(s => ({
                        id: s.profile.uid,
                        name: s.profile.full_name || "Student",
                        email: s.profile.email || "",
                        avatarUrl: s.profile.avatar_url || "",
                        attemptsCount: 0,
                        avgScore: 0,
                        passRate: 0,
                        improvement: 0,
                        lastActive: s.profile.last_activity_date || null,
                        needsAttention: false,
                        attempts: []
                    }));

                const combinedProgress = [...progressRows, ...noActivityRows];
                setStudentProgress(combinedProgress);

                // Compute student performance groups
                const topPerformers = progressRows.filter(s => s.avgScore >= 85);
                const needsAttention = combinedProgress.filter(s => s.needsAttention);
                
                setPerformanceGroups({
                    topPerformers,
                    needsAttention,
                    noActivity: noActivityRows
                });

                // G. Question Performances (correct/incorrect rates and times)
                const questionStats = {};
                completed.forEach(att => {
                    const answers = att.attempt_answers || [];
                    answers.forEach(ans => {
                        const qId = ans.question_id;
                        if (!qId) return;
                        const qText = ans.question?.question_text || `Question ${qId}`;
                        const isCorrect = ans.is_correct;
                        const timeSpent = ans.time_spent_secs || 0;

                        if (!questionStats[qId]) {
                            questionStats[qId] = {
                                id: qId,
                                text: qText,
                                total: 0,
                                correct: 0,
                                incorrect: 0,
                                totalTimeSpent: 0
                            };
                        }

                        questionStats[qId].total++;
                        if (isCorrect) {
                            questionStats[qId].correct++;
                        } else {
                            questionStats[qId].incorrect++;
                        }
                        questionStats[qId].totalTimeSpent += timeSpent;
                    });
                });

                const questionPerformancesList = Object.values(questionStats).map(q => ({
                    id: q.id,
                    text: q.text,
                    attempts: q.total,
                    correctCount: q.correct,
                    incorrectCount: q.incorrect,
                    percentCorrect: q.total ? Math.round((q.correct / q.total) * 100) : 0,
                    percentIncorrect: q.total ? Math.round((q.incorrect / q.total) * 100) : 0,
                    avgTimeSpent: q.total ? Math.round(q.totalTimeSpent / q.total) : 0
                }));

                const hardestQs = [...questionPerformancesList]
                    .sort((a, b) => b.percentIncorrect - a.percentIncorrect)
                    .slice(0, 5);

                const easiestQs = [...questionPerformancesList]
                    .sort((a, b) => b.percentCorrect - a.percentCorrect)
                    .slice(0, 5);

                const avgTimePerQ = [...questionPerformancesList]
                    .sort((a, b) => b.avgTimeSpent - a.avgTimeSpent);

                setQuestionPerformances({
                    hardest: hardestQs,
                    easiest: easiestQs,
                    avgTimePerQuestion: avgTimePerQ
                });

                // H. Quiz averages progression
                const quizAgg = {};
                completed.forEach(att => {
                    const qId = att.quiz?.id;
                    const qTitle = att.quiz?.title || "Quiz";
                    const catName = att.quiz?.category?.name || "General";
                    if (qId) {
                        if (!quizAgg[qId]) {
                            quizAgg[qId] = { id: qId, title: qTitle, category: catName, totalScore: 0, count: 0, passedCount: 0 };
                        }
                        quizAgg[qId].totalScore += att.score || 0;
                        quizAgg[qId].count++;
                        if (att.passed) {
                            quizAgg[qId].passedCount++;
                        }
                    }
                });

                const quizAverages = Object.values(quizAgg).map(q => ({
                    id: q.id,
                    name: q.title,
                    avg: Math.round(q.totalScore / q.count),
                    pass: Math.round((q.passedCount / q.count) * 100),
                    category: q.category,
                    completions: q.count
                }));
                setQuizPerformanceData(quizAverages);

            } catch (err) {
                console.error("Error computing instructor analytics:", err);
            } finally {
                setLoading(false);
            }
        };

        loadAnalytics();
    }, [user, dateRange, customRange, selectedQuizId]);

    return {
        loading,
        quizzes,
        stats,
        scoreDistribution,
        passFailRatio,
        completionRatio,
        categoryPerformance,
        studentProgress,
        quizPerformanceData,
        attemptsOverTime,
        questionPerformances,
        performanceGroups,
        categoryHighlights
    };
};

