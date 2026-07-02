// local
import styles from "./AuthBackground.module.css";

// react
import { useEffect, useRef } from "react";

// gsap
import { gsap } from "gsap";

const AuthBackground = () => {
    const containerRef = useRef(null);
    const circle1Ref = useRef(null);
    const circle2Ref = useRef(null);
    const circle3Ref = useRef(null);
    const circle4Ref = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Function to float circles around organically
            const animateCircle = (ref, xRange, yRange, duration) => {
                if (!ref.current) return;
                gsap.to(ref.current, {
                    x: `random(${xRange[0]}, ${xRange[1]})`,
                    y: `random(${yRange[0]}, ${yRange[1]})`,
                    duration: gsap.utils.random(duration - 2, duration + 2),
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });
            };

            animateCircle(circle1Ref, [-60, 60], [-60, 60], 8);
            animateCircle(circle2Ref, [-80, 80], [-80, 80], 11);
            animateCircle(circle3Ref, [-50, 50], [-50, 50], 7);
            animateCircle(circle4Ref, [-70, 70], [-70, 70], 10);

            // Stagger scale in
            gsap.fromTo(
                [circle1Ref.current, circle2Ref.current, circle3Ref.current, circle4Ref.current],
                { scale: 0.5, opacity: 0 },
                { scale: 1, opacity: 1, duration: 1.5, stagger: 0.15, ease: "power2.out" }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className={styles.backgroundContainer} aria-hidden="true">
            <div ref={circle1Ref} className={`${styles.circle} ${styles.circle1}`} />
            <div ref={circle2Ref} className={`${styles.circle} ${styles.circle2}`} />
            <div ref={circle3Ref} className={`${styles.circle} ${styles.circle3}`} />
            <div ref={circle4Ref} className={`${styles.circle} ${styles.circle4}`} />
            <div className={styles.glassOverlay} />
        </div>
    );
};

export default AuthBackground;
