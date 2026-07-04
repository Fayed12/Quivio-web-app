// local components
import PageHeader from "../components/PageHeader";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./StudentsManagement.module.css";

// react
import { useState, useEffect, useRef } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";
import { 
    fetchMyStudents, 
    selectMyStudents, 
    selectStudentCount, 
    createStudentThunk,
    bulkCreateThunk,
    resendCredentialsThunk,
    deleteStudentThunk
} from "../../../redux/slices/instructorStudentsSlice";
import { fetchMyRooms, selectMyRooms } from "../../../redux/slices/roomsSlice";

// gsap
import { gsap } from "gsap";

// react-icons
import { 
    FiPlus, 
    FiUpload, 
    FiSearch, 
    FiX, 
    FiMoreVertical, 
    FiEye, 
    FiKey, 
    FiUserX, 
    FiUserCheck,
    FiTrash2, 
    FiCalendar, 
    FiBriefcase, 
    FiAward, 
    FiActivity, 
    FiFileText,
    FiDownload,
    FiInfo
} from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

// Material UI
import { Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

// supabase client
import { supabase } from "../../../services/config/supabaseClient";

const StudentsManagement = () => {
    const dispatch = useDispatch();

    // Redux selectors
    const students = useSelector(selectMyStudents);
    const rooms = useSelector(selectMyRooms);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [roomFilter, setRoomFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortOption, setSortOption] = useState("name_az");

    // Modal togglers
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null); // side panel student object
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Confirm modals
    const [resendCredsStudent, setResendCredsStudent] = useState(null);
    const [toggleActiveStudent, setToggleActiveStudent] = useState(null);
    const [deleteStudent, setDeleteStudent] = useState(null);
    const [deleteVerifyName, setDeleteVerifyName] = useState("");

    // Create student form states
    const [fullName, setFullName] = useState("");
    const [studentId, setStudentId] = useState("");
    const [email, setEmail] = useState("");
    const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);
    const [assignRoomId, setAssignRoomId] = useState("");

    // CSV Bulk Importer states
    const [csvPreview, setCsvPreview] = useState([]);
    const [csvFile, setCsvFile] = useState(null);
    const [csvValidCount, setCsvValidCount] = useState(0);
    const [csvErrorsCount, setCsvErrorsCount] = useState(0);

    const containerRef = useRef(null);
    const sidePanelRef = useRef(null);
    const dropdownRef = useRef(null);
    const createModalRef = useRef(null);
    const importModalRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initial load
    useEffect(() => {
        dispatch(fetchMyStudents());
        dispatch(fetchMyRooms());
    }, [dispatch]);

    // Handle clicks outside active dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (activeDropdown !== null && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activeDropdown]);

    // GSAP animations for page
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(containerRef.current,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
            );
        }, containerRef);
        return () => ctx.revert();
    }, [students]);

    // GSAP animation for slide-in side panel
    useEffect(() => {
        if (selectedStudent) {
            gsap.fromTo(sidePanelRef.current,
                { x: "100%", opacity: 0 },
                { x: "0%", opacity: 1, duration: 0.4, ease: "power3.out" }
            );
        }
    }, [selectedStudent]);

    // Add student handler
    const handleCreateStudent = async (e) => {
        e.preventDefault();
        if (!fullName.trim() || !studentId.trim() || !email.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            await dispatch(createStudentThunk({
                fullName,
                studentCode: studentId,
                email,
                roomId: assignRoomId || null
            })).unwrap();

            toast.success(`Student "${fullName}" account created successfully! Credentials sent to email.`);
            setIsCreateOpen(false);
            setFullName("");
            setStudentId("");
            setEmail("");
            setAssignRoomId("");
            dispatch(fetchMyStudents());
        } catch (err) {
            toast.error(err || "Failed to create student profile");
        }
    };

    // Resend login credentials
    const handleResendCredentials = async () => {
        if (!resendCredsStudent) return;
        try {
            await dispatch(resendCredentialsThunk(resendCredsStudent.student_uid)).unwrap();
            toast.success(`Login credentials resent to ${resendCredsStudent.profile?.email}!`);
            setResendCredsStudent(null);
        } catch (err) {
            toast.error(err || "Failed to resend credentials");
        }
    };

    // Toggle active / deactivate account status
    const handleToggleStudentActive = async () => {
        if (!toggleActiveStudent) return;
        const newStatus = !toggleActiveStudent.profile?.is_active;
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ is_active: newStatus })
                .eq("uid", toggleActiveStudent.student_uid);

            if (error) throw error;

            toast.success(`Account for ${toggleActiveStudent.profile?.full_name} is now ${newStatus ? "Active" : "Inactive"}`);
            setToggleActiveStudent(null);
            dispatch(fetchMyStudents());
        } catch (err) {
            toast.error(err.message || "Failed to update profile status");
        }
    };

    // Delete Student
    const handleDeleteStudent = async () => {
        if (!deleteStudent || deleteVerifyName !== deleteStudent.profile?.full_name) {
            toast.error("Verification name does not match");
            return;
        }

        try {
            await dispatch(deleteStudentThunk(deleteStudent.student_uid)).unwrap();
            toast.success(`Permanently deleted student "${deleteStudent.profile?.full_name}" records!`);
            setDeleteStudent(null);
            setDeleteVerifyName("");
            dispatch(fetchMyStudents());
        } catch (err) {
            toast.error(err || "Failed to delete student");
        }
    };

    // CSV parser logic
    const handleCsvUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCsvFile(file);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
            if (lines.length <= 1) {
                toast.error("CSV file is empty");
                return;
            }

            const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
            const rows = [];
            let valids = 0;
            let errors = 0;

            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(",").map(c => c.trim());
                const rData = {};
                headers.forEach((h, idx) => {
                    rData[h] = cols[idx] || "";
                });

                const rErrs = [];
                if (!rData.full_name) rErrs.push("Missing full_name");
                if (!rData.student_id) rErrs.push("Missing student_id");
                if (!rData.email || !rData.email.includes("@")) rErrs.push("Invalid email");

                if (rErrs.length > 0) {
                    errors++;
                    rData.isValid = false;
                    rData.errorMsg = rErrs.join(", ");
                } else {
                    valids++;
                    rData.isValid = true;
                }
                rows.push(rData);
            }

            setCsvPreview(rows);
            setCsvValidCount(valids);
            setCsvErrorsCount(errors);
        };
        reader.readAsText(file);
    };

    const handleImportCSVData = async () => {
        const validRows = csvPreview.filter(r => r.isValid);
        if (validRows.length === 0) return;

        try {
            // Bulk insert thunk
            const payload = validRows.map(r => ({
                fullName: r.full_name,
                studentCode: r.student_id,
                email: r.email
            }));

            await dispatch(bulkCreateThunk(payload)).unwrap();
            toast.success(`Successfully queued bulk import for ${validRows.length} students!`);
            setIsImportOpen(false);
            setCsvPreview([]);
            setCsvFile(null);
            dispatch(fetchMyStudents());
        } catch (err) {
            toast.error(err || "Failed to bulk import students");
        }
    };

    const handleDownloadTemplate = () => {
        const data = "student_id,full_name,email\nSTU-001,Ahmed Samir,ahmed@email.com\nSTU-002,Sara Mohamed,sara@email.com\n";
        const blob = new Blob([data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "quivio_students_template.csv";
        link.click();
    };

    // Filter & Sort
    const filteredStudents = students.filter(s => {
        const name = s.profile?.full_name || "";
        const emailAddr = s.profile?.email || "";
        const code = s.student_code || "";

        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             emailAddr.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             code.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || 
                              (statusFilter === "active" && s.profile?.is_active) || 
                              (statusFilter === "inactive" && !s.profile?.is_active);

        // Filter by Room requires querying database membership or checking local memberships
        // (Mock or let matchesRoom be true if room filter is "all")
        const matchesRoom = roomFilter === "all"; 

        return matchesSearch && matchesStatus && matchesRoom;
    });

    const sortedStudents = [...filteredStudents].sort((a, b) => {
        if (sortOption === "name_az") return (a.profile?.full_name || "").localeCompare(b.profile?.full_name || "");
        if (sortOption === "name_za") return (b.profile?.full_name || "").localeCompare(a.profile?.full_name || "");
        if (sortOption === "date_newest") return new Date(b.created_at) - new Date(a.created_at);
        return 0;
    });

    // Count states
    const activeCount = students.filter(s => s.profile?.is_active).length;
    const inactiveCount = students.length - activeCount;

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Header */}
            <PageHeader 
                title="Student Management"
                subtitle={`Create, credential-provision, and monitor student accounts. Total: ${students.length}`}
                breadcrumbs={["Students"]}
                actions={
                    <div className={styles.headerActions}>
                        <MainButton onClick={() => setIsCreateOpen(true)} variant="primary">
                            <FiPlus /> Create Student
                        </MainButton>
                        <MainButton onClick={() => setIsImportOpen(true)} variant="outline">
                            <FiUpload /> Bulk Import
                        </MainButton>
                    </div>
                }
            />

            {/* Performance Indicators */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <strong>{students.length}</strong>
                    <span>Total Students</span>
                </div>
                <div className={styles.statCard}>
                    <strong style={{color: "var(--color-success)"}}>{activeCount}</strong>
                    <span>Active Accounts</span>
                </div>
                <div className={styles.statCard}>
                    <strong style={{color: "var(--color-danger)"}}>{inactiveCount}</strong>
                    <span>Inactive Accounts</span>
                </div>
                <div className={styles.statCard}>
                    <strong>82%</strong>
                    <span>Avg. Class Score</span>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    <FiSearch className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Search by student name, email, or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && <FiX className={styles.clearIcon} onClick={() => setSearchQuery("")} />}
                </div>

                <div className={styles.filtersGrid}>
                    <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} className={styles.select}>
                        <option value="all">All Rooms</option>
                        {rooms.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.select}>
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className={styles.select}>
                        <option value="name_az">Name: A-Z</option>
                        <option value="name_za">Name: Z-A</option>
                        <option value="date_newest">Newest Added</option>
                    </select>
                </div>
            </div>

            {/* Students Table */}
            <TableContainer component={Paper} className={styles.tableContainer} elevation={0}>
                <Table size="medium">
                    <TableHead className={styles.tableHead}>
                        <TableRow>
                            <TableCell className={styles.thCell}>Full Name</TableCell>
                            <TableCell className={styles.thCell}>Student ID</TableCell>
                            <TableCell className={styles.thCell}>Email Address</TableCell>
                            <TableCell className={styles.thCell} align="center">Avg. Score</TableCell>
                            <TableCell className={styles.thCell} align="center">Status</TableCell>
                            <TableCell className={styles.thCell} align="center">Last Active</TableCell>
                            <TableCell className={styles.thCell} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedStudents.map((s) => (
                            <TableRow key={s.student_uid} className={styles.tableRow}>
                                <TableCell className={styles.tdCell}>
                                    <div className={styles.studentNameCol}>
                                        <Avatar src={s.profile?.avatar_url} sx={{ width: 32, height: 32 }}>
                                            {s.profile?.full_name?.charAt(0)}
                                        </Avatar>
                                        <div>
                                            <div className={styles.nameText}>{s.profile?.full_name}</div>
                                            <div className={styles.createdText}>Added {new Date(s.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className={styles.tdCell} style={{fontWeight: 600}}>{s.student_code}</TableCell>
                                <TableCell className={styles.tdCell}>{s.profile?.email}</TableCell>
                                <TableCell align="center" className={styles.tdCell} style={{fontWeight: 700}}>82%</TableCell>
                                <TableCell align="center" className={styles.tdCell}>
                                    <span className={`${styles.statusBadge} ${s.profile?.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                                        {s.profile?.is_active ? "Active" : "Inactive"}
                                    </span>
                                </TableCell>
                                <TableCell align="center" className={styles.tdCell}>
                                    {s.profile?.last_activity_date ? new Date(s.profile.last_activity_date).toLocaleDateString() : "Never"}
                                </TableCell>
                                <TableCell align="center" className={styles.tdCell}>
                                    <div className={styles.actions}>
                                        <button className={styles.actionBtn} onClick={() => setSelectedStudent(s)} title="View Profile">
                                            <FiEye />
                                        </button>
                                        
                                        <div className={styles.dropdownContainer}>
                                            <button 
                                                className={styles.moreBtn}
                                                onClick={() => setActiveDropdown(activeDropdown === s.student_uid ? null : s.student_uid)}
                                            >
                                                <FiMoreVertical />
                                            </button>

                                            {activeDropdown === s.student_uid && (
                                                <div className={styles.dropdown} ref={dropdownRef}>
                                                    <button onClick={() => { setResendCredsStudent(s); setActiveDropdown(null); }} className={styles.dropdownItem}>
                                                        <FiKey /> Resend Credentials
                                                    </button>
                                                    <button onClick={() => { setToggleActiveStudent(s); setActiveDropdown(null); }} className={styles.dropdownItem}>
                                                        {s.profile?.is_active ? <FiUserX /> : <FiUserCheck />} {s.profile?.is_active ? "Deactivate" : "Activate"}
                                                    </button>
                                                    <div className={styles.dropdownDivider} />
                                                    <button onClick={() => { setDeleteStudent(s); setActiveDropdown(null); }} className={`${styles.dropdownItem} ${styles.danger}`}>
                                                        <FiTrash2 /> Delete Student
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {sortedStudents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" className={styles.emptyCell}>
                                    No students registered matching filters. Click "+ Create Student" to add!
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* SIDE DETAIL SLIDE-IN PANEL */}
            {selectedStudent && (
                <>
                    {/* Backdrop */}
                    <div className={styles.panelBackdrop} onClick={() => setSelectedStudent(null)} />
                    
                    <div className={styles.sidePanel} ref={sidePanelRef}>
                        <div className={styles.panelHeader}>
                            <h3>Student Profile Details</h3>
                            <button className={styles.panelClose} onClick={() => setSelectedStudent(null)}>
                                <FiX />
                            </button>
                        </div>

                        <div className={styles.panelBody}>
                            {/* Profile Card */}
                            <div className={styles.panelProfileCard}>
                                <Avatar src={selectedStudent.profile?.avatar_url} sx={{ width: 56, height: 56 }}>
                                    {selectedStudent.profile?.full_name?.charAt(0)}
                                </Avatar>
                                <h4>{selectedStudent.profile?.full_name}</h4>
                                <span>ID: {selectedStudent.student_code}</span>
                                <span>{selectedStudent.profile?.email}</span>
                            </div>

                            {/* Mini stats */}
                            <div className={styles.miniStatsGrid}>
                                <div className={styles.miniStatCard}>
                                    <FiActivity className={styles.miniStatIcon} />
                                    <div>
                                        <strong>12</strong>
                                        <span>Attempts</span>
                                    </div>
                                </div>
                                <div className={styles.miniStatCard}>
                                    <FiAward className={styles.miniStatIcon} />
                                    <div>
                                        <strong>82%</strong>
                                        <span>Avg. Score</span>
                                    </div>
                                </div>
                            </div>

                            {/* Classrooms */}
                            <div className={styles.panelSection}>
                                <h4>Classroom Memberships</h4>
                                <div className={styles.roomsList}>
                                    <div className={styles.roomTag}>CS 101</div>
                                    <div className={styles.roomTag}>Web Design</div>
                                </div>
                            </div>

                            {/* Recent Quiz Attempts */}
                            <div className={styles.panelSection}>
                                <h4>Recent Quiz Attempts</h4>
                                <div className={styles.attemptsFeed}>
                                    <div className={styles.attemptItem}>
                                        <span>JS Scopes</span>
                                        <strong>85%</strong>
                                    </div>
                                    <div className={styles.attemptItem}>
                                        <span>HTML Layouts</span>
                                        <strong>90%</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* CREATE STUDENT MODAL */}
            {isCreateOpen && (
                <div 
                    className={styles.modalOverlay}
                    onClick={() => setIsCreateOpen(false)} // Close on outside click
                >
                    <form 
                        className={styles.modal} 
                        ref={createModalRef}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                        onSubmit={handleCreateStudent}
                    >
                        <div className={styles.modalHeader}>
                            <h3>Create New Student Account</h3>
                            <button type="button" className={styles.closeBtn} onClick={() => setIsCreateOpen(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Full name */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Full Name <span className={styles.req}>*</span></label>
                                <input 
                                    type="text" 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="e.g. Ahmed Samir"
                                    className={styles.input}
                                    required
                                />
                            </div>

                            {/* Student ID Code */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Student ID Code <span className={styles.req}>*</span></label>
                                <input 
                                    type="text" 
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    placeholder="e.g. STU-001"
                                    className={styles.input}
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email Address <span className={styles.req}>*</span></label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g. ahmed@email.com"
                                    className={styles.input}
                                    required
                                />
                            </div>

                            {/* Passwords */}
                            <div className={styles.toggleRow}>
                                <div>
                                    <label className={styles.toggleLabel}>Auto-Generate Password</label>
                                    <p className={styles.toggleDesc}>A secure credentials email will be auto-sent to student.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={autoGeneratePassword}
                                    onChange={(e) => setAutoGeneratePassword(e.target.checked)}
                                    className={styles.toggleSwitch}
                                />
                            </div>

                            {/* Room Selector */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Assign to Classroom (Optional)</label>
                                <select 
                                    value={assignRoomId} 
                                    onChange={(e) => setAssignRoomId(e.target.value)}
                                    className={styles.select}
                                >
                                    <option value="">Select Room...</option>
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <MainButton onClick={() => setIsCreateOpen(false)} variant="secondary">
                                Cancel
                            </MainButton>
                            <MainButton type="submit" variant="primary">
                                Create Student
                            </MainButton>
                        </div>
                    </form>
                </div>
            )}

            {/* BULK IMPORT STUDENTS */}
            {isImportOpen && (
                <div 
                    className={styles.modalOverlay}
                    onClick={() => setIsImportOpen(false)} // Close on outside click
                >
                    <div 
                        className={styles.csvModal}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                    >
                        <div className={styles.modalHeader}>
                            <h3>Bulk Import Students CSV</h3>
                            <button type="button" className={styles.closeBtn} onClick={() => setIsImportOpen(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Upload Zone */}
                            <div className={styles.csvUploadZone} onClick={() => fileInputRef.current.click()}>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className={styles.fileInput} 
                                    onChange={handleCsvUpload} 
                                    accept=".csv"
                                />
                                <FiUpload className={styles.csvIcon} />
                                <p>{csvFile ? csvFile.name : "Select or drag student CSV file here"}</p>
                            </div>

                            {/* Preview Table */}
                            {csvPreview.length > 0 && (
                                <div className={styles.csvPreviewWrapper}>
                                    <div className={styles.csvSummaryText}>
                                        <span className={styles.validText}>{csvValidCount} Valid Students</span> • 
                                        <span className={styles.errorText} style={{marginLeft: "5px"}}>{csvErrorsCount} Errors</span>
                                    </div>
                                    
                                    <div className={styles.csvPreviewTableScroll}>
                                        <table className={styles.csvTable}>
                                            <thead>
                                                <tr>
                                                    <th>Student ID</th>
                                                    <th>Full Name</th>
                                                    <th>Email Address</th>
                                                    <th>Validation</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {csvPreview.map((row, idx) => (
                                                    <tr key={idx} className={row.isValid ? styles.csvRowValid : styles.csvRowError}>
                                                        <td>{row.student_id}</td>
                                                        <td>{row.full_name}</td>
                                                        <td>{row.email}</td>
                                                        <td>{row.isValid ? "✓ Ready" : `✗ ${row.errorMsg}`}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <MainButton onClick={handleDownloadTemplate} variant="secondary" style={{marginRight: "auto"}}>
                                <FiDownload /> Download Template
                            </MainButton>
                            <MainButton onClick={() => setIsImportOpen(false)} variant="secondary">
                                Cancel
                            </MainButton>
                            <MainButton 
                                onClick={handleImportCSVData} 
                                variant="primary" 
                                disabled={csvValidCount === 0}
                            >
                                Import {csvValidCount} Students
                            </MainButton>
                        </div>
                    </div>
                </div>
            )}

            {/* CREDENTIALS RESEND MODAL */}
            {resendCredsStudent && (
                <div 
                    className={styles.modalOverlay}
                    onClick={() => setResendCredsStudent(null)} // Close on outside click
                >
                    <div 
                        className={styles.confirmModal}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                    >
                        <div className={styles.iconCircleBlue}>
                            <FiKey />
                        </div>
                        <h3>Resend Login Credentials to "{resendCredsStudent.profile?.full_name}"?</h3>
                        <p className={styles.modalWarningText}>
                            This triggers a credential dispatch notification containing a fresh auto-signed token link. The email will be sent to <strong>{resendCredsStudent.profile?.email}</strong>.
                        </p>
                        <div className={styles.modalButtons}>
                            <MainButton onClick={() => setResendCredsStudent(null)} variant="secondary">
                                Cancel
                            </MainButton>
                            <MainButton onClick={handleResendCredentials} variant="primary">
                                Resend Credentials
                            </MainButton>
                        </div>
                    </div>
                </div>
            )}

            {/* DEACTIVATE CONFIRM MODAL */}
            {toggleActiveStudent && (
                <div 
                    className={styles.modalOverlay}
                    onClick={() => setToggleActiveStudent(null)} // Close on outside click
                >
                    <div 
                        className={styles.confirmModal}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                    >
                        <div className={styles.iconCircleYellow}>
                            {toggleActiveStudent.profile?.is_active ? <FiUserX /> : <FiUserCheck />}
                        </div>
                        <h3>
                            {toggleActiveStudent.profile?.is_active ? "Deactivate" : "Activate"} "{toggleActiveStudent.profile?.full_name}"?
                        </h3>
                        <p className={styles.modalWarningText}>
                            {toggleActiveStudent.profile?.is_active 
                                ? "Deactivating students immediately logs them out and prevents further dashboard sign-ins until reactivated." 
                                : "Activating students restores access and permits dashboard sign-ins immediately."}
                        </p>
                        <div className={styles.modalButtons}>
                            <MainButton onClick={() => setToggleActiveStudent(null)} variant="secondary">
                                Cancel
                            </MainButton>
                            <MainButton onClick={handleToggleStudentActive} variant="primary">
                                Confirm Changes
                            </MainButton>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE STUDENT CONFIRM MODAL */}
            {deleteStudent && (
                <div 
                    className={styles.modalOverlay}
                    onClick={() => { setDeleteStudent(null); setDeleteVerifyName(""); }} // Close on outside click
                >
                    <div 
                        className={styles.deleteModal}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                    >
                        <div className={styles.deleteIconCircle}>
                            <FiTrash2 />
                        </div>
                        <h3>Delete Student "{deleteStudent.profile?.full_name}"?</h3>
                        <p className={styles.modalWarningText}>
                            Permanently deletes student Supabase Auth accounts. All attempts, achievements, scores, and PDF certificates will be destroyed.
                        </p>

                        <div className={styles.confirmInputGroup}>
                            <label className={styles.confirmLabel}>Type the student full name to confirm:</label>
                            <input 
                                type="text"
                                value={deleteVerifyName}
                                onChange={(e) => setDeleteVerifyName(e.target.value)}
                                placeholder={deleteStudent.profile?.full_name}
                                className={styles.confirmInput}
                            />
                        </div>

                        <div className={styles.modalButtons}>
                            <MainButton onClick={() => { setDeleteStudent(null); setDeleteVerifyName(""); }} variant="secondary">
                                Cancel
                            </MainButton>
                            <MainButton 
                                onClick={handleDeleteStudent} 
                                variant="danger"
                                disabled={deleteVerifyName !== deleteStudent.profile?.full_name}
                            >
                                Delete Student
                            </MainButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentsManagement;
