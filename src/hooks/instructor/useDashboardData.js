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
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
    const [inProgressAlerts, setInProgressAlerts] = useState([]);

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

                // Fetch real upcoming deadlines (Next 7 Days)
                const today = new Date().toISOString();
                const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                const { data: assignments } = await supabase
                    .from("assignments")
                    .select(`
                        id, due_date, room_id, quiz_id,
                        quiz:quizzes(id, title),
                        room:rooms(id, name, member_count)
                    `)
                    .eq("is_active", true)
                    .gte("due_date", today)
                    .lte("due_date", sevenDaysLater)
                    .order("due_date", { ascending: true });

                if (assignments && assignments.length > 0) {
                    const assignmentQuizIds = assignments.map(a => a.quiz_id);
                    const { data: assignmentAttempts } = await supabase
                        .from("attempts")
                        .select("quiz_id, uid, status")
                        .in("quiz_id", assignmentQuizIds)
                        .eq("status", "completed");

                    const computedDeadlines = assignments.map(ass => {
                        const attemptsForQuiz = (assignmentAttempts || []).filter(att => att.quiz_id === ass.quiz_id);
                        const uniqueCompletions = new Set(attemptsForQuiz.map(att => att.uid)).size;
                        const memberCount = ass.room?.member_count || 1;
                        const completionPercent = Math.min(100, Math.round((uniqueCompletions / memberCount) * 100));

                        return {
                            id: ass.id,
                            quiz: ass.quiz?.title || "Quiz",
                            room: ass.room?.name || "Classroom",
                            date: new Date(ass.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
                            completion: completionPercent
                        };
                    });
                    setUpcomingDeadlines(computedDeadlines);
                } else {
                    setUpcomingDeadlines([]);
                }

                // Fetch real In-Progress Alerts (>24h since start)
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

                const { data: alerts } = await supabase
                    .from("attempts")
                    .select(`
                        id, started_at,
                        quiz:quizzes!inner(id, title, instructor_uid),
                        profile:profiles!uid(uid, full_name)
                    `)
                    .eq("quiz.instructor_uid", userId)
                    .eq("status", "started")
                    .lte("started_at", twentyFourHoursAgo)
                    .order("started_at", { ascending: false });

                if (alerts) {
                    const computedAlerts = alerts.map(alt => {
                        const hoursAgo = Math.floor((Date.now() - new Date(alt.started_at).getTime()) / (1000 * 60 * 60));
                        const timeText = hoursAgo >= 24 ? `${hoursAgo} hours ago` : `${hoursAgo}h ago`;
                        return {
                            id: alt.id,
                            student: alt.profile?.full_name || "Unknown Student",
                            quiz: alt.quiz?.title || "Quiz",
                            started: timeText
                        };
                    });
                    setInProgressAlerts(computedAlerts);
                } else {
                    setInProgressAlerts([]);
                }

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
        upcomingDeadlines,
        inProgressAlerts,
        getCategoryData
    };
};
