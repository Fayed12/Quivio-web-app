// react
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// date-fns
import { format } from "date-fns";

// redux
import { selectProfile } from "../../../redux/slices/authSlice";
import { updateProfileThunk, updateProfileLocal } from "../../../redux/slices/profilesSlice";
import { fetchMyStats, selectMyStats } from "../../../redux/slices/attemptsSlice";
import { fetchMyCertificates, selectMyCertificates } from "../../../redux/slices/certificatesSlice";

// components
import MainButton from "../../../components/ui/button/MainButton";
import MainInput from "../../../components/ui/input/MainInput";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";

// supabase
import { supabase } from "../../../services/config/supabaseClient";

// react-icons
import {
    FiUser,
    FiLock,
    FiBarChart2,
    FiAward,
    FiDownload,
    FiLink
} from "react-icons/fi";

// local
import styles from "./Profile.module.css";
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

const PRESET_AVATARS = [
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Buddy",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Kiki",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Mimi",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Leo",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Coco",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Lucky",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Cookie"
];

const StudentProfile = () => {
    const dispatch = useDispatch();
    const profile = useSelector(selectProfile);
    const stats = useSelector(selectMyStats);
    const certs = useSelector(selectMyCertificates) || [];

    const containerRef = useRef(null);
    const [activeTab, setActiveTab] = useState("personal"); // personal | security | statistics | certificates
    const [selectedAvatar, setSelectedAvatar] = useState("");

    // Personal Info Form
    const { register: registerPersonal, handleSubmit: handleSubmitPersonal, reset: resetPersonal } = useForm();
    // Password change form
    const { register: registerPass, handleSubmit: handleSubmitPass, reset: resetPass } = useForm();

    // Entrance Animation
    usePageAnimation(containerRef, {
        ready: !!profile
    });

    useEffect(() => {
        dispatch(fetchMyStats());
        dispatch(fetchMyCertificates());
    }, [dispatch]);

    useEffect(() => {
        if (profile) {
            resetPersonal({
                full_name: profile.full_name || "",
                bio: profile.bio || "",
                phone: profile.phone || "",
                country: profile.country || ""
            });
            setSelectedAvatar(profile.avatar_url || PRESET_AVATARS[0]);
        }
    }, [profile, resetPersonal]);

    // Handle profile update
    const onSavePersonal = async (data) => {
        // 1. Update text fields using thunk
        const result = await dispatch(updateProfileThunk(data));
        
        if (updateProfileThunk.fulfilled.match(result)) {
            // 2. Update avatar_url directly in supabase table
            const { error: avatarError } = await supabase
                .from("profiles")
                .update({ avatar_url: selectedAvatar })
                .eq("uid", profile.uid);

            if (!avatarError) {
                dispatch(updateProfileLocal({ avatar_url: selectedAvatar }));
                toast.success("Profile updated successfully!");
            } else {
                toast.error("Failed to update avatar.");
            }
        } else {
            toast.error(result.payload || "Failed to save profile changes.");
        }
    };

    // Handle password change
    const onUpdatePassword = async (data) => {
        if (data.new_password !== data.confirm_password) {
            toast.error("New passwords do not match.");
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: data.new_password });
        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Password updated successfully!");
            resetPass();
        }
    };

    const handleCopyVerifyLink = (code) => {
        const link = `${window.location.origin}/verify/${code}`;
        navigator.clipboard.writeText(link);
        toast.success("Verification link copied!");
    };

    return (
        <div ref={containerRef} className={styles.profileContainer}>
            {/* Header */}
            <div style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-4)" }}>
                <h1 className="h1">Student Profile</h1>
                <p className="text-sm text-secondary">Manage your personal settings, password details, and view your verified certificates.</p>
            </div>

            {/* Profile Grid Layout */}
            <div className={styles.profileLayout}>
                {/* Left Column */}
                <div className={styles.leftCol}>
                    <div className={`${styles.card} ${styles.summaryCard}`}>
                        <img 
                            src={selectedAvatar} 
                            alt={profile?.full_name} 
                            className={styles.avatarBig} 
                        />
                        <div className={styles.nameBig}>{profile?.full_name}</div>
                        <span className="scoreBadge scorePass" style={{ textTransform: "uppercase", fontSize: "10px" }}>
                            {profile?.is_active ? "Active Student" : "Deactivated"}
                        </span>
                        
                        <div className="flex gap-4" style={{ marginTop: "var(--space-2)" }}>
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-md text-primary">Lvl {profile?.level || 1}</span>
                                <span className="text-xs text-muted">Level</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-md text-primary">{profile?.streak || 0}d</span>
                                <span className="text-xs text-muted">Streak</span>
                            </div>
                        </div>
                    </div>

                    {/* Nav Tabs */}
                    <div className={styles.tabsList}>
                        <button
                            onClick={() => setActiveTab("personal")}
                            className={`${styles.tabBtn} ${activeTab === "personal" ? styles.tabBtnActive : ""}`}
                        >
                            <FiUser style={{ marginRight: "8px", verticalAlign: "middle" }} /> Personal Info
                        </button>
                        <button
                            onClick={() => setActiveTab("security")}
                            className={`${styles.tabBtn} ${activeTab === "security" ? styles.tabBtnActive : ""}`}
                        >
                            <FiLock style={{ marginRight: "8px", verticalAlign: "middle" }} /> Security
                        </button>
                        <button
                            onClick={() => setActiveTab("statistics")}
                            className={`${styles.tabBtn} ${activeTab === "statistics" ? styles.tabBtnActive : ""}`}
                        >
                            <FiBarChart2 style={{ marginRight: "8px", verticalAlign: "middle" }} /> Statistics
                        </button>
                        <button
                            onClick={() => setActiveTab("certificates")}
                            className={`${styles.tabBtn} ${activeTab === "certificates" ? styles.tabBtnActive : ""}`}
                        >
                            <FiAward style={{ marginRight: "8px", verticalAlign: "middle" }} /> Certificates
                        </button>
                    </div>
                </div>

                {/* Right Column */}
                <div className={styles.rightCol}>
                    {activeTab === "personal" && (
                        <div className={styles.card}>
                            <h3 className="h3">Personal Information</h3>
                            <form onSubmit={handleSubmitPersonal(onSavePersonal)} className={styles.formGrid}>
                                <MainInput
                                    title="Full Name"
                                    placeholder="Enter your name"
                                    register={registerPersonal("full_name")}
                                />
                                <MainInput
                                    title="Email Address (Username)"
                                    value={profile?.email || ""}
                                    disabled
                                    placeholder="email@example.com"
                                />

                                {/* Avatar selector presets */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                                    <span className={styles.avatarSelectionLabel}>Choose an Avatar</span>
                                    <div className={styles.avatarsGrid}>
                                        {PRESET_AVATARS.map(url => (
                                            <img
                                                key={url}
                                                src={url}
                                                alt="avatar preset"
                                                onClick={() => setSelectedAvatar(url)}
                                                className={`${styles.avatarSelectable} ${selectedAvatar === url ? styles.avatarSelected : ""}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <MainInput
                                    title="Bio description"
                                    placeholder="Write a brief bio..."
                                    register={registerPersonal("bio")}
                                />
                                <MainInput
                                    title="Phone"
                                    placeholder="Phone number"
                                    register={registerPersonal("phone")}
                                />
                                <MainInput
                                    title="Country"
                                    placeholder="Country"
                                    register={registerPersonal("country")}
                                />

                                <MainButton type="submit" variant="primary" size="md">
                                    Save Changes
                                </MainButton>
                            </form>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className={styles.card}>
                            <h3 className="h3">Update Security Password</h3>
                            <form onSubmit={handleSubmitPass(onUpdatePassword)} className={styles.formGrid}>
                                <MainInput
                                    title="New Password"
                                    type="password"
                                    placeholder="Enter new password"
                                    register={registerPass("new_password", { required: true })}
                                />
                                <MainInput
                                    title="Confirm New Password"
                                    type="password"
                                    placeholder="Confirm new password"
                                    register={registerPass("confirm_password", { required: true })}
                                />

                                <MainButton type="submit" variant="primary" size="md">
                                    Update Password
                                </MainButton>
                            </form>
                        </div>
                    )}

                    {activeTab === "statistics" && (
                        <div className={styles.card}>
                            <h3 className="h3">Personal Statistics logs</h3>
                            <div className="flex flex-col gap-1">
                                <div className={styles.statRowItem}>
                                    <span className="text-secondary">Level Badge Rating</span>
                                    <strong className="text-primary">Level {profile?.level || 1} ({profile?.xp || 0} XP)</strong>
                                </div>
                                <div className={styles.statRowItem}>
                                    <span className="text-secondary">Total Quiz Attempts completed</span>
                                    <strong className="text-primary">{stats?.total_attempts || 0} attempts</strong>
                                </div>
                                <div className={styles.statRowItem}>
                                    <span className="text-secondary">Average Score achieved</span>
                                    <strong className="text-success">{stats?.avg_score ? `${Math.round(stats.avg_score)}%` : "0%"}</strong>
                                </div>
                                <div className={styles.statRowItem}>
                                    <span className="text-secondary">Best Attempt Score</span>
                                    <strong className="text-primary">{stats?.best_score ? `${Math.round(stats.best_score)}%` : "0%"}</strong>
                                </div>
                                <div className={styles.statRowItem}>
                                    <span className="text-secondary">Active Activity Streak</span>
                                    <strong className="text-primary">🔥 {profile?.streak || 0} days</strong>
                                </div>
                                <div className={styles.statRowItem}>
                                    <span className="text-secondary">Longest Streak record</span>
                                    <strong className="text-primary">{profile?.longest_streak || 0} days</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "certificates" && (
                        <div className={styles.card}>
                            <h3 className="h3">Verified Certificates</h3>
                            {certs.length === 0 ? (
                                <p className="text-secondary text-sm">You haven't earned any certificates yet. Pass quizzes to earn them!</p>
                            ) : (
                                <div className={styles.certsGrid}>
                                    {certs.map(c => (
                                        <div key={c.id} className={styles.certCard}>
                                            <span className={styles.certTitle}>{c.quiz?.title}</span>
                                            <span className={styles.certMeta}>Code: <code>{c.certificate_code}</code></span>
                                            <span className={styles.certMeta}>Issued: {format(new Date(c.issued_at), "PP")}</span>
                                            
                                            <div className="flex gap-2" style={{ marginTop: "var(--space-2)" }}>
                                                <button
                                                    onClick={() => handleCopyVerifyLink(c.certificate_code)}
                                                    className="btn btn--outline btn--sm"
                                                    title="Copy verification link"
                                                    style={{ padding: "4px" }}
                                                >
                                                    <FiLink />
                                                </button>
                                                <MainButton
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => window.open(c.pdf_url, "_blank")}
                                                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                                                >
                                                    <FiDownload /> PDF
                                                </MainButton>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
