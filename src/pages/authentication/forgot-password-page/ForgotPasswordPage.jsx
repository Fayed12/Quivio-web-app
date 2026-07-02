// local
import MainButton from "../../../components/ui/button/MainButton";
import MainInput from "../../../components/ui/input/MainInput";
import AuthBackground from "../../../components/ui/background/AuthBackground";
import { forgotPasswordThunk, clearError } from "../../../redux/slices/authSlice";
import styles from "./ForgotPasswordPage.module.css";

// react
import { useState, useEffect, useRef } from "react";

// react-router
import { useNavigate, Link } from "react-router";

// redux
import { useDispatch, useSelector } from "react-redux";

// react-hook-form
import { useForm } from "react-hook-form";

// react-icons
import { FiMail, FiArrowLeft, FiCheckCircle } from "react-icons/fi";

// toastify
import { toast } from "react-toastify";

// gsap
import { gsap } from "gsap";

const ForgotPasswordPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error, isAuthenticated, role } = useSelector((state) => state.auth);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const containerRef = useRef(null);
    const successRef = useRef(null);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: {
            email: ""
        }
    });

    // Guard: Redirect logged in users to their dashboards
    useEffect(() => {
        if (isAuthenticated && role) {
            navigate(role === "instructor" ? "/instructor/dashboard" : "/student/dashboard");
        }
    }, [isAuthenticated, role, navigate]);

    // GSAP Entrance Animation
    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            tl.fromTo(
                `.${styles.card}`,
                { opacity: 0, scale: 0.95, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.6 }
            );

            tl.fromTo(
                `.${styles.animItem}`,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 },
                "-=0.4"
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    // GSAP Success Animation
    useEffect(() => {
        if (isSubmitted) {
            const ctx = gsap.context(() => {
                gsap.fromTo(
                    `.${styles.successIcon}`,
                    { scale: 0, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.8)" }
                );
                gsap.fromTo(
                    `.${styles.successText}`,
                    { y: 15, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.4, stagger: 0.1 }
                );
            }, successRef);

            return () => ctx.revert();
        }
    }, [isSubmitted]);

    // Toast error monitoring
    useEffect(() => {
        if (error) {
            toast.error(error, {
                position: "top-right",
                autoClose: 5000,
                theme: document.documentElement.classList.contains("dark") ? "dark" : "light"
            });
            dispatch(clearError());
        }
    }, [error, dispatch]);

    const onSubmit = (data) => {
        dispatch(forgotPasswordThunk(data.email));
        // Always set success to prevent email enumeration
        setIsSubmitted(true);
    };

    return (
        <div ref={containerRef} className={styles.pageWrapper}>
            <AuthBackground />

            <div className={styles.container}>
                <div className={styles.card}>
                    {!isSubmitted ? (
                        <>
                            <div className={`${styles.header} ${styles.animItem}`}>
                                <h2>Forgot password?</h2>
                                <p>No worries, we'll send you recovery instructions.</p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                                <div className={styles.animItem}>
                                    <MainInput
                                        title="Email Address"
                                        type="email"
                                        name="email"
                                        placeholder="Enter your email"
                                        icon={<FiMail />}
                                        hasError={!!errors.email}
                                        errorMsg={errors.email?.message}
                                        register={register("email", {
                                            required: "Email address is required",
                                            pattern: {
                                                value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                                                message: "Please enter a valid email address"
                                            }
                                        })}
                                    />
                                </div>

                                <div className={styles.animItem}>
                                    <MainButton
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        isLoading={loading}
                                        className={styles.submitBtn}
                                    >
                                        Send reset link
                                    </MainButton>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div ref={successRef} className={styles.successState}>
                            <div className={styles.successIcon}>
                                <FiCheckCircle />
                            </div>
                            <h2 className={styles.successText}>Check your inbox</h2>
                            <p className={styles.successText}>
                                We have sent password reset instructions to your email address. 
                                Please check your spam folder if you do not receive it within a few minutes.
                            </p>
                        </div>
                    )}

                    <div className={`${styles.footer} ${styles.animItem}`}>
                        <Link to="/login" className={styles.backLink}>
                            <FiArrowLeft className={styles.backIcon} /> Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
