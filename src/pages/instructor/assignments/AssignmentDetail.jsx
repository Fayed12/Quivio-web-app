// local components
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./AssignmentDetail.module.css";
import { supabase } from "../../../services/config/supabaseClient";
import { useAssignmentDetailData } from "../../../hooks/instructor/useAssignmentDetailData";

// react
import { useState, useRef } from "react";

// react-router
import { useParams, useNavigate } from "react-router";

// animation
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

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

const AssignmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Use custom data hook
    const { loading, assignment, studentsStatus, stats } = useAssignmentDetailData(id);

    // Local States
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const containerRef = useRef(null);

    // Page entrance animation
    usePageAnimation(containerRef, { ready: !loading });

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

    // Pagination calculations
    const rowsPerPage = 5;
    const totalRows = filteredStudents.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const startRow = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(currentPage * rowsPerPage, totalRows);

    if (loading) {
        return <div className={styles.loading}>Loading Assignment details...</div>;
    }

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Page Header */}
            <PageHeader 
                title={`Assignment: ${assignment?.quiz?.title || "Quiz Assignment"}`}
                subtitle={assignment?.room?.name ? `Target Classroom: ${assignment.room.name}` : assignment?.student?.full_name ? `Target Student: ${assignment.student.full_name}` : "Assignment Details"}
                breadcrumbs={["Assignments", assignment?.quiz?.title || "Details"]}
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
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className={styles.searchInput}
                        />
                        {searchQuery && <FiX className={styles.clearIcon} onClick={() => { setSearchQuery(""); setCurrentPage(1); }} />}
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
                            {paginatedStudents.map((s) => (
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

                {/* Pagination Controls */}
                {totalRows > 0 && (
                    <div className={styles.paginationRow}>
                        <div className={styles.paginationInfo}>
                            Showing <strong>{startRow}</strong>-<strong>{endRow}</strong> of <strong>{totalRows}</strong> students
                        </div>
                        <div className={styles.paginationBtnGroup}>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className={styles.pageBtn}
                            >
                                Previous
                            </button>
                            {[...Array(totalPages)].map((_, idx) => {
                                const pageNum = idx + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`${styles.pageNumberBtn} ${currentPage === pageNum ? styles.pageNumberBtnActive : ""}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className={styles.pageBtn}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignmentDetail;
