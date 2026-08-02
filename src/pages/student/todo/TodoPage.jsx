// react
import { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

// date-fns
import { format, isPast, isToday } from "date-fns";

// react-icons
import {
    FiCheckSquare,
    FiPlus,
    FiSearch,
    FiClock,
    FiAlertCircle,
    FiCheckCircle,
    FiCalendar,
    FiTrash2,
    FiEdit2,
    FiPlay,
    FiX,
    FiTag,
    FiList
} from "react-icons/fi";

// redux
import { fetchStudentAssignments, selectStudentAssignments } from "../../../redux/slices/assignmentsSlice";
import { fetchMyAttempts, selectMyAttempts } from "../../../redux/slices/attemptsSlice";
import { fetchPublishedQuizzes } from "../../../redux/slices/quizzesSlice";
import { selectUser } from "../../../redux/slices/authSlice";
import {
    fetchTodos,
    addTodo,
    editTodo,
    toggleTodo,
    removeTodo,
    selectTodos
} from "../../../redux/slices/todosSlice";

// hooks
import { useRealtimeTodos } from "../../../hooks/useRealtimeTodos";

// components
import MainButton from "../../../components/ui/button/MainButton";
import ModalPortal from "../../instructor/components/ModalPortal";
import { toast } from "react-toastify";
import Select from "react-select";
import Swal from "sweetalert2";

// gsap
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

// local
import styles from "./TodoPage.module.css";

const EMPTY_ARRAY = [];

const customSelectStyles = {
    control: (base) => ({
        ...base,
        backgroundColor: "var(--bg-app)",
        borderColor: "var(--border-color)",
        borderRadius: "var(--radius-lg)",
        minHeight: "38px",
        boxShadow: "none",
        "&:hover": {
            borderColor: "var(--color-accent)",
        },
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-lg)",
        zIndex: 50,
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? "var(--color-accent)"
            : state.isFocused
            ? "var(--bg-card-hover)"
            : "transparent",
        color: state.isSelected ? "#fff" : "var(--text-primary)",
        fontSize: "13px",
        cursor: "pointer",
    }),
    singleValue: (base) => ({
        ...base,
        color: "var(--text-primary)",
        fontSize: "13px",
    }),
};

const modalSelectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: "var(--bg-app, #f8fafc)",
        borderColor: state.isFocused ? "var(--color-accent, #6366f1)" : "var(--border-color, #cbd5e1)",
        borderRadius: "var(--radius-lg, 0.5rem)",
        minHeight: "42px",
        boxShadow: state.isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.18)" : "none",
        "&:hover": {
            borderColor: "var(--color-accent, #6366f1)",
        },
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: "var(--bg-elevated, var(--bg-card, #ffffff))",
        border: "1px solid var(--border-color, #e2e8f0)",
        borderRadius: "var(--radius-lg, 0.5rem)",
        zIndex: 999999,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)",
    }),
    menuPortal: (base) => ({
        ...base,
        zIndex: 999999,
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? "var(--color-accent, #6366f1)"
            : state.isFocused
            ? "var(--bg-card-hover, #f1f5f9)"
            : "transparent",
        color: state.isSelected ? "#ffffff" : "var(--text-primary, #0f172a)",
        fontSize: "13px",
        cursor: "pointer",
    }),
    singleValue: (base) => ({
        ...base,
        color: "var(--text-primary, #0f172a)",
        fontSize: "13px",
        fontWeight: "500",
    }),
};

const TodoPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const containerRef = useRef(null);

    const user = useSelector(selectUser);

    // Subscribe to Supabase Realtime changes for user's todos
    useRealtimeTodos();

    const rawAssignments = useSelector(selectStudentAssignments);
    const rawAttempts = useSelector(selectMyAttempts);
    const rawDbTodos = useSelector(selectTodos);

    const assignments = useMemo(() => rawAssignments || EMPTY_ARRAY, [rawAssignments]);
    const attempts = useMemo(() => rawAttempts || EMPTY_ARRAY, [rawAttempts]);
    const dbCustomTodos = useMemo(() => rawDbTodos || EMPTY_ARRAY, [rawDbTodos]);

    // Local States
    const [filterTab, setFilterTab] = useState("all"); // all, pending, completed, overdue, custom
    const [searchTerm, setSearchTerm] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);

    // Form inputs for new custom todo
    const [newTitle, setNewTitle] = useState("");
    const [newTopic, setNewTopic] = useState("");
    const [newPriority, setNewPriority] = useState("Medium");
    const [newDueDate, setNewDueDate] = useState("");
    const [newDesc, setNewDesc] = useState("");

    // GSAP Entrance
    usePageAnimation(containerRef, {
        ready: true,
        staggerSelector: `.${styles.todoCard}, .${styles.statCard}`
    });

    useEffect(() => {
        if (user?.id) {
            dispatch(fetchTodos(user.id));
        }
        dispatch(fetchStudentAssignments({ page: 1, pageSize: 50 }));
        dispatch(fetchMyAttempts({ page: 1, pageSize: 50 }));
        dispatch(fetchPublishedQuizzes({ page: 1, pageSize: 50 }));
    }, [dispatch, user?.id]);

    // Set of finished quiz IDs from attempts
    const completedQuizIds = useMemo(() => {
        const set = new Set();
        attempts.forEach((a) => {
            if (a.status === "completed" && a.quiz_id) {
                set.add(a.quiz_id);
            }
        });
        return set;
    }, [attempts]);

    // Build Unified Todo List
    const allTodos = useMemo(() => {
        const list = [];

        // 1. Convert Room Assignments into Todos
        assignments.forEach((asg) => {
            if (!asg.quiz) return;
            const isDone = completedQuizIds.has(asg.quiz.id);
            const dueDate = asg.due_date ? new Date(asg.due_date) : null;
            const isOverdue = !isDone && dueDate && isPast(dueDate) && !isToday(dueDate);

            list.push({
                id: `asg-${asg.id}`,
                type: "assignment",
                title: asg.quiz.title,
                topic: asg.quiz.category?.name || "Assignment",
                description: asg.note || `Room assignment due by ${dueDate ? format(dueDate, "MMM d, h:mm a") : "scheduled date"}.`,
                dueDate: dueDate,
                priority: isOverdue ? "High" : "Medium",
                isCompleted: isDone,
                isOverdue: isOverdue,
                quizId: asg.quiz.id,
                actionText: isDone ? "Review Results" : "Start Assignment",
                createdDate: new Date(asg.created_at || "2026-01-01T00:00:00.000Z")
            });
        });

        // 2. Convert Custom DB Todos
        dbCustomTodos.forEach((item) => {
            const dueDate = item.dueDate ? new Date(item.dueDate) : null;
            const isOverdue = !item.isCompleted && dueDate && isPast(dueDate) && !isToday(dueDate);

            list.push({
                id: item.id,
                type: "custom",
                title: item.title,
                topic: item.topic || "Personal Goal",
                description: item.description || "Self-study practice task",
                dueDate: dueDate,
                priority: item.priority || "Medium",
                isCompleted: !!item.isCompleted,
                isOverdue: isOverdue,
                isCustom: true,
                createdDate: new Date(item.createdAt || "2026-01-01T00:00:00.000Z")
            });
        });

        return list;
    }, [assignments, completedQuizIds, dbCustomTodos]);

    // Open Modal for Create
    const handleOpenCreateModal = () => {
        setEditingTaskId(null);
        setNewTitle("");
        setNewTopic("");
        setNewDesc("");
        setNewDueDate("");
        setNewPriority("Medium");
        setShowModal(true);
    };

    // Open Modal for Edit (Only available for non-completed custom tasks)
    const handleEditCustomTodo = (todo) => {
        if (todo.isCompleted) return;
        setEditingTaskId(todo.id);
        setNewTitle(todo.title || "");
        setNewTopic(todo.topic || "");
        setNewDesc(todo.description || "");
        setNewDueDate(todo.dueDate ? format(new Date(todo.dueDate), "yyyy-MM-dd'T'HH:mm") : "");
        setNewPriority(todo.priority || "Medium");
        setShowModal(true);
    };

    // Handlers for custom todo items via Redux / Supabase DB
    const handleAddCustomTodo = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) {
            toast.error("Please enter a title for your task.");
            return;
        }

        if (editingTaskId) {
            const changes = {
                title: newTitle.trim(),
                topic: newTopic.trim() || "General Practice",
                priority: newPriority,
                dueDate: newDueDate || null,
                description: newDesc.trim()
            };
            try {
                await dispatch(editTodo({ taskId: editingTaskId, changes })).unwrap();
                toast.success("Custom task updated successfully!");
            } catch (err) {
                toast.error(err || "Failed to update task.");
            }
        } else {
            if (!user?.id) {
                toast.error("You must be logged in to save tasks.");
                return;
            }
            const taskPayload = {
                title: newTitle.trim(),
                topic: newTopic.trim() || "General Practice",
                priority: newPriority,
                dueDate: newDueDate || null,
                description: newDesc.trim()
            };
            try {
                await dispatch(addTodo({ userUid: user.id, task: taskPayload })).unwrap();
                toast.success("Custom task created!");
            } catch (err) {
                toast.error(err || "Failed to create task.");
            }
        }

        setEditingTaskId(null);
        setNewTitle("");
        setNewTopic("");
        setNewDesc("");
        setNewDueDate("");
        setShowModal(false);
    };

    const handleToggleCustomTodo = async (id) => {
        try {
            await dispatch(toggleTodo({ taskId: id, isCompleted: true })).unwrap();
            toast.success("Task marked as completed!");
        } catch (err) {
            toast.error(err || "Failed to mark task complete.");
        }
    };

    const handleDeleteCustomTodo = (id) => {
        Swal.fire({
            title: "Delete Custom Task?",
            text: "Are you sure you want to remove this study task? This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Yes, delete task",
            cancelButtonText: "Cancel",
            customClass: {
                popup: "swal2-popup-custom"
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await dispatch(removeTodo(id)).unwrap();
                    toast.success("Task deleted successfully!");
                } catch (err) {
                    toast.error(err || "Failed to delete task.");
                }
            }
        });
    };

    // Filter & Search Logic
    const filteredTodos = useMemo(() => {
        return allTodos.filter((item) => {
            // Tab filter
            if (filterTab === "pending" && (item.isCompleted || item.isOverdue)) return false;
            if (filterTab === "completed" && !item.isCompleted) return false;
            if (filterTab === "overdue" && !item.isOverdue) return false;
            if (filterTab === "custom" && item.type !== "custom") return false;

            // Priority filter
            if (priorityFilter !== "all" && item.priority.toLowerCase() !== priorityFilter.toLowerCase()) {
                return false;
            }

            // Search filter
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const titleMatch = item.title.toLowerCase().includes(term);
                const topicMatch = item.topic.toLowerCase().includes(term);
                const descMatch = item.description?.toLowerCase().includes(term);
                return titleMatch || topicMatch || descMatch;
            }

            return true;
        });
    }, [allTodos, filterTab, priorityFilter, searchTerm]);

    // Summary Stats
    const totalCount = allTodos.length;
    const completedCount = allTodos.filter((t) => t.isCompleted).length;
    const pendingCount = allTodos.filter((t) => !t.isCompleted && !t.isOverdue).length;
    const overdueCount = allTodos.filter((t) => t.isOverdue).length;
    const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className={styles.container} ref={containerRef}>
            {/* Header Section */}
            <div className={styles.header}>
                <div className={styles.titleArea}>
                    <h1 className={styles.pageTitle}>
                        <span className={styles.titleIcon}><FiCheckSquare /></span>
                        Study Todo List
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Track assigned quizzes, upcoming room deadlines, and manage your personal topic revision checklist.
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <MainButton onClick={handleOpenCreateModal} icon={<FiPlus />}>
                        Add Personal Task
                    </MainButton>
                </div>
            </div>

            {/* Stats Bar */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIconWrapper} ${styles.blue}`}>
                        <FiList />
                    </div>
                    <div className={styles.statMeta}>
                        <span className={styles.statValue}>{totalCount}</span>
                        <span className={styles.statLabel}>Total Tasks</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={`${styles.statIconWrapper} ${styles.green}`}>
                        <FiCheckCircle />
                    </div>
                    <div className={styles.statMeta}>
                        <span className={styles.statValue}>{completedCount} ({completionPercent}%)</span>
                        <span className={styles.statLabel}>Completed</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={`${styles.statIconWrapper} ${styles.amber}`}>
                        <FiClock />
                    </div>
                    <div className={styles.statMeta}>
                        <span className={styles.statValue}>{pendingCount}</span>
                        <span className={styles.statLabel}>Pending Tasks</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={`${styles.statIconWrapper} ${styles.red}`}>
                        <FiAlertCircle />
                    </div>
                    <div className={styles.statMeta}>
                        <span className={styles.statValue}>{overdueCount}</span>
                        <span className={styles.statLabel}>Overdue Items</span>
                    </div>
                </div>
            </div>

            {/* Filters & Search Control Bar */}
            <div className={styles.controlsCard}>
                <div className={styles.filterTabs}>
                    <button
                        className={`${styles.tabBtn} ${filterTab === "all" ? styles.tabBtnActive : ""}`}
                        onClick={() => setFilterTab("all")}
                    >
                        All Tasks <span className={styles.badgeCount}>{totalCount}</span>
                    </button>
                    <button
                        className={`${styles.tabBtn} ${filterTab === "pending" ? styles.tabBtnActive : ""}`}
                        onClick={() => setFilterTab("pending")}
                    >
                        Pending <span className={styles.badgeCount}>{pendingCount}</span>
                    </button>
                    <button
                        className={`${styles.tabBtn} ${filterTab === "completed" ? styles.tabBtnActive : ""}`}
                        onClick={() => setFilterTab("completed")}
                    >
                        Completed <span className={styles.badgeCount}>{completedCount}</span>
                    </button>
                    <button
                        className={`${styles.tabBtn} ${filterTab === "overdue" ? styles.tabBtnActive : ""}`}
                        onClick={() => setFilterTab("overdue")}
                    >
                        Overdue <span className={styles.badgeCount}>{overdueCount}</span>
                    </button>
                    <button
                        className={`${styles.tabBtn} ${filterTab === "custom" ? styles.tabBtnActive : ""}`}
                        onClick={() => setFilterTab("custom")}
                    >
                        Custom Notes <span className={styles.badgeCount}>{dbCustomTodos.length}</span>
                    </button>
                </div>

                <div className={styles.searchAndSelect}>
                    <div className={styles.searchBox}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search tasks, topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <div style={{ width: "160px" }}>
                        <Select
                            styles={customSelectStyles}
                            value={{
                                value: priorityFilter,
                                label: priorityFilter === "all" ? "All Priorities" : `${priorityFilter} Priority`,
                            }}
                            onChange={(opt) => setPriorityFilter(opt.value)}
                            options={[
                                { value: "all", label: "All Priorities" },
                                { value: "high", label: "High Priority" },
                                { value: "medium", label: "Medium Priority" },
                                { value: "low", label: "Low Priority" },
                            ]}
                            isSearchable={false}
                        />
                    </div>
                </div>
            </div>

            {/* Todo Item List */}
            <div className={styles.todoGrid}>
                {filteredTodos.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FiCheckCircle className={styles.emptyIcon} />
                        <h3 className={styles.emptyTitle}>
                            {searchTerm
                                ? "No matching tasks"
                                : filterTab === "completed"
                                ? "No completed tasks"
                                : filterTab === "pending"
                                ? "No pending tasks"
                                : filterTab === "overdue"
                                ? "No overdue tasks"
                                : filterTab === "custom"
                                ? "No custom notes"
                                : "No tasks found"}
                        </h3>
                        <p className={styles.emptyText}>
                            {searchTerm
                                ? `No tasks matching "${searchTerm}". Try clearing your search query.`
                                : filterTab === "completed"
                                ? "You haven't completed any tasks yet. Finished assignments and custom goals will appear here."
                                : filterTab === "pending"
                                ? "No pending tasks at the moment. Great job keeping up with your study goals!"
                                : filterTab === "overdue"
                                ? "No overdue tasks! All your assignments and study goals are on schedule."
                                : filterTab === "custom"
                                ? "No custom study notes created yet. Add personal goals to track your practice!"
                                : "You're all caught up! Create a personal study task or check back later for assignments."}
                        </p>
                        {(filterTab === "all" || filterTab === "custom") && !searchTerm && (
                            <MainButton onClick={handleOpenCreateModal} icon={<FiPlus />}>
                                Create Custom Todo
                            </MainButton>
                        )}
                    </div>
                ) : (
                    <div className={styles.todoList}>
                        {filteredTodos.map((todo) => {
                            const isCustom = todo.isCustom;

                            return (
                                <div
                                    key={todo.id}
                                    className={`${styles.todoCard} ${
                                        todo.isCompleted ? styles.todoCardCompleted : ""
                                    }`}
                                >
                                    <div className={styles.todoLeft}>
                                        {todo.isCompleted ? (
                                            <span className={styles.completedBadge} title="Completed Task (Locked)">
                                                <FiCheckCircle size={18} />
                                            </span>
                                        ) : (
                                            <button
                                                className={styles.checkboxBtn}
                                                onClick={() => {
                                                    if (isCustom) {
                                                        handleToggleCustomTodo(todo.id);
                                                    } else {
                                                        toast.info(
                                                            "Assignment status updates automatically when you take the quiz!"
                                                        );
                                                    }
                                                }}
                                                title={
                                                    isCustom
                                                        ? "Mark task as finished (cannot be modified after)"
                                                        : "Complete quiz attempt to mark finished"
                                                }
                                            />
                                        )}

                                        <div className={styles.todoDetails}>
                                            <div className={styles.todoHeaderRow}>
                                                <span
                                                    className={`${styles.todoTitle} ${
                                                        todo.isCompleted ? styles.todoTitleStrikethrough : ""
                                                    }`}
                                                >
                                                    {todo.title}
                                                </span>

                                                <span
                                                    className={`${styles.typeBadge} ${
                                                        todo.type === "assignment"
                                                            ? styles.typeAssignment
                                                            : styles.typeCustom
                                                    }`}
                                                >
                                                    {todo.type}
                                                </span>

                                                <span
                                                    className={`${styles.priorityBadge} ${
                                                        todo.priority === "High"
                                                            ? styles.pHigh
                                                            : todo.priority === "Low"
                                                            ? styles.pLow
                                                            : styles.pMedium
                                                    }`}
                                                >
                                                    {todo.priority}
                                                </span>
                                            </div>

                                            <p className={styles.todoDesc}>{todo.description}</p>

                                            <div className={styles.todoMetaRow}>
                                                <span className={styles.metaItem}>
                                                    <FiTag /> {todo.topic}
                                                </span>
                                                {todo.dueDate && (
                                                    <span
                                                        className={`${styles.metaItem} ${
                                                            todo.isOverdue ? styles.overdueText : ""
                                                        }`}
                                                    >
                                                        <FiCalendar />{" "}
                                                        {todo.isOverdue ? "Overdue: " : "Due: "}
                                                        {format(todo.dueDate, "MMM d, yyyy h:mm a")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.todoRight}>
                                        {todo.quizId && (
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => navigate(`/student/quizzes/${todo.quizId}`)}
                                            >
                                                <FiPlay /> {todo.actionText}
                                            </button>
                                        )}

                                        {isCustom && !todo.isCompleted && (
                                            <button
                                                className={styles.iconOnlyBtn}
                                                onClick={() => handleEditCustomTodo(todo)}
                                                title="Edit Custom Task"
                                            >
                                                <FiEdit2 />
                                            </button>
                                        )}

                                        {isCustom && (
                                            <button
                                                className={styles.iconOnlyBtn}
                                                onClick={() => handleDeleteCustomTodo(todo.id)}
                                                title="Delete Custom Task"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create / Edit Custom Todo Modal */}
            {showModal && (
                <ModalPortal onClose={() => setShowModal(false)}>
                    <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <div className={styles.modalTitleGroup}>
                                    <div className={styles.modalBadgeIcon}>
                                        <FiCheckSquare />
                                    </div>
                                    <div>
                                        <h3 className={styles.modalTitle}>
                                            {editingTaskId ? "Edit Custom Task" : "Add Custom Study Task"}
                                        </h3>
                                        <p className={styles.modalSubtitle}>
                                            {editingTaskId
                                                ? "Update your personal study task parameters"
                                                : "Create personal study goals & topic practice notes"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className={styles.closeModalBtn}
                                    onClick={() => setShowModal(false)}
                                >
                                    <FiX />
                                </button>
                            </div>

                            <form onSubmit={handleAddCustomTodo} className={styles.modalForm}>
                                <div className={styles.modalFormBody}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            Task Title <span style={{ color: "var(--red-500)" }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Review Organic Chemistry Mechanisms"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            className={styles.formInput}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Subject / Topic</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Chemistry, Physics"
                                                value={newTopic}
                                                onChange={(e) => setNewTopic(e.target.value)}
                                                className={styles.formInput}
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Priority Level</label>
                                            <Select
                                                styles={modalSelectStyles}
                                                value={{
                                                    value: newPriority,
                                                    label:
                                                        newPriority === "High"
                                                            ? "High Priority"
                                                            : newPriority === "Low"
                                                            ? "Low Priority"
                                                            : "Medium Priority",
                                                }}
                                                onChange={(opt) => setNewPriority(opt.value)}
                                                options={[
                                                    { value: "High", label: "High Priority" },
                                                    { value: "Medium", label: "Medium Priority" },
                                                    { value: "Low", label: "Low Priority" },
                                                ]}
                                                isSearchable={false}
                                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                menuPosition="fixed"
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Due Date (Optional)</label>
                                        <input
                                            type="datetime-local"
                                            value={newDueDate}
                                            onChange={(e) => setNewDueDate(e.target.value)}
                                            className={styles.formInput}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Notes & Study Details (Optional)</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Add study notes, chapter references, or practice targets..."
                                            value={newDesc}
                                            onChange={(e) => setNewDesc(e.target.value)}
                                            className={styles.formTextarea}
                                        />
                                    </div>
                                </div>

                                <div className={styles.modalFooter}>
                                    <button
                                        type="button"
                                        className={styles.cancelBtn}
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <MainButton type="submit" icon={editingTaskId ? <FiEdit2 /> : <FiPlus />}>
                                        {editingTaskId ? "Save Changes" : "Save Task"}
                                    </MainButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default TodoPage;
