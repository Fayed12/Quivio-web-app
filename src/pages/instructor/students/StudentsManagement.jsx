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
    createStudentThunk,
    bulkCreateThunk,
    resendCredentialsThunk,
    deleteStudentThunk
} from "../../../redux/slices/instructorStudentsSlice";
import { fetchMyRooms, selectMyRooms } from "../../../redux/slices/roomsSlice";

// animation
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";
import ModalPortal from "../components/ModalPortal";

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
    FiAward, 
    FiActivity,
    FiDownload
} from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

// sweetalert2
import Swal from "sweetalert2";

// custom select
import CustomSelect from "../../../components/ui/select/CustomSelect";

// Material UI
import { Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

// supabase client
import { supabase } from "../../../services/config/supabaseClient";

import { useStudentsData } from "../../../hooks/instructor/useStudentsData";

// gsap
import gsap from "gsap";

const StudentsManagement = () => {
    const dispatch = useDispatch();

    // Redux selectors using custom data hook
    const { students } = useStudentsData();
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
    const [isImporting, setIsImporting] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const containerRef = useRef(null);
    const sidePanelRef = useRef(null);
    const dropdownRef = useRef(null);
    const createModalRef = useRef(null);
    const fileInputRef = useRef(null);

    // Fetch rooms (students are fetched inside hook)
    useEffect(() => {
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

    // Page entrance animation
    usePageAnimation(containerRef);

    // GSAP animation for slide-in side panel
    useEffect(() => {
        if (selectedStudent && sidePanelRef.current) {
            const rafId = requestAnimationFrame(() => {
                gsap.fromTo(sidePanelRef.current,
                    { x: "100%", opacity: 0 },
                    { x: "0%", opacity: 1, duration: 0.4, ease: "power3.out" }
                );
            });
            return () => cancelAnimationFrame(rafId);
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
                full_name: fullName,
                student_code: studentId,
                email,
                room_id: assignRoomId || null
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
    const handleResendCredentials = (student) => {
        const isDark = document.documentElement.classList.contains("dark");
        Swal.fire({
            title: `Resend credentials to "${student.profile?.full_name}"?`,
            text: `This triggers a credential dispatch notification containing a fresh auto-signed token link. The email will be sent to ${student.profile?.email}.`,
            icon: "info",
            background: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            showCancelButton: true,
            confirmButtonText: "Resend",
            cancelButtonText: "Cancel",
            confirmButtonColor: "var(--color-accent, #2563eb)",
            cancelButtonColor: isDark ? "#475569" : "#94a3b8",
            customClass: {
                popup: "premium-swal-popup"
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await dispatch(resendCredentialsThunk(student.student_uid)).unwrap();
                    toast.success(`Login credentials resent to ${student.profile?.email}!`);
                } catch (err) {
                    toast.error(err || "Failed to resend credentials");
                }
            }
        });
    };

    // Toggle active / deactivate account status
    const handleToggleStudentActive = (student) => {
        const isDark = document.documentElement.classList.contains("dark");
        const isActive = student.profile?.is_active;
        Swal.fire({
            title: `${isActive ? "Deactivate" : "Activate"} "${student.profile?.full_name}"?`,
            text: isActive 
                ? "Deactivating students immediately logs them out and prevents further dashboard sign-ins until reactivated." 
                : "Activating students restores access and permits dashboard sign-ins immediately.",
            icon: "warning",
            background: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            showCancelButton: true,
            confirmButtonText: "Confirm",
            cancelButtonText: "Cancel",
            confirmButtonColor: "var(--color-accent, #2563eb)",
            cancelButtonColor: isDark ? "#475569" : "#94a3b8",
            customClass: {
                popup: "premium-swal-popup"
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const newStatus = !isActive;
                try {
                    const { error } = await supabase
                        .from("profiles")
                        .update({ is_active: newStatus })
                        .eq("uid", student.student_uid);

                    if (error) throw error;

                    toast.success(`Account for ${student.profile?.full_name} is now ${newStatus ? "Active" : "Inactive"}`);
                    dispatch(fetchMyStudents());
                } catch (err) {
                    toast.error(err.message || "Failed to update profile status");
                }
            }
        });
    };

    // Delete Student
    const handleDeleteStudent = (student) => {
        const isDark = document.documentElement.classList.contains("dark");
        Swal.fire({
            title: `Delete Student "${student.profile?.full_name}"?`,
            html: `
                <div style="text-align: left; font-family: var(--font-sans, sans-serif);">
                    <p style="color: ${isDark ? "#94a3b8" : "#475569"}; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1rem;">
                        Permanently deletes student Supabase Auth accounts. All attempts, achievements, scores, and PDF certificates will be destroyed.
                    </p>
                    <label style="font-weight: 600; font-size: 0.8125rem; display: block; margin-bottom: 0.5rem; color: ${isDark ? "#f8fafc" : "#0f172a"};">
                        Type the student full name to confirm:
                    </label>
                </div>
            `,
            input: "text",
            inputPlaceholder: student.profile?.full_name,
            inputAttributes: {
                autocapitalize: "off",
                autocorrect: "off"
            },
            background: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            showCancelButton: true,
            confirmButtonText: "Delete Student",
            cancelButtonText: "Cancel",
            confirmButtonColor: "var(--color-danger, #ef4444)",
            cancelButtonColor: isDark ? "#475569" : "#94a3b8",
            buttonsStyling: true,
            customClass: {
                popup: "premium-swal-popup",
                input: "premium-swal-input"
            },
            preConfirm: (inputValue) => {
                if (inputValue !== student.profile?.full_name) {
                    Swal.showValidationMessage("Student name does not match");
                    return false;
                }
                return true;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await dispatch(deleteStudentThunk(student.student_uid)).unwrap();
                    toast.success(`Permanently deleted student "${student.profile?.full_name}" records!`);
                    dispatch(fetchMyStudents());
                } catch (err) {
                    toast.error(err || "Failed to delete student");
                }
            }
        });
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

        setIsImporting(true);
        try {
            // Bulk insert thunk
            const payload = validRows.map(r => ({
                full_name: r.full_name,
                student_code: r.student_id,
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
        } finally {
            setIsImporting(false);
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

    // Reset pagination to page 1 on filter changes during render to avoid cascading renders
    const filterKey = `${searchQuery}_${roomFilter}_${statusFilter}_${sortOption}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (filterKey !== prevFilterKey) {
        setPrevFilterKey(filterKey);
        setCurrentPage(1);
    }

    // Pagination slices
    const totalRows = sortedStudents.length;
    const totalPages = Math.ceil(totalRows / pageSize);
    const paginatedStudents = sortedStudents.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );
    const startRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRow = Math.min(currentPage * pageSize, totalRows);

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
                        <MainButton onClick={handleDownloadTemplate} variant="secondary">
                            <FiDownload /> Template
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
                    <CustomSelect
                        options={[
                            { value: "all", label: "All Rooms" },
                            ...rooms.map(r => ({ value: r.id, label: r.name }))
                        ]}
                        value={roomFilter}
                        onChange={setRoomFilter}
                        className={styles.select}
                    />

                    <CustomSelect
                        options={[
                            { value: "all", label: "All Statuses" },
                            { value: "active", label: "Active" },
                            { value: "inactive", label: "Inactive" }
                        ]}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        className={styles.select}
                    />

                    <CustomSelect
                        options={[
                            { value: "name_az", label: "Name: A-Z" },
                            { value: "name_za", label: "Name: Z-A" },
                            { value: "date_newest", label: "Newest Added" }
                        ]}
                        value={sortOption}
                        onChange={setSortOption}
                        className={styles.select}
                    />
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
                        {paginatedStudents.map((s) => (
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
                                <TableCell align="center" className={styles.tdCell} style={{ position: "relative", zIndex: activeDropdown === s.student_uid ? 100 : 1 }}>
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
                                                    <button onClick={() => { handleResendCredentials(s); setActiveDropdown(null); }} className={styles.dropdownItem}>
                                                        <FiKey /> Resend Credentials
                                                    </button>
                                                    <button onClick={() => { handleToggleStudentActive(s); setActiveDropdown(null); }} className={styles.dropdownItem}>
                                                        {s.profile?.is_active ? <FiUserX /> : <FiUserCheck />} {s.profile?.is_active ? "Deactivate" : "Activate"}
                                                    </button>
                                                    <div className={styles.dropdownDivider} />
                                                    <button onClick={() => { handleDeleteStudent(s); setActiveDropdown(null); }} className={`${styles.dropdownItem} ${styles.danger}`}>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
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

            {/* SIDE DETAIL SLIDE-IN PANEL */}
            {selectedStudent && (
                <ModalPortal onClose={() => setSelectedStudent(null)}>
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
                </ModalPortal>
            )}

            {/* CREATE STUDENT MODAL */}
            {isCreateOpen && (
                <ModalPortal onClose={() => setIsCreateOpen(false)}>
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
                                <CustomSelect
                                    options={[
                                        { value: "", label: "Select Room..." },
                                        ...rooms.map(r => ({ value: r.id, label: r.name }))
                                    ]}
                                    value={assignRoomId}
                                    onChange={setAssignRoomId}
                                    placeholder="Select Room..."
                                />
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
                </ModalPortal>
            )}

            {/* BULK IMPORT STUDENTS */}
            {isImportOpen && (
                <ModalPortal onClose={() => !isImporting && setIsImportOpen(false)}>
                <div 
                    className={styles.modalOverlay}
                    onClick={() => !isImporting && setIsImportOpen(false)} // Close on outside click
                >
                    <div 
                        className={styles.csvModal}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                    >
                        <div className={styles.modalHeader}>
                            <h3>Bulk Import Students CSV</h3>
                            <button type="button" className={styles.closeBtn} onClick={() => !isImporting && setIsImportOpen(false)} disabled={isImporting}>
                                <FiX />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Upload Zone */}
                            <div 
                                className={styles.csvUploadZone} 
                                onClick={() => !isImporting && fileInputRef.current.click()}
                                style={{ pointerEvents: isImporting ? 'none' : 'auto', opacity: isImporting ? 0.6 : 1 }}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className={styles.fileInput} 
                                    onChange={handleCsvUpload} 
                                    accept=".csv"
                                    disabled={isImporting}
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
                            <MainButton onClick={() => setIsImportOpen(false)} variant="secondary" disabled={isImporting}>
                                Cancel
                            </MainButton>
                            <MainButton 
                                onClick={handleImportCSVData} 
                                variant="primary" 
                                disabled={csvValidCount === 0 || isImporting}
                                isLoading={isImporting}
                            >
                                {isImporting ? "Importing..." : `Import ${csvValidCount} Students`}
                            </MainButton>
                        </div>
                    </div>
                </div>
                </ModalPortal>
            )}

        </div>
    );
};

export default StudentsManagement;
