// local components
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./Dashboard.module.css";

// react
import { useRef } from "react";

// react-router
import { useNavigate } from "react-router";

// redux
import { useSelector } from "react-redux";
import { selectProfile } from "../../../redux/slices/authSlice";

// animation
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

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

// custom hook
import { useDashboardData } from "../../../hooks/instructor/useDashboardData";

const Dashboard = () => {
    const navigate = useNavigate();
    const profile = useSelector(selectProfile);

    const {
        loading,
        quizzes,
        stats,
        attemptsOverTime,
        topStudents,
        activityFeed,
        getCategoryData
    } = useDashboardData();

    const containerRef = useRef(null);

    // Page entrance animation
    usePageAnimation(containerRef, {
        ready: !loading,
        staggerSelector: `.${styles.statsGrid} > div`,
    });

    // Colors for donut chart
    const COLORS = ["var(--blue-500)", "var(--violet-500)", "var(--teal-500)", "var(--amber-500)", "var(--red-500)"];

    // Upcoming Deadlines (Mocked for dashboard layout)
    const upcomingDeadlines = [
        { id: 1, quiz: "Advanced Algebra", room: "Mathematics", date: "Jul 10, 2026", completion: 65 },
        { id: 2, quiz: "Database Design II", room: "Computer Science", date: "Jul 14, 2026", completion: 24 }
    ];

    // In-Progress Alerts (Mocked for dashboard layout)
    const inProgressAlerts = [
        { id: 1, student: "Kareem Ibrahim", quiz: "OS Fundamentals", started: "26 hours ago" }
    ];

    if (loading) {
        return <div style={{ color: "var(--text-secondary)", padding: "var(--space-6)" }}>Loading dashboard insights...</div>;
    }

    return (
        <div ref={containerRef} className={styles.dashboardContainer}>
            {/* Header */}
            <PageHeader 
                title="Instructor Dashboard"
                subtitle={`Welcome back, ${profile?.full_name || "Instructor"}! Here's an overview of your classroom activity.`}
                breadcrumbs={["Dashboard"]}
                actions={
                    <div className={styles.headerActions}>
                        {stats.liveAttempts > 0 && (
                            <div className={styles.liveBadge} title="Students currently taking quizzes">
                                <span className={styles.livePulse} />
                                <span className={styles.liveText}>{stats.liveAttempts} Student{stats.liveAttempts > 1 ? "s" : ""} Online</span>
                            </div>
                        )}
                    </div>
                }
            />

            {/* Stats Row */}
            <div className={styles.statsGrid} data-tour="dashboard-stats">
                <StatCard 
                    icon={<FiClipboard />} 
                    value={stats.quizzesCount} 
                    label="Total Quizzes" 
                    trend={{ amount: "Real-time", isPositive: true }} 
                    color="blue"
                />
                <StatCard 
                    icon={<FiActivity />} 
                    value={stats.attemptsCount} 
                    label="Total Attempts" 
                    trend={{ amount: "Real-time", isPositive: true }} 
                    color="violet"
                />
                <StatCard 
                    icon={<FiUsers />} 
                    value={stats.studentsCount} 
                    label="Total Students" 
                    trend={{ amount: "Real-time", isPositive: true }} 
                    color="green"
                />
                <StatCard 
                    icon={<FiAward />} 
                    value={`${stats.avgScore}%`} 
                    label="Average Score" 
                    trend={{ amount: "Real-time", isPositive: true }} 
                    color="amber"
                />
                <StatCard 
                    icon={<FiTrendingUp />} 
                    value={`${stats.passRate}%`} 
                    label="Pass Rate" 
                    trend={{ amount: "Real-time", isPositive: true }} 
                    color="red"
                />
            </div>

            {/* Quick Actions Panel */}
            <div className={styles.quickActionsCard} data-tour="dashboard-actions">
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
            <div className={styles.gridMain} data-tour="dashboard-recent">
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
                                <AreaChart data={attemptsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
