// local
import MainButton from "../../components/ui/button/MainButton";
import styles from "./offlinePage.module.css";

// react
import { useEffect, useRef } from "react";

// prop-types
import PropTypes from "prop-types";

// gsap
import { gsap } from "gsap";

// react-icons
import { FiWifiOff, FiRefreshCw } from "react-icons/fi";

const OfflinePage = ({ isOffline, onExited }) => {
    const containerRef = useRef(null);
    const exitTriggeredRef = useRef(false);

    useEffect(() => {
        // Entrance animation inside GSAP context to avoid target-not-found HMR bugs
        const ctx = gsap.context(() => {
            gsap.set(containerRef.current, { yPercent: 0, opacity: 1 });
            
            const tl = gsap.timeline({
                defaults: { ease: "power3.out" }
            });

            // Card container bounces in with slight tilt
            tl.fromTo(
                `.${styles.cardContainer}`,
                { scale: 0.9, y: 50, rotation: -2, opacity: 0 },
                { scale: 1, y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.4)" }
            );

            // macOS control dots stagger
            tl.fromTo(
                `.${styles.cardHeaderDecoration} span`,
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.4, stagger: 0.1 },
                "-=0.4"
            );

            // Icon scales in
            tl.fromTo(
                `.${styles.iconContainer}`,
                { scale: 0.5, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.8)" },
                "-=0.3"
            );

            // Title & text slide in
            tl.fromTo(
                `.${styles.title}`,
                { y: 15, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4 },
                "-=0.3"
            );

            tl.fromTo(
                `.${styles.description}`,
                { y: 15, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4 },
                "-=0.3"
            );

            // Status indicator slide in
            tl.fromTo(
                `.${styles.statusIndicator}`,
                { scaleX: 0, opacity: 0 },
                { scaleX: 1, opacity: 1, duration: 0.5, ease: "back.out(1.2)" },
                "-=0.2"
            );

            // Button fades in
            tl.fromTo(
                `.${styles.btnContainer}`,
                { y: 15, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4 },
                "-=0.2"
            );

            // Pulse the Wi-Fi icon scale infinitely
            gsap.to(`.${styles.wifiIcon}`, {
                scale: 1.08,
                duration: 1.2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    // Monitor isOffline state to run slide out animation when returning online
    useEffect(() => {
        if (!isOffline && !exitTriggeredRef.current) {
            exitTriggeredRef.current = true;
            
            // Slide container up off-screen
            gsap.to(containerRef.current, {
                yPercent: -100,
                duration: 1.0,
                ease: "power4.inOut",
                onComplete: () => {
                    if (onExited) onExited();
                }
            });
        }
    }, [isOffline, onExited]);

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div
            ref={containerRef}
            className={styles.overlay}
            role="alert"
            aria-live="assertive"
            aria-labelledby="offline-title"
        >
            <div className={styles.cardContainer}>
                {/* macOS control dots decoration */}
                <div className={styles.cardHeaderDecoration}>
                    <span className={styles.dotRed} />
                    <span className={styles.dotOrange} />
                    <span className={styles.dotGreen} />
                </div>

                <div className={styles.content}>
                    <div className={styles.iconContainer}>
                        <div className={styles.pulseRing} />
                        <div className={styles.pulseRing2} />
                        <div className={styles.iconCircle}>
                            <FiWifiOff className={styles.wifiIcon} aria-hidden="true" />
                        </div>
                    </div>

                    <h1 id="offline-title" className={styles.title}>
                        Connection Lost
                    </h1>
                    
                    <p className={styles.description}>
                        You are currently disconnected from Quivio. Please check your network cables, Wi-Fi router, or cellular status. We will automatically reconnect you as soon as you're back online.
                    </p>

                    <div className={styles.statusIndicator}>
                        <span className={styles.indicatorDot} />
                        <span>Attempting to reconnect...</span>
                    </div>

                    <div className={styles.btnContainer}>
                        <MainButton onClick={handleReload} variant="outline" size="md" className={styles.reloadBtn}>
                            <FiRefreshCw className={styles.reloadIcon} aria-hidden="true" /> Retry Connection
                        </MainButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

OfflinePage.propTypes = {
    isOffline: PropTypes.bool.isRequired,
    onExited: PropTypes.func.isRequired,
};

export default OfflinePage;
