// local components
import PageHeader from "../components/PageHeader";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./Profile.module.css";

// react
import { useState, useRef } from "react";

// redux
import { useDispatch } from "react-redux";
import { 
    updateProfileThunk,
    updateAvatarThunk
} from "../../../redux/slices/profilesSlice";
import { forgotPasswordThunk } from "../../../redux/slices/authSlice";
import { setTheme } from "../../../redux/slices/themeSLice";

// animation
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

// react-icons
import { 
    FiUser, 
    FiLock, 
    FiSliders, 
    FiCamera, 
    FiPhone,
    FiGlobe,
    FiShield,
    FiAward,
    FiZap,
    FiCalendar,
    FiActivity,
    FiMail,
    FiEdit2,
    FiCheck,
    FiX,
    FiSend
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

    // Toggle edit mode for personal info card
    const [isEditingPersonal, setIsEditingPersonal] = useState(false);

    // Personal details states
    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");
    const [phone, setPhone] = useState("");
    const [country, setCountry] = useState("");

    // Synchronize profile details directly in render to prevent cascading re-render warnings
    const [prevProfile, setPrevProfile] = useState(null);
    if (profile && profile !== prevProfile) {
        setPrevProfile(profile);
        setFullName(profile.full_name || "");
        setBio(profile.bio || "");
        setPhone(profile.phone || "");
        setCountry(profile.country || "");
    }

    // Loading state for email password reset request
    const [isResetSending, setIsResetSending] = useState(false);

    // Preference states initialized with lazy state initializers to prevent mount re-renders
    const [emailOnPass, setEmailOnPass] = useState(() => {
        const mailPref = localStorage.getItem("pref_email_on_pass");
        return mailPref !== null ? mailPref === "true" : true;
    });
    const [weeklyReports, setWeeklyReports] = useState(() => {
        const reportPref = localStorage.getItem("pref_weekly_reports");
        return reportPref !== null ? reportPref === "true" : true;
    });
    const [darkModePref, setDarkModePref] = useState(() => {
        return document.documentElement.classList.contains("dark");
    });

    const containerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Trigger staggered GSAP entrance animation for all cards
    usePageAnimation(containerRef, {
        ready: !!profile,
        staggerSelector: `.${styles.profileCard}`,
    });

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
                bio,
                phone: phone || null,
                country: country || null
            })).unwrap();

            toast.success("Profile details updated successfully!");
            setIsEditingPersonal(false);
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
        if (file.size > AVATAR_MAX_BYTES) {
            toast.error("Max image size is 5MB");
            return;
        }

        toast.info("Uploading avatar...");

        try {
            await dispatch(updateAvatarThunk(file)).unwrap();
            toast.success("Avatar image updated!");
        } catch (err) {
            console.error(err);
            const fallbackUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${fullName}`;
            await supabase.from("profiles").update({ avatar_url: fallbackUrl }).eq("uid", profile.uid);
            toast.success("Avatar set with Dicebear placeholder!");
        }
    };

    // Password reset email handler
    const handleRequestPasswordReset = async () => {
        if (!profile?.email) return;
        setIsResetSending(true);
        try {
            await dispatch(forgotPasswordThunk(profile.email)).unwrap();
            toast.success("A password reset email has been sent to your inbox!");
        } catch (err) {
            toast.error(err || "Failed to send password reset email");
        } finally {
            setIsResetSending(false);
        }
    };

    // Save preferences
    const handleSavePreferences = (e) => {
        e.preventDefault();
        localStorage.setItem("pref_email_on_pass", emailOnPass);
        localStorage.setItem("pref_weekly_reports", weeklyReports);
        
        // Dispatch theme state update to Redux themeSlice
        dispatch(setTheme(darkModePref ? "dark" : "light"));

        toast.success("Preferences saved successfully!");
    };

    if (!profile) {
        return <div className={styles.loading}>Loading profile specs...</div>;
    }

    // Constants for avatar bounds check
    const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Page Header */}
            <PageHeader 
                title="Profile Settings"
                breadcrumbs={["Settings", "Instructor Profile"]}
            />

            {/* Modern Dashboard Grid Layout */}
            <div className={styles.profileGrid}>
                
                {/* 1. IDENTITY & AVATAR CARD */}
                <div className={`${styles.profileCard} ${styles.identityCard}`}>
                    <div className={styles.avatarWrapper} onClick={() => fileInputRef.current.click()}>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleAvatarChange} 
                            className={styles.fileInput}
                            accept="image/*"
                        />
                        <Avatar src={profile.avatar_url} sx={{ width: 120, height: 120, fontSize: "48px" }} className={styles.avatar}>
                            {profile.full_name?.charAt(0)}
                        </Avatar>
                        <div className={styles.avatarOverlay}>
                            <FiCamera />
                            <span>Change Photo</span>
                        </div>
                    </div>

                    <div className={styles.identityDetails}>
                        <div className={styles.badgeRow}>
                            <span className={`${styles.badge} ${styles.roleBadge}`}>
                                <FiShield /> {profile.role}
                            </span>
                            {profile.email_verified && (
                                <span className={`${styles.badge} ${styles.verifiedBadge}`}>
                                    <FiMail /> Verified
                                </span>
                            )}
                        </div>
                        <h2 className={styles.profileName}>{profile.full_name}</h2>
                        <p className={styles.profileEmail}>{profile.email}</p>
                        
                        <p className={styles.profileBioText}>
                            {profile.bio || "No biography provided yet. Edit your professional details below to write a brief introduction."}
                        </p>
                    </div>

                    <div className={styles.statsSummaryRow}>
                        <div className={styles.summaryBox}>
                            <strong>{roomCount}</strong>
                            <span>Rooms</span>
                        </div>
                        <div className={styles.summaryBox}>
                            <strong>{quizCount}</strong>
                            <span>Quizzes</span>
                        </div>
                        <div className={styles.summaryBox}>
                            <strong>{questionCount}</strong>
                            <span>Questions</span>
                        </div>
                    </div>
                </div>

                {/* 2. PERSONAL & CONTACT DETAILS CARD */}
                <div className={`${styles.profileCard} ${styles.detailsCard}`}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderTitle}>
                            <FiUser className={styles.headerIcon} />
                            <h3>Personal Specifications</h3>
                        </div>
                        {!isEditingPersonal ? (
                            <button className={styles.editCardBtn} onClick={() => setIsEditingPersonal(true)}>
                                <FiEdit2 /> Edit details
                            </button>
                        ) : (
                            <div className={styles.editActionRow}>
                                <button className={styles.saveActionBtn} onClick={handleSavePersonal}>
                                    <FiCheck /> Save
                                </button>
                                <button className={styles.cancelActionBtn} onClick={() => {
                                    setFullName(profile.full_name || "");
                                    setBio(profile.bio || "");
                                    setPhone(profile.phone || "");
                                    setCountry(profile.country || "");
                                    setIsEditingPersonal(false);
                                }}>
                                    <FiX /> Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {!isEditingPersonal ? (
                        <div className={styles.cardViewBody}>
                            <div className={styles.viewField}>
                                <span className={styles.viewLabel}>Full Name</span>
                                <strong className={styles.viewVal}>{profile.full_name}</strong>
                            </div>
                            <div className={styles.viewField}>
                                <span className={styles.viewLabel}>Bio / Introduction</span>
                                <p className={styles.viewValBio}>{profile.bio || "No biography details."}</p>
                            </div>
                            <div className={styles.viewFieldGrid}>
                                <div className={styles.viewField}>
                                    <span className={styles.viewLabel}><FiPhone /> Phone</span>
                                    <strong className={styles.viewVal}>{profile.phone || "—"}</strong>
                                </div>
                                <div className={styles.viewField}>
                                    <span className={styles.viewLabel}><FiGlobe /> Country</span>
                                    <strong className={styles.viewVal}>{profile.country || "—"}</strong>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form className={styles.cardFormBody} onSubmit={handleSavePersonal}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Full Name <span className={styles.req}>*</span></label>
                                <input 
                                    type="text" 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className={styles.input}
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Biography / Info</label>
                                <textarea 
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Write a brief intro about yourself..."
                                    rows={3}
                                    className={styles.textarea}
                                    maxLength={300}
                                />
                                <span className={styles.charCounter}>{bio.length}/300</span>
                            </div>
                            <div className={styles.formGrid2}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Phone Number</label>
                                    <input 
                                        type="tel" 
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className={styles.input}
                                        placeholder="e.g. +1 (555) 123-4567"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Country</label>
                                    <input 
                                        type="text" 
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        className={styles.input}
                                        placeholder="e.g. United States"
                                    />
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* 3. GAMIFICATION & AUDIT CARD */}
                <div className={`${styles.profileCard} ${styles.gamificationCard}`}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderTitle}>
                            <FiAward className={styles.headerIcon} />
                            <h3>Gamification & Activity Specs</h3>
                        </div>
                        <span className={styles.readOnlyFlag}>
                            <FiLock /> Read-only
                        </span>
                    </div>

                    <div className={styles.statsBoxGrid}>
                        {/* Level Info */}
                        <div className={styles.statProgressCard}>
                            <div className={styles.progressHeader}>
                                <div className={styles.progressTitle}>
                                    <FiAward className={styles.levelIcon} />
                                    <span>Level {profile.level}</span>
                                </div>
                                <span className={styles.xpLabel}>{profile.xp} XP</span>
                            </div>
                            <div className={styles.progressBarWrapper}>
                                <div 
                                    className={styles.progressBar} 
                                    style={{ width: `${Math.min(100, (profile.xp % 100))}%` }} 
                                />
                            </div>
                            <span className={styles.nextLevelText}>{100 - (profile.xp % 100)} XP to Next Level</span>
                        </div>

                        <div className={styles.statNumbersRow}>
                            <div className={styles.statMetricBox}>
                                <FiZap className={styles.metricIcon} style={{color: "var(--color-warning)"}} />
                                <strong>{profile.streak} days</strong>
                                <span>Current Streak</span>
                            </div>
                            <div className={styles.statMetricBox}>
                                <FiAward className={styles.metricIcon} style={{color: "var(--color-success)"}} />
                                <strong>{profile.longest_streak} days</strong>
                                <span>Longest Streak</span>
                            </div>
                        </div>

                        <div className={styles.auditInfoList}>
                            <div className={styles.auditItem}>
                                <FiActivity className={styles.auditIcon} />
                                <div>
                                    <span>Last Activity</span>
                                    <strong>{profile.last_activity_date ? new Date(profile.last_activity_date).toLocaleDateString(undefined, {dateStyle: 'medium'}) : "No recent activity"}</strong>
                                </div>
                            </div>
                            <div className={styles.auditItem}>
                                <FiCalendar className={styles.auditIcon} />
                                <div>
                                    <span>Member Since</span>
                                    <strong>{new Date(profile.created_at).toLocaleDateString(undefined, {dateStyle: 'medium'})}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. SECURITY & CREDENTIALS CARD */}
                <div className={`${styles.profileCard} ${styles.securityCard}`}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderTitle}>
                            <FiLock className={styles.headerIcon} />
                            <h3>Security & Credentials</h3>
                        </div>
                    </div>

                    <div className={styles.securityWrapperCard}>
                        <p className={styles.securityInfoText}>
                            For security purposes, password changes must be authorized via verification email. 
                            Clicking the button below will send a secure password reset link to your email address (<strong>{profile.email}</strong>).
                        </p>
                        
                        <div className={styles.resetButtonWrapper}>
                            <MainButton 
                                onClick={handleRequestPasswordReset} 
                                variant="primary" 
                                size="lg"
                                isLoading={isResetSending}
                                className={styles.resetButton}
                            >
                                <FiSend /> Send Password Reset Email
                            </MainButton>
                        </div>
                    </div>
                </div>

                {/* 5. ACCOUNT PREFERENCES CARD */}
                <div className={`${styles.profileCard} ${styles.preferencesCard}`}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderTitle}>
                            <FiSliders className={styles.headerIcon} />
                            <h3>Account Preferences</h3>
                        </div>
                    </div>

                    <form className={styles.formBody} onSubmit={handleSavePreferences}>
                        <div className={styles.toggleRow}>
                            <div>
                                <label className={styles.toggleLabel}>Email Student Performance Alerts</label>
                                <p className={styles.toggleDesc}>Receive email notifications when students complete assigned quizzes.</p>
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
                                <label className={styles.toggleLabel}>Weekly Analytics Digests</label>
                                <p className={styles.toggleDesc}>Receive a compiled digest of classroom progress and completion metrics.</p>
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
                                <label className={styles.toggleLabel}>Enable Dark Theme Accent</label>
                                <p className={styles.toggleDesc}>Toggle structural contrast styles between light and dark modes.</p>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={darkModePref}
                                onChange={(e) => setDarkModePref(e.target.checked)}
                                className={styles.toggleSwitch}
                            />
                        </div>

                        <div className={styles.formFooter}>
                            <MainButton type="submit" variant="primary">
                                Save Preferences
                            </MainButton>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default Profile;
