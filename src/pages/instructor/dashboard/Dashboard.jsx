// react
import { useEffect, useRef } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";
import { logoutThunk, selectProfile } from "../../../redux/slices/authSlice";

// components
import MainButton from "../../../components/ui/button/MainButton";

// gsap
import { gsap } from "gsap";

const InstructorDashboard = () => {
    const dispatch = useDispatch();
    const profile = useSelector(selectProfile);
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(containerRef.current,
                { opacity: 0, scale: 0.95, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "power3.out" }
            );
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const handleSignOut = () => {
        dispatch(logoutThunk());
    };

    return (
        <div 
            ref={containerRef}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                padding: "2rem",
                backgroundColor: "var(--bg-app)",
                color: "var(--text-primary)"
            }}
        >
            <div 
                style={{
                    background: "var(--bg-surface)",
                    maxWidth: "500px",
                    width: "100%",
                    padding: "2.5rem",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-lg)",
                    border: "1px solid var(--border-default)",
                    textAlign: "center"
                }}
            >
                <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>👨‍🏫</div>
                <h1 style={{ 
                    fontSize: "var(--text-2xl)", 
                    fontWeight: "var(--fw-bold)", 
                    marginBottom: "0.5rem" 
                }}>
                    Instructor Dashboard
                </h1>
                <p style={{ 
                    fontSize: "var(--text-sm)", 
                    color: "var(--text-secondary)", 
                    marginBottom: "2rem" 
                }}>
                    Hello, <strong style={{ color: "var(--color-accent)" }}>{profile?.full_name || "Instructor"}</strong>! Welcome to your Instructor Dashboard.
                </p>
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <MainButton onClick={handleSignOut} variant="outline" size="md">
                        Sign Out
                    </MainButton>
                </div>
            </div>
        </div>
    );
};

export default InstructorDashboard;
