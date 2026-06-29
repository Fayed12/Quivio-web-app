// local
import styles from "./welcomePage.module.css";

// react
import { useEffect, useRef, useState } from "react";

// prop-types
import PropTypes from "prop-types";

// gsap
import { gsap } from "gsap";

// react-icons
import { FiBookOpen, FiUsers, FiAward } from "react-icons/fi";

const WelcomePage = ({ onComplete }) => {
    const containerRef = useRef(null);

    // Track dynamic theme state
    const [isDark, setIsDark] = useState(() => {
        if (typeof document !== "undefined") {
            return document.documentElement.classList.contains("dark") || 
                   document.documentElement.getAttribute("data-theme") === "dark";
        }
        return false;
    });

    useEffect(() => {
        if (typeof document === "undefined") return;
        const observer = new MutationObserver(() => {
            setIsDark(
                document.documentElement.classList.contains("dark") || 
                document.documentElement.getAttribute("data-theme") === "dark"
            );
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "data-theme"]
        });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        // Create GSAP Context to handle React 18 strict mode double-renders safely
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                defaults: { ease: "power3.out" },
            });

            // Set initial overlay position
            gsap.set(containerRef.current, { yPercent: 0 });

            // Entrance animations
            tl.fromTo(
                `.${styles.logoContainer}`,
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.5)" }
            );

            tl.fromTo(
                `.${styles.title}`,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6 },
                "-=0.5"
            );

            tl.fromTo(
                `.${styles.subtitle}`,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6 },
                "-=0.5"
            );

            tl.fromTo(
                `.${styles.featureItem}`,
                { y: 25, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.5,
                    stagger: 0.12,
                },
                "-=0.3"
            );

            tl.fromTo(
                `.${styles.progressBar}`,
                { width: "0%" },
                { width: "100%", duration: 3.8, ease: "power1.inOut" },
                "-=0.1"
            );

            // Exit animation
            tl.to(containerRef.current, {
                yPercent: -100,
                duration: 1.0,
                ease: "power4.inOut",
                onComplete: () => {
                    if (onComplete) onComplete();
                },
            });
        }, containerRef);

        return () => ctx.revert(); // Reverts all animations and clean up DOM modifications
    }, [onComplete]);

    return (
        <div
            ref={containerRef}
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
        >
            <div className={styles.content}>
                <div className={styles.logoContainer}>
                    <img 
                        src={isDark ? "/dark-logo.png" : "/light-logo.png"} 
                        alt="Quivio Logo" 
                        className={styles.logoImg} 
                    />
                </div>
                
                <p className={styles.subtitle}>
                    A modern EdTech platform built for instructors to create, manage, and analyze quizzes, and students to learn and excel.
                </p>

                <div className={styles.features}>
                    <div className={styles.featureItem}>
                        <div className={styles.iconBox}>
                            <FiBookOpen aria-hidden="true" />
                        </div>
                        <div className={styles.featureText}>
                            <h3>Diverse Quizzes</h3>
                            <p>Rich question formats with live tracking.</p>
                        </div>
                    </div>
                    
                    <div className={styles.featureItem}>
                        <div className={styles.iconBox}>
                            <FiUsers aria-hidden="true" />
                        </div>
                        <div className={styles.featureText}>
                            <h3>Virtual Rooms</h3>
                            <p>Manage courses, students, and invitations.</p>
                        </div>
                    </div>

                    <div className={styles.featureItem}>
                        <div className={styles.iconBox}>
                            <FiAward aria-hidden="true" />
                        </div>
                        <div className={styles.featureText}>
                            <h3>XP & Gamification</h3>
                            <p>Stay motivated with streaks and leaderboards.</p>
                        </div>
                    </div>
                </div>

                <div className={styles.loaderArea}>
                    <div className={styles.progressContainer}>
                        <div className={styles.progressBar} />
                    </div>
                    <span className={styles.loaderText}>Booting Quivio engine...</span>
                </div>
            </div>
        </div>
    );
};

WelcomePage.propTypes = {
    onComplete: PropTypes.func.isRequired,
};

export default WelcomePage;
