// local components
import PageHeader from "../components/PageHeader";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./Rooms.module.css";

// react
import { useState, useEffect, useRef } from "react";

// react-router
import { useNavigate } from "react-router";

// redux
import { useDispatch, useSelector } from "react-redux";
import { 
    fetchMyRooms, 
    selectMyRooms, 
    createRoomThunk, 
    updateRoomThunk, 
    deleteRoomThunk,
    fetchRoomMembers,
    selectRoomMembers
} from "../../../redux/slices/roomsSlice";

// hooks
import { useRealtimeRooms } from "../../../hooks/useRealtimeRooms";

// gsap
import { gsap } from "gsap";

// react-icons
import * as Icons from "react-icons/fi";
import { 
    FiPlus, 
    FiMoreVertical, 
    FiEdit2, 
    FiTrash2, 
    FiInbox, 
    FiBook, 
    FiUsers, 
    FiX 
} from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

// Material UI
import { Avatar, AvatarGroup } from "@mui/material";

// Colors for picker
const COLOR_PRESETS = [
    "#3B82F6", // Blue
    "#8B5CF6", // Purple
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#EC4899", // Pink
    "#14B8A6", // Teal
    "#6366F1"  // Indigo
];

// Icons for picker
const ICON_OPTIONS = [
    { name: "FiBook", comp: <FiBook /> },
    { name: "FiCode", comp: <Icons.FiCode /> },
    { name: "FiCpu", comp: <Icons.FiCpu /> },
    { name: "FiGlobe", comp: <Icons.FiGlobe /> },
    { name: "FiTerminal", comp: <Icons.FiTerminal /> },
    { name: "FiAward", comp: <Icons.FiAward /> },
    { name: "FiCompass", comp: <Icons.FiCompass /> },
    { name: "FiLayers", comp: <Icons.FiLayers /> },
    { name: "FiActivity", comp: <Icons.FiActivity /> },
    { name: "FiFeather", comp: <Icons.FiFeather /> },
    { name: "FiBriefcase", comp: <Icons.FiBriefcase /> },
    { name: "FiServer", comp: <Icons.FiServer /> }
];

const Rooms = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux selectors
    const rooms = useSelector(selectMyRooms);

    // Real-time synchronization
    useRealtimeRooms();

    // Local States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null); // active room for edit modal
    const [deletingRoom, setDeletingRoom] = useState(null); // active room for delete modal
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Form inputs (Create / Edit)
    const [roomName, setRoomName] = useState("");
    const [roomDescription, setRoomDescription] = useState("");
    const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
    const [selectedIcon, setSelectedIcon] = useState("FiBook");

    // Delete confirmation text state
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    // Avatar map state to store fetched student profiles per room
    const [roomAvatars, setRoomAvatars] = useState({});

    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const modalRef = useRef(null);
    const deleteModalRef = useRef(null);

    // Initial load
    useEffect(() => {
        dispatch(fetchMyRooms());
    }, [dispatch]);

    // Fetch student avatars for each room once list loads
    useEffect(() => {
        if (rooms.length > 0) {
            rooms.forEach(async (r) => {
                const { data } = await supabase
                    .from("room_members")
                    .select("joined_at, profile:profiles!uid(uid, full_name, avatar_url)")
                    .eq("room_id", r.id)
                    .limit(5);
                if (data) {
                    setRoomAvatars(prev => ({
                        ...prev,
                        [r.id]: data.map(m => m.profile)
                    }));
                }
            });
        }
    }, [rooms]);

    // GSAP animations
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(containerRef.current,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
            );

            gsap.fromTo(`.${styles.roomCard}`,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }
            );
        }, containerRef);
        return () => ctx.revert();
    }, [rooms]);

    // Dropdown close listener
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (activeDropdown !== null && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activeDropdown]);

    const openCreateModal = () => {
        setRoomName("");
        setRoomDescription("");
        setSelectedColor(COLOR_PRESETS[0]);
        setSelectedIcon("FiBook");
        setIsCreateModalOpen(true);
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!roomName.trim()) {
            toast.error("Room Name is required");
            return;
        }

        try {
            await dispatch(createRoomThunk({
                name: roomName,
                description: roomDescription,
                color: selectedColor,
                icon: selectedIcon
            })).unwrap();

            toast.success(`Classroom "${roomName}" created successfully!`);
            setIsCreateModalOpen(false);
        } catch (err) {
            toast.error(err || "Failed to create room");
        }
    };

    const openEditModal = (room) => {
        setEditingRoom(room);
        setRoomName(room.name || "");
        setRoomDescription(room.description || "");
        setSelectedColor(room.color || COLOR_PRESETS[0]);
        setSelectedIcon(room.icon || "FiBook");
        setActiveDropdown(null);
    };

    const handleEditRoom = async (e) => {
        e.preventDefault();
        if (!roomName.trim()) {
            toast.error("Room Name is required");
            return;
        }

        try {
            await dispatch(updateRoomThunk({
                id: editingRoom.id,
                name: roomName,
                description: roomDescription,
                color: selectedColor,
                icon: selectedIcon
            })).unwrap();

            toast.success(`Classroom updated successfully!`);
            setEditingRoom(null);
        } catch (err) {
            toast.error(err || "Failed to update room");
        }
    };

    const handleDeleteRoom = async () => {
        if (!deletingRoom || deleteConfirmText !== deletingRoom.name) {
            toast.error("Verification name does not match");
            return;
        }

        try {
            await dispatch(deleteRoomThunk(deletingRoom.id)).unwrap();
            toast.success(`Deleted classroom "${deletingRoom.name}" successfully!`);
            setDeletingRoom(null);
            setDeleteConfirmText("");
        } catch (err) {
            toast.error(err || "Failed to delete room");
        }
    };

    const renderIcon = (iconName) => {
        const found = ICON_OPTIONS.find(i => i.name === iconName);
        return found ? found.comp : <FiBook />;
    };

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Page Header */}
            <PageHeader 
                title="Classrooms"
                subtitle={`Create organized student pools and assign quizzes to rooms. Total: ${rooms.length} rooms`}
                breadcrumbs={["Rooms"]}
                actions={
                    <MainButton onClick={openCreateModal} variant="primary">
                        <FiPlus /> Create Room
                    </MainButton>
                }
            />

            {/* Rooms Grid */}
            {rooms.length > 0 ? (
                <div className={styles.grid}>
                    {rooms.map(room => (
                        <div key={room.id} className={styles.roomCard}>
                            {/* Color Accent Indicator */}
                            <div className={styles.cardAccent} style={{ backgroundColor: room.color }} />
                            
                            <div className={styles.cardContent}>
                                {/* Header */}
                                <div className={styles.cardHeader}>
                                    <div className={styles.iconBox} style={{ color: room.color, backgroundColor: `${room.color}15` }}>
                                        {renderIcon(room.icon)}
                                    </div>
                                    
                                    <div className={styles.dropdownContainer}>
                                        <button 
                                            className={styles.moreBtn}
                                            onClick={() => setActiveDropdown(activeDropdown === room.id ? null : room.id)}
                                        >
                                            <FiMoreVertical />
                                        </button>

                                        {activeDropdown === room.id && (
                                            <div className={styles.dropdown} ref={dropdownRef}>
                                                <button onClick={() => openEditModal(room)} className={styles.dropdownItem}>
                                                    <FiEdit2 /> Edit Room
                                                </button>
                                                <div className={styles.dropdownDivider} />
                                                <button onClick={() => { setDeletingRoom(room); setActiveDropdown(null); }} className={`${styles.dropdownItem} ${styles.danger}`}>
                                                    <FiTrash2 /> Delete Room
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Room Details */}
                                <h3 className={styles.roomName}>{room.name}</h3>
                                <p className={styles.roomDesc}>{room.description || "No description set for this classroom."}</p>

                                {/* Counts */}
                                <div className={styles.counters}>
                                    <div className={styles.counter}>
                                        <strong>{room.member_count || 0}</strong>
                                        <span>Students</span>
                                    </div>
                                    <div className={styles.counterLine} />
                                    <div className={styles.counter}>
                                        <strong>Active</strong>
                                        <span>Status</span>
                                    </div>
                                </div>

                                {/* Stacked Avatars */}
                                <div className={styles.avatarsRow}>
                                    <AvatarGroup max={4} className={styles.avatarGroup}>
                                        {(roomAvatars[room.id] || []).map((prof) => (
                                            <Avatar 
                                                key={prof.uid} 
                                                src={prof.avatar_url} 
                                                alt={prof.full_name}
                                                title={prof.full_name}
                                                sx={{ width: 28, height: 28, fontSize: "11px", fontWeight: "bold" }}
                                            >
                                                {prof.full_name?.charAt(0)}
                                            </Avatar>
                                        ))}
                                    </AvatarGroup>
                                </div>

                                <div className={styles.divider} />

                                {/* Manage CTA */}
                                <MainButton onClick={() => navigate(`/instructor/rooms/${room.id}`)} variant="outline" className={styles.manageBtn}>
                                    Manage Classroom
                                </MainButton>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <FiInbox />
                    </div>
                    <h2>No rooms created yet</h2>
                    <p>Rooms let you pool collections of students together. Once created, you can assign quizzes and review collective performance charts.</p>
                    <MainButton onClick={openCreateModal} variant="primary" size="md">
                        + Create your first room
                    </MainButton>
                </div>
            )}

            {/* CREATE / EDIT ROOM MODAL */}
            {(isCreateModalOpen || editingRoom) && (
                <div 
                    className={styles.modalOverlay}
                    onClick={() => { setIsCreateModalOpen(false); setEditingRoom(null); }} // Close on outside click
                >
                    <form 
                        className={styles.modal} 
                        ref={modalRef}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                        onSubmit={editingRoom ? handleEditRoom : handleCreateRoom}
                    >
                        <div className={styles.modalHeader}>
                            <h3>{editingRoom ? "Edit Classroom details" : "Create Classroom Room"}</h3>
                            <button type="button" className={styles.closeBtn} onClick={() => { setIsCreateModalOpen(false); setEditingRoom(null); }}>
                                <FiX />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Room Name */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Room Name <span className={styles.req}>*</span></label>
                                <input 
                                    type="text" 
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    placeholder="e.g. Computer Science 101"
                                    className={styles.input}
                                    maxLength={100}
                                    required
                                />
                            </div>

                            {/* Room Description */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Description</label>
                                <textarea 
                                    value={roomDescription}
                                    onChange={(e) => setRoomDescription(e.target.value)}
                                    placeholder="Brief details about the syllabus or students..."
                                    rows={3}
                                    className={styles.textarea}
                                />
                            </div>

                            {/* Color Selector preset swatches */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Accent Theme Color</label>
                                <div className={styles.colorPalette}>
                                    {COLOR_PRESETS.map((color) => (
                                        <div 
                                            key={color} 
                                            className={`${styles.colorSwatch} ${selectedColor === color ? styles.colorSwatchActive : ""}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setSelectedColor(color)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Icon Picker grid */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Classroom Icon symbol</label>
                                <div className={styles.iconGrid}>
                                    {ICON_OPTIONS.map((item) => (
                                        <div 
                                            key={item.name}
                                            className={`${styles.iconItem} ${selectedIcon === item.name ? styles.iconItemActive : ""}`}
                                            onClick={() => setSelectedIcon(item.name)}
                                            style={{ color: selectedIcon === item.name ? selectedColor : undefined }}
                                        >
                                            {item.comp}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <MainButton onClick={() => { setIsCreateModalOpen(false); setEditingRoom(null); }} variant="secondary">
                                Cancel
                            </MainButton>
                            <MainButton type="submit" variant="primary">
                                {editingRoom ? "Save Changes" : "Create Room"}
                            </MainButton>
                        </div>
                    </form>
                </div>
            )}

            {/* DELETE ROOM MODAL */}
            {deletingRoom && (
                <div 
                    className={styles.modalOverlay}
                    onClick={() => { setDeletingRoom(null); setDeleteConfirmText(""); }} // Close on outside click
                >
                    <div 
                        className={styles.deleteModal} 
                        ref={deleteModalRef}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                    >
                        <div className={styles.deleteIconCircle}>
                            <FiTrash2 />
                        </div>
                        <h3>Delete classroom "{deletingRoom.name}"?</h3>
                        <p className={styles.modalWarningText}>
                            All student memberships will be deleted and removed from this classroom layout. Students lose access to assigned quizzes in this room. Past attempt records are preserved.
                        </p>
                        
                        <div className={styles.confirmInputGroup}>
                            <label className={styles.confirmLabel}>Type the room name to confirm:</label>
                            <input 
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder={deletingRoom.name}
                                className={styles.confirmInput}
                            />
                        </div>

                        <div className={styles.modalButtons}>
                            <MainButton onClick={() => { setDeletingRoom(null); setDeleteConfirmText(""); }} variant="secondary">
                                Cancel
                            </MainButton>
                            <MainButton 
                                onClick={handleDeleteRoom} 
                                variant="danger"
                                disabled={deleteConfirmText !== deletingRoom.name}
                            >
                                Delete Classroom
                            </MainButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rooms;
