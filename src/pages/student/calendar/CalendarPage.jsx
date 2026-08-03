// react
import { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

// date-fns
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    isPast} from "date-fns";

// react-icons
import {
    FiCalendar,
    FiChevronLeft,
    FiChevronRight,
    FiCheckCircle,
    FiClock,
    FiAlertCircle,
    FiPlay,
    FiGrid,
    FiList,
    FiX,
    FiBookOpen,
    FiTag
} from "react-icons/fi";

// redux
import { fetchStudentAssignments, selectStudentAssignments } from "../../../redux/slices/assignmentsSlice";
import { fetchMyAttempts, selectMyAttempts } from "../../../redux/slices/attemptsSlice";
import { fetchPublishedQuizzes, selectPublishedQuizzes } from "../../../redux/slices/quizzesSlice";
import { selectUser } from "../../../redux/slices/authSlice";
import { fetchTodos, selectTodos } from "../../../redux/slices/todosSlice";

// hooks
import { useRealtimeTodos } from "../../../hooks/useRealtimeTodos";

// supabase
import { supabase } from "../../../services/config/supabaseClient";

// components
import MainButton from "../../../components/ui/button/MainButton";
import ModalPortal from "../../instructor/components/ModalPortal";

// gsap
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

// local
import styles from "./CalendarPage.module.css";

const EMPTY_ARRAY = [];

const CalendarPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const containerRef = useRef(null);

    const user = useSelector(selectUser);

    // Subscribe to Supabase Realtime changes for user's todos
    useRealtimeTodos();

    const rawAssignments = useSelector(selectStudentAssignments);
    const rawAttempts = useSelector(selectMyAttempts);
    const rawPublicQuizzes = useSelector(selectPublishedQuizzes);
    const rawDbTodos = useSelector(selectTodos);

    const assignments = useMemo(() => rawAssignments || EMPTY_ARRAY, [rawAssignments]);
    const attempts = useMemo(() => rawAttempts || EMPTY_ARRAY, [rawAttempts]);
    const publicQuizzes = useMemo(() => rawPublicQuizzes || EMPTY_ARRAY, [rawPublicQuizzes]);
    const customTodos = useMemo(() => rawDbTodos || EMPTY_ARRAY, [rawDbTodos]);

    // Local States
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState("month"); // 'month' or 'agenda'
    const [selectedDateEvents, setSelectedDateEvents] = useState(null);
    const [selectedDateStr, setSelectedDateStr] = useState("");

    const [directQuizzes, setDirectQuizzes] = useState([]);

    // GSAP Entrance animation
    usePageAnimation(containerRef, {
        ready: true,
        staggerSelector: `.${styles.dayCell}, .${styles.agendaItem}`
    });

    useEffect(() => {
        if (user?.id) {
            dispatch(fetchTodos(user.id));
        }
        dispatch(fetchStudentAssignments({ page: 1, pageSize: 500 }));
        dispatch(fetchMyAttempts({ page: 1, pageSize: 500 }));
        dispatch(fetchPublishedQuizzes({ page: 1, pageSize: 500 }));

        // Direct fetch of all published & room quizzes for 100% calendar completeness
        async function loadAllQuizzes() {
            try {
                const { data } = await supabase
                    .from("quizzes")
                    .select("id, title, published_at, created_at, category:categories(id, name)")
                    .order("created_at", { ascending: false });
                if (data) setDirectQuizzes(data);
            } catch {
                // handle silently
            }
        }
        loadAllQuizzes();

        // Realtime Subscription to update calendar immediately when a quiz is submitted or created
        const channel = supabase
            .channel("realtime-calendar-updates")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "attempts" },
                () => {
                    dispatch(fetchMyAttempts({ page: 1, pageSize: 500 }));
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "assignments" },
                () => {
                    dispatch(fetchStudentAssignments({ page: 1, pageSize: 500 }));
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "quizzes" },
                () => {
                    dispatch(fetchPublishedQuizzes({ page: 1, pageSize: 500 }));
                    loadAllQuizzes();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [dispatch, user?.id]);

    // Build unified events array
    const allEvents = useMemo(() => {
        const events = [];

        // Combine publicQuizzes and directQuizzes to ensure full coverage
        const combinedQuizzesMap = {};
        publicQuizzes.forEach((q) => {
            if (q?.id) combinedQuizzesMap[q.id] = q;
        });
        directQuizzes.forEach((dq) => {
            if (dq?.id && !combinedQuizzesMap[dq.id]) {
                combinedQuizzesMap[dq.id] = dq;
            }
        });
        const quizMap = combinedQuizzesMap;
        const combinedQuizzes = Object.values(combinedQuizzesMap);

        // 1. Quiz Attempts (Completed or Submitted)
        attempts.forEach((att) => {
            const rawDate = att.submitted_at || att.started_at || att.created_at;
            if (!rawDate) return;

            const dateObj = new Date(rawDate);
            if (isNaN(dateObj.getTime())) return;

            const quizObj = att.quiz || quizMap[att.quiz_id] || {};
            const quizTitle = quizObj.title || att.quiz_title || "Quiz Attempt";
            const topicName = quizObj.category?.name || "General Knowledge";

            events.push({
                id: `att-${att.id}`,
                title: quizTitle,
                type: att.passed ? "completed" : att.status === "completed" ? "completed" : "assignment",
                date: dateObj,
                score: att.score ?? 0,
                passed: !!att.passed,
                quizId: att.quiz_id || quizObj.id,
                attemptId: att.id,
                topic: topicName
            });
        });

        // 2. Room Assignments (Pending/Due)
        assignments.forEach((asg) => {
            if (!asg.due_date) return;
            const dueDate = new Date(asg.due_date);
            if (isNaN(dueDate.getTime())) return;

            const quizObj = asg.quiz || quizMap[asg.quiz_id] || {};
            const quizTitle = quizObj.title || "Room Assignment";
            const isFinished = attempts.some(
                (a) => (a.quiz_id === asg.quiz_id || a.quiz?.id === asg.quiz_id) && a.status === "completed"
            );
            const isOverdue = !isFinished && isPast(dueDate) && !isToday(dueDate);

            events.push({
                id: `asg-${asg.id}`,
                title: quizTitle,
                type: isFinished ? "completed" : isOverdue ? "overdue" : "assignment",
                date: dueDate,
                quizId: asg.quiz_id || quizObj.id,
                topic: quizObj.category?.name || "Room Assignment",
                note: asg.note
            });
        });

        // 3. Custom Personal Todos
        customTodos.forEach((item) => {
            if (item.dueDate) {
                const dueDate = new Date(item.dueDate);
                if (isNaN(dueDate.getTime())) return;

                const isOverdue = !item.isCompleted && isPast(dueDate) && !isToday(dueDate);

                events.push({
                    id: item.id,
                    title: item.title,
                    type: item.isCompleted ? "completed" : isOverdue ? "overdue" : "custom",
                    date: dueDate,
                    topic: item.topic || "Custom Study Goal",
                    isCustom: true
                });
            }
        });

        // 4. Quiz Publication / Creation Dates
        combinedQuizzes.forEach((q) => {
            const rawPubDate = q.published_at || q.created_at;
            if (!rawPubDate) return;

            const pubDate = new Date(rawPubDate);
            if (isNaN(pubDate.getTime())) return;

            events.push({
                id: `pub-${q.id}`,
                title: `Published: ${q.title}`,
                type: "published",
                date: pubDate,
                quizId: q.id,
                topic: q.category?.name || "New Quiz Release"
            });
        });

        return events;
    }, [assignments, attempts, publicQuizzes, directQuizzes, customTodos]);

    // Generate Calendar Grid Days
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Map events by date string (YYYY-MM-DD)
    const eventsByDate = useMemo(() => {
        const map = {};
        allEvents.forEach((ev) => {
            const dateKey = format(ev.date, "yyyy-MM-dd");
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(ev);
        });
        return map;
    }, [allEvents]);

    // Month navigation controls
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const resetToToday = () => setCurrentMonth(new Date());

    // Day Click Handler
    const handleDayClick = (day, eventsForDay) => {
        setSelectedDateStr(format(day, "MMMM d, yyyy"));
        setSelectedDateEvents(eventsForDay || []);
    };

    return (
        <div className={styles.container} ref={containerRef}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleArea}>
                    <h1 className={styles.pageTitle}>
                        <span className={styles.titleIcon}><FiCalendar /></span>
                        Study Calendar
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Visualize all upcoming quiz deadlines, room assignments, and attempt completion history in a month layout.
                    </p>
                </div>

                <div className={styles.viewControls}>
                    <button
                        className={`${styles.todayBtn} ${viewMode === "month" ? styles.todayBtnActive : ""}`}
                        onClick={() => setViewMode("month")}
                    >
                        <FiGrid style={{ marginRight: "6px" }} /> Month View
                    </button>
                    <button
                        className={`${styles.todayBtn} ${viewMode === "agenda" ? styles.todayBtnActive : ""}`}
                        onClick={() => setViewMode("agenda")}
                    >
                        <FiList style={{ marginRight: "6px" }} /> Agenda List
                    </button>
                </div>
            </div>

            {/* Calendar Main Card */}
            <div className={styles.calendarCard}>
                {/* Month Navigation Toolbar */}
                <div className={styles.monthHeader}>
                    <h2 className={styles.currentMonthTitle}>
                        {format(currentMonth, "MMMM yyyy")}
                    </h2>

                    <div className={styles.navBtnGroup}>
                        <button className={styles.navIconBtn} onClick={prevMonth} title="Previous Month">
                            <FiChevronLeft />
                        </button>
                        <button className={styles.todayBtn} onClick={resetToToday}>
                            Today
                        </button>
                        <button className={styles.navIconBtn} onClick={nextMonth} title="Next Month">
                            <FiChevronRight />
                        </button>
                    </div>
                </div>

                {/* Color Legend Bar */}
                <div className={styles.legendBar}>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.dotCompleted}`} /> Completed
                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.dotAssignment}`} /> Assigned
                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.dotPublished}`} /> Release
                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.dotOverdue}`} /> Overdue
                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.dotCustom}`} /> Personal Task
                    </div>
                </div>

                {viewMode === "month" ? (
                    <>
                        {/* Days of Week Row */}
                        <div className={styles.weekDaysGrid}>
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                                <div key={dayName} className={styles.weekDayCell}>
                                    {dayName}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className={styles.daysGrid}>
                            {calendarDays.map((day) => {
                                const dateKey = format(day, "yyyy-MM-dd");
                                const dayEvents = eventsByDate[dateKey] || [];
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isTodayDate = isToday(day);

                                return (
                                    <div
                                        key={dateKey}
                                        className={`${styles.dayCell} ${
                                            !isCurrentMonth ? styles.dayCellOutside : ""
                                        } ${isTodayDate ? styles.dayCellToday : ""}`}
                                        onClick={() => handleDayClick(day, dayEvents)}
                                    >
                                        <div className={styles.dayHeader}>
                                            <span
                                                className={`${styles.dayNumber} ${
                                                    isTodayDate ? styles.dayNumberToday : ""
                                                }`}
                                            >
                                                {format(day, "d")}
                                            </span>
                                        </div>

                                        <div className={styles.eventBadgesList}>
                                            {dayEvents.slice(0, 3).map((ev) => (
                                                <div
                                                    key={ev.id}
                                                    className={`${styles.eventBadge} ${
                                                        ev.type === "completed"
                                                            ? styles.badgeCompleted
                                                            : ev.type === "published"
                                                            ? styles.badgePublished
                                                            : ev.type === "overdue"
                                                            ? styles.badgeOverdue
                                                            : ev.type === "custom"
                                                            ? styles.badgeCustom
                                                            : styles.badgeAssignment
                                                    }`}
                                                >
                                                    {ev.type === "completed" ? (
                                                        <FiCheckCircle size={10} />
                                                    ) : ev.type === "published" ? (
                                                        <FiBookOpen size={10} />
                                                    ) : ev.type === "overdue" ? (
                                                        <FiAlertCircle size={10} />
                                                    ) : (
                                                        <FiClock size={10} />
                                                    )}
                                                    {ev.title}
                                                </div>
                                            ))}

                                            {dayEvents.length > 3 && (
                                                <span className={styles.moreEventsCount}>
                                                    +{dayEvents.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    /* Agenda List View */
                    <div className={styles.agendaContainer}>
                        {allEvents.length === 0 ? (
                            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>
                                No scheduled events found for this month.
                            </p>
                        ) : (
                            allEvents.map((ev) => (
                                <div key={ev.id} className={styles.agendaItem}>
                                    <div className={styles.agendaLeft}>
                                        <div className={styles.dateBlock}>
                                            <div className={styles.dateDay}>{format(ev.date, "d")}</div>
                                            <div className={styles.dateMonth}>{format(ev.date, "MMM")}</div>
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
                                                {ev.title}
                                            </h4>
                                            <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                                                <FiTag /> {ev.topic} • {format(ev.date, "h:mm a")}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        {ev.quizId && (
                                            <button
                                                className={styles.todayBtn}
                                                onClick={() => navigate(`/student/quizzes/${ev.quizId}`)}
                                            >
                                                <FiPlay style={{ marginRight: "4px" }} /> Open Quiz
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Day Event Detail Modal */}
            {selectedDateEvents && (
                <ModalPortal onClose={() => setSelectedDateEvents(null)}>
                    <div className={styles.modalOverlay} onClick={() => setSelectedDateEvents(null)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3 className={styles.modalTitle}>Events on {selectedDateStr}</h3>
                                <button
                                    className={styles.modalCloseBtn}
                                    onClick={() => setSelectedDateEvents(null)}
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className={styles.modalEventList}>
                                {selectedDateEvents.length === 0 ? (
                                    <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
                                        No events or deadlines on this day.
                                    </p>
                                ) : (
                                    selectedDateEvents.map((ev) => (
                                        <div key={ev.id} className={styles.modalEventCard}>
                                            <div>
                                                <span
                                                    className={`${styles.eventBadge} ${
                                                        ev.type === "completed"
                                                            ? styles.badgeCompleted
                                                            : ev.type === "published"
                                                            ? styles.badgePublished
                                                            : ev.type === "overdue"
                                                            ? styles.badgeOverdue
                                                            : ev.type === "custom"
                                                            ? styles.badgeCustom
                                                            : styles.badgeAssignment
                                                    }`}
                                                    style={{ display: "inline-flex", marginBottom: "6px" }}
                                                >
                                                    {ev.type.toUpperCase()}
                                                </span>
                                                <h4 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
                                                    {ev.title}
                                                </h4>
                                                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                                                    {ev.topic} • {format(ev.date, "h:mm a")}
                                                </p>
                                            </div>

                                            {ev.quizId && (
                                                <MainButton
                                                    onClick={() => {
                                                        setSelectedDateEvents(null);
                                                        if (ev.attemptId) {
                                                            navigate(`/student/quiz/${ev.quizId}/results/${ev.attemptId}`);
                                                        } else {
                                                            navigate(`/student/quizzes/${ev.quizId}`);
                                                        }
                                                    }}
                                                >
                                                    {ev.attemptId ? "Results" : "Start"}
                                                </MainButton>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default CalendarPage;
