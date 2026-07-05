import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "../../redux/slices/authSlice";
import { supabase } from "../../services/config/supabaseClient";

export const useAnalyticsData = (dateRange = "all") => {
    const user = useSelector(selectProfile);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        avgScore: 0,
        totalCompletions: 0,
        passRate: 0,
        avgTimeMins: 0
    });

    const [scoreDistribution, setScoreDistribution] = useState([]);
    const [passFailRatio, setPassFailRatio] = useState([]);
    const [categoryPerformance, setCategoryPerformance] = useState([]);
    const [studentProgress, setStudentProgress] = useState([]);
    const [quizPerformanceData, setQuizPerformanceData] = useState([]);
    const [questionPerformances, setQuestionPerformances] = useState({
        hardest: [],
        easiest: []
    });

    useEffect(() => {
        const userId = user?.uid || user?.id;
        if (!userId) return;

        const loadAnalytics = async () => {
            try {
                setLoading(true);

                // Fetch attempts related to instructor's quizzes
                const { data: attempts, error } = await supabase
                    .from("attempts")
                    .select(`
                        id, status, score, passed, started_at, submitted_at, time_spent_secs, correct_count, total_questions,
                        quiz:quizzes!inner(id, title, instructor_uid, category:categories(id, name)),
                        profile:profiles!uid(uid, full_name, avatar_url)
                    `)
                    .eq("quiz.instructor_uid", userId);

                if (error) throw error;

                // Apply date filters if necessary
                let filteredAttempts = attempts || [];
                if (dateRange === "7days") {
                    const limit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    filteredAttempts = filteredAttempts.filter(a => new Date(a.started_at) >= limit);
                } else if (dateRange === "30days") {
                    const limit = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    filteredAttempts = filteredAttempts.filter(a => new Date(a.started_at) >= limit);
                }

                const completed = filteredAttempts.filter(a => a.status === "completed");
                const totalScore = completed.reduce((sum, curr) => sum + (curr.score || 0), 0);
                const passedCount = completed.filter(a => a.passed).length;
                const totalTime = completed.reduce((sum, curr) => sum + (curr.time_spent_secs || 0), 0);

                setStats({
                    avgScore: completed.length ? Math.round(totalScore / completed.length) : 0,
                    totalCompletions: completed.length,
                    passRate: completed.length ? Math.round((passedCount / completed.length) * 100) : 0,
                    avgTimeMins: completed.length ? Math.round((totalTime / completed.length) / 60) : 0
                });

                // 1. Score Distribution (buckets 0-50, 50-60, 60-70, 70-80, 80-90, 90-100)
                const buckets = {
                    "0-50%": 0,
                    "50-60%": 0,
                    "60-70%": 0,
                    "70-80%": 0,
                    "80-90%": 0,
                    "90-100%": 0
                };

                completed.forEach(att => {
                    const score = att.score || 0;
                    if (score < 50) buckets["0-50%"]++;
                    else if (score < 60) buckets["50-60%"]++;
                    else if (score < 70) buckets["60-70%"]++;
                    else if (score < 80) buckets["70-80%"]++;
                    else if (score < 90) buckets["80-90%"]++;
                    else buckets["90-100%"]++;
                });

                const distributionData = Object.keys(buckets).map(range => ({
                    range,
                    count: buckets[range]
                }));
                setScoreDistribution(distributionData);

                // 2. Pass Fail Ratio
                setPassFailRatio([
                    { name: "Passed", value: passedCount },
                    { name: "Failed", value: completed.length - passedCount }
                ]);

                // 3. Category Radar (Average Score per category)
                const catAgg = {};
                completed.forEach(att => {
                    const catName = att.quiz?.category?.name || "General";
                    if (!catAgg[catName]) {
                        catAgg[catName] = { name: catName, totalScore: 0, count: 0 };
                    }
                    catAgg[catName].totalScore += att.score || 0;
                    catAgg[catName].count++;
                });

                const radarData = Object.values(catAgg).map(c => ({
                    subject: c.name,
                    A: Math.round(c.totalScore / c.count),
                    fullMark: 100
                }));
                setCategoryPerformance(radarData);

                // 4. Student Progress aggregate table rows
                const stuAgg = {};
                completed.forEach(att => {
                    const sUid = att.profile?.uid;
                    const sName = att.profile?.full_name || "Student";
                    if (sUid) {
                        if (!stuAgg[sUid]) {
                            stuAgg[sUid] = {
                                id: sUid,
                                name: sName,
                                attempts: 0,
                                totalScore: 0,
                                passed: 0,
                                lastAttempt: null
                            };
                        }
                        stuAgg[sUid].attempts++;
                        stuAgg[sUid].totalScore += att.score || 0;
                        if (att.passed) {
                            stuAgg[sUid].passed++;
                        }
                        if (!stuAgg[sUid].lastAttempt || new Date(att.started_at) > new Date(stuAgg[sUid].lastAttempt)) {
                            stuAgg[sUid].lastAttempt = att.started_at;
                        }
                    }
                });

                const progressRows = Object.values(stuAgg).map(s => ({
                    id: s.id,
                    name: s.name,
                    attempts: s.attempts,
                    avgScore: Math.round(s.totalScore / s.attempts),
                    status: s.passed > 0 ? "certified" : "active",
                    trend: s.avgScore >= 80 ? "Improving" : "Stable"
                }));
                setStudentProgress(progressRows);

                // 5. Quiz Performance progressions
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

                const sortedQuizzes = [...quizAverages].sort((a, b) => a.avg - b.avg);
                setQuestionPerformances({
                    hardest: sortedQuizzes.slice(0, 5),
                    easiest: sortedQuizzes.length > 5 
                        ? sortedQuizzes.slice(-5).reverse() 
                        : [...sortedQuizzes].reverse()
                });
                
                setQuizPerformanceData(quizAverages);

            } catch (err) {
                console.error("Error computing instructor analytics:", err);
            } finally {
                setLoading(false);
            }
        };

        loadAnalytics();
    }, [user, dateRange]);

    return {
        loading,
        stats,
        scoreDistribution,
        passFailRatio,
        categoryPerformance,
        studentProgress,
        questionPerformances,
        quizPerformanceData
    };
};
