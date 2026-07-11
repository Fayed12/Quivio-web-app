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
    FiRefreshCw
} from "react-icons/fi";

// redux
import { logoutThunk, selectProfile } from "../../../redux/slices/authSlice";
import { toggleTheme, selectTheme } from "../../../redux/slices/themeSLice";
import {
    selectUnreadCount,
    fetchUnreadCount
} from "../../../redux/slices/notificationsSlice";

// local
import styles from "./StudentTopbar.module.css";

const StudentTopbar = ({
    onToggleSidebar,
    onToggleMobileSidebar,
    style
}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const profile = useSelector(selectProfile);
    const theme = useSelector(selectTheme);
    const unreadCount = useSelector(selectUnreadCount);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Fetch notifications unread counts
    useEffect(() => {
        dispatch(fetchUnreadCount());
    }, [dispatch]);

    // Handle Ctrl + K shortcut
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

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        const trimmed = searchQuery.trim();
        if (trimmed) {
            navigate(`/student/quizzes?search=${encodeURIComponent(trimmed)}`);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearchSubmit();
        }
    };

    const handleClearSearch = () => {
        setSearchQuery("");
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
                <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
                    <FiSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        ref={searchInputRef}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Search quizzes..."
                        className={styles.searchInput}
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
                    <kbd className={styles.searchShortcut}>Ctrl+K</kbd>
                </form>
            </div>

            {/* Right section */}
            <div className={styles.right}>
                {/* Theme Switcher */}
                <button
                    className={styles.iconBtn}
                    onClick={handleThemeToggle}
                    title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
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
                            {getInitials(profile?.full_name)}
                        </div>
                        <span className={styles.profileName}>
                            {profile?.full_name?.split(" ")[0] || "Student"}
                        </span>
                        <FiChevronDown className={`${styles.chevron} ${isMenuOpen ? styles.rotated : ""}`} />
                    </button>

                    {isMenuOpen && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>
                                <div className={styles.dropdownName}>{profile?.full_name || "Student"}</div>
                                <div className={styles.dropdownEmail}>{profile?.email || ""}</div>
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
        </header>
    );
};

export default StudentTopbar;
