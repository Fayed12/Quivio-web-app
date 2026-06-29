// local
import WelcomePage from "./pages/welcome-page/welcomePage";
import OfflinePage from "./pages/offline-page/offlinePage";

// react
import { useState, useEffect } from "react";

// react-router
import { Outlet } from "react-router";

function App() {
    // Welcome overlay state (sessionStorage-aware, slides up to hide)
    const [showWelcome, setShowWelcome] = useState(() => {
        if (typeof window !== "undefined") {
            return !sessionStorage.getItem("welcomeShown");
        }
        return true;
    });

    // Online/Offline status tracking
    const [isOffline, setIsOffline] = useState(
        typeof navigator !== "undefined" ? !navigator.onLine : false
    );
    
    // Keep offline component rendered during slide-up exit animation
    const [hasBeenOffline, setHasBeenOffline] = useState(
        typeof navigator !== "undefined" ? !navigator.onLine : false
    );

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

    return (
        <div style={{ position: "relative", minHeight: "100vh", width: "100%", overflow: "hidden" }}>
            {/* Welcome overlay */}
            {showWelcome && (
                <WelcomePage onComplete={() => {
                    setShowWelcome(false);
                    sessionStorage.setItem("welcomeShown", "true");
                }} />
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
    );
}

export default App;
