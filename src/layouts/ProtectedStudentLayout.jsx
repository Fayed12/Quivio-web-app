// react
import { useState, useEffect, useRef } from "react";

// react-router
import { Navigate, Outlet, useNavigate, useLocation } from "react-router";

// react-joyride
import { Joyride } from "react-joyride";

// redux
import { useDispatch, useSelector } from "react-redux";
import {
    selectIsAuthenticated,
    selectRole,
    selectIsInitializing,
    selectMustChangePassword,
    selectProfile,
    logoutThunk
} from "../redux/slices/authSlice";
import { fetchStudentRooms } from "../redux/slices/roomsSlice";

// components
import MainButton from "../components/ui/button/MainButton";
import StudentSidebar from "../pages/student/components/StudentSidebar";
import StudentTopbar from "../pages/student/components/StudentTopbar";
import StudentMovingBackground from "../pages/student/components/StudentMovingBackground";

// local
import styles from "./ProtectedStudentLayout.module.css";

// gsap
import { gsap } from "gsap";

const ProtectedStudentLayout = () => {
    const isAuth = useSelector(selectIsAuthenticated);
    const role = useSelector(selectRole);
    const isInitializing = useSelector(selectIsInitializing);
    const mustChangePwd = useSelector(selectMustChangePassword);
    const profile = useSelector(selectProfile);
    const location = useLocation();
    
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Local state to track if student skipped password change prompt in this session
    const [showPrompt, setShowPrompt] = useState(false);
    const [runGuide, setRunGuide] = useState(false);
    
    // States for collapsible and mobile sidebar
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem("student-sidebar-collapsed");
        if (saved !== null) return saved === "true";
        return typeof window !== "undefined" ? window.innerWidth <= 1024 : false;
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth <= 768 : false,
    );

    const modalRef = useRef(null);
    const backdropRef = useRef(null);
    const deactContainerRef = useRef(null);

    // Track mobile viewport resizing
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const mobile = width <= 768;
            setIsMobile(mobile);
            if (mobile) {
                setIsMobileOpen(false); // Close drawer if resizing to mobile
            } else if (width <= 1024) {
                setIsCollapsed(true); // Auto collapse on tablet viewports
            } else {
                // Restore saved preference on larger screens
                const saved = localStorage.getItem("student-sidebar-collapsed");
                setIsCollapsed(saved === "true");
            }
        };
        window.addEventListener("resize", handleResize);
        handleResize(); // run initially on mount
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const isHome =
        location.pathname === "/student/dashboard" ||
        location.pathname === "/student" ||
        location.pathname === "/student/";

    const homeSteps = [
        {
            target: "body",
            content:
                "Welcome to the Quivio Student Tour! Let's show you how to navigate your dashboard and quizzes.",
            placement: "center",
        },
        {
            target: '[data-tour="sidebar-dashboard"]',
            content:
                "Dashboard: Your central hub. View your streak, total quizzes taken, achievements, and statistics.",
        },
        {
            target: '[data-tour="sidebar-quizzes"]',
            content:
                "Browse Quizzes: Explore public quizzes from the community, filter by categories, and test your knowledge.",
        },
        {
            target: '[data-tour="sidebar-attempts"]',
            content:
                "My Attempts: View your historical quiz scores, response breakdown keys, and completion certificates.",
        },
        {
            target: '[data-tour="sidebar-progress"]',
            content:
                "Progress: Visual charts showing score trends, pass/fail ratios, and subject mastery levels over time.",
        },
        {
            target: '[data-tour="sidebar-leaderboard"]',
            content:
                "Leaderboard: Compare your XP score rankings and check your position against other students globally.",
        },
        {
            target: '[data-tour="sidebar-bookmarks"]',
            content:
                "Bookmarks: Quick access to important quizzes you've saved for future practice.",
        },
        {
            target: '[data-tour="sidebar-achievements"]',
            content:
                "Achievements: Earned badge awards for streaks, perfect scores, fast completions, and key learning milestones.",
        },
        {
            target: '[data-tour="sidebar-notifications"]',
            content:
                "Notifications: Keep track of new quiz assignments from rooms and system alerts.",
        },
        {
            target: '[data-tour="sidebar-profile"]',
            content:
                "Profile: Update your account details, profile picture, change password, and notification preferences.",
        },
        {
            target: '[data-tour="dashboard-stats"]',
            content:
                "Learning KPIs: View your total quiz attempts, average accuracy rate, best scores, and current learning streak.",
        },
        {
            target: '[data-tour="dashboard-assigned"]',
            content:
                "Pending Assignments: Active quizzes distributed by instructors to your classrooms that are waiting for you to complete.",
        },
        {
            target: '[data-tour="dashboard-recent"]',
            content:
                "Recent Attempts: Access your last five quiz submissions to review details or see scores.",
        },
        {
            target: '[data-tour="dashboard-category"]',
            content:
                "Category performance: Track your knowledge levels across subjects like Math, Science, and Languages.",
        },
        {
            target: '[data-tour="dashboard-xp"]',
            content:
                "Level & XP progress: Gain Experience Points (XP) by submitting quizzes and level up your rank.",
        },
        {
            target: '[data-tour="dashboard-streak"]',
            content:
                "Streak calendar: Keep your daily learning streak alive by attempting at least one quiz every day.",
        },
        {
            target: '[data-tour="dashboard-achievements"]',
            content:
                "Recent Badges: Displays your recently earned achievement awards and tiers.",
        },
    ];

    const pageSteps = [
        {
            target: "h1",
            content:
                "Workspace Header: Displays current workspace title and breadcrumb path.",
        },
        {
            target: "main",
            content:
                "Main Content Area: Where you browse, answer quiz questions, view detailed progress, or review attempts.",
        },
        {
            target: '[data-tour="topbar-search"]',
            content:
                "Global Search Bar: Instantly search assigned quizzes or public quizzes by name or topic.",
        },
        {
            target: '[data-tour="topbar-actions"]',
            content:
                "System Actions: Toggle theme, read notifications, reload the page, or start the tour guide again.",
        },
    ];

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

    // Fetch student rooms on load to check limited/active state
    useEffect(() => {
        if (isAuth && role === "student") {
            dispatch(fetchStudentRooms());
        }
    }, [isAuth, role, dispatch]);

    useEffect(() => {
        // If must change password is true, and they haven't skipped yet, show the prompt
        if (isAuth && role === "student" && mustChangePwd && !sessionStorage.getItem("skippedPasswordChange")) {
            const timer = setTimeout(() => setShowPrompt(true), 0);
            return () => clearTimeout(timer);
        }
    }, [isAuth, role, mustChangePwd]);

    // GSAP Animation when prompt state is activated
    useEffect(() => {
        if (showPrompt) {
            const ctx = gsap.context(() => {
                gsap.fromTo(backdropRef.current, 
                    { opacity: 0 },
                    { opacity: 1, duration: 0.3, ease: "power2.out" }
                );
                gsap.fromTo(modalRef.current,
                    { scale: 0.9, y: 30, opacity: 0 },
                    { scale: 1, y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }
                );
            });
            return () => ctx.revert();
        }
    }, [showPrompt]);

    // GSAP Animation for Deactivated Screen
    useEffect(() => {
        if (profile && profile.is_active === false) {
            const ctx = gsap.context(() => {
                gsap.fromTo(deactContainerRef.current,
                    { opacity: 0, scale: 0.9, y: 40 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: "back.out(1.2)" }
                );
            });
            return () => ctx.revert();
        }
    }, [profile]);

    if (isInitializing) return null;

    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    if (role !== "student") {
        if (role === "instructor") {
            return <Navigate to="/instructor/dashboard" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    // Check if user is deactivated
    if (profile && profile.is_active === false) {
        return (
            <div 
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    backgroundColor: "var(--bg-app)",
                    padding: "2rem"
                }}
            >
                <StudentMovingBackground />
                <div 
                    ref={deactContainerRef}
                    style={{
                        background: "var(--bg-surface)",
                        maxWidth: "500px",
                        width: "100%",
                        padding: "3rem 2.5rem",
                        borderRadius: "var(--radius-lg)",
                        boxShadow: "var(--shadow-xl)",
                        border: "1px solid var(--border-danger)",
                        textAlign: "center",
                        zIndex: 10
                    }}
                >
                    <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }} role="img" aria-label="Locked">
                        🛑
                    </div>
                    <h1 style={{ 
                        fontSize: "var(--text-2xl)", 
                        fontWeight: "var(--fw-bold)", 
                        color: "var(--color-danger)",
                        marginBottom: "1rem" 
                    }}>
                        Account Deactivated
                    </h1>
                    <p style={{ 
                        fontSize: "var(--text-base)", 
                        color: "var(--text-secondary)", 
                        lineHeight: "var(--leading-normal)",
                        marginBottom: "2.5rem" 
                    }}>
                        Hello, <strong>{profile?.full_name || "Student"}</strong>. Your account has been temporarily deactivated by your instructor. You no longer have access to quizzes, attempts, or leaderboard data. Please reach out to your instructor to reactivate your access.
                    </p>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <MainButton onClick={() => dispatch(logoutThunk())} variant="danger" size="md">
                            Sign Out
                        </MainButton>
                    </div>
                </div>
            </div>
        );
    }

    const handleSkip = () => {
        // Animate out and then hide
        gsap.to(modalRef.current, {
            scale: 0.95,
            y: 15,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
                sessionStorage.setItem("skippedPasswordChange", "true");
                setShowPrompt(false);
            }
        });
        gsap.to(backdropRef.current, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.in"
        });
    };

    const handleGoToReset = () => {
        setShowPrompt(false);
        navigate("/reset-password");
    };

    const handleToggleSidebar = () => {
        const newCollapsedState = !isCollapsed;
        setIsCollapsed(newCollapsedState);
        localStorage.setItem(
            "student-sidebar-collapsed",
            String(newCollapsedState),
        );
    };

    // Detect quiz-taking route — hide sidebar & topbar during exam
    const isQuizTaking = /\/student\/quiz\/[^/]+\/take/.test(location.pathname);

    const currentMarginLeft = isQuizTaking
        ? "0px"
        : isMobile
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

            {/* Moving background circles */}
            {!isQuizTaking && <StudentMovingBackground />}

            {/* Sidebar — hidden during quiz-taking */}
            {!isQuizTaking && (
                <StudentSidebar
                    isCollapsed={isCollapsed}
                    isOpen={isMobileOpen}
                    onClose={() => setIsMobileOpen(false)}
                />
            )}

            {/* Main view content */}
            <div
                className={styles.mainContent}
                style={{
                    marginLeft: currentMarginLeft,
                    width: isQuizTaking ? "100%" : `calc(100% - ${currentMarginLeft})`,
                    transition: "margin-left var(--transition-slower), width var(--transition-slower)",
                }}
            >
                {/* Topbar — hidden during quiz-taking */}
                {!isQuizTaking && (
                    <StudentTopbar
                        onToggleSidebar={handleToggleSidebar}
                        onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
                        onStartGuide={() => setRunGuide(true)}
                        style={{
                            left: currentMarginLeft,
                            width: `calc(100% - ${currentMarginLeft})`,
                        }}
                    />
                )}

                {/* Inner views outlet */}
                <main className={styles.contentWrapper}>
                    <div className={styles.innerContainer}>
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Force change temporary password modal */}
            {showPrompt && (
                <div 
                    ref={backdropRef}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(15, 23, 42, 0.6)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "1rem"
                    }}
                >
                    <div 
                        ref={modalRef}
                        style={{
                            background: "var(--bg-surface)",
                            maxWidth: "420px",
                            width: "100%",
                            padding: "2rem",
                            borderRadius: "var(--radius-lg)",
                            boxShadow: "var(--shadow-xl)",
                            border: "1px solid var(--border-default)",
                            textAlign: "center"
                        }}
                    >
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }} role="img" aria-label="Shield">
                            🛡️
                        </div>
                        <h2 style={{ 
                            fontSize: "var(--text-xl)", 
                            fontWeight: "var(--fw-bold)", 
                            color: "var(--text-primary)",
                            marginBottom: "1rem"
                        }}>
                            Secure Your Account
                        </h2>
                        <p style={{ 
                            fontSize: "var(--text-sm)", 
                            color: "var(--text-secondary)",
                            lineHeight: "var(--leading-normal)",
                            marginBottom: "2rem"
                        }}>
                            Welcome to Quivio! Your account has been initialized with a temporary password. To keep your learning achievements and profile secure, please set a password of your choice.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <MainButton onClick={handleGoToReset} variant="primary" size="md">
                                Set Up Secure Password
                            </MainButton>
                            <MainButton onClick={handleSkip} variant="ghost" size="md">
                                Keep Using Current (Skip)
                            </MainButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProtectedStudentLayout;
