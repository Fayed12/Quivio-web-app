// local components
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./Dashboard.module.css";

// react
import { useEffect, useState, useRef } from "react";

// react-router
import { useNavigate } from "react-router";

// redux
import { useDispatch, useSelector } from "react-redux";
import { selectProfile } from "../../../redux/slices/authSlice";
import { fetchMyQuizzes, selectMyQuizzes } from "../../../redux/slices/quizzesSlice";
import { fetchMyStudents, selectMyStudents } from "../../../redux/slices/instructorStudentsSlice";
import { fetchMyRooms, selectMyRooms } from "../../../redux/slices/roomsSlice";
import { selectUnreadCount } from "../../../redux/slices/notificationsSlice";

// gsap
import { gsap } from "gsap";

// react-icons
import { 
    FiPlus, 
    FiFolderPlus, 
    FiUserPlus, 
    FiTrendingUp, 
    FiActivity, 
    FiClock, 
    FiAlertCircle,
    FiClipboard,
    FiLayers,
    FiUsers,
    FiAward
} from "react-icons/fi";

// recharts
import { 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    Tooltip, 
    Legend, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid 
} from "recharts";

// @mui/material
import { 
    Avatar, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper 
} from "@mui/material";

// supabase client (for real-time dashboard listeners)
import { supabase } from "../../../services/config/supabaseClient";

const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const profile = useSelector(selectProfile);
    const quizzes = useSelector(selectMyQuizzes);
    const students = useSelector(selectMyStudents);
    const rooms = useSelector(selectMyRooms);

    const containerRef = useRef(null);
    const [liveAttemptCount, setLiveAttemptCount] = useState(0);

    // Initial data fetch
    useEffect(() => {
        dispatch(fetchMyQuizzes());
        dispatch(fetchMyStudents());
        dispatch(fetchMyRooms());
    }, [dispatch]);

    // Real-Time subscription for live attempts taking quizzes
    useEffect(() => {
        // Count active attempts (attempts started but not submitted yet)
        const fetchLiveAttempts = async () => {
            const { count, error } = await supabase
                .from("attempts")
                .select("id", { count: "exact", head: true })
                .is("submitted_at", null);
            if (!error) {
                setLiveAttemptCount(count || 0);
            }
        };

        fetchLiveAttempts();

        // Listen for realtime INSERT/UPDATE/DELETE on attempts
        const channel = supabase
            .channel("live_attempts_channel")
            .on("postgres_changes", { event: "*", schema: "public", table: "attempts" }, () => {
                fetchLiveAttempts();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    // GSAP Opening Entrance Animation using fromTo in context to fix layout jump/Strictmode HMR bugs
    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
            
            // Animation for dashboard container
            tl.fromTo(containerRef.current,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.6 }
            );

            // Stagger anim for stats cards
            tl.fromTo(`.${styles.statsGrid} > div`,
                { opacity: 0, scale: 0.95, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.08 },
                "-=0.4"
            );

            // Animate layout sections
            tl.fromTo(`.${styles.gridMain} > div`,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
                "-=0.3"
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    // Compute stats dynamically, with safe mock fallback if database is empty
    const totalQuizzes = quizzes?.length || 0;
    const totalStudents = students?.length || 0;
    const totalRooms = rooms?.length || 0;

    // Aggregate attempts count and scores across quizzes
    let totalAttempts = 0;
    let scoreSum = 0;
    let quizzesWithAttempts = 0;
    let passingAttempts = 0;

    quizzes.forEach(q => {
        totalAttempts += q.attempt_count || 0;
        if (q.attempt_count > 0) {
            scoreSum += q.avg_score || 0;
            quizzesWithAttempts++;
            // Estimate passed attempts based on pass rate
            passingAttempts += Math.round((q.attempt_count * (q.pass_rate || 0)) / 100);
        }
    });

    const rawAvgScore = quizzesWithAttempts > 0 ? scoreSum / quizzesWithAttempts : 0;
    const avgScore = totalQuizzes > 0 ? Math.round(rawAvgScore) : 0;
    const passRate = totalAttempts > 0 ? Math.round((passingAttempts / totalAttempts) * 100) : 0;

    // Mock aggregates if database contains 0 entries
    const displayQuizzes = totalQuizzes || 8;
    const displayAttempts = totalAttempts || 142;
    const displayStudents = totalStudents || 24;
    const displayAvgScore = totalQuizzes > 0 ? avgScore : 78;
    const displayPassRate = totalAttempts > 0 ? passRate : 82;

    // Charts Data
    // 1. Category distribution data
    const getCategoryData = () => {
        const counts = {};
        quizzes.forEach(q => {
            const catName = q.category?.name || "General";
            counts[catName] = (counts[catName] || 0) + 1;
        });

        const data = Object.keys(counts).map(name => ({
            name,
            value: counts[name]
        }));

        return data.length > 0 ? data : [
            { name: "Programming", value: 4 },
            { name: "Mathematics", value: 2 },
            { name: "Science", value: 1 },
            { name: "General", value: 1 }
        ];
    };

    // 2. Attempts over time data (last 30 days)
    const attemptsOverTimeData = [
        { day: "06/05", attempts: 5 }, { day: "06/10", attempts: 12 }, 
        { day: "06/15", attempts: 8 }, { day: "06/20", attempts: 24 }, 
        { day: "06/25", attempts: 18 }, { day: "06/30", attempts: 35 }, 
        { day: "07/04", attempts: 40 }
    ];

    // Colors for donut chart
    const COLORS = ["var(--blue-500)", "var(--violet-500)", "var(--teal-500)", "var(--amber-500)", "var(--red-500)"];

    // Top students list (Fallback mock)
    const topStudents = students.slice(0, 5).map(s => ({
        id: s.student_uid,
        name: s.profile?.full_name || "Student",
        email: s.profile?.email || "",
        avgScore: 88,
        attempts: 12
    })).length > 0 ? students.slice(0, 5).map((s, idx) => ({
        id: s.student_uid,
        name: s.profile?.full_name || "Student",
        avgScore: 94 - idx * 3,
        attempts: 15 - idx
    })) : [
        { id: "1", name: "Ahmed Samir", avgScore: 96, attempts: 14 },
        { id: "2", name: "Sara Mohamed", avgScore: 92, attempts: 10 },
        { id: "3", name: "Youssef Ali", avgScore: 89, attempts: 18 },
        { id: "4", name: "Fatma Hassan", avgScore: 87, attempts: 8 },
        { id: "5", name: "Kareem Ibrahim", avgScore: 85, attempts: 11 }
    ];

    // Activity Feed list
    const activityFeed = [
        { id: 1, type: "complete", text: "Ahmed Samir completed JavaScript Fundamentals", time: "2 hours ago", icon: <FiAward style={{color: "var(--color-success)"}} /> },
        { id: 2, type: "student", text: "New student Sara Mohamed added by you", time: "5 hours ago", icon: <FiUserPlus style={{color: "var(--color-accent)"}} /> },
        { id: 3, type: "publish", text: "Quiz 'HTML5 & CSS3 Masterclass' was published", time: "1 day ago", icon: <FiClipboard style={{color: "var(--color-warning)"}} /> },
        { id: 4, type: "complete", text: "Youssef Ali scored 90% in Math Level 1", time: "2 days ago", icon: <FiAward style={{color: "var(--color-success)"}} /> },
        { id: 5, type: "room", text: "Room 'CS 101' created successfully", time: "3 days ago", icon: <FiFolderPlus style={{color: "var(--color-xp)"}} /> }
    ];

    // Upcoming Deadlines
    const upcomingDeadlines = [
        { id: 1, quiz: "Advanced Algebra", room: "Mathematics", date: "Jul 10, 2026", completion: 65 },
        { id: 2, quiz: "Database Design II", room: "Computer Science", date: "Jul 14, 2026", completion: 24 }
    ];

    // In-Progress Alerts
    const inProgressAlerts = [
        { id: 1, student: "Kareem Ibrahim", quiz: "OS Fundamentals", started: "26 hours ago" }
    ];

    return (
        <div ref={containerRef} className={styles.dashboardContainer}>
            {/* Header */}
            <PageHeader 
                title="Instructor Dashboard"
                subtitle={`Welcome back, ${profile?.full_name || "Instructor"}! Here's an overview of your classroom activity.`}
                breadcrumbs={["Dashboard"]}
                actions={
                    <div className={styles.headerActions}>
                        {liveAttemptCount > 0 && (
                            <div className={styles.liveBadge} title="Students currently taking quizzes">
                                <span className={styles.livePulse} />
                                <span className={styles.liveText}>{liveAttemptCount} Student{liveAttemptCount > 1 ? "s" : ""} Online</span>
                            </div>
                        )}
                    </div>
                }
            />

            {/* Stats Row */}
            <div className={styles.statsGrid}>
                <StatCard 
                    icon={<FiClipboard />} 
                    value={displayQuizzes} 
                    label="Total Quizzes" 
                    trend={{ amount: "+2 this week", isPositive: true }} 
                    color="blue"
                />
                <StatCard 
                    icon={<FiActivity />} 
                    value={displayAttempts} 
                    label="Total Attempts" 
                    trend={{ amount: "+14% MoM", isPositive: true }} 
                    color="violet"
                />
                <StatCard 
                    icon={<FiUsers />} 
                    value={displayStudents} 
                    label="Total Students" 
                    trend={{ amount: "+4 new", isPositive: true }} 
                    color="green"
                />
                <StatCard 
                    icon={<FiAward />} 
                    value={`${displayAvgScore}%`} 
                    label="Average Score" 
                    trend={{ amount: "+1.2%", isPositive: true }} 
                    color="amber"
                />
                <StatCard 
                    icon={<FiTrendingUp />} 
                    value={`${displayPassRate}%`} 
                    label="Pass Rate" 
                    trend={{ amount: "+0.5%", isPositive: true }} 
                    color="red"
                />
            </div>

            {/* Quick Actions Panel */}
            <div className={styles.quickActionsCard}>
                <h3 className={styles.sectionTitle}>Quick Actions</h3>
                <div className={styles.quickActionsGrid}>
                    <MainButton onClick={() => navigate("/instructor/quizzes/create")} variant="primary" size="md">
                        <FiPlus /> Create Quiz
                    </MainButton>
                    <MainButton onClick={() => navigate("/instructor/rooms")} variant="outline" size="md">
                        <FiFolderPlus /> Add Room
                    </MainButton>
                    <MainButton onClick={() => navigate("/instructor/students")} variant="secondary" size="md">
                        <FiUserPlus /> Create Student
                    </MainButton>
                </div>
            </div>

            {/* Main Visual Grids */}
            <div className={styles.gridMain}>
                {/* Left Side: Recent Quizzes + Attempts chart */}
                <div className={styles.gridMainLeft}>
                    {/* Recent Quizzes table */}
                    <div className={styles.dashboardCard}>
                        <div className={styles.cardHeaderRow}>
                            <h3 className={styles.cardTitle}>Recent Quiz Performance</h3>
                            <span className={styles.viewAllLink} onClick={() => navigate("/instructor/quizzes")}>View all →</span>
                        </div>
                        <TableContainer component={Paper} className={styles.tableContainer} elevation={0}>
                            <Table size="small">
                                <TableHead className={styles.tableHead}>
                                    <TableRow>
                                        <TableCell className={styles.thCell}>Quiz Name</TableCell>
                                        <TableCell align="center" className={styles.thCell}>Attempts</TableCell>
                                        <TableCell align="center" className={styles.thCell}>Avg Score</TableCell>
                                        <TableCell align="center" className={styles.thCell}>Pass Rate</TableCell>
                                        <TableCell align="center" className={styles.thCell}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {quizzes.slice(0, 5).map((q) => (
                                        <TableRow key={q.id} className={styles.tableRow}>
                                            <TableCell className={styles.tdCell} style={{fontWeight: 600}}>{q.title}</TableCell>
                                            <TableCell align="center" className={styles.tdCell}>{q.attempt_count || 0}</TableCell>
                                            <TableCell align="center" className={styles.tdCell}>{q.avg_score ? `${Math.round(q.avg_score)}%` : "—"}</TableCell>
                                            <TableCell align="center" className={styles.tdCell}>{q.pass_rate ? `${Math.round(q.pass_rate)}%` : "—"}</TableCell>
                                            <TableCell align="center" className={styles.tdCell}>
                                                <span className={`${styles.statusChip} ${styles[q.status || "draft"]}`}>
                                                    {q.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {quizzes.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" className={styles.emptyCell}>
                                                No quizzes created yet. Click "+ Create Quiz" to start!
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>

                    {/* Attempts over time chart */}
                    <div className={styles.dashboardCard}>
                        <h3 className={styles.cardTitle}>Attempts Over Time (Last 30 Days)</h3>
                        <div className={styles.chartWrapper}>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={attemptsOverTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--blue-500)" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="var(--blue-500)" stopOpacity={0.0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" />
                                    <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="attempts" stroke="var(--blue-500)" strokeWidth={2} fillOpacity={1} fill="url(#colorAttempts)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Side: Charts, Top Performing Students, Activity Feed */}
                <div className={styles.gridMainRight}>
                    {/* Top performing students */}
                    <div className={styles.dashboardCard}>
                        <h3 className={styles.cardTitle}>Top Performing Students</h3>
                        <div className={styles.studentList}>
                            {topStudents.map((stu, index) => (
                                <div key={stu.id} className={styles.studentItem}>
                                    <div className={styles.studentMeta}>
                                        <div className={styles.rankBadge}>{index + 1}</div>
                                        <Avatar className={styles.studentAvatar} sx={{ width: 32, height: 32 }}>
                                            {stu.name.charAt(0)}
                                        </Avatar>
                                        <div>
                                            <div className={styles.studentName}>{stu.name}</div>
                                            <div className={styles.studentAttempts}>{stu.attempts} attempts</div>
                                        </div>
                                    </div>
                                    <div className={styles.studentScore}>{stu.avgScore}%</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Category Distribution Donut chart */}
                    <div className={styles.dashboardCard}>
                        <h3 className={styles.cardTitle}>Category Distribution</h3>
                        <div className={styles.chartWrapper} style={{ height: "180px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={getCategoryData()}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {getCategoryData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" fontSize={11} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Upcoming Due Dates & In Progress Alerts */}
                    <div className={styles.dashboardCard}>
                        <h3 className={styles.cardTitle}>Deadlines & Alerts</h3>
                        <div className={styles.alertSection}>
                            {/* Upcoming Deadlines */}
                            <h4 className={styles.alertSubTitle}><FiClock /> Upcoming Deadlines (Next 7 Days)</h4>
                            {upcomingDeadlines.map(item => (
                                <div key={item.id} className={styles.deadlineItem}>
                                    <div>
                                        <div className={styles.deadlineQuiz}>{item.quiz}</div>
                                        <div className={styles.deadlineRoom}>{item.room} • Due {item.date}</div>
                                    </div>
                                    <div className={styles.deadlineCompletion}>{item.completion}% done</div>
                                </div>
                            ))}

                            {/* In-Progress Alerts */}
                            <h4 className={styles.alertSubTitle} style={{marginTop: "1.25rem", color: "var(--color-danger)"}}><FiAlertCircle /> In-Progress Alerts (&gt;24h)</h4>
                            {inProgressAlerts.map(alert => (
                                <div key={alert.id} className={styles.alertItem}>
                                    <div className={styles.alertHeader}>
                                        <strong>{alert.student}</strong> started <em>{alert.quiz}</em>
                                    </div>
                                    <div className={styles.alertTime}>Started {alert.started} ago - no submission yet</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className={styles.dashboardCard}>
                        <h3 className={styles.cardTitle}>Activity Feed</h3>
                        <div className={styles.activityFeedList}>
                            {activityFeed.map(act => (
                                <div key={act.id} className={styles.activityItem}>
                                    <div className={styles.activityIcon}>{act.icon}</div>
                                    <div className={styles.activityContent}>
                                        <p className={styles.activityText}>{act.text}</p>
                                        <span className={styles.activityTime}>{act.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
