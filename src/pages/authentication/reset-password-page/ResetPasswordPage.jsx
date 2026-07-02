// local
import MainButton from "../../../components/ui/button/MainButton";
import MainInput from "../../../components/ui/input/MainInput";
import AuthBackground from "../../../components/ui/background/AuthBackground";
import { resetPasswordThunk, setMustChangePassword, logoutThunk, clearError } from "../../../redux/slices/authSlice";
import { markPasswordChanged } from "../../../services/profilesService";
import styles from "./ResetPasswordPage.module.css";

// react
import { useState, useEffect, useRef } from "react";

// react-router
import { useNavigate, Link } from "react-router";

// redux
import { useDispatch, useSelector } from "react-redux";

// react-hook-form
import { useForm } from "react-hook-form";

// react-icons
import { FiLock, FiEye, FiEyeOff, FiAlertTriangle } from "react-icons/fi";

// toastify
import { toast } from "react-toastify";

// gsap
import { gsap } from "gsap";

const ResetPasswordPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error, successMessage, isAuthenticated, role, mustChangePassword } = useSelector((state) => state.auth);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const [isValidToken, setIsValidToken] = useState(true);
    const [isCheckingToken, setIsCheckingToken] = useState(true);

    const containerRef = useRef(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm({
        defaultValues: {
            password: "",
            confirmPassword: ""
        }
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const watchedPassword = watch("password", "");

    // Token Validation Logic on page load
    useEffect(() => {
        // If authenticated (logged in, or session active), we can proceed
        if (isAuthenticated) {
            setIsValidToken(true);
            setIsCheckingToken(false);
            return;
        }

        // Otherwise, inspect URL hash and search params for Supabase recovery signatures
        const hash = window.location.hash || "";
        const search = window.location.search || "";
        const hasAccessToken = hash.includes("access_token") || search.includes("access_token") || search.includes("token");
        const isRecovery = hash.includes("type=recovery") || search.includes("type=recovery") || hash.includes("recovery") || search.includes("recovery");

        if (hasAccessToken || isRecovery) {
            setIsValidToken(true);
        } else {
            // No session and no recovery tokens, block route
            setIsValidToken(false);
        }
        setIsCheckingToken(false);
    }, [isAuthenticated]);

    // Password strength calculation
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

        if (score <= 1) setPasswordStrength(1);
        else if (score === 2 || score === 3) setPasswordStrength(2);
        else if (score === 4) setPasswordStrength(3);
        else if (score === 5) setPasswordStrength(4);
    }, [watchedPassword]);

    // GSAP Entry Animation
    useEffect(() => {
        if (isCheckingToken) return;

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
    }, [isCheckingToken]);

    // Handle authentication errors via Toastify alert
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

    // Handle success actions
    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage, {
                position: "top-right",
                autoClose: 4000,
                theme: document.documentElement.classList.contains("dark") ? "dark" : "light"
            });
            dispatch(clearError());
            
            // Sign out to invalidate all sessions and ensure clean login
            dispatch(logoutThunk()).then(() => {
                navigate("/login");
            });
        }
    }, [successMessage, dispatch, navigate]);

    const onSubmit = async (data) => {
        // Submit password change
        dispatch(resetPasswordThunk(data.password)).then(async (actionResult) => {
            if (resetPasswordThunk.fulfilled.match(actionResult)) {
                // If it is first-time student login password change, mark as updated in DB
                if (role === "student" && mustChangePassword) {
                    await markPasswordChanged();
                    dispatch(setMustChangePassword(false));
                }
            }
        });
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

    if (isCheckingToken) {
        return (
            <div className={styles.pageWrapper}>
                <AuthBackground />
                <div className={styles.loadingSpinner}>Loading...</div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={styles.pageWrapper}>
            <AuthBackground />

            <div className={styles.container}>
                <div className={styles.card}>
                    {isValidToken ? (
                        <>
                            <div className={`${styles.header} ${styles.animItem}`}>
                                <h2>
                                    {role === "student" && mustChangePassword
                                        ? "Secure your student account"
                                        : "Reset your password"}
                                </h2>
                                <p>Please choose a new, secure password below.</p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                                <div className={`${styles.animItem} ${styles.passwordWrapper}`}>
                                    <MainInput
                                        title="New Password"
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

                                {/* Password Strength Meter */}
                                {watchedPassword && (
                                    <div className={`${styles.animItem} ${styles.strengthMeter}`}>
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

                                <div className={`${styles.animItem} ${styles.passwordWrapper}`}>
                                    <MainInput
                                        title="Confirm New Password"
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

                                <div className={styles.animItem}>
                                    <MainButton
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        isLoading={loading}
                                        className={styles.submitBtn}
                                    >
                                        Reset password
                                    </MainButton>
                                </div>
                            </form>
                        </>
                    ) : (
                        /* Token Invalid / Expired State */
                        <div className={styles.invalidTokenState}>
                            <div className={`${styles.warningIconWrapper} ${styles.animItem}`}>
                                <FiAlertTriangle className={styles.warningIcon} />
                            </div>
                            <h2 className={styles.animItem}>Link Expired or Invalid</h2>
                            <p className={styles.animItem}>
                                This password recovery link is expired, invalid, or has already been used. 
                                Please request a new recovery link.
                            </p>
                            <div className={`${styles.actions} ${styles.animItem}`}>
                                <MainButton
                                    onClick={() => navigate("/forgot-password")}
                                    variant="primary"
                                    size="md"
                                    className={styles.submitBtn}
                                >
                                    Request New Link
                                </MainButton>
                            </div>
                        </div>
                    )}

                    <div className={`${styles.footer} ${styles.animItem}`}>
                        <Link to="/login" className={styles.backLink}>
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
