// react
import { useState, useEffect } from "react";

// react-router
import { Navigate, Outlet, useLocation } from "react-router";

// react-joyride
import { Joyride } from "react-joyride";

// redux
import { useSelector } from "react-redux";
import {
    selectIsAuthenticated,
    selectRole,
    selectIsInitializing,
} from "../redux/slices/authSlice";

// local components
import Sidebar from "../pages/instructor/components/Sidebar";
import Topbar from "../pages/instructor/components/Topbar";
import MovingBackground from "../pages/instructor/components/MovingBackground";
import styles from "./ProtectedInstructorLayout.module.css";

const ProtectedInstructorLayout = () => {
    const isAuth = useSelector(selectIsAuthenticated);
    const role = useSelector(selectRole);
    const isInitializing = useSelector(selectIsInitializing);

    const location = useLocation();
    const [runGuide, setRunGuide] = useState(false);

    // States for collapsible and mobile sidebar
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem("instructor-sidebar-collapsed") === "true";
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth <= 768 : false,
    );

    const isHome =
        location.pathname === "/instructor/dashboard" ||
        location.pathname === "/instructor" ||
        location.pathname === "/instructor/";

    const homeSteps = [
        {
            target: "body",
            content:
                "Welcome to the Quivio Instructor Tour! Let's show you how to manage your classroom and quizzes.",
            placement: "center",
        },
        {
            target: '[data-tour="sidebar-dashboard"]',
            content:
                "Dashboard: Your central hub. View live stats, upcoming deadlines, active student counts, and recent activities.",
        },
        {
            target: '[data-tour="sidebar-quizzes"]',
            content:
                "My Quizzes: Create, configure, and publish quizzes. Customize questions, categories, and review performance ratio charts.",
        },
        {
            target: '[data-tour="sidebar-questions"]',
            content:
                "Question Bank: A reusable repository of all your quiz questions. Easily import, filter, or tag them.",
        },
        {
            target: '[data-tour="sidebar-rooms"]',
            content:
                "Rooms: Manage virtual classrooms. Group students, invite participants, and track room-specific progress.",
        },
        {
            target: '[data-tour="sidebar-students"]',
            content:
                "Students: Roster management. Add new student accounts, generate registration codes, and track profiles.",
        },
        {
            target: '[data-tour="sidebar-analytics"]',
            content:
                "Analytics: Deep statistical insights. View score deciles, pass rates, easiest/hardest questions, and download Excel sheets.",
        },
        {
            target: '[data-tour="sidebar-assignments"]',
            content:
                "Assignments: Distribute quizzes to rooms. Set opening/closing windows, view submission statuses.",
        },
        {
            target: '[data-tour="sidebar-categories"]',
            content:
                "Categories: Group quizzes by subject domains (e.g. Mathematics, OS) to track comparative statistics.",
        },
        {
            target: '[data-tour="sidebar-certificates"]',
            content:
                "Certificates: Design and award auto-generated credentials to students who pass assigned quizzes.",
        },
        {
            target: '[data-tour="sidebar-profile"]',
            content:
                "Profile: Manage your personal instructor credentials, security, and notification preferences.",
        },
        {
            target: '[data-tour="dashboard-stats"]',
            content:
                "KPI Stats Summary: View total quizzes, attempts, unique students, average scores, and classroom pass rates in real-time.",
        },
        {
            target: '[data-tour="dashboard-actions"]',
            content:
                "Quick Actions Panel: Instantly create a new quiz, add a classroom, or register a student with these buttons.",
        },
        {
            target: '[data-tour="dashboard-recent"]',
            content:
                "Activity & Feeds: Track recent quiz attempts, top student score rankings, category accuracy charts, and deadline alerts.",
        },
    ];

    const pageSteps = [
        {
            target: '[data-tour="page-header"]',
            content:
                "Page Workspace Header: Shows page title, path navigation, and filters or export actions.",
        },
        {
            target: "main",
            content:
                "Main Content Workspace: View layout elements, tables, forms, and tools specific to this page.",
        },
        {
            target: '[data-tour="topbar-search"]',
            content:
                "Global Search bar: Search quizzes, rooms, and students globally at any time.",
        },
        {
            target: '[data-tour="topbar-actions"]',
            content:
                "System Settings: Switch theme modes, view system alerts, and manage your account dropdown.",
        },
    ];

    // On mobile, filter out sidebar steps since the sidebar is hidden
    const rawSteps = isHome ? homeSteps : pageSteps;
    const steps = isMobile
        ? rawSteps.filter((s) => !s.target.includes?.("sidebar-"))
        : rawSteps;

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        if (["finished", "skipped"].includes(status)) {
            setRunGuide(false);
        }
    };

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
        localStorage.setItem(
            "instructor-sidebar-collapsed",
            String(newCollapsedState),
        );
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
        : isCollapsed
          ? "var(--sidebar-collapsed)"
          : "var(--sidebar-width)";

    return (
        <div className={styles.appShell}>
            {/* Joyride Tour Guide */}
            <Joyride
                run={runGuide}
                steps={steps}
                continuous={true}
                showSkipButton={true}
                showProgress={true}
                callback={handleJoyrideCallback}
                disableOverlay={false}
                disableOverlayClose={true}
                spotlightClicks={false}
                disableScrolling={false}
                scrollOffset={100}
                styles={{
                    options: {
                        primaryColor: "var(--color-accent)",
                        textColor: "var(--text-primary)",
                        backgroundColor: "var(--bg-surface)",
                        arrowColor: "var(--bg-surface)",
                        zIndex: 50000,
                    },
                    overlay: {
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        zIndex: 10000,
                    },
                    spotlight: {
                        borderRadius: "var(--radius-md)",
                        zIndex: 20000,
                    },
                    tooltip: {
                        borderRadius: "var(--radius-lg)",
                        fontSize: "var(--text-sm)",
                        fontFamily: "var(--font-sans)",
                        zIndex: 20001,
                    },
                }}
            />

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
                    transition:
                        "margin-left var(--transition-slower), width var(--transition-slower)",
                }}
            >
                {/* Topbar */}
                <Topbar
                    onToggleSidebar={handleToggleSidebar}
                    onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
                    onStartGuide={() => setRunGuide(true)}
                    style={{
                        left: currentMarginLeft,
                        width: `calc(100% - ${currentMarginLeft})`,
                    }}
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
