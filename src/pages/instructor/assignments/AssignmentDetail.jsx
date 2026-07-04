// local components
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./AssignmentDetail.module.css";

// react
import { useState, useEffect, useRef } from "react";

// react-router
import { useParams, useNavigate } from "react-router";

// redux
import { useDispatch } from "react-redux";
import { sendReminderThunk } from "../../../redux/slices/assignmentsSlice";

// gsap
import { gsap } from "gsap";

// react-icons
import { 
    FiArrowLeft, 
    FiBell, 
    FiUsers, 
    FiCheckCircle, 
    FiAward, 
    FiPercent,
    FiSearch,
    FiX
} from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

// Material UI
import { Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

// supabase client
import { supabase } from "../../../services/config/supabaseClient";

const AssignmentDetail = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Local States
    const [loading, setLoading] = useState(true);
    const [assignment, setAssignment] = useState(null);
    const [studentsStatus, setStudentsStatus] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    // KPIs calculated
    const [stats, setStats] = useState({
        completed: 0,
        total: 0,
        avgScore: 0,
        passRate: 0
    });

    const containerRef = useRef(null);

    // Initial Load
    useEffect(() => {
        if (id) {
            fetchAssignmentDetails();
        }
    }, [id]);

    const fetchAssignmentDetails = async () => {
        setLoading(true);
        try {
            // 1. Fetch assignment details
            const { data: ass, error: assErr } = await supabase
                .from("assignments")
                .select("*, quiz:quizzes(*), room:rooms(*)")
                .eq("id", id)
                .single();

            if (assErr) throw assErr;
            setAssignment(ass);

            // 2. Fetch classroom members
            const { data: members, error: memErr } = await supabase
                .from("room_members")
                .select("*, profile:profiles(*)")
                .eq("room_id", ass.room_id);

            if (memErr) throw memErr;

            // 3. Fetch attempts for this quiz
            const { data: attempts, error: attErr } = await supabase
                .from("attempts")
                .select("*")
                .eq("quiz_id", ass.quiz_id)
                .order("created_at", { ascending: false });

            if (attErr) throw attErr;

            // 4. Map students completion status
            let completedCount = 0;
            let totalScores = 0;
            let passedCount = 0;

            const statusList = members.map(m => {
                // Find matching completed attempt for this user
                const userAttempt = attempts.find(a => a.uid === m.uid && a.status === "completed");
                
                const isCompleted = !!userAttempt;
                const score = isCompleted ? userAttempt.score : null;
                const isPassed = isCompleted ? (score >= (ass.quiz?.passing_score || 70)) : null;

                if (isCompleted) {
                    completedCount++;
                    totalScores += score;
                    if (isPassed) passedCount++;
                }

                return {
                    uid: m.uid,
                    fullName: m.profile?.full_name || "Unknown Student",
                    email: m.profile?.email || "",
                    avatarUrl: m.profile?.avatar_url || "",
                    isCompleted,
                    submittedAt: isCompleted ? new Date(userAttempt.completed_at || userAttempt.created_at).toLocaleString() : null,
                    score,
                    isPassed
                };
            });

            setStudentsStatus(statusList);
            setStats({
                completed: completedCount,
                total: members.length,
                avgScore: completedCount > 0 ? Math.round(totalScores / completedCount) : 0,
                passRate: completedCount > 0 ? Math.round((passedCount / completedCount) * 100) : 0
            });
        } catch (err) {
            console.error(err);
            toast.error("Failed to load assignment details");
        } finally {
            setLoading(false);
        }
    };

    // GSAP animations
    useEffect(() => {
        if (!loading) {
            const ctx = gsap.context(() => {
                gsap.fromTo(containerRef.current,
                    { opacity: 0, y: 15 },
                    { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
                );
            }, containerRef);
            return () => ctx.revert();
        }
    }, [loading]);

    // Send single reminder thunk
    const handleRemindIndividual = async (uid, fullName) => {
        try {
            // Call Supabase insert directly for single notification reminder
            const { error } = await supabase
                .from("notifications")
                .insert({
                    uid,
                    type: "assignment_reminder",
                    title: "Quiz Assignment pending",
                    body: `Reminder: Please submit "${assignment.quiz?.title}" as soon as possible.`,
                    quiz_id: assignment.quiz_id
                });

            if (error) throw error;
            toast.success(`Sent reminder notification to ${fullName}!`);
        } catch (err) {
            toast.error(err.message || "Failed to send reminder");
        }
    };

    // Filter student submissions
    const filteredStudents = studentsStatus.filter(s => {
        return s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
               s.email.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (loading) {
        return <div className={styles.loading}>Loading Assignment details...</div>;
    }

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Page Header */}
            <PageHeader 
                title={`Assignment: ${assignment.quiz?.title}`}
                subtitle={`Target Classroom: ${assignment.room?.name || "Classroom"}`}
                breadcrumbs={["Assignments", assignment.quiz?.title || "Details"]}
                onBack={() => navigate("/instructor/assignments")}
                actions={
                    <MainButton onClick={() => navigate("/instructor/assignments")} variant="secondary">
                        <FiArrowLeft /> Back to List
                    </MainButton>
                }
            />

            {/* KPI Cards */}
            <div className={styles.kpis}>
                <StatCard icon={<FiUsers />} value={`${stats.completed} / ${stats.total}`} label="Completions" color="blue" />
                <StatCard 
                    icon={<FiPercent />} 
                    value={`${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%`} 
                    label="Completion rate" 
                    color="green" 
                />
                <StatCard icon={<FiAward />} value={`${stats.avgScore}%`} label="Average Score" color="amber" />
                <StatCard icon={<FiCheckCircle />} value={`${stats.passRate}%`} label="Pass Rate" color="violet" />
            </div>

            {/* Submissions Detail list */}
            <div className={styles.detailCard}>
                <div className={styles.cardHeader}>
                    <h3>Classroom Student Submissions</h3>
                    <div className={styles.searchWrapper}>
                        <FiSearch className={styles.searchIcon} />
                        <input 
                            type="text" 
                            placeholder="Search student status..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchQuery && <FiX className={styles.clearIcon} onClick={() => setSearchQuery("")} />}
                    </div>
                </div>

                <TableContainer component={Paper} className={styles.tableContainer} elevation={0}>
                    <Table size="medium">
                        <TableHead className={styles.tableHead}>
                            <TableRow>
                                <TableCell className={styles.thCell}>Student Name</TableCell>
                                <TableCell className={styles.thCell}>Email Address</TableCell>
                                <TableCell className={styles.thCell} align="center">Status</TableCell>
                                <TableCell className={styles.thCell} align="center">Time Submitted</TableCell>
                                <TableCell className={styles.thCell} align="center">Score</TableCell>
                                <TableCell className={styles.thCell} align="center">Result</TableCell>
                                <TableCell className={styles.thCell} align="center">Remind</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredStudents.map((s) => (
                                <TableRow key={s.uid} className={styles.tableRow}>
                                    <TableCell className={styles.tdCell}>
                                        <div className={styles.studentNameCol}>
                                            <Avatar src={s.avatarUrl} sx={{ width: 28, height: 28 }}>
                                                {s.fullName.charAt(0)}
                                            </Avatar>
                                            <span>{s.fullName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className={styles.tdCell}>{s.email}</TableCell>
                                    <TableCell align="center" className={styles.tdCell}>
                                        <span className={`${styles.statusBadge} ${s.isCompleted ? styles.badgeSuccess : styles.badgePending}`}>
                                            {s.isCompleted ? "Completed" : "Pending"}
                                        </span>
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell}>
                                        {s.submittedAt || "—"}
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell} style={{fontWeight: 700}}>
                                        {s.score !== null ? `${s.score}%` : "—"}
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell}>
                                        {s.isPassed !== null ? (
                                            <span className={`${styles.resultBadge} ${s.isPassed ? styles.badgePass : styles.badgeFail}`}>
                                                {s.isPassed ? "Pass" : "Fail"}
                                            </span>
                                        ) : "—"}
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell}>
                                        {!s.isCompleted ? (
                                            <button 
                                                className={styles.remindBtn}
                                                onClick={() => handleRemindIndividual(s.uid, s.fullName)}
                                                title="Send individual reminder notification"
                                            >
                                                <FiBell /> Remind
                                            </button>
                                        ) : "—"}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredStudents.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" className={styles.emptyCell}>
                                        No student submissions found matching search.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    );
};

export default AssignmentDetail;
