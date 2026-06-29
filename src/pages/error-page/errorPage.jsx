// local
import MainButton from "../../components/ui/button/MainButton";
import styles from "./errorPage.module.css";

// react
import { useEffect, useRef } from "react";

// react-router
import { useNavigate, useRouteError } from "react-router";

// gsap
import { gsap } from "gsap";

// react-icons
import { FiAlertOctagon, FiArrowLeft, FiHome } from "react-icons/fi";

const ErrorPage = () => {
    const navigate = useNavigate();
    const error = useRouteError();
    const containerRef = useRef(null);

    // Parse routing error if present
    let errorMessage = "An unexpected error occurred.";
    let errorStatus = "";
    if (error) {
        errorMessage = error.statusText || error.message || errorMessage;
        if (error.status) {
            errorStatus = `Error Status ${error.status}`;
        }
    }

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
            const tl = gsap.timeline({
                defaults: { ease: "power3.out" }
            });

            tl.fromTo(
                `.${styles.card}`,
                { y: 40, scale: 0.96, opacity: 0 },
                { y: 0, scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.2)" }
            );

            tl.fromTo(
                `.${styles.iconContainer}`,
                { scale: 0.4, rotation: -30, opacity: 0 },
                { scale: 1, rotation: 0, opacity: 1, duration: 0.5, ease: "back.out(1.5)" },
                "-=0.3"
            );

            tl.fromTo(
                `.${styles.heading}`,
                { y: 15, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4 },
                "-=0.2"
            );

            tl.fromTo(
                `.${styles.description}`,
                { y: 15, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4 },
                "-=0.2"
            );

            tl.fromTo(
                `.${styles.details}`,
                { y: 15, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4 },
                "-=0.2"
            );

            tl.fromTo(
                `.${styles.actions} button`,
                { y: 10, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, stagger: 0.1 },
                "-=0.2"
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleGoHome = () => {
        navigate("/");
    };

    return (
        <div ref={containerRef} className={styles.overlay}>
            <main className={styles.card} role="main">
                <div className={styles.iconContainer}>
                    <FiAlertOctagon className={styles.errorIcon} aria-hidden="true" />
                </div>
                
                {errorStatus && <span className={styles.statusCode}>{errorStatus}</span>}
                <h1 className={styles.heading}>Oops! Page Error</h1>
                
                <p className={styles.description}>
                    Quivio encountered a problem while trying to render this path. It might be due to an invalid route, server failure, or network disruption.
                </p>

                <div className={styles.details}>
                    <code>{errorMessage}</code>
                </div>

                <div className={styles.actions}>
                    <MainButton onClick={handleGoBack} variant="outline" size="md">
                        <FiArrowLeft aria-hidden="true" /> Go Back
                    </MainButton>
                    <MainButton onClick={handleGoHome} variant="primary" size="md">
                        <FiHome aria-hidden="true" /> Return Home
                    </MainButton>
                </div>
            </main>
        </div>
    );
};

export default ErrorPage;
