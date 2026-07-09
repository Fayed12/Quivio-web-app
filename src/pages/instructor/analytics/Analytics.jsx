// local components
import PageHeader from "../components/PageHeader";
import MainButton from "../../../components/ui/button/MainButton";
import CustomSelect from "../../../components/ui/select/CustomSelect";
import styles from "./Analytics.module.css";
import { useAnalyticsData } from "../../../hooks/instructor/useAnalyticsData";
import ModalPortal from "../components/ModalPortal";

// react
import { useState, useRef, useEffect } from "react";

// animation
import { gsap } from "gsap";

// react-icons
import {
    FiDownload, 
    FiClock, 
    FiTarget, 
    FiAward, 
    FiCheckCircle,
    FiFrown,
    FiSmile,
    FiChevronUp,
    FiChevronDown,
    FiUser,
    FiCalendar,
    FiPieChart,
    FiActivity,
    FiX,
    FiInfo
} from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

// Recharts
import { 
    ResponsiveContainer, 
    AreaChart, Area, 
    BarChart, Bar, 
    PieChart, Pie, Cell, 
    XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from "recharts";

// Material UI
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar } from "@mui/material";

// XLSX for exports
import * as XLSX from "xlsx";

const Analytics = () => {
    // Local Filters States
    const [dateRange, setDateRange] = useState("30days");
    const [customRange, setCustomRange] = useState(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return {
            startDate: thirtyDaysAgo.toISOString().split("T")[0],
            endDate: today.toISOString().split("T")[0]
        };
    });
    const [selectedQuizId, setSelectedQuizId] = useState("all");
    const [activeTab, setActiveTab] = useState("quizzes");

    // Student Progress Tab states
    const [searchQuery, setSearchQuery] = useState("");
    const [studentStatusFilter, setStudentStatusFilter] = useState("all");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;

    const containerRef = useRef(null);
    const sidePanelRef = useRef(null);

    const {
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
    } = useAnalyticsData(dateRange, customRange, selectedQuizId);

    // Page entrance & tab switch animation using GSAP
    useEffect(() => {
        if (!loading && containerRef.current) {
            // Animate cards & charts loading/tab-switching
            const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });
            timeline.fromTo(`.${styles.kpiCard}, .${styles.chartCard}, .${styles.listCard}, .${styles.tableContainer}, .${styles.groupCard}`, 
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.03 }
            );
        }
    }, [loading, activeTab]);

    // GSAP animation for slide-in student details panel
    useEffect(() => {
        if (selectedStudent && sidePanelRef.current) {
            const rafId = requestAnimationFrame(() => {
                gsap.fromTo(sidePanelRef.current,
                    { x: "100%", opacity: 0 },
                    { x: "0%", opacity: 1, duration: 0.4, ease: "power3.out" }
                );
            });
            return () => cancelAnimationFrame(rafId);
        }
    }, [selectedStudent]);

    // Handlers for exporting currently viewed datasets
    const handleExport = () => {
        let exportData = [];
        let filename = "quivio_analytics.xlsx";
        let sheetName = "Analytics";

        if (activeTab === "quizzes") {
            exportData = quizPerformanceData.map(q => ({
                "Quiz Name": q.name,
                "Category": q.category,
                "Completions": q.completions,
                "Average Score (%)": q.avg,
                "Pass Rate (%)": q.pass
            }));
            filename = `quivio_quiz_performance_${dateRange}.xlsx`;
            sheetName = "Quiz Performance";
        } else if (activeTab === "progress") {
            exportData = studentProgress.map(s => ({
                "Student Name": s.name,
                "Email": s.email,
                "Attempts": s.attemptsCount,
                "Average Score (%)": s.avgScore,
                "Pass Rate (%)": s.passRate,
                "Improvement": s.improvement > 0 ? `+${s.improvement}` : s.improvement,
                "Last Active": s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "Never"
            }));
            filename = `quivio_student_progress_${dateRange}.xlsx`;
            sheetName = "Student Progress";
        } else if (activeTab === "categories") {
            exportData = categoryPerformance.map(c => ({
                "Category Name": c.subject,
                "Quizzes": c.quizCount,
                "Students": c.studentCount,
                "Average Score (%)": c.avgScore
            }));
            filename = `quivio_category_insights_${dateRange}.xlsx`;
            sheetName = "Category Insights";
        }

        if (exportData.length === 0) {
            toast.warning("No data available to export.");
            return;
        }

        try {
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            XLSX.writeFile(workbook, filename);
            toast.success(`Exported ${sheetName} successfully!`);
        } catch (err) {
            console.error("Error exporting to Excel:", err);
            toast.error("Failed to export Excel sheet.");
        }
    };

    // Filter Student Progress Table
    const filteredProgress = studentProgress.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              s.email.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (studentStatusFilter === "top") {
            return matchesSearch && s.attemptsCount > 0 && s.avgScore >= 85;
        }
        if (studentStatusFilter === "needs_attention") {
            return matchesSearch && s.needsAttention;
        }
        if (studentStatusFilter === "no_activity") {
            return matchesSearch && s.attemptsCount === 0;
        }

        return matchesSearch;
    });

    // Pagination
    const totalRows = filteredProgress.length;
    const totalPages = Math.ceil(totalRows / pageSize);
    const paginatedProgress = filteredProgress.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Reset pagination to page 1 on filter changes during render to avoid cascading renders
    const filterKey = `${searchQuery}_${studentStatusFilter}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (filterKey !== prevFilterKey) {
        setPrevFilterKey(filterKey);
        setCurrentPage(1);
    }

    if (loading) {
        return (
            <div className={styles.loadingWrapper}>
                <div className={styles.spinner}></div>
                <span>Loading Analytics System...</span>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Page Header */}
            <PageHeader 
                title="Analytics Dashboard"
                subtitle="Deep-dive statistics, attempt progressions, category radar, and student performance metrics."
                breadcrumbs={["Analytics"]}
                actions={
                    <div className={styles.headerActions}>
                        {/* Quiz selector (Only on Quiz Performance tab) */}
                        {activeTab === "quizzes" && (
                            <div className={styles.selectWrapper} style={{ width: "200px" }}>
                                <CustomSelect
                                    options={[
                                        { value: "all", label: "All Quizzes" },
                                        ...quizzes.map(q => ({ value: q.id, label: q.title }))
                                    ]}
                                    value={selectedQuizId}
                                    onChange={setSelectedQuizId}
                                    placeholder="Select Quiz..."
                                />
                            </div>
                        )}

                        {/* Date Range Select */}
                        <div className={styles.selectWrapper} style={{ width: "160px" }}>
                            <CustomSelect
                                options={[
                                    { value: "7days", label: "Last 7 Days" },
                                    { value: "30days", label: "Last 30 Days" },
                                    { value: "90days", label: "Last 90 Days" },
                                    { value: "custom", label: "Custom Range" },
                                    { value: "all", label: "All Time" }
                                ]}
                                value={dateRange}
                                onChange={setDateRange}
                            />
                        </div>

                        {/* Custom Date Inputs */}
                        {dateRange === "custom" && (
                            <div className={styles.customDateWrapper}>
                                <input 
                                    type="date"
                                    value={customRange.startDate}
                                    onChange={(e) => setCustomRange(prev => ({ ...prev, startDate: e.target.value }))}
                                    className={styles.dateInput}
                                    title="Start Date"
                                />
                                <span className={styles.dateSeparator}>to</span>
                                <input 
                                    type="date"
                                    value={customRange.endDate}
                                    onChange={(e) => setCustomRange(prev => ({ ...prev, endDate: e.target.value }))}
                                    className={styles.dateInput}
                                    title="End Date"
                                />
                            </div>
                        )}

                        {/* Export xlsx Button */}
                        <MainButton onClick={handleExport} variant="primary">
                            <FiDownload /> Export Excel
                        </MainButton>
                    </div>
                }
            />

            {/* Performance KPI blocks */}
            <div className={styles.kpiGrid}>
                <div className={`${styles.kpiCard} ${styles.blue}`}>
                    <div className={styles.kpiIconBox}><FiTarget /></div>
                    <div className={styles.kpiInfo}>
                        <h3>{stats.avgScore}%</h3>
                        <span>Average Score</span>
                    </div>
                </div>
                <div className={`${styles.kpiCard} ${styles.green}`}>
                    <div className={styles.kpiIconBox}><FiCheckCircle /></div>
                    <div className={styles.kpiInfo}>
                        <h3>{stats.passRate}%</h3>
                        <span>Pass Rate</span>
                    </div>
                </div>
                <div className={`${styles.kpiCard} ${styles.amber}`}>
                    <div className={styles.kpiIconBox}><FiClock /></div>
                    <div className={styles.kpiInfo}>
                        <h3>{stats.avgTimeMins} min</h3>
                        <span>Avg. Attempt Time</span>
                    </div>
                </div>
                <div className={`${styles.kpiCard} ${styles.violet}`}>
                    <div className={styles.kpiIconBox}><FiAward /></div>
                    <div className={styles.kpiInfo}>
                        <h3>{stats.totalCompletions} / {stats.totalAttempts}</h3>
                        <span>Completions / Total</span>
                    </div>
                </div>
            </div>

            {/* Main Tabs Navigation */}
            <div className={styles.tabsRow}>
                {["quizzes", "progress", "categories"].map(tab => (
                    <button 
                        key={tab} 
                        className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === "quizzes" && "Quiz Performance"}
                        {tab === "progress" && "Student Analytics"}
                        {tab === "categories" && "Category Insights"}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT: QUIZ PERFORMANCE */}
            {activeTab === "quizzes" && (
                <div className={styles.tabLayout}>
                    {/* Charts Grid */}
                    <div className={styles.grid2}>
                        {/* Score Distribution Chart */}
                        <div className={styles.chartCard}>
                            <h4 className={styles.chartTitle}><FiActivity /> Overall Score Distribution</h4>
                            <div className={styles.chartWrapper}>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" />
                                        <XAxis dataKey="range" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                                        <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: "var(--bg-surface)", 
                                                borderColor: "var(--border-default)", 
                                                borderRadius: "var(--radius-md)" 
                                            }}
                                            labelClassName={styles.tooltipLabel}
                                        />
                                        <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Dual Donut Ratio Charts */}
                        <div className={styles.chartCard}>
                            <h4 className={styles.chartTitle}><FiPieChart /> Pass vs Fail & Completion Ratios</h4>
                            <div className={styles.pieLayout}>
                                {/* Pass/Fail Donut */}
                                <div className={styles.pieChartContainer}>
                                    <h5 className={styles.pieSubTitle}>Pass / Fail Ratio</h5>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <PieChart>
                                            <Pie 
                                                data={passFailRatio} 
                                                cx="50%" cy="50%" 
                                                innerRadius={45} 
                                                outerRadius={60} 
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                <Cell fill="var(--color-success)" />
                                                <Cell fill="var(--color-danger)" />
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className={styles.pieLegend}>
                                        <span>Passed: {stats.passRate}%</span>
                                        <span>Failed: {100 - stats.passRate}%</span>
                                    </div>
                                </div>

                                {/* Completion/Abandoned Donut */}
                                <div className={styles.pieChartContainer}>
                                    <h5 className={styles.pieSubTitle}>Completion Ratio</h5>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <PieChart>
                                            <Pie 
                                                data={completionRatio} 
                                                cx="50%" cy="50%" 
                                                innerRadius={45} 
                                                outerRadius={60} 
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                <Cell fill="var(--blue-500)" />
                                                <Cell fill="var(--slate-400)" />
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className={styles.pieLegend}>
                                        <span>Completed: {stats.completionRate}%</span>
                                        <span>Other: {100 - stats.completionRate}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attempts over time timeline area chart */}
                    <div className={styles.chartCard}>
                        <h4 className={styles.chartTitle}><FiCalendar /> Attempts Activity Over Time</h4>
                        <div className={styles.chartWrapper}>
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={attemptsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--blue-500)" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="var(--blue-500)" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                                    <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="count" name="Total Attempts" stroke="var(--blue-500)" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                                    <Area type="monotone" dataKey="passed" name="Passed Attempts" stroke="var(--color-success)" strokeWidth={2} fillOpacity={1} fill="url(#colorPassed)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Questions Analytics */}
                    <div className={styles.grid2}>
                        {/* Hardest Questions Table */}
                        <div className={styles.listCard}>
                            <h4 className={styles.listHeader}><FiFrown className={styles.hardIcon} /> Hardest Questions (Highest Error Rate)</h4>
                            <div className={styles.tableScroll}>
                                <table className={styles.insightsTable}>
                                    <thead>
                                        <tr>
                                            <th>Question Text</th>
                                            <th align="center">% Missed</th>
                                            <th align="center">Attempts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {questionPerformances.hardest.map((q, idx) => (
                                            <tr key={q.id}>
                                                <td className={styles.questionTextCol}>
                                                    {idx === 0 && <span className={styles.missedBadge}>Most Missed</span>}
                                                    <span className={styles.truncatedText} title={q.text}>
                                                        {q.text}
                                                    </span>
                                                </td>
                                                <td align="center">
                                                    <span className={`${styles.statusBadge} ${styles.badgeInactive}`}>
                                                        {q.percentIncorrect}%
                                                    </span>
                                                </td>
                                                <td align="center" style={{ fontWeight: 600 }}>{q.attempts}</td>
                                            </tr>
                                        ))}
                                        {questionPerformances.hardest.length === 0 && (
                                            <tr>
                                                <td colSpan={3} align="center" style={{ padding: "var(--space-6)", color: "var(--text-muted)" }}>
                                                    No attempt answers recorded.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Easiest Questions Table */}
                        <div className={styles.listCard}>
                            <h4 className={styles.listHeader}><FiSmile className={styles.easyIcon} /> Easiest Questions (Highest Correct Rate)</h4>
                            <div className={styles.tableScroll}>
                                <table className={styles.insightsTable}>
                                    <thead>
                                        <tr>
                                            <th>Question Text</th>
                                            <th align="center">% Correct</th>
                                            <th align="center">Attempts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {questionPerformances.easiest.map((q) => (
                                            <tr key={q.id}>
                                                <td className={styles.questionTextCol}>
                                                    <span className={styles.truncatedText} title={q.text}>
                                                        {q.text}
                                                    </span>
                                                </td>
                                                <td align="center">
                                                    <span className={`${styles.statusBadge} ${styles.badgeActive}`}>
                                                        {q.percentCorrect}%
                                                    </span>
                                                </td>
                                                <td align="center" style={{ fontWeight: 600 }}>{q.attempts}</td>
                                            </tr>
                                        ))}
                                        {questionPerformances.easiest.length === 0 && (
                                            <tr>
                                                <td colSpan={3} align="center" style={{ padding: "var(--space-6)", color: "var(--text-muted)" }}>
                                                    No attempt answers recorded.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Avg Time Per Question Horizontal Bar Chart */}
                    <div className={styles.chartCard}>
                        <h4 className={styles.chartTitle}><FiClock /> Average Time Spent per Question (Seconds)</h4>
                        <div className={styles.chartWrapper}>
                            {questionPerformances.avgTimePerQuestion.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200 + questionPerformances.avgTimePerQuestion.length * 30}>
                                    <BarChart 
                                        layout="vertical"
                                        data={questionPerformances.avgTimePerQuestion} 
                                        margin={{ top: 10, right: 20, left: 40, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-default)" />
                                        <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} />
                                        <YAxis 
                                            type="category" 
                                            dataKey="text" 
                                            stroke="var(--text-secondary)" 
                                            fontSize={10} 
                                            width={150}
                                            tickFormatter={(tick) => tick.length > 25 ? `${tick.slice(0, 25)}...` : tick}
                                        />
                                        <Tooltip />
                                        <Bar dataKey="avgTimeSpent" name="Avg Time (s)" fill="var(--amber-500)" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className={styles.emptyStateContainer}>No time-tracking data available.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: STUDENT ANALYTICS */}
            {activeTab === "progress" && (
                <div className={styles.tabLayout}>
                    {/* Performance Status Groups Filters */}
                    <div className={styles.groupsGrid}>
                        <div 
                            className={`${styles.groupCard} ${styles.blue} ${studentStatusFilter === "all" ? styles.groupCardActive : ""}`}
                            onClick={() => setStudentStatusFilter("all")}
                        >
                            <div className={styles.groupHeader}>
                                <span>All Students</span>
                                <FiUser />
                            </div>
                            <strong className={styles.groupCount}>{studentProgress.length}</strong>
                        </div>
                        <div 
                            className={`${styles.groupCard} ${styles.violet} ${studentStatusFilter === "top" ? styles.groupCardActive : ""}`}
                            onClick={() => setStudentStatusFilter("top")}
                        >
                            <div className={styles.groupHeader}>
                                <span>Top Performers (avg ≥85%)</span>
                                <FiAward />
                            </div>
                            <strong className={styles.groupCount}>{performanceGroups.topPerformers.length}</strong>
                        </div>
                        <div 
                            className={`${styles.groupCard} ${styles.red} ${studentStatusFilter === "needs_attention" ? styles.groupCardActive : ""}`}
                            onClick={() => setStudentStatusFilter("needs_attention")}
                        >
                            <div className={styles.groupHeader}>
                                <span>Needs Attention (&lt;50% or inactive)</span>
                                <FiFrown />
                            </div>
                            <strong className={styles.groupCount}>{performanceGroups.needsAttention.length}</strong>
                        </div>
                        <div 
                            className={`${styles.groupCard} ${styles.slate} ${studentStatusFilter === "no_activity" ? styles.groupCardActive : ""}`}
                            onClick={() => setStudentStatusFilter("no_activity")}
                        >
                            <div className={styles.groupHeader}>
                                <span>No Activity (0 attempts)</span>
                                <FiInfo/>
                            </div>
                            <strong className={styles.groupCount}>{performanceGroups.noActivity.length}</strong>
                        </div>
                    </div>

                    {/* Table Filters Search Bar */}
                    <div className={styles.filterRow}>
                        <div className={styles.searchContainer}>
                            <input 
                                type="text"
                                placeholder="Search student by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                            {searchQuery && (
                                <button className={styles.clearSearchBtn} onClick={() => setSearchQuery("")}><FiX /></button>
                            )}
                        </div>
                    </div>

                    {/* Student List Table */}
                    <TableContainer component={Paper} className={styles.tableContainer} elevation={0}>
                        <Table size="medium">
                            <TableHead className={styles.tableHead}>
                                <TableRow>
                                    <TableCell className={styles.thCell}>Student Name</TableCell>
                                    <TableCell className={styles.thCell} align="center">Attempts</TableCell>
                                    <TableCell className={styles.thCell} align="center">Average Score</TableCell>
                                    <TableCell className={styles.thCell} align="center">Pass Rate</TableCell>
                                    <TableCell className={styles.thCell} align="center">Improvement Trend</TableCell>
                                    <TableCell className={styles.thCell} align="center">Last Active</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedProgress.map((s) => (
                                    <TableRow 
                                        key={s.id} 
                                        className={`${styles.tableRow} ${styles.clickable}`}
                                        onClick={() => setSelectedStudent(s)}
                                    >
                                        <TableCell className={styles.tdCell}>
                                            <div className={styles.studentNameCol}>
                                                <Avatar 
                                                    src={s.avatarUrl} 
                                                    sx={{ width: 32, height: 32, fontSize: "12px", fontWeight: "bold" }}
                                                >
                                                    {s.name.charAt(0)}
                                                </Avatar>
                                                <div className={styles.nameDetails}>
                                                    <span className={styles.studentNameText}>{s.name}</span>
                                                    <span className={styles.studentEmailText}>{s.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell} style={{ fontWeight: 600 }}>{s.attemptsCount}</TableCell>
                                        <TableCell align="center" className={styles.tdCell} style={{ fontWeight: 700 }}>
                                            {s.attemptsCount > 0 ? `${s.avgScore}%` : "—"}
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell}>
                                            {s.attemptsCount > 0 ? (
                                                <span className={`${styles.statusBadge} ${s.passRate >= 50 ? styles.badgeActive : styles.badgeInactive}`}>
                                                    {s.passRate}% Pass
                                                </span>
                                            ) : "—"}
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell}>
                                            {s.attemptsCount > 0 ? (
                                                <div className={styles.trendRow} data-trend={s.improvement >= 0 ? "up" : "down"}>
                                                    {s.improvement >= 0 ? <FiChevronUp /> : <FiChevronDown />}
                                                    <span>{s.improvement >= 0 ? `+${s.improvement}` : s.improvement}%</span>
                                                </div>
                                            ) : "—"}
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell}>
                                            {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "Never"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {paginatedProgress.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" className={styles.emptyCell}>
                                            No students found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.paginationRow}>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className={styles.pageBtn}
                            >
                                Previous
                            </button>
                            <span className={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className={styles.pageBtn}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: CATEGORY INSIGHTS */}
            {activeTab === "categories" && (
                <div className={styles.tabLayout}>
                    {/* Highlight Panels */}
                    <div className={styles.grid2}>
                        {categoryHighlights.best && (
                            <div className={`${styles.highlightCard} ${styles.success}`}>
                                <div className={styles.highlightBadge}>Top Performance Category</div>
                                <h3>{categoryHighlights.best.subject}</h3>
                                <p>This category holds the highest score index of <strong>{categoryHighlights.best.avgScore}%</strong> average accuracy.</p>
                                <div className={styles.miniStatsInline}>
                                    <span><strong>{categoryHighlights.best.quizCount}</strong> Quizzes</span>
                                    <span><strong>{categoryHighlights.best.studentCount}</strong> Students</span>
                                </div>
                            </div>
                        )}
                        {categoryHighlights.worst && (
                            <div className={`${styles.highlightCard} ${styles.danger}`}>
                                <div className={styles.highlightBadge}>Needs Enhancement</div>
                                <h3>{categoryHighlights.worst.subject}</h3>
                                <p>Students struggle in this domain, recording a low score index of <strong>{categoryHighlights.worst.avgScore}%</strong> average accuracy.</p>
                                <div className={styles.miniStatsInline}>
                                    <span><strong>{categoryHighlights.worst.quizCount}</strong> Quizzes</span>
                                    <span><strong>{categoryHighlights.worst.studentCount}</strong> Students</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.grid2}>
                        {/* Subject Performance index chart */}
                        <div className={styles.chartCard}>
                            <h4 className={styles.chartTitle}><FiActivity /> Subject Performance Index</h4>
                            <div className={styles.chartWrapper}>
                                {categoryPerformance.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart 
                                            data={categoryPerformance} 
                                            layout="vertical" 
                                            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-default)" />
                                            <XAxis type="number" domain={[0, 100]} stroke="var(--text-secondary)" fontSize={11} />
                                            <YAxis type="category" dataKey="subject" stroke="var(--text-secondary)" fontSize={11} width={80} />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: "var(--bg-surface)", 
                                                    borderColor: "var(--border-default)", 
                                                    borderRadius: "var(--radius-md)" 
                                                }}
                                            />
                                            <Bar dataKey="avgScore" name="Avg Score (%)" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className={styles.emptyStateContainer}>No category data computed.</div>
                                )}
                            </div>
                        </div>

                        {/* Category Stats Table */}
                        <div className={styles.chartCard}>
                            <h4 className={styles.chartTitle}><FiAward /> Category Analytics Details</h4>
                            <div className={styles.tableScroll}>
                                <table className={styles.insightsTable}>
                                    <thead>
                                        <tr>
                                            <th>Category Name</th>
                                            <th align="center">Unique Quizzes</th>
                                            <th align="center">Participants</th>
                                            <th align="center">Avg. Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categoryPerformance.map((c, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: 600 }}>{c.subject}</td>
                                                <td align="center">{c.quizCount}</td>
                                                <td align="center">{c.studentCount}</td>
                                                <td align="center">
                                                    <span className={`${styles.statusBadge} ${c.avgScore >= 75 ? styles.badgeActive : styles.badgeInactive}`}>
                                                        {c.avgScore}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {categoryPerformance.length === 0 && (
                                            <tr>
                                                <td colSpan={4} align="center" style={{ padding: "var(--space-6)", color: "var(--text-muted)" }}>
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

            {/* STUDENT DETAILS SLIDE-IN PANEL */}
            {selectedStudent && (
                <ModalPortal onClose={() => setSelectedStudent(null)}>
                    {/* Backdrop */}
                    <div className={styles.panelBackdrop} onClick={() => setSelectedStudent(null)} />
                    
                    <div className={styles.sidePanel} ref={sidePanelRef}>
                        <div className={styles.panelHeader}>
                            <h3>Detailed Student Profiling</h3>
                            <button className={styles.panelClose} onClick={() => setSelectedStudent(null)}>
                                <FiX />
                            </button>
                        </div>

                        <div className={styles.panelBody}>
                            {/* Profile Card */}
                            <div className={styles.panelProfileCard}>
                                <Avatar 
                                    src={selectedStudent.avatarUrl} 
                                    sx={{ width: 64, height: 64, mb: 1, fontSize: "20px", fontWeight: "bold" }}
                                >
                                    {selectedStudent.name.charAt(0)}
                                </Avatar>
                                <h4>{selectedStudent.name}</h4>
                                <span className={styles.emailText}>{selectedStudent.email}</span>
                            </div>

                            {/* Stats */}
                            <div className={styles.miniStatsGrid}>
                                <div className={styles.miniStatCard}>
                                    <FiActivity className={styles.miniStatIcon} />
                                    <div>
                                        <strong>{selectedStudent.attemptsCount}</strong>
                                        <span>Total Attempts</span>
                                    </div>
                                </div>
                                <div className={styles.miniStatCard}>
                                    <FiAward className={styles.miniStatIcon} />
                                    <div>
                                        <strong>{selectedStudent.attemptsCount > 0 ? `${selectedStudent.avgScore}%` : "—"}</strong>
                                        <span>Avg. Score</span>
                                    </div>
                                </div>
                                <div className={styles.miniStatCard}>
                                    <FiCheckCircle className={styles.miniStatIcon} />
                                    <div>
                                        <strong>{selectedStudent.attemptsCount > 0 ? `${selectedStudent.passRate}%` : "—"}</strong>
                                        <span>Pass Rate</span>
                                    </div>
                                </div>
                            </div>

                            {/* Attempt History Feed */}
                            <div className={styles.panelSection}>
                                <h4>Quiz Attempts History</h4>
                                <div className={styles.attemptsFeed}>
                                    {selectedStudent.attempts && selectedStudent.attempts.length > 0 ? (
                                        selectedStudent.attempts.map((att) => (
                                            <div key={att.id} className={styles.attemptItem}>
                                                <div className={styles.attemptItemLeft}>
                                                    <span className={styles.attemptQuizTitle}>{att.quizTitle}</span>
                                                    <span className={styles.attemptDate}>
                                                        {new Date(att.submittedAt || att.startedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className={styles.attemptItemRight}>
                                                    <strong className={att.passed ? styles.textSuccess : styles.textDanger}>
                                                        {att.score}%
                                                    </strong>
                                                    <span className={styles.attemptTimeSpent}>
                                                        {Math.round(att.timeSpentSecs / 60)} min spent
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.emptyFeed}>No quiz attempts registered.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default Analytics
