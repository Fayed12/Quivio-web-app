// local components
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./Analytics.module.css";
import { useAnalyticsData } from "../../../hooks/instructor/useAnalyticsData";

// react
import { useState, useRef } from "react";

// animation
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

// react-icons
import { 
    FiCalendar, 
    FiDownload, 
    FiClock, 
    FiTarget, 
    FiAward, 
    FiCheckCircle,
    FiFrown,
    FiSmile,
    FiChevronUp,
    FiChevronDown
} from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

// Recharts
import { 
    ResponsiveContainer, 
    AreaChart, Area, 
    BarChart, Bar, 
    PieChart, Pie, Cell, 
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from "recharts";

// Material UI
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar } from "@mui/material";


const Analytics = () => {
    // Filters
    const [dateRange, setDateRange] = useState("30days");
    const [activeTab, setActiveTab] = useState("quizzes");

    const containerRef = useRef(null);

    const {
        loading,
        stats,
        scoreDistribution,
        passFailRatio,
        categoryPerformance,
        studentProgress,
        questionPerformances,
        quizPerformanceData
    } = useAnalyticsData(dateRange);

    // Page entrance animation
    usePageAnimation(containerRef, { ready: !loading });

    // Exports triggers
    const handleExport = (type) => {
        toast.success(`Exporting analytics data as ${type.toUpperCase()}...`);
    };

    if (loading) {
        return <div style={{ color: "var(--text-secondary)", padding: "var(--space-6)" }}>Loading analytics...</div>;
    }

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Page Header */}
            <PageHeader 
                title="Analytics Dashboard"
                subtitle="Evaluate student performance, quiz scores, and category metrics."
                breadcrumbs={["Analytics"]}
                actions={
                    <div className={styles.headerActions}>
                        {/* Date Picker */}
                        <div className={styles.datePicker}>
                            <FiCalendar />
                            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={styles.dateSelect}>
                                <option value="7days">Last 7 Days</option>
                                <option value="30days">Last 30 Days</option>
                                <option value="90days">Last 90 Days</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        {/* Download button */}
                        <MainButton onClick={() => handleExport("pdf")} variant="outline">
                            <FiDownload /> Export PDF
                        </MainButton>
                        <MainButton onClick={() => handleExport("excel")} variant="secondary">
                            <FiDownload /> Excel Sheet
                        </MainButton>
                    </div>
                }
            />

            {/* Performance KPI blocks */}
            <div className={styles.kpiGrid}>
                <StatCard icon={<FiTarget />} value={`${stats.avgScore}%`} label="Average score" trend="Real-time" color="blue" />
                <StatCard icon={<FiCheckCircle />} value={`${stats.passRate}%`} label="Pass rate" trend="Real-time" color="green" />
                <StatCard icon={<FiClock />} value={`${stats.avgTimeMins} min`} label="Avg completion time" color="amber" />
                <StatCard icon={<FiAward />} value={stats.totalCompletions} label="Total completions" trend="Real-time" color="violet" />
            </div>

            {/* Tabs */}
            <div className={styles.tabsRow}>
                {["quizzes", "progress", "categories"].map(tab => (
                    <button 
                        key={tab} 
                        className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === "quizzes" && "Quiz Performance"}
                        {tab === "progress" && "Student Progress"}
                        {tab === "categories" && "Category Insights"}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT: QUIZ PERFORMANCE */}
            {activeTab === "quizzes" && (
                <div className={styles.tabLayout}>
                    <div className={styles.grid2}>
                        {/* Score Distribution Chart */}
                        <div className={styles.chartCard}>
                            <h4 className={styles.chartTitle}>Overall Score Distribution</h4>
                            <div className={styles.chartWrapper}>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={scoreDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" />
                                        <XAxis dataKey="range" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                                        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pass Fail Ratio Pie Chart */}
                        <div className={styles.chartCard}>
                            <h4 className={styles.chartTitle}>Pass vs Fail Ratio</h4>
                            <div className={styles.pieLayout}>
                                <div className={styles.chartWrapper} style={{width: "200px"}}>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie 
                                                data={passFailRatio} 
                                                cx="50%" cy="50%" 
                                                innerRadius={60} 
                                                outerRadius={80} 
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {passFailRatio.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? "#10B981" : "#EF4444"} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className={styles.pieLegend}>
                                    <div className={styles.legendItem}>
                                        <span className={styles.legendDot} style={{backgroundColor: "#10B981"}} />
                                        <span>Passed: {stats.passRate}%</span>
                                    </div>
                                    <div className={styles.legendItem}>
                                        <span className={styles.legendDot} style={{backgroundColor: "#EF4444"}} />
                                        <span>Failed: {100 - stats.passRate}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance trends chart */}
                    <div className={styles.chartCard}>
                        <h4 className={styles.chartTitle}>Quiz Score Progression & Pass Rates</h4>
                        <div className={styles.chartWrapper}>
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={quizPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="avg" name="Avg Score (%)" stroke="var(--color-accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorAvg)" />
                                    <Area type="monotone" dataKey="pass" name="Pass Rate (%)" stroke="var(--color-success)" strokeWidth={2} fillOpacity={1} fill="url(#colorPass)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Hardest / Easiest Lists */}
                    <div className={styles.grid2}>
                        <div className={styles.listCard}>
                            <h4 className={styles.listHeader}><FiFrown className={styles.hardIcon} /> Hardest Quizzes (Low Average Score)</h4>
                            <div className={styles.listBody}>
                                {questionPerformances.hardest.map((q) => (
                                    <div key={q.id} className={styles.listItem}>
                                        <p>"{q.name}"</p>
                                        <span>Avg Score: {q.avg}%</span>
                                    </div>
                                ))}
                                {questionPerformances.hardest.length === 0 && (
                                    <div className={styles.listItem}>No data available yet.</div>
                                )}
                            </div>
                        </div>

                        <div className={styles.listCard}>
                            <h4 className={styles.listHeader}><FiSmile className={styles.easyIcon} /> Easiest Quizzes (High Average Score)</h4>
                            <div className={styles.listBody}>
                                {questionPerformances.easiest.map((q) => (
                                    <div key={q.id} className={styles.listItem}>
                                        <p>"{q.name}"</p>
                                        <span>Avg Score: {q.avg}%</span>
                                    </div>
                                ))}
                                {questionPerformances.easiest.length === 0 && (
                                    <div className={styles.listItem}>No data available yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: STUDENT PROGRESS */}
            {activeTab === "progress" && (
                <div className={styles.tabLayout}>
                    <TableContainer component={Paper} className={styles.tableContainer} elevation={0}>
                        <Table size="medium">
                            <TableHead className={styles.tableHead}>
                                <TableRow>
                                    <TableCell className={styles.thCell}>Student Name</TableCell>
                                    <TableCell className={styles.thCell} align="center">Attempts</TableCell>
                                    <TableCell className={styles.thCell} align="center">Average Score</TableCell>
                                    <TableCell className={styles.thCell} align="center">Improvement Trend</TableCell>
                                    <TableCell className={styles.thCell} align="center">Certificates</TableCell>
                                    <TableCell className={styles.thCell} align="center">Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {studentProgress.map((s) => (
                                    <TableRow key={s.id} className={styles.tableRow}>
                                        <TableCell className={styles.tdCell}>
                                            <div className={styles.studentNameCol}>
                                                <Avatar sx={{ width: 28, height: 28 }}>
                                                    {s.name.charAt(0)}
                                                </Avatar>
                                                <span>{s.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell}>{s.attempts}</TableCell>
                                        <TableCell align="center" className={styles.tdCell} style={{fontWeight: 700}}>{s.avgScore}%</TableCell>
                                        <TableCell align="center" className={styles.tdCell}>
                                            <div className={styles.trendRow} data-trend={s.avgScore >= 80 ? "up" : "down"}>
                                                {s.avgScore >= 80 ? <FiChevronUp /> : <FiChevronDown />} {s.trend}
                                            </div>
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell}>
                                            {s.status === "certified" ? "1 issued" : "0 issued"}
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell}>
                                            <span className={`${styles.statusBadge} ${styles.badgeActive}`}>
                                                Active
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {studentProgress.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" className={styles.emptyCell}>
                                            No student attempts recorded in this timeframe.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            )}

            {/* TAB CONTENT: CATEGORY INSIGHTS */}
            {activeTab === "categories" && (
                <div className={styles.tabLayout}>
                    <div className={styles.grid2}>
                        {/* Radar Chart */}
                        <div className={styles.chartCard}>
                            <h4 className={styles.chartTitle}>Category Score Distribution</h4>
                            <div className={styles.chartWrapper} style={{display: "flex", justifyContent: "center"}}>
                                <ResponsiveContainer width="100%" height={260}>
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryPerformance}>
                                        <PolarGrid stroke="var(--border-default)" />
                                        <PolarAngleAxis dataKey="subject" stroke="var(--text-muted)" fontSize={11} />
                                        <PolarRadiusAxis stroke="var(--text-muted)" fontSize={9} />
                                        <Radar name="Performance" dataKey="A" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.3} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Categories Summary Table */}
                        <div className={styles.chartCard}>
                            <h4 className={styles.chartTitle}>Category Statistics</h4>
                            <div className={styles.tableScroll}>
                                <table className={styles.insightsTable}>
                                    <thead>
                                        <tr>
                                            <th>Category Name</th>
                                            <th align="center">Avg. Score</th>
                                            <th align="center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categoryPerformance.map((c, idx) => (
                                            <tr key={idx}>
                                                <td>{c.subject}</td>
                                                <td align="center" style={{fontWeight: 600}}>{c.A}%</td>
                                                <td align="center">Active</td>
                                            </tr>
                                        ))}
                                        {categoryPerformance.length === 0 && (
                                            <tr>
                                                <td colSpan={3} align="center" style={{ padding: "var(--space-6)", color: "var(--text-muted)" }}>
                                                    No category data available yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;
