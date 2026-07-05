// react
import { useState, useEffect } from "react";

// react-router
import { Navigate, Outlet } from "react-router";

// redux
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectRole, selectIsInitializing } from "../redux/slices/authSlice";

// local components
import Sidebar from "../pages/instructor/components/Sidebar";
import Topbar from "../pages/instructor/components/Topbar";
import MovingBackground from "../pages/instructor/components/MovingBackground";
import styles from "./ProtectedInstructorLayout.module.css";

const ProtectedInstructorLayout = () => {
    const isAuth = useSelector(selectIsAuthenticated);
    const role = useSelector(selectRole);
    const isInitializing = useSelector(selectIsInitializing);

    // States for collapsible and mobile sidebar
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem("instructor-sidebar-collapsed") === "true";
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);

    // Track mobile viewport resizing
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) {
                setIsMobileOpen(false); // Close drawer if resizing to desktop
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Prevent scrolling on mobile when sidebar drawer is open
    useEffect(() => {
        if (isMobile && isMobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMobile, isMobileOpen]);

    const handleToggleSidebar = () => {
        const newCollapsedState = !isCollapsed;
        setIsCollapsed(newCollapsedState);
        localStorage.setItem("instructor-sidebar-collapsed", String(newCollapsedState));
    };

    if (isInitializing) return null;

    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    if (role !== "instructor") {
        if (role === "student") {
            return <Navigate to="/student/dashboard" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    const currentMarginLeft = isMobile 
        ? "0px" 
        : (isCollapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)");

    return (
        <div className={styles.appShell}>
            {/* Organic moving background circles */}
            <MovingBackground />

            {/* Sidebar */}
            <Sidebar 
                isCollapsed={isCollapsed} 
                isOpen={isMobileOpen} 
                onClose={() => setIsMobileOpen(false)} 
            />

            {/* Main view content */}
            <div 
                className={styles.mainContent} 
                style={{ 
                    marginLeft: currentMarginLeft,
                    width: `calc(100% - ${currentMarginLeft})`,
                    transition: "margin-left var(--transition-slower), width var(--transition-slower)"
                }}
            >
                {/* Topbar */}
                <Topbar 
                    onToggleSidebar={handleToggleSidebar} 
                    onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)} 
                />

                {/* Inner views outlet */}
                <main className={styles.contentWrapper}>
                    <div className={styles.innerContainer}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProtectedInstructorLayout;
