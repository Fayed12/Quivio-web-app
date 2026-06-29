// local
import LoadingSpinner from "../../components/ui/loading-Spinner/loadingSpinner";
import styles from "./loadingPage.module.css";

// react
import { useEffect, useRef } from "react";

// gsap
import { gsap } from "gsap";

const LoadingPage = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (typeof document !== "undefined") {
            document.body.style.overflow = "hidden";
        }
        return () => {
            if (typeof document !== "undefined") {
                document.body.style.overflow = "";
            }
        };
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Pulse the skeletons in unison
            gsap.fromTo(
                `.${styles.skeleton}`,
                { opacity: 0.4 },
                {
                    opacity: 0.7,
                    duration: 1.0,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    stagger: 0.05
                }
            );

            // Intro fade-in of the entire loading container
            gsap.fromTo(
                containerRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.4, ease: "power2.out" }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className={styles.container} role="status" aria-label="Loading application">
            {/* Topbar skeleton */}
            <div className={styles.topbar}>
                <div className={`${styles.skeleton} ${styles.logoSkeleton}`} />
                <div className={`${styles.skeleton} ${styles.searchSkeleton}`} />
                <div className={`${styles.skeleton} ${styles.avatarSkeleton}`} />
            </div>

            <div className={styles.body}>
                {/* Sidebar skeleton */}
                <div className={styles.sidebar}>
                    <div className={`${styles.skeleton} ${styles.navSkeleton}`} />
                    <div className={`${styles.skeleton} ${styles.navSkeleton}`} />
                    <div className={`${styles.skeleton} ${styles.navSkeleton}`} />
                    <div className={`${styles.skeleton} ${styles.navSkeleton}`} />
                    <div className={`${styles.skeleton} ${styles.navSkeleton}`} />
                </div>

                {/* Main Content Area */}
                <main className={styles.main}>
                    <div className={styles.headerArea}>
                        <div className={`${styles.skeleton} ${styles.titleSkeleton}`} />
                        <div className={`${styles.skeleton} ${styles.subtitleSkeleton}`} />
                    </div>

                    <div className={styles.grid}>
                        <div className={styles.cardCol}>
                            <div className={`${styles.skeleton} ${styles.cardSkeleton}`} />
                            <div className={`${styles.skeleton} ${styles.cardSkeleton}`} />
                        </div>
                        <div className={styles.cardCol}>
                            <div className={`${styles.skeleton} ${styles.largeCardSkeleton}`} />
                        </div>
                    </div>
                </main>
            </div>

            {/* Spinner Floating Center */}
            <div className={styles.spinnerOverlay}>
                <div className={styles.spinnerWrapper}>
                    <LoadingSpinner size="lg" color="primary" label="loading..." />
                </div>
            </div>
        </div>
    );
};

export default LoadingPage;
