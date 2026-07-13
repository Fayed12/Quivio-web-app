// local components
import PageHeader from "../components/PageHeader";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./Assignments.module.css";

// react
import { useState, useRef, useMemo } from "react";

// react-router
import { useNavigate } from "react-router";

// redux
import { useDispatch } from "react-redux";
import { 
    fetchMyAssignments, 
    createAssignmentThunk, 
    deleteAssignmentThunk,
    sendReminderThunk
} from "../../../redux/slices/assignmentsSlice";

// animation
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";
import ModalPortal from "../components/ModalPortal";

// react-icons
import { 
    FiPlus, 
    FiSearch, 
    FiTrash2, 
    FiBell, 
    FiX,
    FiEye
} from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

// Material UI
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

// sweetalert2
import Swal from "sweetalert2";

// custom select
import CustomSelect from "../../../components/ui/select/CustomSelect";

import { useAssignmentsData } from "../../../hooks/instructor/useAssignmentsData";

const Assignments = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Custom hook loader
    const { assignments, quizzes, rooms, completionsMap } = useAssignmentsData();

    // Local States
    const [searchQuery, setSearchQuery] = useState("");
    const [isAssignOpen, setIsAssignOpen] = useState(false);

    // Modal Assign Form inputs
    const [assignQuizId, setAssignQuizId] = useState("");
    const [assignRoomId, setAssignRoomId] = useState("");
    const [assignDueDate, setAssignDueDate] = useState("");
    const [assignLimit, setAssignLimit] = useState("");
    const [assignNote, setAssignNote] = useState("");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const containerRef = useRef(null);
    const assignModalRef = useRef(null);

    // Page entrance animation
    usePageAnimation(containerRef);

    // Build a Set of "quizId::roomId" strings for all existing assignments
    const existingAssignmentCombos = useMemo(() => {
        return new Set(
            assignments
                .filter(a => (a.quiz_id || a.quiz?.id) && (a.room_id || a.room?.id))
                .map(a => `${a.quiz_id || a.quiz?.id}::${a.room_id || a.room?.id}`)
        );
    }, [assignments]);

    // Available rooms filtered by whether the selected quiz is already assigned there
    const availableRoomsForQuiz = useMemo(() => {
        if (!assignQuizId) return rooms;
        return rooms.filter(r => !existingAssignmentCombos.has(`${assignQuizId}::${r.id}`));
    }, [rooms, assignQuizId, existingAssignmentCombos]);

    // Operations Handlers
    const handleAssignQuiz = async (e) => {
        e.preventDefault();
        if (!assignQuizId || !assignRoomId) {
            toast.error("Quiz and Classroom are required");
            return;
        }
        if (existingAssignmentCombos.has(`${assignQuizId}::${assignRoomId}`)) {
            toast.error("This quiz is already assigned to the selected room");
            return;
        }

        try {
            await dispatch(createAssignmentThunk({
                quiz_id: assignQuizId,
                room_id: assignRoomId,
                student_uid: null,
                due_date: assignDueDate || null,
                attempt_limit_override: assignLimit && assignLimit !== "" && assignLimit !== "Unlimited" ? Number(assignLimit) : null,
                note: assignNote || null
            })).unwrap();

            toast.success("Successfully created assignment!");
            setIsAssignOpen(false);
            setAssignQuizId("");
            setAssignRoomId("");
            setAssignDueDate("");
            setAssignLimit("");
            setAssignNote("");
            dispatch(fetchMyAssignments());
        } catch (err) {
            toast.error(err || "Failed to create assignment");
        }
    };

    const handleDeleteAssignment = (ass) => {
        const isDark = document.documentElement.classList.contains("dark");
        Swal.fire({
            title: "Delete Assignment?",
            text: "Students lose access to this quiz assignment. Past completed attempt details are retained in logs.",
            icon: "warning",
            background: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            showCancelButton: true,
            confirmButtonText: "Delete Assignment",
            cancelButtonText: "Cancel",
            confirmButtonColor: "var(--color-danger, #ef4444)",
            cancelButtonColor: isDark ? "#475569" : "#94a3b8",
            customClass: {
                popup: "premium-swal-popup"
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await dispatch(deleteAssignmentThunk(ass.id)).unwrap();
                    toast.success("Assignment deleted successfully!");
                    dispatch(fetchMyAssignments());
                } catch (err) {
                    toast.error(err || "Failed to delete assignment");
                }
            }
        });
    };

    const handleSendReminder = async (assignmentId, quizTitle) => {
        try {
            const result = await dispatch(sendReminderThunk(assignmentId)).unwrap();
            if (result.sent > 0) {
                toast.success(`Sent reminder notification to ${result.sent} pending student(s) for "${quizTitle}"!`);
            } else {
                toast.info("All assigned students have already completed this quiz.");
            }
        } catch (err) {
            toast.error(err || "Failed to send reminders");
        }
    };

    // Filter assignments
    const filteredAssignments = assignments.filter(ass => {
        const title = ass.quiz?.title || "";
        const roomName = ass.room?.name || "";
        return title.toLowerCase().includes(searchQuery.toLowerCase()) || 
               roomName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Reset pagination to page 1 on search changes during render to avoid cascading renders
    const filterKey = searchQuery;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (filterKey !== prevFilterKey) {
        setPrevFilterKey(filterKey);
        setCurrentPage(1);
    }

    // Pagination slices
    const totalRows = filteredAssignments.length;
    const totalPages = Math.ceil(totalRows / pageSize);
    const paginatedAssignments = filteredAssignments.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );
    const startRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRow = Math.min(currentPage * pageSize, totalRows);

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Page Header */}
            <PageHeader 
                title="Quiz Assignments"
                subtitle="Assign published tests to classrooms, specify deadlines, and send reminders."
                breadcrumbs={["Assignments"]}
                actions={
                    <MainButton onClick={() => setIsAssignOpen(true)} variant="primary">
                        <FiPlus /> Assign Quiz
                    </MainButton>
                }
            />

            {/* Filters */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    <FiSearch className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Search assignments by quiz or room..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && <FiX className={styles.clearIcon} onClick={() => setSearchQuery("")} />}
                </div>
            </div>

            {/* Assignments Table */}
            <TableContainer component={Paper} className={styles.tableContainer} elevation={0}>
                <Table size="medium">
                    <TableHead className={styles.tableHead}>
                        <TableRow>
                            <TableCell className={styles.thCell}>Quiz Title</TableCell>
                            <TableCell className={styles.thCell}>Classroom Room</TableCell>
                            <TableCell className={styles.thCell} align="center">Assigned Date</TableCell>
                            <TableCell className={styles.thCell} align="center">Due Date</TableCell>
                            <TableCell className={styles.thCell} align="center">Completions</TableCell>
                            <TableCell className={styles.thCell} align="center">Status</TableCell>
                            <TableCell className={styles.thCell} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedAssignments.map((ass) => {
                            const isOverdue = ass.due_date && new Date(ass.due_date) < new Date();
                            return (
                                <TableRow key={ass.id} className={styles.tableRow}>
                                    <TableCell className={styles.tdCell} style={{fontWeight: 600}}>
                                        {ass.quiz?.title}
                                    </TableCell>
                                    <TableCell className={styles.tdCell}>
                                        {ass.room?.name || "Individual Students"}
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell}>
                                        {new Date(ass.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell}>
                                        {ass.due_date ? new Date(ass.due_date).toLocaleDateString() : "No deadline"}
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell}>
                                        <span className={styles.completionCount}>
                                            {completionsMap[ass.id] ? `${completionsMap[ass.id].completed} / ${completionsMap[ass.id].total} completed` : "Loading..."}
                                        </span>
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell}>
                                        <span className={`${styles.statusBadge} ${isOverdue ? styles.badgeOverdue : styles.badgeActive}`}>
                                            {isOverdue ? "Overdue" : "Active"}
                                        </span>
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell}>
                                        <div className={styles.actions}>
                                            <button 
                                                className={styles.actionBtn} 
                                                onClick={() => navigate(`/instructor/assignments/${ass.id}`)}
                                                title="View assignment details"
                                            >
                                                <FiEye />
                                            </button>
                                            <button 
                                                className={styles.actionBtn} 
                                                onClick={() => handleSendReminder(ass.id, ass.quiz?.title)}
                                                title="Send reminder notifications"
                                            >
                                                <FiBell />
                                            </button>
                                            <button 
                                                className={`${styles.actionBtn} ${styles.danger}`}
                                                onClick={() => handleDeleteAssignment(ass)}
                                                title="Delete assignment"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredAssignments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" className={styles.emptyCell}>
                                    No quiz assignments matching search. Click "Assign Quiz" to get started!
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className={styles.paginationRow}>
                    <div className={styles.paginationInfo}>
                        Showing <strong>{startRow}</strong>-<strong>{endRow}</strong> of <strong>{totalRows}</strong> assignments
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

            {/* ASSIGN QUIZ MODAL */}
            {isAssignOpen && (
                <ModalPortal onClose={() => setIsAssignOpen(false)}>
                <div 
                    className={styles.modalOverlay}
                    onClick={() => setIsAssignOpen(false)} // Close on outside click
                >
                    <form 
                        className={styles.modal} 
                        ref={assignModalRef}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                        onSubmit={handleAssignQuiz}
                    >
                        <div className={styles.modalHeader}>
                            <h3>Assign Quiz to Classroom</h3>
                            <button type="button" className={styles.closeBtn} onClick={() => setIsAssignOpen(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Quiz selector */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Select Quiz <span className={styles.req}>*</span></label>
                                <CustomSelect
                                    options={quizzes.filter(q => q.status === "published").map(q => ({ value: q.id, label: q.title }))}
                                    value={assignQuizId}
                                    onChange={setAssignQuizId}
                                    placeholder="Choose published quiz..."
                                />
                            </div>

                            {/* Room selector */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Select Classroom <span className={styles.req}>*</span></label>
                                <CustomSelect
                                    options={availableRoomsForQuiz.map(r => ({ value: r.id, label: r.name }))}
                                    value={assignRoomId}
                                    onChange={setAssignRoomId}
                                    placeholder={assignQuizId && availableRoomsForQuiz.length === 0 ? "This quiz is assigned to all rooms" : "Choose classroom..."}
                                    isDisabled={!assignQuizId || availableRoomsForQuiz.length === 0}
                                />
                            </div>

                            {/* Due date */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Due Date</label>
                                <input 
                                    type="datetime-local" 
                                    value={assignDueDate}
                                    onChange={(e) => setAssignDueDate(e.target.value)}
                                    className={styles.input}
                                />
                            </div>

                            {/* Attempt overrides */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Attempts Limit Override</label>
                                <CustomSelect
                                    options={[
                                        { value: "", label: "Use Quiz Defaults" },
                                        { value: "1", label: "1 Attempt Only" },
                                        { value: "2", label: "2 Attempts" },
                                        { value: "3", label: "3 Attempts" },
                                        { value: "5", label: "5 Attempts" }
                                    ]}
                                    value={assignLimit}
                                    onChange={setAssignLimit}
                                />
                            </div>

                            {/* Instruction Note */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Note to students</label>
                                <textarea 
                                    value={assignNote}
                                    onChange={(e) => setAssignNote(e.target.value)}
                                    placeholder="Write instructions or info for students..."
                                    rows={2}
                                    className={styles.textarea}
                                    maxLength={500}
                                />
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <MainButton onClick={() => setIsAssignOpen(false)} variant="secondary">
                                Cancel
                            </MainButton>
                            <MainButton type="submit" variant="primary">
                                Assign Quiz
                            </MainButton>
                        </div>
                    </form>
                </div>
                </ModalPortal>
            )}

        </div>
    );
};

export default Assignments;
