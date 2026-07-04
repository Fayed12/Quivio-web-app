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
    FiLogOut 
} from "react-icons/fi";

// redux
import { logoutThunk, selectProfile } from "../../../redux/slices/authSlice";
import { toggleTheme, selectTheme } from "../../../redux/slices/themeSLice";
import { selectUnreadCount, fetchUnreadCount } from "../../../redux/slices/notificationsSlice";

// local
import styles from "./Topbar.module.css";

const Topbar = ({ onToggleSidebar, onToggleMobileSidebar }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const profile = useSelector(selectProfile);
    const theme = useSelector(selectTheme);
    const unreadCount = useSelector(selectUnreadCount);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch unread notification counts
    useEffect(() => {
        dispatch(fetchUnreadCount());
    }, [dispatch]);

    // Handle clicks outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

                {/* Dummy search bar */}
                <div className={styles.searchBar}>
                    <FiSearch className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Search quizzes, students, rooms..." 
                        className={styles.searchInput}
                    />
                    <kbd className={styles.searchShortcut}>Ctrl+K</kbd>
                </div>
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
