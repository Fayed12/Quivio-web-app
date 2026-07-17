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
    FiRefreshCw,
    FiArrowLeft,
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
import styles from "./Topbar.module.css";

const Topbar = ({
    onToggleSidebar,
    onToggleMobileSidebar,
    onStartGuide,
    style,
}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const profile = useSelector(selectProfile);
    const theme = useSelector(selectTheme);
    const unreadCount = useSelector(selectUnreadCount);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const mobileSearchInputRef = useRef(null);
    const searchContainerRef = useRef(null);

    // Search states
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState({
        quizzes: [],
        rooms: [],
        students: [],
    });
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Mobile search toggle
    const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);

    // Fetch unread notification counts
    useEffect(() => {
        dispatch(fetchUnreadCount());
    }, [dispatch]);

    // Handle Ctrl + K global keyboard shortcut to focus search input
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

    // Handle clicks outside the dropdowns to close them
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
            setSearchResults({ quizzes: [], rooms: [], students: [] });
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
                // Query quizzes
                const { data: quizzes } = await supabase
                    .from("quizzes")
                    .select("id, title")
                    .eq("instructor_uid", profile.uid)
                    .ilike("title", `%${trimmedQuery}%`)
                    .limit(5);

                // Query rooms
                const { data: rooms } = await supabase
                    .from("rooms")
                    .select("id, name")
                    .eq("instructor_uid", profile.uid)
                    .is("deleted_at", null)
                    .ilike("name", `%${trimmedQuery}%`)
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
                    .filter((s) => {
                        if (!s.profile) return false;
                        const nameMatch = s.profile.full_name
                            ?.toLowerCase()
                            .includes(trimmedQuery.toLowerCase());
                        const emailMatch = s.profile.email
                            ?.toLowerCase()
                            .includes(trimmedQuery.toLowerCase());
                        return nameMatch || emailMatch;
                    })
                    .slice(0, 5)
                    .map((s) => s.profile);

                setSearchResults({
                    quizzes: quizzes || [],
                    rooms: rooms || [],
                    students: matchingStudents || [],
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
        setSearchResults({ quizzes: [], rooms: [], students: [] });
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
        return name.trim().charAt(0).toUpperCase() || "I";
    };

    return (
        <header className={styles.topbar} style={style}>
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
                            placeholder="Search quizzes, students, rooms..."
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button
                                className={styles.clearBtn}
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
                                        {searchResults.quizzes.length === 0 &&
                                        searchResults.rooms.length === 0 &&
                                        searchResults.students.length === 0 ? (
                                            <div className={styles.searchEmpty}>
                                                No results found for "{searchQuery}"
                                            </div>
                                        ) : (
                                            <>
                                                {/* Quizzes Group */}
                                                {searchResults.quizzes.length >
                                                    0 && (
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
                                                            Quizzes
                                                        </div>
                                                        {searchResults.quizzes.map(
                                                            (q) => (
                                                                <div
                                                                    key={q.id}
                                                                    className={
                                                                        styles.searchResultItem
                                                                    }
                                                                    onClick={() => {
                                                                        setShowResults(
                                                                            false,
                                                                        );
                                                                        navigate(
                                                                            `/instructor/quizzes/${q.id}/edit`,
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

                                                {/* Rooms Group */}
                                                {searchResults.rooms.length > 0 && (
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
                                                            Rooms
                                                        </div>
                                                        {searchResults.rooms.map(
                                                            (r) => (
                                                                <div
                                                                    key={r.id}
                                                                    className={
                                                                        styles.searchResultItem
                                                                    }
                                                                    onClick={() => {
                                                                        setShowResults(
                                                                            false,
                                                                        );
                                                                        navigate(
                                                                            `/instructor/rooms/${r.id}`,
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
                                                                            {r.name}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}

                                                {/* Students Group */}
                                                {searchResults.students.length >
                                                    0 && (
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
                                                            Students
                                                        </div>
                                                        {searchResults.students.map(
                                                            (s) => (
                                                                <div
                                                                    key={s.uid}
                                                                    className={
                                                                        styles.searchResultItem
                                                                    }
                                                                    onClick={() => {
                                                                        setShowResults(
                                                                            false,
                                                                        );
                                                                        navigate(
                                                                            `/instructor/students`,
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
                                                                                s.full_name
                                                                            }
                                                                        </span>
                                                                        <span
                                                                            className={
                                                                                styles.searchResultSubText
                                                                            }
                                                                        >
                                                                            {
                                                                                s.email
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
                    className={`${styles.iconBtn} ${styles.desktopOnly}`}
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
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name || "Avatar"} className={styles.avatarImg} />
                            ) : (
                                getInitials(profile?.full_name)
                            )}
                        </div>
                        <span className={styles.profileName}>
                            {profile?.full_name?.split(" ")[0] || "Instructor"}
                        </span>
                        <FiChevronDown
                            className={`${styles.chevron} ${isMenuOpen ? styles.rotated : ""}`}
                        />
                    </button>

                    {/* Profile Dropdown */}
                    {isMenuOpen && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>
                                <div className={styles.dropdownName}>
                                    {profile?.full_name || "Instructor"}
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
                            placeholder="Search quizzes, students, rooms..."
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
                                                        {searchResults.quizzes.map((q) => (
                                                            <div
                                                                key={q.id}
                                                                className={styles.searchResultItem}
                                                                onClick={() => {
                                                                    setShowResults(false);
                                                                    setIsMobileSearchExpanded(false);
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
                                                        {searchResults.rooms.map((r) => (
                                                            <div
                                                                key={r.id}
                                                                className={styles.searchResultItem}
                                                                onClick={() => {
                                                                    setShowResults(false);
                                                                    setIsMobileSearchExpanded(false);
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
                                                        {searchResults.students.map((s) => (
                                                            <div
                                                                key={s.uid}
                                                                className={styles.searchResultItem}
                                                                onClick={() => {
                                                                    setShowResults(false);
                                                                    setIsMobileSearchExpanded(false);
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
            )}
        </header>
    );
};

export default Topbar;
