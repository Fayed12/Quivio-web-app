// local
import WelcomePage from "./pages/welcome-page/welcomePage";
import OfflinePage from "./pages/offline-page/offlinePage";
import LoadingPage from "./pages/loading-page/loadingPage";
import { initAuth, selectIsAuthenticated, selectIsInitializing, setSession } from "./redux/slices/authSlice";
import { subscribeToAuthChanges } from "./services/authService";
import { getMyProfile } from "./services/profilesService";
// import { fetchUnreadCount } from './store/slices/notificationsSlice';
import { useRealtimeProfiles } from "./hooks";
import { selectTheme } from "./redux/slices/themeSLice.js"

// react
import { useState, useEffect } from "react";

// react-router
import { Outlet,useNavigate } from "react-router";

// redux
import { useDispatch, useSelector } from "react-redux";

// ─────────────────────────────────────────────────────────────────────────────
// Inner component — mounted only when authenticated.
// Houses ALL realtime hooks so they are active for the entire session.
// ─────────────────────────────────────────────────────────────────────────────
function RealtimeProvider() {
    // // ── Notification toast handler ───────────────────────────────────────────
    // const handleNewNotification = useCallback((notif) => {
    //     // Replace this with your toast library (e.g. react-hot-toast, sonner)
    //     console.info("[Notification]", notif.title, notif.body);
    //     // toast.success(notif.title, { description: notif.body });
    // }, []);

    // // ── Achievement unlock handler ───────────────────────────────────────────
    // const handleAchievementUnlock = useCallback((row) => {
    //     console.info("[Achievement unlocked]", row);
    //     // showAchievementModal(row);
    //     // confetti();
    // }, []);

    // // ── Certificate issued handler ───────────────────────────────────────────
    // const handleCertificateIssued = useCallback((cert) => {
    //     console.info("[Certificate issued]", cert);
    //     // showCertificateModal(cert);
    // }, []);

    // ── Mount all hooks ──────────────────────────────────────────────────────
    useRealtimeProfiles();
    // useRealtimeNotifications({ onNew: handleNewNotification });
    // useRealtimeQuizzes();
    // useRealtimeLeaderboard();
    // useRealtimeUserAchievements({ onUnlock: handleAchievementUnlock });
    // useRealtimeAssignments();
    // useRealtimeCertificates({ onIssued: handleCertificateIssued });
    // useRealtimeCategories();

    return null;
}

function App() {
    const dispatch = useDispatch();
    const isAuth = useSelector(selectIsAuthenticated);
    const isInitializing = useSelector(selectIsInitializing);
    const currentTheme = useSelector(selectTheme);

    const navigate = useNavigate();

    // Welcome overlay state (localStorage-aware, slides up to hide)
    const [showWelcome, setShowWelcome] = useState(() => {
        if (typeof window !== "undefined") {
            return !localStorage.getItem("welcomeShown");
        }
        return true;
    });

    // Online/Offline status tracking
    const [isOffline, setIsOffline] = useState(
        typeof navigator !== "undefined" ? !navigator.onLine : false,
    );

    // Keep offline component rendered during slide-up exit animation
    const [hasBeenOffline, setHasBeenOffline] = useState(
        typeof navigator !== "undefined" ? !navigator.onLine : false,
    );

    // handle online/offline status
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
        };

        const handleOffline = () => {
            setIsOffline(true);
            setHasBeenOffline(true);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Prevent scrolling when WelcomePage or OfflinePage overlays are active
    useEffect(() => {
        if (typeof document !== "undefined") {
            if (showWelcome || isOffline || hasBeenOffline) {
                document.body.style.overflow = "hidden";
            } else {
                document.body.style.overflow = "";
            }
        }
        return () => {
            if (typeof document !== "undefined") {
                document.body.style.overflow = "";
            }
        };
    }, [showWelcome, isOffline, hasBeenOffline]);

    // set theme based on localStorage
    useEffect(() => {
        if (currentTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [currentTheme]);

    // 1. Restore session on mount
    useEffect(() => {
        dispatch(initAuth());
    }, [dispatch]);

    // 2. Listen for Supabase auth state changes (tab switches, token refresh, etc.)
    useEffect(() => {
        const { data: { subscription } } = subscribeToAuthChanges(async (event, session) => {
            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                const { data: profile } = await getMyProfile();
                dispatch(setSession({ session, profile }));
            }
            if (event === "SIGNED_OUT") {
                dispatch(setSession(null));
                navigate("/home");
            }
        });
        return () => subscription.unsubscribe();
    }, [dispatch, navigate]);

    if (isInitializing) {
        return <LoadingPage />;
    }

    return (
        <>
        <div
            style={{
                position: "relative",
                minHeight: "100vh",
                width: "100%",
                overflowX: "hidden",
            }}
        >
            {/* Welcome overlay */}
            {showWelcome && (
                <WelcomePage
                    onComplete={() => {
                        setShowWelcome(false);
                        localStorage.setItem("welcomeShown", "true");
                    }}
                />
            )}

            {/* Offline alert overlay */}
            {(isOffline || hasBeenOffline) && (
                <OfflinePage
                    isOffline={isOffline}
                    onExited={() => setHasBeenOffline(false)}
                />
            )}

            {/* Main Application Routes */}
            <Outlet />
        </div>
        {isAuth && <RealtimeProvider />}
        </>
    );
}

export default App;
