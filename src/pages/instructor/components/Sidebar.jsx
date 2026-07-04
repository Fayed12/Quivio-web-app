// react
import { NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";

// react-icons
import {
    FiHome,
    FiClipboard,
    FiDatabase,
    FiFolder,
    FiUsers,
    FiBarChart2,
    FiCheckSquare,
    FiTag,
    FiAward,
    FiBell,
    FiUser,
    FiLogOut
} from "react-icons/fi";

// redux
import { logoutThunk, selectProfile } from "../../../redux/slices/authSlice";
import { selectUnreadCount } from "../../../redux/slices/notificationsSlice";

// local
import styles from "./Sidebar.module.css";

const Sidebar = ({ isCollapsed, isOpen, onClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const profile = useSelector(selectProfile);
    const unreadCount = useSelector(selectUnreadCount);

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
                { path: "/instructor/dashboard", label: "Dashboard", icon: <FiHome /> },
                { path: "/instructor/quizzes", label: "My Quizzes", icon: <FiClipboard /> },
                { path: "/instructor/questions", label: "Question Bank", icon: <FiDatabase /> },
                { path: "/instructor/rooms", label: "Rooms", icon: <FiFolder /> },
                { path: "/instructor/students", label: "Students", icon: <FiUsers /> },
            ]
        },
        {
            label: "Analytics",
            items: [
                { path: "/instructor/analytics", label: "Analytics", icon: <FiBarChart2 /> },
                { path: "/instructor/assignments", label: "Assignments", icon: <FiCheckSquare /> },
            ]
        },
        {
            label: "Content",
            items: [
                { path: "/instructor/categories", label: "Categories", icon: <FiTag /> },
                { path: "/instructor/certificates", label: "Certificates", icon: <FiAward /> },
            ]
        },
        {
            label: "Account",
            items: [
                { 
                    path: "/instructor/notifications", 
                    label: "Notifications", 
                    icon: <FiBell />, 
                    badge: unreadCount > 0 ? unreadCount : null 
                },
                { path: "/instructor/profile", label: "Profile", icon: <FiUser /> },
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
                <div className={styles.logoSection} onClick={() => navigate("/instructor/dashboard")}>
                    <div className={styles.logoIcon}>
                        <span>Q</span>
                    </div>
                    {!isCollapsed && (
                        <div className={styles.logoText}>
                            Quivio <span className={styles.logoHighlight}>Pro</span>
                        </div>
                    )}
                </div>

                {/* Nav Items */}
                <nav className={styles.nav}>
                    {navSections.map((section, sIdx) => (
                        <div key={section.label} className={styles.section}>
                            {!isCollapsed && <span className={styles.sectionLabel}>{section.label}</span>}
                            {sIdx > 0 && isCollapsed && <div className={styles.sectionDivider} />}
                            <div className={styles.sectionList}>
                                {section.items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={onClose}
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
                                ))}
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
                            {profile?.full_name?.charAt(0).toUpperCase() || "I"}
                        </div>
                        {!isCollapsed && (
                            <div className={styles.userInfo}>
                                <div className={styles.userName}>{profile?.full_name || "Instructor"}</div>
                                <div className={styles.userRole}>Instructor</div>
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

export default Sidebar;
