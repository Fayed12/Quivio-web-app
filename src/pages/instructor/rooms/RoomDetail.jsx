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
    const [studentToRemove, setStudentToRemove] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Modal Forms inputs
    const [selectedStudentUids, setSelectedStudentUids] = useState([]);
    const [assignQuizId, setAssignQuizId] = useState("");
    const [assignDueDate, setAssignDueDate] = useState("");
    const [assignLimit, setAssignLimit] = useState("");
    const [assignNote, setAssignNote] = useState("");
    const [deleteRoomNameInput, setDeleteRoomNameInput] = useState("");
    const [bankSearch, setBankSearch] = useState("");

    const containerRef = useRef(null);
    const addModalRef = useRef(null);
    const assignModalRef = useRef(null);
    const removeModalRef = useRef(null);
    const deleteModalRef = useRef(null);

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

    const handleRemoveStudent = async () => {
        if (!studentToRemove) return;
        try {
            await dispatch(removeMemberThunk({
                roomId: id,
                studentUid: studentToRemove.uid
            })).unwrap();

            toast.success(`Removed ${studentToRemove.full_name} from classroom!`);
            setStudentToRemove(null);
            refreshMembers();
        } catch (err) {
            toast.error(err || "Failed to remove member");
        }
    };

    const handleAssignQuiz = async (e) => {
        e.preventDefault();
        if (!assignQuizId) {
            toast.error("Please select a quiz");
            return;
        }

        try {
            await dispatch(createAssignmentThunk({
                quiz_id: assignQuizId,
                room_id: id,
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

    const handleDeleteRoom = async () => {
        if (deleteRoomNameInput !== room.name) {
            toast.error("Verification name does not match");
            return;
        }

        try {
            await dispatch(deleteRoomThunk(id)).unwrap();
            toast.success(`Classroom "${room.name}" deleted successfully!`);
            navigate("/instructor/rooms");
        } catch (err) {
            toast.error(err || "Failed to delete classroom");
        }
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

    // Dummy Analytics Data
    const analyticsChartData = [
        { day: "06/05", score: 72 }, { day: "06/10", score: 78 }, 
        { day: "06/15", score: 74 }, { day: "06/20", score: 85 }, 
        { day: "06/25", score: 81 }, { day: "06/30", score: 88 }, 
        { day: "07/04", score: 92 }
    ];

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
                    <button className={styles.deleteBtn} onClick={() => setIsDeleteOpen(true)}>
                        <FiTrash2 /> Delete Room
                    </button>
                }
            />

            {/* Quick Stats overview widgets */}
            <div className={styles.statsGrid}>
                <StatCard icon={<FiUsers />} value={room.member_count || 0} label="Class Students" color="blue" />
                <StatCard icon={<FiClipboard />} value={roomAssignments.length} label="Assigned Quizzes" color="green" />
                <StatCard icon={<FiAward />} value="82%" label="Average Score" color="amber" />
                <StatCard icon={<FiPercent />} value="90%" label="Completion Rate" color="violet" />
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
                                            82%
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell}>
                                            <button 
                                                className={styles.removeStudentBtn} 
                                                onClick={() => setStudentToRemove(m.profile)}
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
                                            {ass.quiz?.pass_rate ? `${Math.round(ass.quiz.pass_rate)}%` : "80%"}
                                        </TableCell>
                                        <TableCell align="center" className={styles.tdCell} style={{fontWeight: 600}}>
                                            {ass.quiz?.avg_score ? `${Math.round(ass.quiz.avg_score)}%` : "78%"}
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
                                {members.slice(0, 5).map((m, idx) => (
                                    <div key={m.id} className={styles.studentItem}>
                                        <div className={styles.studentMeta}>
                                            <span className={styles.rankBadge}>{idx + 1}</span>
                                            <Avatar src={m.profile?.avatar_url} sx={{ width: 28, height: 28 }}>
                                                {m.profile?.full_name?.charAt(0)}
                                            </Avatar>
                                            <span className={styles.studentName}>{m.profile?.full_name}</span>
                                        </div>
                                        <strong>88%</strong>
                                    </div>
                                ))}
                                {members.length === 0 && (
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

            {/* REMOVE MEMBER CONFIRMATION MODAL */}
            {studentToRemove && (
                <ModalPortal onClose={() => setStudentToRemove(null)}>
                <div 
                    className={styles.modalOverlay}
                    onClick={() => setStudentToRemove(null)} // Close on outside click
                >
                    <div 
                        className={styles.removeConfirmModal} 
                        ref={removeModalRef}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                    >
                        <div className={styles.deleteIconCircle}>
                            <FiUserMinus />
                        </div>
                        <h3>Remove {studentToRemove.full_name}?</h3>
                        <p className={styles.modalWarningText}>
                            Their account remains active. They will only lose access to this classroom's quizzes and announcements. All past attempt data is preserved.
                        </p>
                        <div className={styles.modalButtons}>
                            <MainButton onClick={() => setStudentToRemove(null)} variant="secondary">
                                Cancel
                            </MainButton>
                            <MainButton onClick={handleRemoveStudent} variant="danger">
                                Remove Student
                            </MainButton>
                        </div>
                    </div>
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
                                <select 
                                    value={assignQuizId} 
                                    onChange={(e) => setAssignQuizId(e.target.value)}
                                    className={styles.select}
                                    required
                                >
                                    <option value="">Choose quiz...</option>
                                    {quizzes.filter(q => q.status === "published").map(q => (
                                        <option key={q.id} value={q.id}>{q.title}</option>
                                    ))}
                                </select>
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
                                <select value={assignLimit} onChange={(e) => setAssignLimit(e.target.value)} className={styles.select}>
                                    <option value="">Use Quiz Defaults</option>
                                    <option value="1">1 Attempt Only</option>
                                    <option value="2">2 Attempts</option>
                                    <option value="3">3 Attempts</option>
                                    <option value="5">5 Attempts</option>
                                </select>
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

            {/* DELETE ROOM CONFIRMATION */}
            {isDeleteOpen && (
                <ModalPortal onClose={() => { setIsDeleteOpen(false); setDeleteRoomNameInput(""); }}>
                <div 
                    className={styles.modalOverlay}
                    onClick={() => { setIsDeleteOpen(false); setDeleteRoomNameInput(""); }} // Close on outside click
                >
                    <div 
                        className={styles.deleteModal} 
                        ref={deleteModalRef}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                    >
                        <div className={styles.deleteIconCircle}>
                            <FiTrash2 />
                        </div>
                        <h3>Delete classroom "{room.name}"?</h3>
                        <p className={styles.modalWarningText}>
                            Students will be notified and removed immediately. Past attempt records are preserved in logs.
                        </p>

                        <div className={styles.confirmInputGroup}>
                            <label className={styles.confirmLabel}>Type the room name to confirm:</label>
                            <input 
                                type="text"
                                value={deleteRoomNameInput}
                                onChange={(e) => setDeleteRoomNameInput(e.target.value)}
                                placeholder={room.name}
                                className={styles.confirmInput}
                            />
                        </div>

                        <div className={styles.modalButtons}>
                            <MainButton onClick={() => { setIsDeleteOpen(false); setDeleteRoomNameInput(""); }} variant="secondary">
                                Cancel
                            </MainButton>
                            <MainButton 
                                onClick={handleDeleteRoom} 
                                variant="danger"
                                disabled={deleteRoomNameInput !== room.name}
                            >
                                Delete Room
                            </MainButton>
                        </div>
                    </div>
                </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default RoomDetail;
