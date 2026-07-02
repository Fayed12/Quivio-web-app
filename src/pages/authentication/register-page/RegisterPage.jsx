// local
import MainButton from "../../../components/ui/button/MainButton";
import MainInput from "../../../components/ui/input/MainInput";
import AuthBackground from "../../../components/ui/background/AuthBackground";
import { registerInstructorThunk, clearError } from "../../../redux/slices/authSlice";
import styles from "./RegisterPage.module.css";

// react
import { useState, useEffect, useRef } from "react";

// react-router
import { useNavigate, Link } from "react-router";

// redux
import { useDispatch, useSelector } from "react-redux";

// react-hook-form
import { useForm } from "react-hook-form";

// react-icons
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiInfo } from "react-icons/fi";

// toastify
import { toast } from "react-toastify";

// gsap
import { gsap } from "gsap";

const RegisterPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error, successMessage, isAuthenticated, role, user, profile } = useSelector((state) => state.auth);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const containerRef = useRef(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm({
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
            terms: false
        }
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const watchedPassword = watch("password", "");

    // Calculate password strength in real time
    useEffect(() => {
        if (!watchedPassword) {
            setPasswordStrength(0);
            return;
        }
        let score = 0;
        if (watchedPassword.length >= 8) score++;
        if (/[A-Z]/.test(watchedPassword)) score++;
        if (/[a-z]/.test(watchedPassword)) score++;
        if (/[0-9]/.test(watchedPassword)) score++;
        if (/[^A-Za-z0-9]/.test(watchedPassword)) score++;

        // Map to 4 segments (1-4)
        if (score <= 1) setPasswordStrength(1); // Weak
        else if (score === 2 || score === 3) setPasswordStrength(2); // Fair
        else if (score === 4) setPasswordStrength(3); // Strong
        else if (score === 5) setPasswordStrength(4); // Very Strong
    }, [watchedPassword]);

    // GSAP Opening Animations
    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            // Left panel text slide-in
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

    // Redirect to Verify Email on successful sign up
    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage, {
                position: "top-right",
                autoClose: 5000,
                theme: document.documentElement.classList.contains("dark") ? "dark" : "light"
            });
            dispatch(clearError());
            navigate("/verify-email");
        }
    }, [successMessage, navigate, dispatch]);

    // Redirect if already authenticated and role is instructor
    useEffect(() => {
        if (isAuthenticated && role === "instructor") {
            navigate("/instructor/dashboard");
        }
    }, [isAuthenticated, role, navigate]);

    // Handle registration errors via Toastify alert
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
        dispatch(registerInstructorThunk({
            full_name: data.fullName,
            email: data.email,
            password: data.password
        }));
    };

    const getStrengthLabel = () => {
        switch (passwordStrength) {
            case 1: return "Weak";
            case 2: return "Fair";
            case 3: return "Strong";
            case 4: return "Very Strong";
            default: return "";
        }
    };

    const getStrengthColor = () => {
        switch (passwordStrength) {
            case 1: return styles.strengthWeak;
            case 2: return styles.strengthFair;
            case 3: return styles.strengthStrong;
            case 4: return styles.strengthVeryStrong;
            default: return "";
        }
    };

    // ── Render Blocked student state ──
    const isStudent = isAuthenticated && role === "student";

    return (
        <div ref={containerRef} className={styles.pageWrapper}>
            <AuthBackground />

            <div className={styles.splitLayout}>
                {/* Left Panel - Instructor Focused Marketing (hidden if student is blocked) */}
                {!isStudent && (
                    <div className={styles.decorPanel}>
                        <div className={styles.decorContent}>
                            <div className={styles.logoBadge}>
                                <span className={styles.logoIcon}>⚡</span>
                                <span className={styles.logoText}>Quivio</span>
                            </div>
                            <h1 className={styles.decorTitle}>
                                Start teaching today and elevate student learning.
                            </h1>
                            <ul className={styles.featureList}>
                                <li className={styles.featureItem}>
                                    <FiCheck className={styles.checkIcon} />
                                    Create quizzes with AI-assisted workflows
                                </li>
                                <li className={styles.featureItem}>
                                    <FiCheck className={styles.checkIcon} />
                                    Manage student classrooms & track completion rates
                                </li>
                                <li className={styles.featureItem}>
                                    <FiCheck className={styles.checkIcon} />
                                    Customize certificate branding & templates
                                </li>
                            </ul>

                            {/* Testimonial Quote */}
                            <div className={styles.testimonialCard}>
                                <p className={styles.quoteText}>
                                    "As an instructor, Quivio makes it incredibly simple to set up rooms and distribute custom, automated certificates. The insights panel is spectacular."
                                </p>
                                <div className={styles.quoteAuthor}>
                                    <div className={styles.authorAvatar}>ML</div>
                                    <div>
                                        <div className={styles.authorName}>Maria Lopez</div>
                                        <div className={styles.authorRole}>Math Professor</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Right Panel (Forms / Student Info Card) */}
                <div className={isStudent ? styles.fullPanel : styles.formPanel}>
                    <div className={styles.formCard}>
                        {isStudent ? (
                            // Render Student Profile Detail Card
                            <div className={styles.studentBlock}>
                                <div className={styles.studentBlockHeader}>
                                    <div className={styles.alertIconWrapper}>
                                        <FiInfo className={styles.alertIcon} />
                                    </div>
                                    <h2>Student Account Active</h2>
                                    <p>Self-registration is reserved for instructors.</p>
                                </div>

                                <div className={styles.profileCard}>
                                    <div className={styles.avatarCircle}>
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Profile" className={styles.avatarImg} />
                                        ) : (
                                            profile?.full_name?.substring(0, 2).toUpperCase() || "ST"
                                        )}
                                    </div>
                                    <h3 className={styles.profileName}>{profile?.full_name || "Student User"}</h3>
                                    <p className={styles.profileEmail}>{user?.email || profile?.email}</p>

                                    <div className={styles.statsGrid}>
                                        <div className={styles.statBox}>
                                            <span className={styles.statEmoji}>🔥</span>
                                            <div className={styles.statLabel}>Streak</div>
                                            <div className={styles.statVal}>{profile?.streak ?? 0} days</div>
                                        </div>
                                        <div className={styles.statBox}>
                                            <span className={styles.statEmoji}>⚡</span>
                                            <div className={styles.statLabel}>Level</div>
                                            <div className={styles.statVal}>Lvl {profile?.level ?? 1}</div>
                                        </div>
                                        <div className={styles.statBox}>
                                            <span className={styles.statEmoji}>🏆</span>
                                            <div className={styles.statLabel}>XP</div>
                                            <div className={styles.statVal}>{profile?.xp ?? 0} XP</div>
                                        </div>
                                    </div>
                                </div>

                                <p className={styles.blockMessage}>
                                    Student accounts are managed and created directly by your instructor. You are currently logged in with a student profile. Feel free to access your dashboard to start taking quizzes!
                                </p>

                                <div className={styles.blockAction}>
                                    <MainButton
                                        onClick={() => navigate("/student/dashboard")}
                                        variant="primary"
                                        size="lg"
                                        className={styles.dashboardBtn}
                                    >
                                        Go to Student Dashboard
                                    </MainButton>
                                </div>
                            </div>
                        ) : (
                            // Render Instructor Registration Form
                            <>
                                <div className={`${styles.formHeader} ${styles.formItem}`}>
                                    <div className={styles.mobileLogo}>⚡ Quivio</div>
                                    <h2>Create Instructor Account</h2>
                                    <p>Set up your teaching profile</p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                                    <div className={styles.formItem}>
                                        <MainInput
                                            title="Full Name"
                                            type="text"
                                            name="fullName"
                                            placeholder="Enter your full name"
                                            icon={<FiUser />}
                                            hasError={!!errors.fullName}
                                            errorMsg={errors.fullName?.message}
                                            register={register("fullName", {
                                                required: "Full name is required",
                                                minLength: { value: 2, message: "Name must be at least 2 characters" },
                                                maxLength: { value: 60, message: "Name must not exceed 60 characters" }
                                            })}
                                        />
                                    </div>

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
                                            placeholder="Create a strong password"
                                            icon={<FiLock />}
                                            hasError={!!errors.password}
                                            errorMsg={errors.password?.message}
                                            register={register("password", {
                                                required: "Password is required",
                                                minLength: { value: 8, message: "Password must be at least 8 characters" },
                                                pattern: {
                                                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                                                    message: "Must contain 1 uppercase, 1 lowercase, 1 digit, and 1 special char"
                                                }
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

                                    {/* Real-time Password Strength Meter */}
                                    {watchedPassword && (
                                        <div className={`${styles.formItem} ${styles.strengthMeter}`}>
                                            <div className={styles.strengthHeader}>
                                                <span>Password Strength:</span>
                                                <strong className={getStrengthColor()}>{getStrengthLabel()}</strong>
                                            </div>
                                            <div className={styles.strengthBarContainer}>
                                                <div className={`${styles.strengthSegment} ${passwordStrength >= 1 ? getStrengthColor() : ""}`} />
                                                <div className={`${styles.strengthSegment} ${passwordStrength >= 2 ? getStrengthColor() : ""}`} />
                                                <div className={`${styles.strengthSegment} ${passwordStrength >= 3 ? getStrengthColor() : ""}`} />
                                                <div className={`${styles.strengthSegment} ${passwordStrength >= 4 ? getStrengthColor() : ""}`} />
                                            </div>
                                        </div>
                                    )}

                                    <div className={`${styles.formItem} ${styles.passwordWrapper}`}>
                                        <MainInput
                                            title="Confirm Password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            placeholder="Confirm your password"
                                            icon={<FiLock />}
                                            hasError={!!errors.confirmPassword}
                                            errorMsg={errors.confirmPassword?.message}
                                            register={register("confirmPassword", {
                                                required: "Please confirm your password",
                                                validate: (val) => val === watchedPassword || "Passwords do not match"
                                            })}
                                        />
                                        <button
                                            type="button"
                                            className={styles.eyeButton}
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>

                                    <div className={`${styles.formItem} ${styles.termsRow}`}>
                                        <label className={styles.termsLabel}>
                                            <input
                                                type="checkbox"
                                                {...register("terms", { required: "You must agree to the Terms of Service" })}
                                                className={styles.checkboxInput}
                                            />
                                            <span>
                                                I agree to the <Link to="/terms" className={styles.inlineLink}>Terms of Service</Link> and <Link to="/privacy" className={styles.inlineLink}>Privacy Policy</Link>
                                            </span>
                                        </label>
                                        {errors.terms && <p className={styles.checkboxError} role="alert">{errors.terms.message}</p>}
                                    </div>

                                    <div className={styles.formItem}>
                                        <MainButton
                                            type="submit"
                                            variant="primary"
                                            size="lg"
                                            isLoading={loading}
                                            className={styles.submitBtn}
                                        >
                                            Create Instructor Account
                                        </MainButton>
                                    </div>
                                </form>

                                <div className={`${styles.formFooter} ${styles.formItem}`}>
                                    <p>
                                        Already have an account?{" "}
                                        <Link to="/login" className={styles.loginLink}>
                                            Sign in
                                        </Link>
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
