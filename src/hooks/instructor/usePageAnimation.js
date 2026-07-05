import { useEffect } from "react";
import { gsap } from "gsap";

/**
 * usePageAnimation - A safe, modern GSAP page entrance animation hook.
 * 
 * @param {React.RefObject} containerRef - The main page container ref
 * @param {object} options
 * @param {boolean}  [options.ready=true]        - Animation triggers when true
 * @param {string}   [options.staggerSelector]   - CSS selector for stagger children (relative to containerRef)
 * @param {number}   [options.duration=0.5]      - Base animation duration
 * @param {number}   [options.staggerDelay=0.06] - Stagger delay between children
 */
const usePageAnimation = (containerRef, {
    ready = true,
    staggerSelector = null,
    duration = 0.5,
    staggerDelay = 0.06,
} = {}) => {
    useEffect(() => {
        if (!ready || !containerRef.current) return;

        const el = containerRef.current;
        
        // Set initial state immediately (no flash of unstyled content)
        gsap.set(el, { opacity: 0, y: 18 });

        // Small rAF delay ensures DOM is fully painted before animating
        const rafId = requestAnimationFrame(() => {
            const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

            // Fade in + slide up the main container
            tl.to(el, {
                opacity: 1,
                y: 0,
                duration,
            });

            // Stagger children if a selector is provided
            if (staggerSelector) {
                const children = el.querySelectorAll(staggerSelector);
                if (children.length > 0) {
                    gsap.set(children, { opacity: 0, y: 14 });
                    tl.to(children, {
                        opacity: 1,
                        y: 0,
                        duration: duration * 0.8,
                        stagger: staggerDelay,
                    }, "-=0.25");
                }
            }
        });

        // Cleanup: cancel pending rAF and reset styles
        return () => {
            cancelAnimationFrame(rafId);
            gsap.killTweensOf(el);
            if (staggerSelector) {
                const children = el.querySelectorAll(staggerSelector);
                gsap.killTweensOf(children);
            }
            gsap.set(el, { clearProps: "all" });
        };
    }, [ready, containerRef, staggerSelector, duration, staggerDelay]);
};

export default usePageAnimation;
