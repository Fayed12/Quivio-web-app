// local components
import PageHeader from "../components/PageHeader";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./MyQuizzes.module.css";

// react
import { useState, useEffect, useRef, useMemo } from "react";

// react-router
import { useNavigate } from "react-router";

// redux
import { useDispatch, useSelector } from "react-redux";
import {
    deleteQuizThunk, 
    duplicateQuizThunk, 
    updateQuizThunk,
    publishQuizThunk,
    unpublishQuizThunk,
    archiveQuizThunk
} from "../../../redux/slices/quizzesSlice";
import { createAssignmentThunk } from "../../../redux/slices/assignmentsSlice";
import { fetchMyAssignments, selectMyAssignments } from "../../../redux/slices/assignmentsSlice";

// hooks
import { useRealtimeQuizzes } from "../../../hooks/useRealtimeQuizzes";

// animation
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";
import ModalPortal from "../components/ModalPortal";

// react-icons
import { 
    FiPlus, 
    FiSearch, 
    FiEdit2, 
    FiCopy, 
    FiMoreVertical, 
    FiTrash2, 
    FiEye, 
    FiSend, 
    FiArchive, 
    FiInbox,
    FiCheckSquare,
    FiX
} from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

// sweetalert2
import Swal from "sweetalert2";

// custom select
import CustomSelect from "../../../components/ui/select/CustomSelect";

import { useQuizzesData } from "../../../hooks/instructor/useQuizzesData";

const MyQuizzes = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { quizzes, categories, rooms } = useQuizzesData();

    // Load all existing assignments to check for duplicates
    const allAssignments = useSelector(selectMyAssignments);
    useEffect(() => {
        dispatch(fetchMyAssignments());
    }, [dispatch]);

    // Realtime changes listener
    useRealtimeQuizzes();

    // Local States
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [sortOption, setSortOption] = useState("newest");

    // Dropdown and modal states
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [quizToAssign, setQuizToAssign] = useState(null);
    const [assignRoomId, setAssignRoomId] = useState("");
    const [assignDueDate, setAssignDueDate] = useState("");

    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const assignModalRef = useRef(null);

    // Handle clicks outside of dropdowns to close them
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (activeDropdown !== null && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activeDropdown]);

    // Page entrance animation
    usePageAnimation(containerRef, {
        staggerSelector: `.${styles.quizCard}`,
    });

    // Operations handlers
    const handleDeleteQuiz = (quiz) => {
        const isDark = document.documentElement.classList.contains("dark");
        Swal.fire({
            title: `Delete "${quiz.title}"?`,
            text: "This action cannot be undone. All student attempts, scores, certificates, and historical results associated with this quiz will be permanently deleted from the servers.",
            icon: "warning",
            background: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            showCancelButton: true,
            confirmButtonText: "Delete Quiz",
            cancelButtonText: "Cancel",
            confirmButtonColor: "var(--color-danger, #ef4444)",
            cancelButtonColor: isDark ? "#475569" : "#94a3b8",
            customClass: {
                popup: "premium-swal-popup"
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await dispatch(deleteQuizThunk(quiz.id)).unwrap();
                    toast.success(`Deleted ${quiz.title} successfully!`);
                } catch (err) {
                    toast.error(err || "Failed to delete quiz");
                }
            }
        });
    };

    const handleDuplicateQuiz = async (quizId) => {
        try {
            await dispatch(duplicateQuizThunk(quizId)).unwrap();
            toast.success("Quiz duplicated successfully as draft!");
            setActiveDropdown(null);
        } catch (err) {
            toast.error(err || "Failed to duplicate quiz");
        }
    };

    const handleTogglePublish = async (quiz) => {
        setActiveDropdown(null);
        try {
            if (quiz.status === "published") {
                const isDark = document.documentElement.classList.contains("dark");
                Swal.fire({
                    title: `Unpublish "${quiz.title}"?`,
                    text: "Students will lose access immediately.",
                    icon: "warning",
                    background: isDark ? "#1e293b" : "#ffffff",
                    color: isDark ? "#f8fafc" : "#0f172a",
                    showCancelButton: true,
                    confirmButtonText: "Unpublish",
                    cancelButtonText: "Cancel",
                    confirmButtonColor: "var(--color-danger, #ef4444)",
                    cancelButtonColor: isDark ? "#475569" : "#94a3b8",
                    customClass: {
                        popup: "premium-swal-popup"
                    }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            await dispatch(unpublishQuizThunk(quiz.id)).unwrap();
                            toast.success(`Unpublished ${quiz.title}`);
                        } catch (err) {
                            toast.error(err || "Failed to update status");
                        }
                    }
                });
            } else {
                await dispatch(publishQuizThunk(quiz.id)).unwrap();
                toast.success(`Published ${quiz.title} successfully!`);
            }
        } catch (err) {
            toast.error(err || "Failed to update status");
        }
    };

    const handleToggleArchive = async (quiz) => {
        setActiveDropdown(null);
        try {
            if (quiz.status === "archived") {
                await dispatch(updateQuizThunk({ id: quiz.id, status: "draft" })).unwrap();
                toast.success(`Restored ${quiz.title} to Drafts`);
            } else {
                await dispatch(archiveQuizThunk(quiz.id)).unwrap();
                toast.success(`Archived ${quiz.title}`);
            }
        } catch (err) {
            toast.error(err || "Failed to archive quiz");
        }
    };

    // Compute rooms that already have the selected quiz assigned
    const assignedRoomIdsForQuiz = useMemo(() => {
        if (!quizToAssign) return new Set();
        return new Set(
            allAssignments
                .filter(a => a.quiz_id === quizToAssign.id || a.quiz?.id === quizToAssign.id)
                .map(a => a.room_id || a.room?.id)
                .filter(Boolean)
        );
    }, [quizToAssign, allAssignments]);

    const availableRooms = useMemo(() => {
        return rooms.filter(r => !assignedRoomIdsForQuiz.has(r.id));
    }, [rooms, assignedRoomIdsForQuiz]);

    const handleAssignQuiz = async (e) => {
        e.preventDefault();
        if (!quizToAssign || !assignRoomId) {
            toast.error("Please select a room to assign");
            return;
        }
        if (assignedRoomIdsForQuiz.has(assignRoomId)) {
            toast.error("This quiz is already assigned to the selected room");
            return;
        }
        try {
            await dispatch(createAssignmentThunk({
                quiz_id: quizToAssign.id,
                room_id: assignRoomId,
                student_uid: null,
                due_date: assignDueDate || null
            })).unwrap();
            toast.success(`Successfully assigned "${quizToAssign.title}" to Room!`);
            setQuizToAssign(null);
            setAssignRoomId("");
            setAssignDueDate("");
            dispatch(fetchMyAssignments());
        } catch (err) {
            toast.error(err || "Failed to assign quiz");
        }
    };

    // Filtering & Sorting
    const filteredQuizzes = quizzes.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || q.status === statusFilter;
        const matchesCategory = categoryFilter === "all" || q.category?.id === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
    });

    const sortedQuizzes = [...filteredQuizzes].sort((a, b) => {
        if (sortOption === "newest") return new Date(b.created_at) - new Date(a.created_at);
        if (sortOption === "oldest") return new Date(a.created_at) - new Date(b.created_at);
        if (sortOption === "attempts") return (b.attempt_count || 0) - (a.attempt_count || 0);
        if (sortOption === "az") return a.title.localeCompare(b.title);
        return 0;
    });

    const getStatusIcon = (status) => {
        if (status === "published") return <span className={`${styles.statusBadge} ${styles.badgePub}`}>● Published</span>;
        if (status === "archived") return <span className={`${styles.statusBadge} ${styles.badgeArc}`}>◑ Archived</span>;
        return <span className={`${styles.statusBadge} ${styles.badgeDrf}`}>○ Draft</span>;
    };

    const getCategoryColor = (catName = "") => {
        const hash = catName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
        return colors[hash % colors.length];
    };

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Page Header */}
            <PageHeader 
                title="My Quizzes"
                subtitle={`Manage and build your library of academic tests. Total: ${quizzes.length} quizzes`}
                breadcrumbs={["Quizzes"]}
                actions={
                    <MainButton onClick={() => navigate("/instructor/quizzes/create")} variant="primary">
                        <FiPlus /> Create Quiz
                    </MainButton>
                }
            />

            {/* Filter Bar */}
            <div className={styles.filterBar}>
                {/* Search */}
                <div className={styles.searchWrapper}>
                    <FiSearch className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Search quizzes by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && <FiX className={styles.clearIcon} onClick={() => setSearchQuery("")} />}
                </div>

                {/* Filters */}
                <div className={styles.filtersGrid}>
                    <CustomSelect
                        options={[
                            { value: "all", label: "All Statuses" },
                            { value: "published", label: "Published" },
                            { value: "draft", label: "Draft" },
                            { value: "archived", label: "Archived" }
                        ]}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        className={styles.select}
                    />

                    <CustomSelect
                        options={[
                            { value: "all", label: "All Categories" },
                            ...categories.map(c => ({ value: c.id, label: c.name }))
                        ]}
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        className={styles.select}
                    />

                    <CustomSelect
                        options={[
                            { value: "newest", label: "Sort: Newest" },
                            { value: "oldest", label: "Sort: Oldest" },
                            { value: "attempts", label: "Sort: Most Attempts" },
                            { value: "az", label: "Sort: A-Z" }
                        ]}
                        value={sortOption}
                        onChange={setSortOption}
                        className={styles.select}
                    />
                </div>
            </div>

            {/* Quiz Grid List */}
            {sortedQuizzes.length > 0 ? (
                <div className={styles.quizGrid}>
                    {sortedQuizzes.map((quiz) => (
                        <div key={quiz.id} className={styles.quizCard}>
                            {/* Card Accent Indicator */}
                            <div 
                                className={styles.cardAccent} 
                                style={{ backgroundColor: getCategoryColor(quiz.category?.name) }} 
                            />
                            
                            <div className={styles.cardContent}>
                                {/* Header */}
                                <div className={styles.cardHeader}>
                                    <span className={styles.categoryName} style={{color: getCategoryColor(quiz.category?.name)}}>
                                        {quiz.category?.name || "General"}
                                    </span>
                                    {getStatusIcon(quiz.status)}
                                </div>

                                <h3 className={styles.quizTitle} title={quiz.title}>
                                    {quiz.title}
                                </h3>

                                {/* Meta counts */}
                                <div className={styles.metaRow}>
                                    <div className={styles.metaCol}>
                                        <span className={styles.metaLabel}>Questions</span>
                                        <span className={styles.metaVal}>{quiz.question_count || 0} Qs</span>
                                    </div>
                                    <div className={styles.metaCol}>
                                        <span className={styles.metaLabel}>Time Limit</span>
                                        <span className={styles.metaVal}>
                                            {quiz.time_limit_minutes ? `${quiz.time_limit_minutes}m` : "No limit"}
                                        </span>
                                    </div>
                                    <div className={styles.metaCol}>
                                        <span className={styles.metaLabel}>Attempts</span>
                                        <span className={styles.metaVal}>{quiz.attempt_count || 0}</span>
                                    </div>
                                    <div className={styles.metaCol}>
                                        <span className={styles.metaLabel}>Avg. Score</span>
                                        <span className={styles.metaVal}>
                                            {quiz.avg_score ? `${Math.round(quiz.avg_score)}%` : "—"}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.divider} />

                                {/* Footer info and actions */}
                                <div className={styles.cardFooter}>
                                    <div className={styles.dateInfo}>
                                        <span>Created: {new Date(quiz.created_at).toLocaleDateString()}</span>
                                    </div>

                                    <div className={styles.cardActions}>
                                        <button 
                                            className={styles.actionBtn} 
                                            onClick={() => navigate(`/instructor/quizzes/${quiz.id}/edit`)}
                                            title="Edit Quiz"
                                        >
                                            <FiEdit2 />
                                        </button>
                                        <button 
                                            className={styles.actionBtn} 
                                            onClick={() => handleDuplicateQuiz(quiz.id)}
                                            title="Duplicate Quiz"
                                        >
                                            <FiCopy />
                                        </button>
                                        
                                        {/* Dropdown Menu Trigger */}
                                        <div className={styles.dropdownContainer}>
                                            <button 
                                                className={styles.moreBtn}
                                                onClick={() => setActiveDropdown(activeDropdown === quiz.id ? null : quiz.id)}
                                            >
                                                <FiMoreVertical />
                                            </button>

                                            {activeDropdown === quiz.id && (
                                                <div className={styles.dropdown} ref={dropdownRef}>
                                                    <button onClick={() => navigate(`/student/quizzes/${quiz.id}`)} className={styles.dropdownItem}>
                                                        <FiEye /> Student Preview
                                                    </button>
                                                    <button onClick={() => handleTogglePublish(quiz)} className={styles.dropdownItem}>
                                                        <FiSend /> {quiz.status === "published" ? "Unpublish" : "Publish"}
                                                    </button>
                                                    <button onClick={() => handleToggleArchive(quiz)} className={styles.dropdownItem}>
                                                        <FiArchive /> {quiz.status === "archived" ? "Unarchive" : "Archive"}
                                                    </button>
                                                    <button onClick={() => setQuizToAssign(quiz)} className={styles.dropdownItem}>
                                                        <FiCheckSquare /> Assign to Room
                                                    </button>
                                                    <div className={styles.dropdownDivider} />
                                                    <button onClick={() => { handleDeleteQuiz(quiz); setActiveDropdown(null); }} className={`${styles.dropdownItem} ${styles.danger}`}>
                                                        <FiTrash2 /> Delete Quiz
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty state */
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <FiInbox />
                    </div>
                    <h2>No quizzes yet</h2>
                    <p>Create your first quiz settings, add MC questions, and assign them to student rooms to begin tracking attempts.</p>
                    <MainButton onClick={() => navigate("/instructor/quizzes/create")} variant="primary" size="md">
                        + Create your first quiz
                    </MainButton>
                </div>
            )}



            {/* ASSIGN TO ROOM QUICK MODAL */}
            {quizToAssign && (
                <ModalPortal onClose={() => setQuizToAssign(null)}>
                <div 
                    className={styles.modalOverlay}
                    onClick={() => setQuizToAssign(null)} // Close on outside click
                >
                    <form 
                        className={styles.assignModal} 
                        ref={assignModalRef}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                        onSubmit={handleAssignQuiz}
                    >
                        <div className={styles.modalHeader}>
                            <h3>Assign Quiz to Classroom</h3>
                            <button type="button" className={styles.closeBtn} onClick={() => setQuizToAssign(null)}>
                                <FiX />
                            </button>
                        </div>
                        
                        <div className={styles.modalBody}>
                            <p className={styles.modalDesc}>
                                Select which room should be assigned the quiz <strong>{quizToAssign.title}</strong>.
                            </p>
                            
                            <div className={styles.formGroup}>
                                <label className={styles.modalLabel}>Target Room</label>
                                <CustomSelect
                                    options={availableRooms.map(r => ({ value: r.id, label: r.name }))}
                                    value={assignRoomId}
                                    onChange={setAssignRoomId}
                                    placeholder={availableRooms.length === 0 ? "This quiz is assigned to all rooms" : "Select a Classroom..."}
                                    isDisabled={availableRooms.length === 0}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.modalLabel}>Due Date (Optional)</label>
                                <input 
                                    type="datetime-local" 
                                    value={assignDueDate}
                                    onChange={(e) => setAssignDueDate(e.target.value)}
                                    className={styles.modalInput}
                                />
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <MainButton onClick={() => setQuizToAssign(null)} variant="secondary">
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

export default MyQuizzes;
