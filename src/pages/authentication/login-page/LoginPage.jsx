// local
import MainButton from "../../../components/ui/button/MainButton";
import MainInput from "../../../components/ui/input/MainInput";
import AuthBackground from "../../../components/ui/background/AuthBackground";
import { loginThunk, clearError } from "../../../redux/slices/authSlice";
import styles from "./LoginPage.module.css";

// react
import { useState, useEffect, useRef } from "react";

// react-router
import { useNavigate, Link } from "react-router";

// redux
import { useDispatch, useSelector } from "react-redux";

// react-hook-form
import { useForm } from "react-hook-form";

// react-icons
import { FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiArrowLeft } from "react-icons/fi";

// toastify
import { toast } from "react-toastify";

// gsap
import { gsap } from "gsap";

const LoginPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const { loading, error, isAuthenticated, role } = useSelector((state) => state.auth);
    const [showPassword, setShowPassword] = useState(false);
    
    const containerRef = useRef(null);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false
        }
    });

    // Opening stagger animation using GSAP context (avoids double-mount and HMR bugs)
    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            // Left panel text fade-in
            tl.fromTo(
                `.${styles.decorContent} > *`,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, stagger: 0.15 }
            );

            // Form container scale/fade-in
            tl.fromTo(
                `.${styles.formCard}`,
                { opacity: 0, scale: 0.95, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.6 },
                "-=0.6"
            );

            // Stagger form items
            tl.fromTo(
                `.${styles.formItem}`,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 },
                "-=0.4"
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    // Redirect upon successful authentication
    useEffect(() => {
        if (isAuthenticated && role) {
            navigate(role === "instructor" ? "/instructor/dashboard" : "/student/dashboard");
        }
    }, [isAuthenticated, role, navigate]);

    // Handle authentication errors via Toastify alert
    useEffect(() => {
        if (error) {
            toast.error(error, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: document.documentElement.classList.contains("dark") ? "dark" : "light"
            });
            dispatch(clearError());
        }
    }, [error, dispatch]);

    const onSubmit = (data) => {
        dispatch(loginThunk({ email: data.email, password: data.password }));
    };

    return (
        <div ref={containerRef} className={styles.pageWrapper}>
            {/* Ambient Background Circles */}
            <AuthBackground />

            <div className={styles.splitLayout}>
                {/* Left Panel (Decorative - hidden on mobile) */}
                <div className={styles.decorPanel}>
                    <div className={styles.decorContent}>
                        <div className={styles.logoBadge}>
                            <span className={styles.logoIcon}>⚡</span>
                            <span className={styles.logoText}>Quivio</span>
                        </div>
                        <h1 className={styles.decorTitle}>
                            Empowering academic excellence, one quiz at a time.
                        </h1>
                        <ul className={styles.featureList}>
                            <li className={styles.featureItem}>
                                <FiCheck className={styles.checkIcon} />
                                Interactive classrooms & real-time analytics
                            </li>
                            <li className={styles.featureItem}>
                                <FiCheck className={styles.checkIcon} />
                                Automated certificates & achievement badges
                            </li>
                            <li className={styles.featureItem}>
                                <FiCheck className={styles.checkIcon} />
                                Smart revision tools & continuous streaks
                            </li>
                        </ul>

                        {/* Testimonial Quote */}
                        <div className={styles.testimonialCard}>
                            <p className={styles.quoteText}>
                                "Quivio has completely transformed how I track student progress. The gamified streaks keep them highly motivated!"
                            </p>
                            <div className={styles.quoteAuthor}>
                                <div className={styles.authorAvatar}>JS</div>
                                <div>
                                    <div className={styles.authorName}>John Smith</div>
                                    <div className={styles.authorRole}>Biology Instructor</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel (Form) */}
                <div className={styles.formPanel}>
                    <div className={styles.formCard}>
                        <Link to="/" className={`${styles.backToHome} ${styles.formItem}`}>
                            <FiArrowLeft style={{ marginRight: "var(--space-1)" }} /> Back to Home
                        </Link>
                        <div className={`${styles.formHeader} ${styles.formItem}`}>
                            <div className={styles.mobileLogo}>⚡ Quivio</div>
                            <h2>Welcome back</h2>
                            <p>Sign in to your account to continue</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                            <div className={styles.formItem}>
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

                            <div className={`${styles.formItem} ${styles.passwordWrapper}`}>
                                <MainInput
                                    title="Password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    icon={<FiLock />}
                                    hasError={!!errors.password}
                                    errorMsg={errors.password?.message}
                                    register={register("password", {
                                        required: "Password is required"
                                    })}
                                />
                                <button
                                    type="button"
                                    className={styles.eyeButton}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>

                            <div className={`${styles.formItem} ${styles.optionsRow}`}>
                                <label className={styles.rememberMe}>
                                    <input
                                        type="checkbox"
                                        {...register("rememberMe")}
                                        className={styles.checkboxInput}
                                    />
                                    <span>Remember me</span>
                                </label>
                                <Link to="/forgot-password" className={styles.forgotLink}>
                                    Forgot password?
                                </Link>
                            </div>

                            <div className={styles.formItem}>
                                <MainButton
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    isLoading={loading}
                                    className={styles.submitBtn}
                                >
                                    Sign In
                                </MainButton>
                            </div>
                        </form>

                        <div className={`${styles.formFooter} ${styles.formItem}`}>
                            <p>
                                Are you an instructor?{" "}
                                <Link to="/register" className={styles.registerLink}>
                                    Create an account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
