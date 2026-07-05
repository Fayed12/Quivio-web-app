import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyQuizzes, selectMyQuizzes } from "../../redux/slices/quizzesSlice";
import { fetchMyRooms, selectMyRooms } from "../../redux/slices/roomsSlice";
import { fetchMyStudents, selectMyStudents } from "../../redux/slices/instructorStudentsSlice";
import { selectProfile } from "../../redux/slices/authSlice";
import { supabase } from "../../services/config/supabaseClient";

export const useDashboardData = () => {
    const dispatch = useDispatch();
    const user = useSelector(selectProfile);
    const quizzes = useSelector(selectMyQuizzes) || [];
    const rooms = useSelector(selectMyRooms) || [];
    const students = useSelector(selectMyStudents) || [];

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        quizzesCount: 0,
        attemptsCount: 0,
        studentsCount: 0,
        avgScore: 0,
        passRate: 0,
        liveAttempts: 0
    });
    const [attemptsOverTime, setAttemptsOverTime] = useState([]);
    const [topStudents, setTopStudents] = useState([]);
    const [activityFeed, setActivityFeed] = useState([]);

    useEffect(() => {
        dispatch(fetchMyQuizzes());
        dispatch(fetchMyRooms());
        dispatch(fetchMyStudents());
    }, [dispatch]);

    useEffect(() => {
        const userId = user?.uid || user?.id;
        if (!userId) return;

        const loadDashboardStats = async () => {
            try {
                setLoading(true);
                // Fetch attempts related to instructor's quizzes
                const { data: attempts, error } = await supabase
                    .from("attempts")
                    .select(`
                        id, status, score, passed, started_at, submitted_at,
                        quiz:quizzes!inner(id, title, instructor_uid, category_id, category:categories(id, name)),
                        profile:profiles!uid(uid, full_name, avatar_url)
                    `)
                    .eq("quiz.instructor_uid", userId);

                if (error) throw error;

                const completedAttempts = (attempts || []).filter(a => a.status === "completed");
                const totalScore = completedAttempts.reduce((sum, curr) => sum + (curr.score || 0), 0);
                const passedCount = completedAttempts.filter(a => a.passed).length;

                // Live active attempts (started in the last 30 minutes, not completed yet)
                const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
                const liveCount = (attempts || []).filter(
                    a => a.status === "started" && a.started_at >= thirtyMinsAgo
                ).length;

                setStats({
                    quizzesCount: quizzes.length,
                    attemptsCount: attempts?.length || 0,
                    studentsCount: students.length,
                    avgScore: completedAttempts.length ? Math.round(totalScore / completedAttempts.length) : 0,
                    passRate: completedAttempts.length ? Math.round((passedCount / completedAttempts.length) * 100) : 0,
                    liveAttempts: liveCount
                });

                // 1. Attempts over time (grouped by day, last 30 days)
                const last30DaysMap = {};
                for (let i = 29; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const key = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                    last30DaysMap[key] = 0;
                }

                (attempts || []).forEach(att => {
                    const dateStr = new Date(att.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
                    if (last30DaysMap[dateStr] !== undefined) {
                        last30DaysMap[dateStr]++;
                    }
                });

                const chartData = Object.keys(last30DaysMap).map(day => ({
                    day,
                    attempts: last30DaysMap[day]
                }));
                setAttemptsOverTime(chartData);

                // 2. Top Performing Students aggregation
                const studentStats = {};
                completedAttempts.forEach(att => {
                    const sUid = att.profile?.uid;
                    const sName = att.profile?.full_name || "Unknown Student";
                    if (sUid) {
                        if (!studentStats[sUid]) {
                            studentStats[sUid] = { id: sUid, name: sName, totalScore: 0, count: 0 };
                        }
                        studentStats[sUid].totalScore += att.score || 0;
                        studentStats[sUid].count++;
                    }
                });

                const aggregatedStudents = Object.values(studentStats)
                    .map(s => ({
                        id: s.id,
                        name: s.name,
                        attempts: s.count,
                        avgScore: Math.round(s.totalScore / s.count)
                    }))
                    .sort((a, b) => b.avgScore - a.avgScore)
                    .slice(0, 5);

                setTopStudents(aggregatedStudents);

                // 3. Recent Activity Feed (recent 10 attempts)
                const feed = (attempts || [])
                    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
                    .slice(0, 8)
                    .map(att => {
                        const sName = att.profile?.full_name || "A student";
                        const qTitle = att.quiz?.title || "Quiz";
                        const timeStr = new Date(att.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        const isCompleted = att.status === "completed";
                        return {
                            id: att.id,
                            icon: isCompleted ? "✅" : "📝",
                            text: isCompleted 
                                ? `${sName} completed "${qTitle}" with score ${att.score}%`
                                : `${sName} started taking "${qTitle}"`,
                            time: `${new Date(att.started_at).toLocaleDateString()} at ${timeStr}`
                        };
                    });

                setActivityFeed(feed);

            } catch (err) {
                console.error("Error loading instructor dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardStats();
    }, [user, quizzes?.length, students?.length]);

    // Categories donut data helper
    const getCategoryData = () => {
        const counts = {};
        const qList = quizzes || [];
        qList.forEach(q => {
            if (q) {
                const catName = q.category?.name || "Uncategorized";
                counts[catName] = (counts[catName] || 0) + 1;
            }
        });
        return Object.keys(counts).map(name => ({
            name,
            value: counts[name]
        }));
    };

    return {
        loading,
        quizzes,
        rooms,
        students,
        stats,
        attemptsOverTime,
        topStudents,
        activityFeed,
        getCategoryData
    };
};
