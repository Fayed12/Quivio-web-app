// local components
import PageHeader from "../components/PageHeader";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./MyQuizzes.module.css";

// react
import { useState, useEffect, useRef } from "react";

// react-router
import { useNavigate } from "react-router";

// redux
import { useDispatch, useSelector } from "react-redux";
import { 
    fetchMyQuizzes, 
    selectMyQuizzes, 
    selectQuizLoading, 
    deleteQuizThunk, 
    duplicateQuizThunk, 
    updateQuizThunk,
    publishQuizThunk,
    unpublishQuizThunk,
    archiveQuizThunk
} from "../../../redux/slices/quizzesSlice";
import { fetchCategories, selectCategories } from "../../../redux/slices/categoriesSlice";
import { fetchMyRooms, selectMyRooms } from "../../../redux/slices/roomsSlice";
import { createAssignmentThunk } from "../../../redux/slices/assignmentsSlice";

// hooks
import { useRealtimeQuizzes } from "../../../hooks/useRealtimeQuizzes";

// gsap
import { gsap } from "gsap";

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
    FiClock, 
    FiCheckSquare,
    FiX
} from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

const MyQuizzes = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Selectors
    const quizzes = useSelector(selectMyQuizzes);
    const categories = useSelector(selectCategories);
    const rooms = useSelector(selectMyRooms);
    const loading = useSelector(selectQuizLoading);

    // Realtime changes listener
    useRealtimeQuizzes();

    // Local States
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [sortOption, setSortOption] = useState("newest");

    // Dropdown and modal states
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [quizToDelete, setQuizToDelete] = useState(null);
    const [isDeleteBtnEnabled, setIsDeleteBtnEnabled] = useState(false);
    const [quizToAssign, setQuizToAssign] = useState(null);
    const [assignRoomId, setAssignRoomId] = useState("");
    const [assignDueDate, setAssignDueDate] = useState("");

    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const deleteModalRef = useRef(null);
    const assignModalRef = useRef(null);

    // Initial Fetching
    useEffect(() => {
        dispatch(fetchMyQuizzes());
        dispatch(fetchCategories());
        dispatch(fetchMyRooms());
    }, [dispatch]);

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

    // GSAP page enter animations
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(containerRef.current,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
            );

            gsap.fromTo(`.${styles.quizCard}`,
                { opacity: 0, scale: 0.96, y: 15 },
                { opacity: 1, scale: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
            );
        }, containerRef);
        return () => ctx.revert();
    }, [quizzes, statusFilter, categoryFilter, searchQuery, sortOption]);

    // Delete Modal Timer logic (0.5s delay to prevent accidental click)
    useEffect(() => {
        if (quizToDelete) {
            setIsDeleteBtnEnabled(false);
            const timer = setTimeout(() => {
                setIsDeleteBtnEnabled(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [quizToDelete]);

    // Operations handlers
    const handleDeleteQuiz = async () => {
        if (!quizToDelete) return;
        try {
            await dispatch(deleteQuizThunk(quizToDelete.id)).unwrap();
            toast.success(`Deleted ${quizToDelete.title} successfully!`);
            setQuizToDelete(null);
        } catch (err) {
            toast.error(err || "Failed to delete quiz");
        }
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
                if (confirm(`Are you sure you want to unpublish "${quiz.title}"? Students will lose access immediately.`)) {
                    await dispatch(unpublishQuizThunk(quiz.id)).unwrap();
                    toast.success(`Unpublished ${quiz.title}`);
                }
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

    const handleAssignQuiz = async (e) => {
        e.preventDefault();
        if (!quizToAssign || !assignRoomId) {
            toast.error("Please select a room to assign");
            return;
        }
        try {
            await dispatch(createAssignmentThunk({
                quiz_id: quizToAssign.id,
                room_id: assignRoomId,
                due_date: assignDueDate || null
            })).unwrap();
            toast.success(`Successfully assigned "${quizToAssign.title}" to Room!`);
            setQuizToAssign(null);
            setAssignRoomId("");
            setAssignDueDate("");
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
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={styles.select}
                    >
                        <option value="all">All Statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>

                    <select 
                        value={categoryFilter} 
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className={styles.select}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    <select 
                        value={sortOption} 
                        onChange={(e) => setSortOption(e.target.value)}
                        className={styles.select}
                    >
                        <option value="newest">Sort: Newest</option>
                        <option value="oldest">Sort: Oldest</option>
                        <option value="attempts">Sort: Most Attempts</option>
                        <option value="az">Sort: A-Z</option>
                    </select>
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
                                                    <button onClick={() => setQuizToDelete(quiz)} className={`${styles.dropdownItem} ${styles.danger}`}>
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

            {/* DELETE CONFIRMATION MODAL */}
            {quizToDelete && (
                <div 
                    className={styles.modalOverlay}
                    onClick={() => setQuizToDelete(null)} // Close on outside click
                >
                    <div 
                        className={styles.deleteModal} 
                        ref={deleteModalRef}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble to overlay
                    >
                        <div className={styles.deleteIconCircle}>
                            <FiTrash2 />
                        </div>
                        <h3>Delete "{quizToDelete.title}"?</h3>
                        <p className={styles.modalWarningText}>
                            This action cannot be undone. All student attempts, scores, certificates, and historical results associated with this quiz will be permanently deleted from the servers.
                        </p>
                        <div className={styles.modalButtons}>
                            <MainButton onClick={() => setQuizToDelete(null)} variant="secondary">
                                Cancel
                            </MainButton>
                            <MainButton 
                                onClick={handleDeleteQuiz} 
                                variant="danger" 
                                disabled={!isDeleteBtnEnabled}
                            >
                                {!isDeleteBtnEnabled ? "Wait (0.5s)..." : "Delete Quiz"}
                            </MainButton>
                        </div>
                    </div>
                </div>
            )}

            {/* ASSIGN TO ROOM QUICK MODAL */}
            {quizToAssign && (
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
                                <select 
                                    value={assignRoomId} 
                                    onChange={(e) => setAssignRoomId(e.target.value)}
                                    className={styles.modalSelect}
                                    required
                                >
                                    <option value="">Select a Classroom...</option>
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
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
            )}
        </div>
    );
};

export default MyQuizzes;
