// local
import WelcomePage from "./pages/welcome-page/welcomePage";
import OfflinePage from "./pages/offline-page/offlinePage";
import LoadingPage from "./pages/loading-page/loadingPage";
import {
    initAuth,
    selectIsAuthenticated,
    selectIsInitializing,
    setSession,
} from "./redux/slices/authSlice";
import { subscribeToAuthChanges } from "./services/authService";
import { getMyProfile } from "./services/profilesService";
import { fetchUnreadCount } from "./redux/slices/notificationsSlice";
import {
    useRealtimeProfiles,
    useRealtimeNotifications,
    useRealtimeQuizzes,
    useRealtimeLeaderboard,
    useRealtimeUserAchievements,
    useRealtimeAssignments,
    useRealtimeCertificates,
    useRealtimeCategories,
} from "./hooks";
import { selectTheme } from "./redux/slices/themeSLice.js";
import { supabase } from "./services/config/supabaseClient";

// toastify
import { toast } from "react-toastify";

// sweetalert2
import Swal from "sweetalert2";

// react
import { useState, useEffect, useCallback } from "react";

// react-router
import { Outlet, useNavigate } from "react-router";

// redux
import { useDispatch, useSelector } from "react-redux";

// ─────────────────────────────────────────────────────────────────────────────
// Inner component — mounted only when authenticated.
// Houses ALL realtime hooks so they are active for the entire session.
// ─────────────────────────────────────────────────────────────────────────────
function RealtimeProvider() {
    // ── Notification toast handler ───────────────────────────────────────────
    const handleNewNotification = useCallback((notif) => {
        console.info("[Notification]", notif.title, notif.body);
        const isDark = document.documentElement.classList.contains("dark");
        const options = {
            position: "top-right",
            autoClose: 5000,
            theme: isDark ? "dark" : "light"
        };
        const message = `${notif.title}: ${notif.body}`;
        
        switch (notif.type) {
            case "success":
                toast.success(message, options);
                break;
            case "error":
            case "danger":
                toast.error(message, options);
                break;
            case "warning":
                toast.warn(message, options);
                break;
            case "info":
            default:
                toast.info(message, options);
                break;
        }
    }, []);

    // ── Achievement unlock handler ───────────────────────────────────────────
    const handleAchievementUnlock = useCallback(async (row) => {
        console.info("[Achievement unlocked]", row);
        
        let name = "New Achievement";
        let description = "You've unlocked a new achievement!";
        let badgeUrl = "";
        let xpReward = 0;

        try {
            const { data, error } = await supabase
                .from("achievements")
                .select("name, description, badge_url, xp_reward")
                .eq("id", row.achievement_id)
                .single();
            if (!error && data) {
                name = data.name;
                description = data.description;
                badgeUrl = data.badge_url;
                xpReward = data.xp_reward;
            }
        } catch (err) {
            console.error("Error fetching achievement details:", err);
        }

        const isDark = document.documentElement.classList.contains("dark");
        Swal.fire({
            title: `<span style="color: var(--color-accent, #6366f1); font-weight: 800; font-family: var(--font-sans, sans-serif);">Achievement Unlocked!</span>`,
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-top: 1rem; font-family: var(--font-sans, sans-serif);">
                    ${badgeUrl ? `<img src="${badgeUrl}" alt="${name}" style="width: 5.5rem; height: 5.5rem; object-fit: contain; filter: drop-shadow(0 10px 15px rgba(99, 102, 241, 0.3));" />` : `<div style="font-size: 5rem; line-height: 1;">🏆</div>`}
                    <div style="text-align: center;">
                        <h4 style="margin: 0 0 0.5rem 0; color: ${isDark ? "#f8fafc" : "#0f172a"}; font-size: 1.25rem; font-weight: 700;">${name}</h4>
                        <p style="margin: 0; color: ${isDark ? "#94a3b8" : "#475569"}; font-size: 0.875rem; line-height: 1.5; max-width: 20rem; margin: 0 auto;">${description}</p>
                    </div>
                    ${xpReward ? `<div style="background: linear-gradient(135deg, var(--color-accent, #6366f1), #4f46e5); color: white; padding: 0.375rem 1rem; border-radius: 9999px; font-weight: 600; font-size: 0.75rem; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 0.25rem; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">⚡ +${xpReward} XP</div>` : ""}
                </div>
            `,
            background: isDark ? "#1e293b" : "#ffffff",
            confirmButtonText: "Awesome!",
            confirmButtonColor: "var(--color-accent, #6366f1)",
            buttonsStyling: true,
            customClass: {
                popup: "premium-swal-popup"
            }
        });
    }, []);

    // ── Certificate issued handler ───────────────────────────────────────────
    const handleCertificateIssued = useCallback(async (cert) => {
        console.info("[Certificate issued]", cert);
        
        let quizTitle = "Quiz";
        try {
            const { data, error } = await supabase
                .from("quizzes")
                .select("title")
                .eq("id", cert.quiz_id)
                .single();
            if (!error && data) {
                quizTitle = data.title;
            }
        } catch (err) {
            console.error("Error fetching quiz title for certificate:", err);
        }

        const isDark = document.documentElement.classList.contains("dark");
        Swal.fire({
            title: `<span style="color: var(--color-success, #10b981); font-weight: 800; font-family: var(--font-sans, sans-serif);">Certificate Earned!</span>`,
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-top: 1rem; font-family: var(--font-sans, sans-serif);">
                    <div style="font-size: 5rem; line-height: 1; filter: drop-shadow(0 10px 15px rgba(16, 185, 129, 0.3));">🎓</div>
                    <div style="text-align: center;">
                        <h4 style="margin: 0 0 0.5rem 0; color: ${isDark ? "#f8fafc" : "#0f172a"}; font-size: 1.25rem; font-weight: 700;">Congratulations!</h4>
                        <p style="margin: 0; color: ${isDark ? "#94a3b8" : "#475569"}; font-size: 0.875rem; line-height: 1.5; max-width: 20rem; margin: 0 auto;">
                            You have successfully completed <strong style="color: var(--color-success, #10b981);">${quizTitle}</strong> with a score of <strong>${cert.score}%</strong>!
                        </p>
                    </div>
                    <div style="font-size: 0.75rem; color: ${isDark ? "#64748b" : "#94a3b8"}; margin-top: 0.5rem;">
                        Certificate Code: <code style="background: ${isDark ? "#334155" : "#f1f5f9"}; color: ${isDark ? "#cbd5e1" : "#334155"}; padding: 0.25rem 0.5rem; border-radius: 4px; font-family: var(--font-mono, monospace);">${cert.certificate_code}</code>
                    </div>
                </div>
            `,
            background: isDark ? "#1e293b" : "#ffffff",
            showCancelButton: true,
            confirmButtonText: "View Certificate PDF",
            cancelButtonText: "Close",
            confirmButtonColor: "var(--color-success, #10b981)",
            cancelButtonColor: isDark ? "#475569" : "#94a3b8",
            buttonsStyling: true,
            customClass: {
                popup: "premium-swal-popup"
            }
        }).then((result) => {
            if (result.isConfirmed && cert.pdf_url) {
                window.open(cert.pdf_url, "_blank");
            }
        });
    }, []);

    // ── Mount all hooks ──────────────────────────────────────────────────────
    useRealtimeProfiles();
    useRealtimeNotifications({ onNew: handleNewNotification });
    useRealtimeQuizzes();
    useRealtimeLeaderboard();
    useRealtimeUserAchievements({ onUnlock: handleAchievementUnlock });
    useRealtimeAssignments();
    useRealtimeCertificates({ onIssued: handleCertificateIssued });
    useRealtimeCategories();

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
        if (currentTheme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [currentTheme]);

    // 1. Restore session on mount
    useEffect(() => {
        dispatch(initAuth());
    }, [dispatch]);

    // 2. Listen for Supabase auth state changes (tab switches, token refresh, etc.)
    useEffect(() => {
        const {
            data: { subscription },
        } = subscribeToAuthChanges(async (event, session) => {
            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                const { data: profile } = await getMyProfile();
                dispatch(setSession({ session, profile }));
                dispatch(fetchUnreadCount());
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
