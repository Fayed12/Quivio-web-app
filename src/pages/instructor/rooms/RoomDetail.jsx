// local components
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./RoomDetail.module.css";

// react
import { useState, useEffect, useRef, useCallback } from "react";

// react-router
import { useParams, useNavigate } from "react-router";

// redux
import { useDispatch } from "react-redux";
import {
    addMembersThunk,
    removeMemberThunk,
    deleteRoomThunk
} from "../../../redux/slices/roomsSlice";
import { createAssignmentThunk } from "../../../redux/slices/assignmentsSlice";

// hooks
import { useRealtimeRooms } from "../../../hooks/useRealtimeRooms";

// animation
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";
import ModalPortal from "../components/ModalPortal";

// react-icons
import { 
    FiUsers, 
    FiClipboard, 
    FiAward, 
    FiPercent, 
    FiTrash2, 
    FiSearch, 
    FiUserPlus, 
    FiUserMinus,
    FiX
} from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

// sweetalert2
import Swal from "sweetalert2";

// custom select
import CustomSelect from "../../../components/ui/select/CustomSelect";

// Material UI
import { Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

// Recharts
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// supabase client
import { supabase } from "../../../services/config/supabaseClient";

import { useRoomDetailData } from "../../../hooks/instructor/useRoomDetailData";

const RoomDetail = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { room, members, nonMembers, quizzes, refreshMembers } = useRoomDetailData(id);

    // Realtime changes listener for this specific room
    useRealtimeRooms(id);

    // Local state
    const [activeTab, setActiveTab] = useState("overview");
    const [studentSearch, setStudentSearch] = useState("");
    const [roomAssignments, setRoomAssignments] = useState([]);
    
    // Modals
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [isAssignQuizOpen, setIsAssignQuizOpen] = useState(false);

    // Modal Forms inputs
    const [selectedStudentUids, setSelectedStudentUids] = useState([]);
    const [assignQuizId, setAssignQuizId] = useState("");
    const [assignDueDate, setAssignDueDate] = useState("");
    const [assignLimit, setAssignLimit] = useState("");
    const [assignNote, setAssignNote] = useState("");
    const [bankSearch, setBankSearch] = useState("");

    const containerRef = useRef(null);
    const addModalRef = useRef(null);
    const assignModalRef = useRef(null);

    const fetchRoomAssignments = useCallback(async () => {
        const { data, error } = await supabase
            .from("assignments")
            .select(`
                id, due_date, created_at, is_active, attempt_limit_override, note,
                quiz:quizzes(id, title, status, question_count, avg_score, pass_rate, category:categories(name))
            `)
            .eq("room_id", id);
        if (!error && data) {
            setRoomAssignments(data);
        }
    }, [id]);

    // Fetch Room Data
    useEffect(() => {
        const timer = setTimeout(() => {
            if (id) {
                fetchRoomAssignments();
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [id, fetchRoomAssignments]);

    // Page entrance animation
    usePageAnimation(containerRef);

    // Operations handlers
    const handleAddStudents = async (e) => {
        e.preventDefault();
        if (selectedStudentUids.length === 0) {
            toast.error("Please select at least one student");
            return;
        }

        try {
            await dispatch(addMembersThunk({
                roomId: id,
                studentUids: selectedStudentUids
            })).unwrap();

            toast.success(`Successfully added ${selectedStudentUids.length} student(s) to Room!`);
            setIsAddStudentOpen(false);
            setSelectedStudentUids([]);
            refreshMembers();
        } catch (err) {
            toast.error(err || "Failed to add students");
        }
    };

    const handleRemoveStudent = (student) => {
        const isDark = document.documentElement.classList.contains("dark");
        Swal.fire({
            title: `Remove ${student.full_name}?`,
            text: "Their account remains active. They will only lose access to this classroom's quizzes and announcements. All past attempt data is preserved.",
            icon: "warning",
            background: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            showCancelButton: true,
            confirmButtonText: "Remove Student",
            cancelButtonText: "Cancel",
            confirmButtonColor: "var(--color-danger, #ef4444)",
            cancelButtonColor: isDark ? "#475569" : "#94a3b8",
            customClass: {
                popup: "premium-swal-popup"
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await dispatch(removeMemberThunk({
                        roomId: id,
                        studentUid: student.uid
                    })).unwrap();
                    toast.success(`Removed ${student.full_name} from classroom!`);
                    refreshMembers();
                } catch (err) {
                    toast.error(err || "Failed to remove member");
                }
            }
        });
    };

    // Set of quiz IDs already assigned to this room – used to filter dropdown & guard submit
    const assignedQuizIds = new Set(roomAssignments.map(a => a.quiz?.id).filter(Boolean));

    // Published quizzes that have NOT already been assigned to this room
    const availableQuizzes = quizzes.filter(q => q.status === "published" && !assignedQuizIds.has(q.id));

    const handleAssignQuiz = async (e) => {
        e.preventDefault();
        if (!assignQuizId) {
            toast.error("Please select a quiz");
            return;
        }
        if (assignedQuizIds.has(assignQuizId)) {
            toast.error("This quiz is already assigned to this room");
            return;
        }

        try {
            await dispatch(createAssignmentThunk({
                quiz_id: assignQuizId,
                room_id: id,
                student_uid: null,
                due_date: assignDueDate || null,
                attempt_limit_override: assignLimit ? Number(assignLimit) : null,
                note: assignNote || null
            })).unwrap();

            toast.success("Quiz successfully assigned to room!");
            setIsAssignQuizOpen(false);
            setAssignQuizId("");
            setAssignDueDate("");
            setAssignLimit("");
            setAssignNote("");
            fetchRoomAssignments();
        } catch (err) {
            toast.error(err || "Failed to assign quiz");
        }
    };

    const handleDeleteRoom = () => {
        const isDark = document.documentElement.classList.contains("dark");
        Swal.fire({
            title: `Delete classroom "${room.name}"?`,
            html: `
                <div style="text-align: left; font-family: var(--font-sans, sans-serif);">
                    <p style="color: ${isDark ? "#94a3b8" : "#475569"}; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1rem;">
                        Students will be notified and removed immediately. Past attempt records are preserved in logs.
                    </p>
                    <label style="font-weight: 600; font-size: 0.8125rem; display: block; margin-bottom: 0.5rem; color: ${isDark ? "#f8fafc" : "#0f172a"};">
                        Type the room name to confirm:
                    </label>
                </div>
            `,
            input: "text",
            inputPlaceholder: room.name,
            inputAttributes: {
                autocapitalize: "off",
                autocorrect: "off"
            },
            background: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            showCancelButton: true,
            confirmButtonText: "Delete Room",
            cancelButtonText: "Cancel",
            confirmButtonColor: "var(--color-danger, #ef4444)",
            cancelButtonColor: isDark ? "#475569" : "#94a3b8",
            buttonsStyling: true,
            customClass: {
                popup: "premium-swal-popup",
                input: "premium-swal-input"
            },
            preConfirm: (inputValue) => {
                if (inputValue !== room.name) {
                    Swal.showValidationMessage("Room name does not match");
                    return false;
                }
                return true;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await dispatch(deleteRoomThunk(id)).unwrap();
                    toast.success(`Classroom "${room.name}" deleted successfully!`);
                    navigate("/instructor/rooms");
                } catch (err) {
                    toast.error(err || "Failed to delete classroom");
                }
            }
        });
    };

    const handleToggleStudentSelection = (uid) => {
        if (selectedStudentUids.includes(uid)) {
            setSelectedStudentUids(selectedStudentUids.filter(id => id !== uid));
        } else {
            setSelectedStudentUids([...selectedStudentUids, uid]);
        }
    };

    // Filter members list
    const filteredMembers = members.filter(m => {
        return m.profile?.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) || 
               m.profile?.email?.toLowerCase().includes(studentSearch.toLowerCase());
    });

    // Filter non-members inside the add modal
    const filteredNonMembers = nonMembers.filter(n => {
        return n.profile?.full_name?.toLowerCase().includes(bankSearch.toLowerCase()) || 
               n.profile?.email?.toLowerCase().includes(bankSearch.toLowerCase());
    });

    // Calculate overall classroom stats based on real member score/attempts data
    const membersWithScores = members.filter(m => m.avg_score > 0);
    const roomAvgScore = membersWithScores.length > 0
        ? Math.round(membersWithScores.reduce((sum, m) => sum + m.avg_score, 0) / membersWithScores.length)
        : 0;

    // Calculate Completion Rate:
    // Total possible completions = members * assignments
    // Actual completions = count members who have completed attempts for assigned quizzes
    const totalPossibleCompletions = members.length * roomAssignments.length;
    let actualCompletions = 0;
    if (totalPossibleCompletions > 0) {
        members.forEach(m => {
            const memberAttempts = m.attempts || [];
            const completedQuizIds = new Set(memberAttempts.map(a => a.quiz_id));
            roomAssignments.forEach(ass => {
                if (ass.quiz?.id && completedQuizIds.has(ass.quiz.id)) {
                    actualCompletions++;
                }
            });
        });
    }
    const completionRate = totalPossibleCompletions > 0
        ? Math.round((actualCompletions / totalPossibleCompletions) * 100)
        : 0;

    // Filter and sort top performers
    const topPerformers = [...members]
        .filter(m => m.avg_score > 0)
        .sort((a, b) => b.avg_score - a.avg_score)
        .slice(0, 5);

    // Compute Chronological progression data for Recharts AreaChart
    const getAnalyticsData = () => {
        const allAttempts = [];
        members.forEach(m => {
            if (m.attempts) {
                m.attempts.forEach(a => {
                    if (a.submitted_at) {
                        allAttempts.push({
                            score: a.score || 0,
                            date: new Date(a.submitted_at)
                        });
                    }
                });
            }
        });

        if (allAttempts.length === 0) {
            return [
                { day: "No Data", score: 0 }
            ];
        }

        // Sort chronologically
        allAttempts.sort((a, b) => a.date - b.date);

        // Group by date (MM/DD format) and calculate average
        const grouped = {};
        allAttempts.forEach(att => {
            const dateStr = att.date.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' });
            if (!grouped[dateStr]) {
                grouped[dateStr] = { sum: 0, count: 0 };
            }
            grouped[dateStr].sum += att.score;
            grouped[dateStr].count += 1;
        });

        return Object.keys(grouped).map(day => ({
            day,
            score: Math.round(grouped[day].sum / grouped[day].count)
        }));
    };

    const analyticsChartData = getAnalyticsData();

    const getQuizRoomStats = (quizId) => {
        const quizAttempts = [];
        members.forEach(m => {
            if (m.attempts) {
                m.attempts.forEach(a => {
                    if (a.quiz_id === quizId) {
                        quizAttempts.push(a);
                    }
                });
            }
        });

        if (quizAttempts.length === 0) {
            return { avgScore: "N/A", passRate: "N/A" };
        }

        const totalScore = quizAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0);
        const avgScore = Math.round(totalScore / quizAttempts.length);

        const passedCount = quizAttempts.filter(a => a.passed).length;
        const passRate = Math.round((passedCount / quizAttempts.length) * 100);

        return { avgScore: `${avgScore}%`, passRate: `${passRate}%` };
    };

    if (!room) {
        return <div className={styles.loading}>Loading Room Details...</div>;
    }

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Page Header */}
            <PageHeader 
                title={room.name}
                subtitle={room.description || "Classroom details panel."}
                breadcrumbs={["Rooms", room.name]}
                onBack={() => navigate("/instructor/rooms")}
                actions={
                    <button className={styles.deleteBtn} onClick={handleDeleteRoom}>
                        <FiTrash2 /> Delete Room
                    </button>
                }
            />

            {/* Quick Stats overview widgets */}
            <div className={styles.statsGrid}>
                <StatCard icon={<FiUsers />} value={room.member_count || 0} label="Class Students" color="blue" />
                <StatCard icon={<FiClipboard />} value={roomAssignments.length} label="Assigned Quizzes" color="green" />
                <StatCard icon={<FiAward />} value={`${roomAvgScore}%`} label="Average Score" color="amber" />
                <StatCard icon={<FiPercent />} value={`${completionRate}%`} label="Completion Rate" color="violet" />
            </div>

            {/* Tabs Selector Navigation */}
            <div className={styles.tabsRow}>
                {["overview", "students", "quizzes", "analytics"].map(tab => (
                    <button 
                        key={tab} 
                        className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === "overview" && (
                <div className={styles.tabContentCard}>
                    <div className={styles.overviewFlex}>
                        <div className={styles.overviewDetails}>
                            <h3>Classroom Info</h3>
                            <div className={styles.infoList}>
                                <div className={styles.infoItem}>
                                    <span>Classroom Name</span>
                                    <strong>{room.name}</strong>
                                </div>
                                <div className={styles.infoItem}>
                                    <span>Created Date</span>
                                    <strong>{new Date(room.created_at).toLocaleDateString()}</strong>
                                </div>
                                <div className={styles.infoItem}>
                                    <span>Description</span>
                                    <p>{room.description || "No description set for this classroom."}</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.overviewActions}>
                            <h3>Quick Activities</h3>
                            <div className={styles.actionGrid}>
                                <MainButton onClick={() => setIsAddStudentOpen(true)} variant="primary">
                                    <FiUserPlus /> Add Students
                                </MainButton>
                                <MainButton onClick={() => setIsAssignQuizOpen(true)} variant="outline">
                                    <FiClipboard /> Assign Quiz
                                </MainButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: STUDENTS */}
            {activeTab === "students" && (
                <div className={styles.tabContentCard}>
                    <div className={styles.tableHeaderRow}>
                        <div className={styles.searchWrapper}>
                            <FiSearch className={styles.searchIcon} />
                            <input 
                                type="text" 
                                placeholder="Search room members..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                        <MainButton onClick={() => setIsAddStudentOpen(true)} variant="primary" size="sm">
                            <FiUserPlus /> Add Students
                        </MainButton>
                    </div>

                    <TableContainer component={Paper} className={styles.tableContainer} elevation={0}>
                        <Table size="medium">
                            <TableHead className={styles.tableHead}>
                                <TableRow>
                                    <TableCell className={styles.thCell}>Student Name</TableCell>
                                    <TableCell className={styles.thCell}>Email Address</TableCell>
                                    <TableCell className={styles.thCell} align="center">Joined Date</TableCell>
                                    <TableCell className={styles.thCell} align="center">Last Active</TableCell>
                                    <TableCell className={styles.thCell} align="center">Avg. Score</TableCell>
                                    <TableCell className={styles.thCell} align="center">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredMembers.map((m) => (
                                    <TableRow key={m.id} className={styles.tableRow}>
                                        <TableCell className={styles.tdCell}>
                                            <div className={styles.userNameCol}>
                                                <Avatar src={m.profile?.avatar_url} sx={{ width: 28, height: 28 }}>
                                                    {m.profile?.full_name?.charAt(0)}
                                                </Avatar>
                                                <span>{m.profile?.full_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className={styles.tdCell}>{m.profile?.email}</TableCell>
                                        <TableCell align="center" className={styles.tdCell}>
                                            {new Date(m.joined_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell}>
                                            {m.profile?.last_activity_date ? new Date(m.profile.last_activity_date).toLocaleDateString() : "Never"}
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell} style={{fontWeight: 600}}>
                                            {m.avg_score > 0 ? `${m.avg_score}%` : "N/A"}
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell}>
                                            <button 
                                                className={styles.removeStudentBtn} 
                                                onClick={() => handleRemoveStudent(m.profile)}
                                                title="Remove Student from Room"
                                            >
                                                <FiUserMinus /> Remove
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredMembers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" className={styles.emptyCell}>
                                            No students found in this room.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            )}

            {/* TAB CONTENT: QUIZZES */}
            {activeTab === "quizzes" && (
                <div className={styles.tabContentCard}>
                    <div className={styles.tableHeaderRow} style={{justifyContent: "flex-end"}}>
                        <MainButton onClick={() => setIsAssignQuizOpen(true)} variant="primary" size="sm">
                            <FiClipboard /> Assign Quiz
                        </MainButton>
                    </div>

                    <TableContainer component={Paper} className={styles.tableContainer} elevation={0}>
                        <Table size="medium">
                            <TableHead className={styles.tableHead}>
                                <TableRow>
                                    <TableCell className={styles.thCell}>Quiz Title</TableCell>
                                    <TableCell className={styles.thCell} align="center">Category</TableCell>
                                    <TableCell className={styles.thCell} align="center">Assigned Date</TableCell>
                                    <TableCell className={styles.thCell} align="center">Due Date</TableCell>
                                    <TableCell className={styles.thCell} align="center">Pass Rate</TableCell>
                                    <TableCell className={styles.thCell} align="center">Avg. Score</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {roomAssignments.map((ass) => (
                                    <TableRow key={ass.id} className={styles.tableRow}>
                                        <TableCell className={styles.tdCell} style={{fontWeight: 600}}>{ass.quiz?.title}</TableCell>
                                        <TableCell align="center" className={styles.tdCell}>{ass.quiz?.category?.name || "General"}</TableCell>
                                        <TableCell align="center" className={styles.tdCell}>
                                            {new Date(ass.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell}>
                                            {ass.due_date ? new Date(ass.due_date).toLocaleDateString() : "No limit"}
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell}>
                                            {getQuizRoomStats(ass.quiz?.id).passRate}
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell} style={{fontWeight: 600}}>
                                            {getQuizRoomStats(ass.quiz?.id).avgScore}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {roomAssignments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" className={styles.emptyCell}>
                                            No quizzes assigned to this classroom yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            )}

            {/* TAB CONTENT: ANALYTICS */}
            {activeTab === "analytics" && (
                <div className={styles.analyticsTab}>
                    <div className={styles.grid2}>
                        {/* Attempts over time chart */}
                        <div className={styles.tabContentCard}>
                            <h3 className={styles.cardTitle}>Average Room Score Progression</h3>
                            <div className={styles.chartWrapper}>
                                <ResponsiveContainer width="100%" height={240}>
                                    <AreaChart data={analyticsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRoomScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--violet-500)" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="var(--violet-500)" stopOpacity={0.0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" />
                                        <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                                        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="score" stroke="var(--violet-500)" strokeWidth={2} fillOpacity={1} fill="url(#colorRoomScore)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Students in room */}
                        <div className={styles.tabContentCard}>
                            <h3 className={styles.cardTitle}>Top Performers inside room</h3>
                            <div className={styles.studentList}>
                                {topPerformers.map((m, idx) => (
                                    <div key={m.id} className={styles.studentItem}>
                                        <div className={styles.studentMeta}>
                                            <span className={styles.rankBadge}>{idx + 1}</span>
                                            <Avatar src={m.profile?.avatar_url} sx={{ width: 28, height: 28 }}>
                                                {m.profile?.full_name?.charAt(0)}
                                            </Avatar>
                                            <span className={styles.studentName}>{m.profile?.full_name}</span>
                                        </div>
                                        <strong>{m.avg_score}%</strong>
                                    </div>
                                ))}
                                {topPerformers.length === 0 && (
                                    <div className={styles.emptyFeed}>No analytics details available.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD MEMBERS TO ROOM MODAL */}
            {isAddStudentOpen && (
                <ModalPortal onClose={() => setIsAddStudentOpen(false)}>
                <div 
                    className={styles.modalOverlay}
                    onClick={() => setIsAddStudentOpen(false)} // Close on outside click
                >
                    <form 
                        className={styles.modal} 
                        ref={addModalRef}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                        onSubmit={handleAddStudents}
                    >
                        <div className={styles.modalHeader}>
                            <h3>Add Students to Classroom</h3>
                            <button type="button" className={styles.closeBtn} onClick={() => setIsAddStudentOpen(false)}>
                                <FiX />
                            </button>
                        </div>

                        {/* Search field */}
                        <div className={styles.bankSearchRow}>
                            <FiSearch className={styles.searchIcon} />
                            <input 
                                type="text" 
                                placeholder="Search students by name or email..."
                                value={bankSearch}
                                onChange={(e) => setBankSearch(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>

                        <div className={styles.modalBody} style={{ maxHeight: "300px", overflowY: "auto" }}>
                            {filteredNonMembers.map(n => {
                                const isChecked = selectedStudentUids.includes(n.student_uid);
                                return (
                                    <div 
                                        key={n.student_uid} 
                                        className={`${styles.studentSelectRow} ${isChecked ? styles.rowChecked : ""}`}
                                        onClick={() => handleToggleStudentSelection(n.student_uid)}
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={isChecked}
                                            onChange={() => {}} // Controlled row click
                                            className={styles.checkbox}
                                        />
                                        <Avatar src={n.profile?.avatar_url} sx={{ width: 28, height: 28 }}>
                                            {n.profile?.full_name?.charAt(0)}
                                        </Avatar>
                                        <div>
                                            <div className={styles.selectName}>{n.profile?.full_name}</div>
                                            <div className={styles.selectEmail}>{n.profile?.email} ({n.student_code})</div>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredNonMembers.length === 0 && (
                                <div className={styles.emptyFeed}>
                                    No students available to add (all existing students are already members).
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <span className={styles.selectedCount}>{selectedStudentUids.length} selected</span>
                            <div>
                                <MainButton onClick={() => setIsAddStudentOpen(false)} variant="secondary">
                                    Cancel
                                </MainButton>
                                <MainButton type="submit" variant="primary" disabled={selectedStudentUids.length === 0}>
                                    Add to Room
                                </MainButton>
                            </div>
                        </div>
                    </form>
                </div>
                </ModalPortal>
            )}



            {/* ASSIGN QUIZ MODAL */}
            {isAssignQuizOpen && (
                <ModalPortal onClose={() => setIsAssignQuizOpen(false)}>
                <div 
                    className={styles.modalOverlay}
                    onClick={() => setIsAssignQuizOpen(false)} // Close on outside click
                >
                    <form 
                        className={styles.modal} 
                        ref={assignModalRef}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                        onSubmit={handleAssignQuiz}
                    >
                        <div className={styles.modalHeader}>
                            <h3>Assign Quiz to Room</h3>
                            <button type="button" className={styles.closeBtn} onClick={() => setIsAssignQuizOpen(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Select Quiz */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Select Quiz <span className={styles.req}>*</span></label>
                                <CustomSelect
                                    options={availableQuizzes.map(q => ({ value: q.id, label: q.title }))}
                                    value={assignQuizId}
                                    onChange={setAssignQuizId}
                                    placeholder={availableQuizzes.length === 0 ? "All quizzes are already assigned" : "Choose quiz..."}
                                    isDisabled={availableQuizzes.length === 0}
                                />
                            </div>

                            {/* Due date */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Due Date (Optional)</label>
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

                            {/* Notes */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Note to Students</label>
                                <textarea 
                                    value={assignNote}
                                    onChange={(e) => setAssignNote(e.target.value)}
                                    placeholder="Write any comments for students..."
                                    rows={2}
                                    className={styles.textarea}
                                    maxLength={500}
                                />
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <MainButton onClick={() => setIsAssignQuizOpen(false)} variant="secondary">
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

export default RoomDetail;
