// local components
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./Analytics.module.css";

// react
import { useState, useEffect, useRef } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";
import { fetchMyQuizzes, selectMyQuizzes } from "../../../redux/slices/quizzesSlice";
import { fetchCategories, selectCategories } from "../../../redux/slices/categoriesSlice";
import { fetchMyStudents, selectMyStudents } from "../../../redux/slices/instructorStudentsSlice";

// gsap
import { gsap } from "gsap";

// react-icons
import { 
    FiCalendar, 
    FiDownload, 
    FiTrendingUp, 
    FiTrendingDown,
    FiClock, 
    FiTarget, 
    FiAward, 
    FiCheckCircle, 
    FiHelpCircle,
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
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

const Analytics = () => {
    const dispatch = useDispatch();

    // Redux selectors
    const quizzes = useSelector(selectMyQuizzes);
    const categories = useSelector(selectCategories);
    const students = useSelector(selectMyStudents);

    // Filters
    const [dateRange, setDateRange] = useState("30days");
    const [activeTab, setActiveTab] = useState("quizzes");

    const containerRef = useRef(null);

    // Initial fetch
    useEffect(() => {
        dispatch(fetchMyQuizzes());
        dispatch(fetchCategories());
        dispatch(fetchMyStudents());
    }, [dispatch]);

    // GSAP animations
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(containerRef.current,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
            );
        }, containerRef);
        return () => ctx.revert();
    }, [activeTab]);

    // Exports triggers
    const handleExport = (type) => {
        toast.success(`Exporting analytics data as ${type.toUpperCase()}...`);
    };

    // Recharts Data mockups
    const quizScoreData = [
        { name: "JS Variables", avg: 82, pass: 88 },
        { name: "React Basics", avg: 74, pass: 80 },
        { name: "CSS Flexbox", avg: 90, pass: 95 },
        { name: "HTML Semantic", avg: 88, pass: 92 },
        { name: "Git Workflow", avg: 68, pass: 75 }
    ];

    const scoreDistributionData = [
        { score: "0-50%", students: 2 },
        { score: "50-60%", students: 5 },
        { score: "60-70%", students: 12 },
        { score: "70-80%", students: 28 },
        { score: "80-90%", students: 35 },
        { score: "90-100%", students: 18 }
    ];

    const passFailPieData = [
        { name: "Passed", value: 85, color: "#10B981" },
        { name: "Failed", value: 15, color: "#EF4444" }
    ];

    const categoryRadarData = [
        { category: "Web Basics", A: 88, B: 110, fullMark: 100 },
        { category: "React.js", A: 74, B: 130, fullMark: 100 },
        { category: "Database", A: 82, B: 100, fullMark: 100 },
        { category: "Node.js", A: 68, B: 90, fullMark: 100 },
        { category: "Git & Shell", A: 85, B: 120, fullMark: 100 }
    ];

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
                <StatCard icon={<FiTarget />} value="81.5%" label="Average score" trend="+3.2% vs last month" color="blue" />
                <StatCard icon={<FiCheckCircle />} value="85.4%" label="Pass rate" trend="+1.5% vs last month" color="green" />
                <StatCard icon={<FiClock />} value="14.2 min" label="Avg completion time" color="amber" />
                <StatCard icon={<FiAward />} value="256" label="Certificates issued" trend="+24 this week" color="violet" />
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
                                    <BarChart data={scoreDistributionData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" />
                                        <XAxis dataKey="score" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                                        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                                        <Tooltip />
                                        <Bar dataKey="students" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
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
                                                data={passFailPieData} 
                                                cx="50%" cy="50%" 
                                                innerRadius={60} 
                                                outerRadius={80} 
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {passFailPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className={styles.pieLegend}>
                                    <div className={styles.legendItem}>
                                        <span className={styles.legendDot} style={{backgroundColor: "#10B981"}} />
                                        <span>Passed: 85.4%</span>
                                    </div>
                                    <div className={styles.legendItem}>
                                        <span className={styles.legendDot} style={{backgroundColor: "#EF4444"}} />
                                        <span>Failed: 14.6%</span>
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
                                <AreaChart data={quizScoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                            <h4 className={styles.listHeader}><FiFrown className={styles.hardIcon} /> Hardest Questions (Low Accuracy)</h4>
                            <div className={styles.listBody}>
                                <div className={styles.listItem}>
                                    <p>"What is closure variable mapping scope?"</p>
                                    <span>Accuracy: 32%</span>
                                </div>
                                <div className={styles.listItem}>
                                    <p>"How does useEffect cleanup sync lifecycle?"</p>
                                    <span>Accuracy: 44%</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.listCard}>
                            <h4 className={styles.listHeader}><FiSmile className={styles.easyIcon} /> Easiest Questions (High Accuracy)</h4>
                            <div className={styles.listBody}>
                                <div className={styles.listItem}>
                                    <p>"What HTML tags are used for lists?"</p>
                                    <span>Accuracy: 95%</span>
                                </div>
                                <div className={styles.listItem}>
                                    <p>"Identify the variable declaration keyword."</p>
                                    <span>Accuracy: 90%</span>
                                </div>
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
                                {students.map((s) => (
                                    <TableRow key={s.student_uid} className={styles.tableRow}>
                                        <TableCell className={styles.tdCell}>
                                            <div className={styles.studentNameCol}>
                                                <Avatar src={s.profile?.avatar_url} sx={{ width: 28, height: 28 }}>
                                                    {s.profile?.full_name?.charAt(0)}
                                                </Avatar>
                                                <span>{s.profile?.full_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell}>12</TableCell>
                                        <TableCell align="center" className={styles.tdCell} style={{fontWeight: 700}}>82%</TableCell>
                                        <TableCell align="center" className={styles.tdCell}>
                                            <div className={styles.trendRow} data-trend="up">
                                                <FiChevronUp /> +4.5%
                                            </div>
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell}>3 issued</TableCell>
                                        <TableCell align="center" className={styles.tdCell}>
                                            <span className={`${styles.statusBadge} ${s.profile?.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                                                {s.profile?.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
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
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryRadarData}>
                                        <PolarGrid stroke="var(--border-default)" />
                                        <PolarAngleAxis dataKey="category" stroke="var(--text-muted)" fontSize={11} />
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
                                            <th align="center">Quizzes count</th>
                                            <th align="center">Avg. Score</th>
                                            <th align="center">Participation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.map((c) => (
                                            <tr key={c.id}>
                                                <td>{c.name}</td>
                                                <td align="center">3</td>
                                                <td align="center" style={{fontWeight: 600}}>84%</td>
                                                <td align="center">92%</td>
                                            </tr>
                                        ))}
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
