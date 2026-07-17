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
    FiRefreshCw,
    FiArrowLeft,
    FiHelpCircle,
} from "react-icons/fi";

// redux
import { logoutThunk, selectProfile } from "../../../redux/slices/authSlice";
import { toggleTheme, selectTheme } from "../../../redux/slices/themeSLice";
import {
    selectUnreadCount,
    fetchUnreadCount,
} from "../../../redux/slices/notificationsSlice";

// local
import { supabase } from "../../../services/config/supabaseClient";
import styles from "./StudentTopbar.module.css";

const StudentTopbar = ({ onToggleSidebar, onToggleMobileSidebar, onStartGuide, style }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const profile = useSelector(selectProfile);
    const theme = useSelector(selectTheme);
    const unreadCount = useSelector(selectUnreadCount);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const mobileSearchInputRef = useRef(null);
    const searchContainerRef = useRef(null);

    // Search states
    const [searchResults, setSearchResults] = useState({
        assignedQuizzes: [],
        publicQuizzes: [],
    });
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Mobile search toggle
    const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);

    // Fetch notifications unread counts
    useEffect(() => {
        dispatch(fetchUnreadCount());
    }, [dispatch]);

    // Handle Ctrl + K shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                const isMobileView = window.innerWidth <= 768;
                if (isMobileView) {
                    setIsMobileSearchExpanded(true);
                    setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
                } else {
                    searchInputRef.current?.focus();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsMenuOpen(false);
            }
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(event.target)
            ) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchChange = (value) => {
        setSearchQuery(value);
        if (!value.trim()) {
            setSearchResults({ assignedQuizzes: [], publicQuizzes: [] });
            setShowResults(false);
        }
    };

    // Debounce search query
    useEffect(() => {
        const trimmed = searchQuery.trim();
        if (!trimmed) return;

        const performSearch = async (trimmedQuery) => {
            if (!profile?.uid) return;

            setIsSearching(true);
            setShowResults(true);

            try {
                // Query public quizzes
                const { data: publicQuizzes } = await supabase
                    .from("quizzes")
                    .select("id, title")
                    .eq("status", "published")
                    .eq("visibility", "public")
                    .ilike("title", `%${trimmedQuery}%`)
                    .limit(5);

                // Query student's room ids to catch all quizzes assigned to student's rooms
                const { data: memberships } = await supabase
                    .from("room_members")
                    .select("room_id")
                    .eq("uid", profile.uid);
                
                const roomIds = (memberships || []).map((m) => m.room_id);

                // Query assigned quizzes (either directly assigned to student or assigned to their rooms)
                let assignmentsQuery = supabase
                    .from("assignments")
                    .select(`
                        id,
                        quiz:quizzes!inner(id, title, status)
                    `)
                    .eq("is_active", true)
                    .eq("quiz.status", "published")
                    .ilike("quiz.title", `%${trimmedQuery}%`);

                const filters = [`student_uid.eq.${profile.uid}`];
                if (roomIds.length) {
                    filters.push(`room_id.in.(${roomIds.join(",")})`);
                }
                assignmentsQuery = assignmentsQuery.or(filters.join(","));

                const { data: assignments } = await assignmentsQuery.limit(5);

                // De-duplicate assigned quizzes by quiz ID
                const seen = new Set();
                const assignedQuizzes = [];
                if (assignments) {
                    for (const a of assignments) {
                        if (a.quiz && !seen.has(a.quiz.id)) {
                            seen.add(a.quiz.id);
                            assignedQuizzes.push(a.quiz);
                        }
                    }
                }

                setSearchResults({
                    publicQuizzes: publicQuizzes || [],
                    assignedQuizzes: assignedQuizzes,
                });
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(() => {
            performSearch(trimmed);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, profile?.uid]);

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            searchInputRef.current?.blur();
        }
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setSearchResults({ assignedQuizzes: [], publicQuizzes: [] });
        setShowResults(false);
    };

    const closeMobileSearch = () => {
        setIsMobileSearchExpanded(false);
        handleClearSearch();
    };

    const handleThemeToggle = () => {
        dispatch(toggleTheme());
    };

    const handleLogout = () => {
        dispatch(logoutThunk());
        navigate("/login");
    };

    const getInitials = (name = "") => {
        return name.trim().charAt(0).toUpperCase() || "S";
    };

    return (
        <header className={styles.topbar} style={style}>
            {/* Left section */}
            <div className={styles.left}>
                {/* Desktop Toggle */}
                <button
                    className={`${styles.toggleBtn} ${styles.desktopOnly}`}
                    onClick={onToggleSidebar}
                    aria-label="Toggle Sidebar"
                >
                    <FiMenu />
                </button>
                {/* Mobile Toggle */}
                <button
                    className={`${styles.toggleBtn} ${styles.mobileOnly}`}
                    onClick={onToggleMobileSidebar}
                    aria-label="Toggle Mobile Drawer"
                >
                    <FiMenu />
                </button>

                {/* Search Bar */}
                <div
                    className={`${styles.searchWrapper} ${styles.desktopOnlySearch}`}
                    ref={searchContainerRef}
                    data-tour="topbar-search"
                >
                    <div className={styles.searchBar}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            ref={searchInputRef}
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search quizzes..."
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className={styles.clearBtnSearch}
                                onClick={handleClearSearch}
                                aria-label="Clear search"
                            >
                                <FiX />
                            </button>
                        )}
                        <kbd className={styles.searchShortcut}>Ctrl+K</kbd>

                        {/* Custom search results dropdown */}
                        {showResults && (
                            <div className={styles.searchResultsPanel}>
                                {isSearching ? (
                                    <div className={styles.searchLoading}>
                                        Searching...
                                    </div>
                                ) : (
                                    <>
                                        {searchResults.assignedQuizzes.length ===
                                            0 &&
                                        searchResults.publicQuizzes.length === 0 ? (
                                            <div className={styles.searchEmpty}>
                                                No results found for "{searchQuery}"
                                            </div>
                                        ) : (
                                            <>
                                                {/* Assigned Quizzes Group */}
                                                {searchResults.assignedQuizzes
                                                    .length > 0 && (
                                                    <div
                                                        className={
                                                            styles.searchGroup
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.searchGroupTitle
                                                            }
                                                        >
                                                            Assigned to Me
                                                        </div>
                                                        {searchResults.assignedQuizzes.map(
                                                            (q) => (
                                                                <div
                                                                    key={`assigned-${q.id}`}
                                                                    className={
                                                                        styles.searchResultItem
                                                                    }
                                                                    onClick={() => {
                                                                        setShowResults(
                                                                            false,
                                                                        );
                                                                        navigate(
                                                                            `/student/quizzes/${q.id}`,
                                                                        );
                                                                    }}
                                                                >
                                                                    <FiSearch
                                                                        className={
                                                                            styles.searchResultIcon
                                                                        }
                                                                    />
                                                                    <div
                                                                        className={
                                                                            styles.searchResultDetails
                                                                        }
                                                                    >
                                                                        <span>
                                                                            {
                                                                                q.title
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}

                                                {/* Public Quizzes Group */}
                                                {searchResults.publicQuizzes
                                                    .length > 0 && (
                                                    <div
                                                        className={
                                                            styles.searchGroup
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.searchGroupTitle
                                                            }
                                                        >
                                                            Public Quizzes
                                                        </div>
                                                        {searchResults.publicQuizzes.map(
                                                            (q) => (
                                                                <div
                                                                    key={`public-${q.id}`}
                                                                    className={
                                                                        styles.searchResultItem
                                                                    }
                                                                    onClick={() => {
                                                                        setShowResults(
                                                                            false,
                                                                        );
                                                                        navigate(
                                                                            `/student/quizzes/${q.id}`,
                                                                        );
                                                                    }}
                                                                >
                                                                    <FiSearch
                                                                        className={
                                                                            styles.searchResultIcon
                                                                        }
                                                                    />
                                                                    <div
                                                                        className={
                                                                            styles.searchResultDetails
                                                                        }
                                                                    >
                                                                        <span>
                                                                            {
                                                                                q.title
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
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
            </div>

            {/* Right section */}
            <div className={styles.right} data-tour="topbar-actions">
                {/* Mobile Search Icon */}
                <button
                    className={`${styles.iconBtn} ${styles.mobileOnlySearch}`}
                    onClick={() => setIsMobileSearchExpanded(true)}
                    aria-label="Search"
                >
                    <FiSearch />
                </button>

                {/* Theme Switcher */}
                <button
                    className={styles.iconBtn}
                    onClick={handleThemeToggle}
                    title={
                        theme === "dark"
                            ? "Switch to Light Mode"
                            : "Switch to Dark Mode"
                    }
                    aria-label="Toggle Theme"
                >
                    {theme === "dark" ? <FiSun /> : <FiMoon />}
                </button>

                {/* Notifications */}
                <button
                    className={styles.iconBtn}
                    onClick={() => navigate("/student/notifications")}
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

                {/* Manual Reload */}
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
                    className={`${styles.iconBtn} ${styles.desktopOnly}`}
                    onClick={onStartGuide}
                    title="Start Tour Guide"
                    aria-label="Start Tour Guide"
                >
                    <FiHelpCircle />
                </button>

                <div className={styles.separator} />

                {/* Profile menu */}
                <div className={styles.profileContainer} ref={dropdownRef}>
                    <button
                        className={styles.profileBtn}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-expanded={isMenuOpen}
                        aria-label="Profile actions"
                    >
                        <div className={styles.avatar}>
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name || "Avatar"} className={styles.avatarImg} />
                            ) : (
                                getInitials(profile?.full_name)
                            )}
                        </div>
                        <span className={styles.profileName}>
                            {profile?.full_name?.split(" ")[0] || "Student"}
                        </span>
                        <FiChevronDown
                            className={`${styles.chevron} ${isMenuOpen ? styles.rotated : ""}`}
                        />
                    </button>

                    {isMenuOpen && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>
                                <div className={styles.dropdownName}>
                                    {profile?.full_name || "Student"}
                                </div>
                                <div className={styles.dropdownEmail}>
                                    {profile?.email || ""}
                                </div>
                            </div>
                            <div className={styles.dropdownDivider} />

                            <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    navigate("/student/profile");
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
            {/* Floating Mobile Search Row */}
            {isMobileSearchExpanded && (
                <div className={styles.mobileSearchRow} ref={searchContainerRef}>
                    <button
                        className={styles.iconBtn}
                        onClick={closeMobileSearch}
                        aria-label="Back"
                    >
                        <FiArrowLeft />
                    </button>
                    <div className={styles.searchBarMobile}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            ref={mobileSearchInputRef}
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search quizzes..."
                            className={styles.searchInput}
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className={styles.clearBtn}
                                onClick={handleClearSearch}
                                aria-label="Clear search"
                            >
                                <FiX />
                            </button>
                        )}

                        {/* Mobile Results Panel inside the mobile search row */}
                        {showResults && (
                            <div className={styles.searchResultsPanelMobile}>
                                {isSearching ? (
                                    <div className={styles.searchLoading}>
                                        Searching...
                                    </div>
                                ) : (
                                    <>
                                        {searchResults.assignedQuizzes.length === 0 &&
                                        searchResults.publicQuizzes.length === 0 ? (
                                            <div className={styles.searchEmpty}>
                                                No results found for "{searchQuery}"
                                            </div>
                                        ) : (
                                            <>
                                                {/* Assigned Quizzes Group */}
                                                {searchResults.assignedQuizzes.length > 0 && (
                                                    <div className={styles.searchGroup}>
                                                        <div className={styles.searchGroupTitle}>
                                                            Assigned to Me
                                                        </div>
                                                        {searchResults.assignedQuizzes.map((q) => (
                                                            <div
                                                                key={`assigned-${q.id}`}
                                                                className={styles.searchResultItem}
                                                                onClick={() => {
                                                                    setShowResults(false);
                                                                    setIsMobileSearchExpanded(false);
                                                                    navigate(`/student/quizzes/${q.id}`);
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

                                                {/* Public Quizzes Group */}
                                                {searchResults.publicQuizzes.length > 0 && (
                                                    <div className={styles.searchGroup}>
                                                        <div className={styles.searchGroupTitle}>
                                                            Public Quizzes
                                                        </div>
                                                        {searchResults.publicQuizzes.map((q) => (
                                                            <div
                                                                key={`public-${q.id}`}
                                                                className={styles.searchResultItem}
                                                                onClick={() => {
                                                                    setShowResults(false);
                                                                    setIsMobileSearchExpanded(false);
                                                                    navigate(`/student/quizzes/${q.id}`);
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
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default StudentTopbar;
