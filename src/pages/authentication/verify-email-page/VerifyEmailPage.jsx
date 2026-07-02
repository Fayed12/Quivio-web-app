// local
import MainButton from "../../../components/ui/button/MainButton";
import AuthBackground from "../../../components/ui/background/AuthBackground";
import { logoutThunk, initAuth } from "../../../redux/slices/authSlice";
import { resendVerificationEmail, getUser } from "../../../services/authService";
import styles from "./VerifyEmailPage.module.css";

// react
import { useState, useEffect, useRef } from "react";

// react-router
import { useNavigate } from "react-router";

// redux
import { useDispatch, useSelector } from "react-redux";

// react-icons
import { FiMail, FiArrowRight, FiInfo } from "react-icons/fi";

// toastify
import { toast } from "react-toastify";

// gsap
import { gsap } from "gsap";

const VerifyEmailPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user, isAuthenticated, role } = useSelector((state) => state.auth);

    const [countdown, setCountdown] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const [resendLimitError, setResendLimitError] = useState(false);

    const containerRef = useRef(null);

    // Redirect guards
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
        if (user?.email_confirmed_at) {
            // Already verified, redirect to dashboard
            navigate(role === "instructor" ? "/instructor/dashboard" : "/student/dashboard");
        }
    }, [isAuthenticated, user, role, navigate]);

    // GSAP Opening Animations
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

    // 45-second countdown timer logic
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    // Polling logic: check if user verified email every 4 seconds
    useEffect(() => {
        if (!isAuthenticated || user?.email_confirmed_at) return;

        const checkVerification = async () => {
            const { data } = await getUser();
            if (data?.user?.email_confirmed_at) {
                toast.success("Account verified successfully! Welcome.", {
                    position: "top-right",
                    autoClose: 4000
                });
                // Initialize Redux store session
                dispatch(initAuth());
                navigate(role === "instructor" ? "/instructor/dashboard" : "/student/dashboard");
            }
        };

        const interval = setInterval(checkVerification, 4000);
        return () => clearInterval(interval);
    }, [isAuthenticated, user, role, dispatch, navigate]);

    // Helper: Mask email string
    const getMaskedEmail = () => {
        const emailStr = user?.email || "";
        if (!emailStr) return "";
        const [name, domain] = emailStr.split("@");
        if (!domain) return emailStr;
        if (name.length <= 2) {
            return `${name[0]}**@${domain}`;
        }
        return `${name.substring(0, 2)}**@${domain}`;
    };

    // Helper: rate limit resends to 3 per hour
    const checkResendLimit = () => {
        const email = user?.email;
        if (!email) return false;

        const key = `resend_ts_${email}`;
        const now = Date.now();
        const hour = 60 * 60 * 1000;
        
        let timestamps = JSON.parse(localStorage.getItem(key) || "[]");
        // Filter timestamps older than 1 hour
        timestamps = timestamps.filter((ts) => now - ts < hour);
        
        if (timestamps.length >= 3) {
            return false;
        }

        timestamps.push(now);
        localStorage.setItem(key, JSON.stringify(timestamps));
        return true;
    };

    const handleResend = async () => {
        if (countdown > 0 || isSending) return;

        // Check rate limits
        if (!checkResendLimit()) {
            setResendLimitError(true);
            toast.error("Resend limit reached. You can resend up to 3 times per hour.", {
                position: "top-right",
                autoClose: 5000
            });
            return;
        }

        setResendLimitError(false);
        setIsSending(true);
        const { error } = await resendVerificationEmail(user.email);
        setIsSending(false);

        if (error) {
            toast.error(error, {
                position: "top-right",
                autoClose: 5000
            });
        } else {
            toast.success("Verification link resent! Please check your inbox.", {
                position: "top-right",
                autoClose: 5000
            });
            setCountdown(45);
        }
    };

    const handleSignOut = () => {
        dispatch(logoutThunk());
    };

    return (
        <div ref={containerRef} className={styles.pageWrapper}>
            <AuthBackground />

            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={`${styles.iconWrapper} ${styles.animItem}`}>
                        <FiMail className={styles.mailIcon} />
                    </div>

                    <h1 className={`${styles.title} ${styles.animItem}`}>
                        Check your inbox
                    </h1>
                    
                    <p className={`${styles.description} ${styles.animItem}`}>
                        We sent a verification link to <strong className={styles.emailText}>{getMaskedEmail()}</strong>. 
                        Please click the link in that email to confirm your account.
                    </p>

                    {resendLimitError && (
                        <div className={`${styles.limitAlert} ${styles.animItem}`}>
                            <FiInfo className={styles.alertIcon} />
                            <span>Resend limit reached. Try again in an hour.</span>
                        </div>
                    )}

                    <div className={`${styles.actions} ${styles.animItem}`}>
                        <MainButton
                            onClick={handleResend}
                            variant={countdown > 0 ? "outline" : "primary"}
                            size="md"
                            disabled={countdown > 0 || isSending}
                            isLoading={isSending}
                            className={styles.resendBtn}
                        >
                            {countdown > 0 ? `Resend in ${countdown}s` : "Resend verification email"}
                        </MainButton>
                    </div>

                    <div className={`${styles.footer} ${styles.animItem}`}>
                        <button onClick={handleSignOut} className={styles.signoutLink}>
                            Wrong email? Sign out and try again <FiArrowRight className={styles.arrowIcon} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
