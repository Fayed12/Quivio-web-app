// react
import { useEffect, useRef } from "react";

// gsap
import { gsap } from "gsap";

// local
import styles from "./MovingBackground.module.css";

const MovingBackground = () => {
    const containerRef = useRef(null);
    const blob1Ref = useRef(null);
    const blob2Ref = useRef(null);
    const blob3Ref = useRef(null);
    const blob4Ref = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const animateBlob = (ref, xLimits, yLimits, baseDuration) => {
                if (!ref.current) return;
                
                // Set initial position
                gsap.set(ref.current, { x: 0, y: 0 });

                gsap.to(ref.current, {
                    x: `random(${xLimits[0]}, ${xLimits[1]})`,
                    y: `random(${yLimits[0]}, ${yLimits[1]})`,
                    duration: gsap.utils.random(baseDuration - 2, baseDuration + 2),
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                });
            };

            // Animate each blob with differing ranges and speeds
            animateBlob(blob1Ref, [-80, 80], [-80, 80], 12);
            animateBlob(blob2Ref, [-100, 100], [-100, 100], 15);
            animateBlob(blob3Ref, [-60, 60], [-60, 60], 10);
            animateBlob(blob4Ref, [-90, 90], [-90, 90], 14);

            // Stagger fade-in scaling
            gsap.fromTo(
                [blob1Ref.current, blob2Ref.current, blob3Ref.current, blob4Ref.current],
                { scale: 0.6, opacity: 0 },
                { scale: 1, opacity: 1, duration: 2.0, stagger: 0.2, ease: "power2.out" }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className={styles.container} aria-hidden="true">
            <div ref={blob1Ref} className={`${styles.blob} ${styles.blob1}`} />
            <div ref={blob2Ref} className={`${styles.blob} ${styles.blob2}`} />
            <div ref={blob3Ref} className={`${styles.blob} ${styles.blob3}`} />
            <div ref={blob4Ref} className={`${styles.blob} ${styles.blob4}`} />
            <div className={styles.glassOverlay} />
        </div>
    );
};

export default MovingBackground;
