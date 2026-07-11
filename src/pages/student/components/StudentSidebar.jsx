// react
import { NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";

// react-icons
import {
    FiHome,
    FiSearch,
    FiClock,
    FiBarChart2,
    FiTrendingUp,
    FiBookmark,
    FiAward,
    FiBell,
    FiUser,
    FiLogOut
} from "react-icons/fi";

// redux
import { logoutThunk, selectProfile } from "../../../redux/slices/authSlice";
import { selectUnreadCount } from "../../../redux/slices/notificationsSlice";
import { selectTheme } from "../../../redux/slices/themeSLice";
import { selectMyRooms } from "../../../redux/slices/roomsSlice";

// local
import styles from "./StudentSidebar.module.css";

const StudentSidebar = ({ isCollapsed, isOpen, onClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const profile = useSelector(selectProfile);
    const rooms = useSelector(selectMyRooms);
    const unreadCount = useSelector(selectUnreadCount);
    const theme = useSelector(selectTheme) || "light";

    // A student is in limited state if they belong to 0 rooms
    const isLimited = rooms.length === 0;

    const logoSrc = theme === "dark" ? "/dark-logo.png" : "/light-logo.png";

    const handleLogout = () => {
        dispatch(logoutThunk());
        navigate("/login");
    };

    // Deterministic avatar color based on name
    const getAvatarColor = (name = "") => {
        const char = name.trim().charAt(0).toUpperCase();
        if (char >= "A" && char <= "E") return "var(--blue-500)";
        if (char >= "F" && char <= "J") return "var(--violet-500)";
        if (char >= "K" && char <= "O") return "var(--teal-500)";
        if (char >= "P" && char <= "T") return "var(--amber-500)";
        return "var(--green-500)";
    };

    const navSections = [
        {
            label: "Main",
            items: [
                { path: "/student/dashboard", label: "Dashboard", icon: <FiHome />, limitedAllowed: true },
                { path: "/student/quizzes", label: "Browse Quizzes", icon: <FiSearch />, limitedAllowed: true },
                { path: "/student/attempts", label: "My Attempts", icon: <FiClock />, limitedAllowed: false },
                { path: "/student/progress", label: "Progress", icon: <FiBarChart2 />, limitedAllowed: false },
                { path: "/student/leaderboard", label: "Leaderboard", icon: <FiTrendingUp />, limitedAllowed: false },
                { path: "/student/bookmarks", label: "Bookmarks", icon: <FiBookmark />, limitedAllowed: false },
            ]
        },
        {
            label: "Activity",
            items: [
                { path: "/student/achievements", label: "Achievements", icon: <FiAward />, limitedAllowed: false },
                { 
                    path: "/student/notifications", 
                    label: "Notifications", 
                    icon: <FiBell />, 
                    badge: unreadCount > 0 ? unreadCount : null,
                    limitedAllowed: false
                },
            ]
        },
        {
            label: "Account",
            items: [
                { path: "/student/profile", label: "Profile", icon: <FiUser />, limitedAllowed: false },
            ]
        }
    ];

    const sidebarClass = `
        ${styles.sidebar} 
        ${isCollapsed ? styles.collapsed : ""} 
        ${isOpen ? styles.open : ""}
    `.trim();

    return (
        <>
            {/* Mobile overlay backdrop */}
            {isOpen && <div className={styles.backdrop} onClick={onClose} />}

            <aside className={sidebarClass}>
                {/* Logo Section */}
                <div className={styles.logoSection} onClick={() => navigate("/student/dashboard")}>
                    <img 
                        key={logoSrc}
                        src={logoSrc} 
                        alt="Quivio Logo" 
                        className={styles.logoImg} 
                    />
                </div>

                {/* Nav Items */}
                <nav className={styles.nav}>
                    {navSections.map((section, sIdx) => (
                        <div key={section.label} className={styles.section}>
                            {!isCollapsed && <span className={styles.sectionLabel}>{section.label}</span>}
                            {sIdx > 0 && isCollapsed && <div className={styles.sectionDivider} />}
                            <div className={styles.sectionList}>
                                {section.items.map((item) => {
                                    const isRestricted = isLimited && !item.limitedAllowed;
                                    const tourKey = item.path.split("/").pop();

                                    if (isRestricted) {
                                        return (
                                            <div
                                                key={item.path}
                                                className={`${styles.navItem} ${styles.restricted}`}
                                                data-label={item.label}
                                                title="Locked: Please contact your instructor to join a room."
                                            >
                                                <span className={styles.navItemIcon}>{item.icon}</span>
                                                {!isCollapsed && <span className={styles.navItemLabel}>{item.label}</span>}
                                                <span className={styles.lockBadge}>🔒</span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={onClose}
                                            data-tour={`sidebar-${tourKey}`}
                                            data-label={item.label}
                                            className={({ isActive }) => 
                                                `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
                                            }
                                        >
                                            <span className={styles.navItemIcon}>{item.icon}</span>
                                            {!isCollapsed && <span className={styles.navItemLabel}>{item.label}</span>}
                                            {item.badge && !isCollapsed && (
                                                <span className={styles.badge}>{item.badge}</span>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer User Info */}
                <div className={styles.footer}>
                    <div className={styles.userCard}>
                        <div 
                            className={styles.avatar} 
                            style={{ backgroundColor: getAvatarColor(profile?.full_name) }}
                        >
                            {profile?.full_name?.charAt(0).toUpperCase() || "S"}
                        </div>
                        {!isCollapsed && (
                            <div className={styles.userInfo}>
                                <div className={styles.userName}>{profile?.full_name || "Student"}</div>
                                <div className={styles.userRole}>Student</div>
                            </div>
                        )}
                        <button 
                            className={styles.logoutBtn} 
                            onClick={handleLogout} 
                            title="Sign Out"
                            aria-label="Sign Out"
                        >
                            <FiLogOut />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default StudentSidebar;
