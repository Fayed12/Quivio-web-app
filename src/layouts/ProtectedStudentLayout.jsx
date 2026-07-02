// react
import { useState, useEffect, useRef } from "react";

// react-router
import { Navigate, Outlet, useNavigate } from "react-router";

// redux
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectRole, selectIsInitializing, selectMustChangePassword } from "../redux/slices/authSlice";

// components
import MainButton from "../components/ui/button/MainButton";

// gsap
import { gsap } from "gsap";

const ProtectedStudentLayout = () => {
    const isAuth = useSelector(selectIsAuthenticated);
    const role = useSelector(selectRole);
    const isInitializing = useSelector(selectIsInitializing);
    const mustChangePwd = useSelector(selectMustChangePassword);
    
    const navigate = useNavigate();

    // Local state to track if student skipped password change prompt in this session
    const [showPrompt, setShowPrompt] = useState(false);
    
    const modalRef = useRef(null);
    const backdropRef = useRef(null);

    useEffect(() => {
        // If must change password is true, and they haven't skipped yet, show the prompt
        if (isAuth && role === "student" && mustChangePwd && !sessionStorage.getItem("skippedPasswordChange")) {
            const timer = setTimeout(() => setShowPrompt(true), 0);
            return () => clearTimeout(timer);
        }
    }, [isAuth, role, mustChangePwd]);

    // GSAP Animation when prompt state is activated
    useEffect(() => {
        if (showPrompt) {
            const ctx = gsap.context(() => {
                gsap.fromTo(backdropRef.current, 
                    { opacity: 0 },
                    { opacity: 1, duration: 0.3, ease: "power2.out" }
                );
                gsap.fromTo(modalRef.current,
                    { scale: 0.9, y: 30, opacity: 0 },
                    { scale: 1, y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }
                );
            });
            return () => ctx.revert();
        }
    }, [showPrompt]);

    if (isInitializing) return null;

    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    if (role !== "student") {
        if (role === "instructor") {
            return <Navigate to="/instructor/dashboard" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    const handleSkip = () => {
        // Animate out and then hide
        gsap.to(modalRef.current, {
            scale: 0.95,
            y: 15,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
                sessionStorage.setItem("skippedPasswordChange", "true");
                setShowPrompt(false);
            }
        });
        gsap.to(backdropRef.current, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.in"
        });
    };

    const handleGoToReset = () => {
        setShowPrompt(false);
        navigate("/reset-password");
    };

    return (
        <>
            <Outlet />
            
            {showPrompt && (
                <div 
                    ref={backdropRef}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(15, 23, 42, 0.6)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "1rem"
                    }}
                >
                    <div 
                        ref={modalRef}
                        style={{
                            background: "var(--bg-surface)",
                            maxWidth: "420px",
                            width: "100%",
                            padding: "2rem",
                            borderRadius: "var(--radius-lg)",
                            boxShadow: "var(--shadow-xl)",
                            border: "1px solid var(--border-default)",
                            textAlign: "center"
                        }}
                    >
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }} role="img" aria-label="Shield">
                            🛡️
                        </div>
                        <h2 style={{ 
                            fontSize: "var(--text-xl)", 
                            fontWeight: "var(--fw-bold)", 
                            color: "var(--text-primary)",
                            marginBottom: "1rem"
                        }}>
                            Secure Your Account
                        </h2>
                        <p style={{ 
                            fontSize: "var(--text-sm)", 
                            color: "var(--text-secondary)",
                            lineHeight: "var(--leading-normal)",
                            marginBottom: "2rem"
                        }}>
                            Welcome to Quivio! Your account has been initialized with a temporary password. To keep your learning achievements and profile secure, please set a password of your choice.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <MainButton onClick={handleGoToReset} variant="primary" size="md">
                                Set Up Secure Password
                            </MainButton>
                            <MainButton onClick={handleSkip} variant="ghost" size="md">
                                Keep Using Current (Skip)
                            </MainButton>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProtectedStudentLayout;
