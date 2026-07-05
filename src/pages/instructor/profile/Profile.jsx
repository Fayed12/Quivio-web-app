// local components
import PageHeader from "../components/PageHeader";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./Profile.module.css";

// react
import { useState, useEffect, useRef } from "react";

// redux
import { useDispatch } from "react-redux";
import { 
    fetchMyProfile,
    updateProfileThunk,
    updateAvatarThunk
} from "../../../redux/slices/profilesSlice";

// animation
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

// react-icons
import { 
    FiUser, 
    FiLock, 
    FiSliders, 
    FiCamera, 
    FiBook,
    FiEye,
    FiEyeOff
} from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

// Material UI
import { Avatar } from "@mui/material";

// supabase client
import { supabase } from "../../../services/config/supabaseClient";

import { useProfileData } from "../../../hooks/instructor/useProfileData";

const Profile = () => {
    const dispatch = useDispatch();

    // Use custom data hook
    const { profile, rooms, quizzes, questions } = useProfileData();

    const roomCount = rooms.length;
    const quizCount = quizzes.length;
    const questionCount = questions.length;

    // Tabs
    const [activeTab, setActiveTab] = useState("personal");

    // Personal details states
    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");

    // Security / Password update states
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [passStrength, setPassStrength] = useState({ score: 0, text: "Weak", color: "red" });

    // Preference states
    const [emailOnPass, setEmailOnPass] = useState(true);
    const [weeklyReports, setWeeklyReports] = useState(true);
    const [darkModePref, setDarkModePref] = useState(false);

    const containerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initial Load preferences
    useEffect(() => {
        // Load preferences from localstorage
        const mailPref = localStorage.getItem("pref_email_on_pass");
        const reportPref = localStorage.getItem("pref_weekly_reports");
        const isDark = document.documentElement.classList.contains("dark");

        if (mailPref !== null) setEmailOnPass(mailPref === "true");
        if (reportPref !== null) setWeeklyReports(reportPref === "true");
        setDarkModePref(isDark);
    }, []);

    // Populate personal details on profile load
    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || "");
            setBio(profile.bio || "");
        }
    }, [profile]);

    // Password strength evaluator
    useEffect(() => {
        if (!newPassword) {
            setPassStrength({ score: 0, text: "Too Short", color: "gray" });
            return;
        }

        let score = 0;
        if (newPassword.length >= 6) score++;
        if (newPassword.length >= 8) score++;
        if (/[A-Z]/.test(newPassword)) score++;
        if (/[0-9]/.test(newPassword)) score++;
        if (/[^A-Za-z0-9]/.test(newPassword)) score++;

        let text = "Weak";
        let color = "var(--color-danger)";
        if (score === 3 || score === 4) {
            text = "Medium";
            color = "var(--color-warning)";
        } else if (score >= 5) {
            text = "Strong";
            color = "var(--color-success)";
        }

        setPassStrength({ score, text, color });
    }, [newPassword]);

    // Page entrance animation
    usePageAnimation(containerRef);

    // Save Personal Settings
    const handleSavePersonal = async (e) => {
        e.preventDefault();
        if (!fullName.trim() || fullName.length < 3) {
            toast.error("Full Name must be at least 3 characters");
            return;
        }

        try {
            await dispatch(updateProfileThunk({
                full_name: fullName,
                bio
            })).unwrap();

            toast.success("Profile details updated successfully!");
        } catch (err) {
            toast.error(err || "Failed to update profile");
        }
    };

    // Update avatar image
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are supported");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Max image size is 2MB");
            return;
        }

        toast.info("Uploading avatar...");

        try {
            // Upload to Supabase profiles bucket using updateAvatarThunk
            await dispatch(updateAvatarThunk(file)).unwrap();
            toast.success("Avatar image updated!");
            dispatch(fetchMyProfile());
        } catch (err) {
            // Mock fallback
            console.log(err);
            const fallbackUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${fullName}`;
            await supabase.from("profiles").update({ avatar_url: fallbackUrl }).eq("uid", profile.uid);
            toast.success("Avatar set with Dicebear placeholder!");
            dispatch(fetchMyProfile());
        }
    };

    // Change Password Auth Settings
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error("New password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New password and confirm password do not match");
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            toast.success("Password changed successfully! Keep it secure.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            toast.error(err.message || "Failed to update password");
        }
    };

    // Save preferences
    const handleSavePreferences = (e) => {
        e.preventDefault();
        localStorage.setItem("pref_email_on_pass", emailOnPass);
        localStorage.setItem("pref_weekly_reports", weeklyReports);
        
        // Dark mode preference toggle
        if (darkModePref) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }

        toast.success("Preferences saved successfully!");
    };

    if (!profile) {
        return <div className={styles.loading}>Loading profile specs...</div>;
    }

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Page Header */}
            <PageHeader 
                title="Profile Settings"
                breadcrumbs={["Settings", "Instructor Profile"]}
            />

            {/* Split layout (Left Card: Photo & Stats, Right Card: Tabs Form) */}
            <div className={styles.splitGrid}>
                
                {/* Left panel card */}
                <div className={styles.leftPanel}>
                    {/* Avatar edit overlay */}
                    <div className={styles.avatarWrapper} onClick={() => fileInputRef.current.click()}>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleAvatarChange} 
                            className={styles.fileInput}
                            accept="image/*"
                        />
                        <Avatar src={profile.avatar_url} sx={{ width: 100, height: 100, fontSize: "40px" }}>
                            {profile.full_name?.charAt(0)}
                        </Avatar>
                        <div className={styles.avatarOverlay}>
                            <FiCamera />
                            <span>Change Photo</span>
                        </div>
                    </div>

                    <h3 className={styles.profileName}>{profile.full_name}</h3>
                    <span className={styles.profileEmail}>{profile.email}</span>
                    
                    <p className={styles.profileBio}>{profile.bio || "No biography provided. Click Edit to add details about your career."}</p>

                    <div className={styles.divider} />

                    {/* Stats */}
                    <div className={styles.statsRow}>
                        <div className={styles.statBox}>
                            <FiBook />
                            <strong>{roomCount}</strong>
                            <span>Rooms</span>
                        </div>
                        <div className={styles.statBox}>
                            <FiBook />
                            <strong>{quizCount}</strong>
                            <span>Quizzes</span>
                        </div>
                        <div className={styles.statBox}>
                            <FiBook />
                            <strong>{questionCount}</strong>
                            <span>Questions</span>
                        </div>
                    </div>
                </div>

                {/* Right panel tabs card */}
                <div className={styles.formCard}>
                    {/* Sub tabs selectors */}
                    <div className={styles.tabsRow}>
                        <button className={`${styles.tabBtn} ${activeTab === "personal" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("personal")}>
                            <FiUser /> Personal Details
                        </button>
                        <button className={`${styles.tabBtn} ${activeTab === "security" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("security")}>
                            <FiLock /> Security & Keys
                        </button>
                        <button className={`${styles.tabBtn} ${activeTab === "preferences" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("preferences")}>
                            <FiSliders /> Preferences
                        </button>
                    </div>

                    {/* Personal Detail tab */}
                    {activeTab === "personal" && (
                        <form className={styles.formBody} onSubmit={handleSavePersonal}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Instructor Full Name <span className={styles.req}>*</span></label>
                                <input 
                                    type="text" 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className={styles.input}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email Address (Read-only)</label>
                                <input 
                                    type="email" 
                                    value={profile.email} 
                                    className={styles.input} 
                                    disabled 
                                    style={{ opacity: 0.6, cursor: "not-allowed" }}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Biography / Info</label>
                                <textarea 
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Write a brief intro..."
                                    rows={4}
                                    className={styles.textarea}
                                />
                            </div>

                            <div className={styles.formFooter}>
                                <MainButton type="submit" variant="primary">
                                    Save Changes
                                </MainButton>
                            </div>
                        </form>
                    )}

                    {/* Security detail tab */}
                    {activeTab === "security" && (
                        <form className={styles.formBody} onSubmit={handleChangePassword}>
                            {/* New password input */}
                            <div className={styles.formGroup} style={{position: "relative"}}>
                                <label className={styles.label}>New Password</label>
                                <input 
                                    type={showPass ? "text" : "password"} 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    className={styles.input}
                                    required
                                />
                                <button 
                                    type="button" 
                                    className={styles.showPassBtn}
                                    onClick={() => setShowPass(!showPass)}
                                >
                                    {showPass ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>

                            {/* Confirm password */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Confirm New Password</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={styles.input}
                                    required
                                />
                            </div>

                            {/* Password strength visual meter */}
                            {newPassword && (
                                <div className={styles.strengthWrapper}>
                                    <div className={styles.strengthBarRow}>
                                        {[1, 2, 3, 4, 5].map(idx => (
                                            <div 
                                                key={idx} 
                                                className={styles.strengthSegment}
                                                style={{
                                                    backgroundColor: idx <= passStrength.score ? passStrength.color : "var(--border-default)"
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span className={styles.strengthText} style={{ color: passStrength.color }}>
                                        Strength: {passStrength.text}
                                    </span>
                                </div>
                            )}

                            <div className={styles.formFooter} style={{marginTop: "var(--space-6)"}}>
                                <MainButton type="submit" variant="primary">
                                    Change Password
                                </MainButton>
                            </div>
                        </form>
                    )}

                    {/* Preference Detail tab */}
                    {activeTab === "preferences" && (
                        <form className={styles.formBody} onSubmit={handleSavePreferences}>
                            <div className={styles.toggleRow}>
                                <div>
                                    <label className={styles.toggleLabel}>Email notifications on student passing</label>
                                    <p className={styles.toggleDesc}>Receive alert logs when students score achievements.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={emailOnPass}
                                    onChange={(e) => setEmailOnPass(e.target.checked)}
                                    className={styles.toggleSwitch}
                                />
                            </div>

                            <div className={styles.toggleRow}>
                                <div>
                                    <label className={styles.toggleLabel}>Weekly progress summaries</label>
                                    <p className={styles.toggleDesc}>Receive emails summarizing classroom completions.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={weeklyReports}
                                    onChange={(e) => setWeeklyReports(e.target.checked)}
                                    className={styles.toggleSwitch}
                                />
                            </div>

                            <div className={styles.toggleRow}>
                                <div>
                                    <label className={styles.toggleLabel}>Dark Mode preferences</label>
                                    <p className={styles.toggleDesc}>Toggle visual contrast styles between dark and light themes.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={darkModePref}
                                    onChange={(e) => setDarkModePref(e.target.checked)}
                                    className={styles.toggleSwitch}
                                />
                            </div>

                            <div className={styles.formFooter} style={{marginTop: "var(--space-6)"}}>
                                <MainButton type="submit" variant="primary">
                                    Save Preferences
                                </MainButton>
                            </div>
                        </form>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Profile;
