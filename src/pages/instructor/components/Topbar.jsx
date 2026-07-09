// react
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

// react-icons
import { 
    FiMenu, 
    FiBell, 
    FiSearch, 
    FiSun, 
    FiMoon, 
    FiChevronDown, 
    FiUser, 
    FiLogOut,
    FiX,
    FiHelpCircle,
    FiRefreshCw
} from "react-icons/fi";

// redux
import { logoutThunk, selectProfile } from "../../../redux/slices/authSlice";
import { toggleTheme, selectTheme } from "../../../redux/slices/themeSLice";
import { selectUnreadCount, fetchUnreadCount } from "../../../redux/slices/notificationsSlice";

// local
import { supabase } from "../../../services/config/supabaseClient";
import styles from "./Topbar.module.css";

const Topbar = ({ onToggleSidebar, onToggleMobileSidebar, onStartGuide }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const profile = useSelector(selectProfile);
    const theme = useSelector(selectTheme);
    const unreadCount = useSelector(selectUnreadCount);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);

    // Search states
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState({ quizzes: [], rooms: [], students: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Fetch unread notification counts
    useEffect(() => {
        dispatch(fetchUnreadCount());
    }, [dispatch]);

    // Handle Ctrl + K global keyboard shortcut to focus search input
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Handle clicks outside the dropdowns to close them
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const triggerSearch = async () => {
        const trimmed = searchQuery.trim();
        if (!trimmed) return;
        if (!profile?.uid) return;

        setIsSearching(true);
        setShowResults(true);

        try {
            // Query quizzes
            const { data: quizzes } = await supabase
                .from("quizzes")
                .select("id, title")
                .eq("instructor_uid", profile.uid)
                .ilike("title", `%${trimmed}%`)
                .limit(5);

            // Query rooms
            const { data: rooms } = await supabase
                .from("rooms")
                .select("id, name")
                .eq("instructor_uid", profile.uid)
                .is("deleted_at", null)
                .ilike("name", `%${trimmed}%`)
                .limit(5);

            // Query students
            const { data: studentRows } = await supabase
                .from("instructor_students")
                .select(`
                    student_uid,
                    profile:profiles!student_uid(uid, full_name, email, avatar_url)
                `)
                .eq("instructor_uid", profile.uid);

            const matchingStudents = (studentRows || [])
                .filter(s => {
                    if (!s.profile) return false;
                    const nameMatch = s.profile.full_name?.toLowerCase().includes(trimmed.toLowerCase());
                    const emailMatch = s.profile.email?.toLowerCase().includes(trimmed.toLowerCase());
                    return nameMatch || emailMatch;
                })
                .slice(0, 5)
                .map(s => s.profile);

            setSearchResults({
                quizzes: quizzes || [],
                rooms: rooms || [],
                students: matchingStudents || []
            });
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            triggerSearch();
        }
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setSearchResults({ quizzes: [], rooms: [], students: [] });
        setShowResults(false);
    };

    const handleThemeToggle = () => {
        dispatch(toggleTheme());
    };

    const handleLogout = () => {
        dispatch(logoutThunk());
        navigate("/login");
    };

    const getInitials = (name = "") => {
        return name.trim().charAt(0).toUpperCase() || "I";
    };

    return (
        <header className={styles.topbar}>
            {/* Left section */}
            <div className={styles.left}>
                {/* Desktop Sidebar Toggle */}
                <button 
                    className={`${styles.toggleBtn} ${styles.desktopOnly}`} 
                    onClick={onToggleSidebar}
                    aria-label="Toggle Sidebar"
                >
                    <FiMenu />
                </button>
                {/* Mobile Sidebar Toggle */}
                <button 
                    className={`${styles.toggleBtn} ${styles.mobileOnly}`} 
                    onClick={onToggleMobileSidebar}
                    aria-label="Toggle Navigation Drawer"
                >
                    <FiMenu />
                </button>

                {/* Search bar with explicit trigger */}
                <div className={styles.searchWrapper} ref={searchContainerRef} data-tour="topbar-search">
                    <div className={styles.searchBar}>
                        <FiSearch className={styles.searchIcon} />
                        <input 
                            type="text" 
                            ref={searchInputRef}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search quizzes, students, rooms..." 
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button className={styles.clearBtn} onClick={handleClearSearch} aria-label="Clear search">
                                <FiX />
                            </button>
                        )}
                        <kbd className={styles.searchShortcut}>Ctrl+K</kbd>
                    </div>
                    <button 
                        className={styles.searchBtn} 
                        onClick={triggerSearch} 
                        disabled={isSearching || !searchQuery.trim()}
                    >
                        {isSearching ? <div className={styles.searchSpinner} /> : "Search"}
                    </button>

                    {/* Custom search results dropdown */}
                    {showResults && (
                        <div className={styles.searchResultsPanel}>
                            {isSearching ? (
                                <div className={styles.searchLoading}>Searching...</div>
                            ) : (
                                <>
                                    {searchResults.quizzes.length === 0 && 
                                     searchResults.rooms.length === 0 && 
                                     searchResults.students.length === 0 ? (
                                        <div className={styles.searchEmpty}>
                                            No results found for "{searchQuery}"
                                        </div>
                                    ) : (
                                        <>
                                            {/* Quizzes Group */}
                                            {searchResults.quizzes.length > 0 && (
                                                <div className={styles.searchGroup}>
                                                    <div className={styles.searchGroupTitle}>Quizzes</div>
                                                    {searchResults.quizzes.map(q => (
                                                        <div 
                                                            key={q.id} 
                                                            className={styles.searchResultItem}
                                                            onClick={() => {
                                                                setShowResults(false);
                                                                navigate(`/instructor/quizzes/${q.id}/edit`);
                                                            }}
                                                        >
                                                            <FiSearch className={styles.searchResultIcon} />
                                                            <div className={styles.searchResultDetails}>
                                                                <span>{q.title}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Rooms Group */}
                                            {searchResults.rooms.length > 0 && (
                                                <div className={styles.searchGroup}>
                                                    <div className={styles.searchGroupTitle}>Rooms</div>
                                                    {searchResults.rooms.map(r => (
                                                        <div 
                                                            key={r.id} 
                                                            className={styles.searchResultItem}
                                                            onClick={() => {
                                                                setShowResults(false);
                                                                navigate(`/instructor/rooms/${r.id}`);
                                                            }}
                                                        >
                                                            <FiSearch className={styles.searchResultIcon} />
                                                            <div className={styles.searchResultDetails}>
                                                                <span>{r.name}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Students Group */}
                                            {searchResults.students.length > 0 && (
                                                <div className={styles.searchGroup}>
                                                    <div className={styles.searchGroupTitle}>Students</div>
                                                    {searchResults.students.map(s => (
                                                        <div 
                                                            key={s.uid} 
                                                            className={styles.searchResultItem}
                                                            onClick={() => {
                                                                setShowResults(false);
                                                                navigate(`/instructor/students`);
                                                            }}
                                                        >
                                                            <FiSearch className={styles.searchResultIcon} />
                                                            <div className={styles.searchResultDetails}>
                                                                <span>{s.full_name}</span>
                                                                <span className={styles.searchResultSubText}>{s.email}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right section */}
            <div className={styles.right} data-tour="topbar-actions">
                {/* Theme Switcher */}
                <button 
                    className={styles.iconBtn} 
                    onClick={handleThemeToggle}
                    title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    aria-label="Toggle Theme"
                >
                    {theme === "dark" ? <FiSun /> : <FiMoon />}
                </button>

                {/* Notifications Bell */}
                <button 
                    className={styles.iconBtn} 
                    onClick={() => navigate("/instructor/notifications")}
                    title="View Notifications"
                    aria-label="Notifications"
                >
                    <div className={styles.bellWrapper}>
                        <FiBell />
                        {unreadCount > 0 && (
                            <span className={styles.badge}>
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </div>
                </button>

                {/* Manual Reload Button */}
                <button 
                    className={styles.iconBtn} 
                    onClick={() => window.location.reload()}
                    title="Reload Page"
                    aria-label="Reload Page"
                >
                    <FiRefreshCw />
                </button>

                {/* Tour / Help Button */}
                <button 
                    className={styles.iconBtn} 
                    onClick={onStartGuide}
                    title="Start Tour Guide"
                    aria-label="Start Tour Guide"
                >
                    <FiHelpCircle />
                </button>

                <div className={styles.separator} />

                {/* Profile Selector */}
                <div className={styles.profileContainer} ref={dropdownRef}>
                    <button 
                        className={styles.profileBtn} 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-expanded={isMenuOpen}
                        aria-label="Instructor profile actions"
                    >
                        <div className={styles.avatar}>
                            {getInitials(profile?.full_name)}
                        </div>
                        <span className={styles.profileName}>
                            {profile?.full_name?.split(" ")[0] || "Instructor"}
                        </span>
                        <FiChevronDown className={`${styles.chevron} ${isMenuOpen ? styles.rotated : ""}`} />
                    </button>

                    {/* Profile Dropdown */}
                    {isMenuOpen && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>
                                <div className={styles.dropdownName}>{profile?.full_name || "Instructor"}</div>
                                <div className={styles.dropdownEmail}>{profile?.email || ""}</div>
                            </div>
                            <div className={styles.dropdownDivider} />
                            
                            <button 
                                className={styles.dropdownItem} 
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    navigate("/instructor/profile");
                                }}
                            >
                                <FiUser className={styles.dropdownItemIcon} />
                                <span>My Profile</span>
                            </button>
                            
                            <div className={styles.dropdownDivider} />
                            
                            <button 
                                className={`${styles.dropdownItem} ${styles.danger}`} 
                                onClick={handleLogout}
                            >
                                <FiLogOut className={styles.dropdownItemIcon} />
                                <span>Log Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
