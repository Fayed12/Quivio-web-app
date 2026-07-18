// react
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

// date-fns
import { format } from "date-fns";

// animation
import { gsap } from "gsap";
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";

// redux
import { selectProfile, setProfile } from "../../../redux/slices/authSlice";
import {
    updateProfileThunk,
    updateProfileLocal,
} from "../../../redux/slices/profilesSlice";
import {
    fetchMyStats,
    selectMyStats,
} from "../../../redux/slices/attemptsSlice";
import {
    fetchMyCertificates,
    selectMyCertificates,
} from "../../../redux/slices/certificatesSlice";

// components
import MainButton from "../../../components/ui/button/MainButton";
import ModalPortal from "../../instructor/components/ModalPortal";
import { toast } from "react-toastify";

// react-pdf
import { pdf } from "@react-pdf/renderer";
import CertificatePDF from "./CertificatePDF";

// supabase
import { supabase } from "../../../services/config/supabaseClient";

// react-icons
import {
    FiUser,
    FiLock,
    FiBarChart2,
    FiAward,
    FiDownload,
    FiCamera,
    FiMail,
    FiShield,
    FiZap,
    FiCheck,
    FiX,
    FiMapPin,
    FiPhone,
    FiCalendar,
    FiActivity,
    FiArrowRight
} from "react-icons/fi";

// local
import styles from "./Profile.module.css";

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
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Cookie",
];

const StudentProfile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const profile = useSelector(selectProfile);
    const stats = useSelector(selectMyStats);
    const certs = useSelector(selectMyCertificates) || [];

    const containerRef = useRef(null);
    const rightColRef = useRef(null);

    const [activeTab, setActiveTab] = useState("personal"); // personal | security | statistics | certificates
    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [pendingAvatar, setPendingAvatar] = useState("");

    // Personal details state variables (Instructor pattern)
    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");
    const [phone, setPhone] = useState("");
    const [country, setCountry] = useState("");

    // Synchronize profile details in render to prevent re-render cascading
    const [prevProfile, setPrevProfile] = useState(null);
    if (profile && profile !== prevProfile) {
        setPrevProfile(profile);
        setFullName(profile.full_name || "");
        setBio(profile.bio || "");
        setPhone(profile.phone || "");
        setCountry(profile.country || "");
        setPendingAvatar(profile.avatar_url || PRESET_AVATARS[0]);
    }

    // Entrance Animation
    usePageAnimation(containerRef, {
        ready: !!profile,
        staggerSelector: `.${styles.card}`,
    });

    // GSAP Tab Switching Animation
    useEffect(() => {
        if (rightColRef.current) {
            const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
            // Fade-in & slide-up the card wrapper
            tl.fromTo(
                rightColRef.current,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.4 }
            );

            // Stagger sub-elements with the .animate-item class
            const animItems = rightColRef.current.querySelectorAll(".animate-item");
            if (animItems.length > 0) {
                tl.fromTo(
                    animItems,
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.3, stagger: 0.05 },
                    "-=0.2"
                );
            }
        }
    }, [activeTab]);

    useEffect(() => {
        dispatch(fetchMyStats());
        dispatch(fetchMyCertificates());
    }, [dispatch]);

    // Handle Profile Personal Info Save (Instructor pattern)
    const handleSavePersonal = async (e) => {
        e.preventDefault();
        if (!fullName.trim() || fullName.length < 3) {
            toast.error("Full Name must be at least 3 characters");
            return;
        }

        try {
            const updates = {
                full_name: fullName,
                bio,
                phone: phone || null,
                country: country || null
            };

            const updatedProfile = await dispatch(updateProfileThunk(updates)).unwrap();

            // Sync local profile state in Auth Slice
            dispatch(setProfile({
                ...profile,
                ...updatedProfile
            }));

            toast.success("Profile details updated successfully!");
            setIsEditingPersonal(false);
        } catch (err) {
            toast.error(err || "Failed to update profile details");
        }
    };

    // Save selected preset avatar
    const handleSaveAvatar = async () => {
        try {
            // Update profile avatar_url directly in supabase table
            const { error: avatarError } = await supabase
                .from("profiles")
                .update({ avatar_url: pendingAvatar })
                .eq("uid", profile.uid);

            if (!avatarError) {
                dispatch(updateProfileLocal({ avatar_url: pendingAvatar }));
                dispatch(setProfile({ ...profile, avatar_url: pendingAvatar }));
                toast.success("Avatar updated successfully!");
                setIsAvatarModalOpen(false);
            } else {
                toast.error("Failed to update avatar in database.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update avatar.");
        }
    };

    // Dynamic PDF Download using @react-pdf/renderer
    const handleDownloadCertificate = async (cert) => {
        try {
            toast.info("Generating certificate PDF...");
            
            // Render document to blob
            const doc = <CertificatePDF cert={cert} profileName={profile?.full_name} />;
            const blob = await pdf(doc).toBlob();
            
            // Create object URL and download
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Certificate_${cert.quiz?.title?.replace(/\s+/g, "_") || "Completion"}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast.success("Certificate downloaded successfully!");
        } catch (err) {
            console.error("PDF generation failed:", err);
            toast.error("Could not generate certificate PDF. Please try again.");
        }
    };


    if (!profile) {
        return <div className={styles.loading}>Loading student specifications...</div>;
    }

    return (
        <div ref={containerRef} className={styles.profileContainer}>
            {/* Header section matching instructor style */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className="h1">Student Profile</h1>
                    <p className="text-sm text-secondary">
                        Manage your student specifications, credentials, and download verified certificates.
                    </p>
                </div>
            </div>

            {/* Stacked layout: Identity card full width on top, horizontal centering controls below */}
            <div className={styles.profileLayoutStacked}>
                
                {/* 1. TOP SECTION - Full Width Identity Card */}
                <div className={`${styles.card} ${styles.summaryCardFullWidth}`}>
                    {/* Avatar Wrapper with photo change overlay */}
                    <div className={styles.avatarWrapper} onClick={() => setIsAvatarModalOpen(true)}>
                        <img
                            src={profile.avatar_url || PRESET_AVATARS[0]}
                            alt={profile.full_name}
                            className={styles.avatarBig}
                        />
                        <div className={styles.avatarOverlay}>
                            <FiCamera />
                            <span>Change Avatar</span>
                        </div>
                    </div>

                    {/* Personal data details */}
                    <div className={styles.identityDetails}>
                        <div className={styles.badgeRow}>
                            <span className={`${styles.badge} ${styles.roleBadge}`}>
                                <FiShield /> {profile.role || "Student"}
                            </span>
                            <span className={`${styles.badge} ${profile.is_active ? styles.verifiedBadge : styles.unverifiedBadge}`}>
                                {profile.is_active ? "Active Student" : "Deactivated"}
                            </span>
                        </div>
                        <h2 className={styles.nameBig}>{profile.full_name}</h2>
                        <p className={styles.emailText}>{profile.email}</p>
                        <p className={styles.bioText}>
                            {profile.bio || "No biography details. Click edit below to add a brief introduction."}
                        </p>
                    </div>

                    {/* Interactive stats summary on the right side */}
                    <div className={styles.statsSummaryRow}>
                        <div className={styles.summaryBox}>
                            <strong>Level {profile.level || 1}</strong>
                            <span>Academic Rank</span>
                        </div>
                        <div className={styles.summaryBox}>
                            <strong>
                                {profile.streak || 0} days
                            </strong>
                            <span>Active Streak</span>
                        </div>
                        <div className={styles.summaryBox}>
                            <strong>{certs.length}</strong>
                            <span>Certificates</span>
                        </div>
                    </div>
                </div>

                {/* 2. MIDDLE SECTION - Centered Horizontal Settings Menu */}
                <div className={styles.navigationMenuCentered}>
                    <div className={styles.tabsListHorizontal}>
                        <button
                            onClick={() => setActiveTab("personal")}
                            className={`${styles.tabBtnHorizontal} ${activeTab === "personal" ? styles.tabBtnActiveHorizontal : ""}`}
                        >
                            <FiUser className={styles.tabIcon} />
                            <span>Personal Info</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("security")}
                            className={`${styles.tabBtnHorizontal} ${activeTab === "security" ? styles.tabBtnActiveHorizontal : ""}`}
                        >
                            <FiLock className={styles.tabIcon} />
                            <span>Security & Credentials</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("statistics")}
                            className={`${styles.tabBtnHorizontal} ${activeTab === "statistics" ? styles.tabBtnActiveHorizontal : ""}`}
                        >
                            <FiBarChart2 className={styles.tabIcon} />
                            <span>My Statistics</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("certificates")}
                            className={`${styles.tabBtnHorizontal} ${activeTab === "certificates" ? styles.tabBtnActiveHorizontal : ""}`}
                        >
                            <FiAward className={styles.tabIcon} />
                            <span>Verified Certificates</span>
                        </button>
                    </div>
                </div>

                {/* 3. BOTTOM SECTION - Selected Tab Content */}
                <div ref={rightColRef} className={styles.activeTabContentWidth}>
                    
                    {/* 1. PERSONAL INFO TAB */}
                    {activeTab === "personal" && (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardHeaderTitle}>
                                    <FiUser className={styles.headerIcon} />
                                    <h3>Personal Specifications</h3>
                                </div>
                                {!isEditingPersonal ? (
                                    <button className={styles.editCardBtn} onClick={() => setIsEditingPersonal(true)}>
                                        <FiUser /> Edit details
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
                                    <div className={`${styles.viewField} animate-item`}>
                                        <span className={styles.viewLabel}>Full Name</span>
                                        <strong className={styles.viewVal}>{profile.full_name}</strong>
                                    </div>
                                    <div className={`${styles.viewField} animate-item`}>
                                        <span className={styles.viewLabel}>Bio / Introduction</span>
                                        <p className={styles.viewValBio}>{profile.bio || "No biography details."}</p>
                                    </div>
                                    <div className={styles.viewFieldGrid}>
                                        <div className={`${styles.viewField} animate-item`}>
                                            <span className={styles.viewLabel}><FiPhone /> Phone</span>
                                            <strong className={styles.viewVal}>{profile.phone || "—"}</strong>
                                        </div>
                                        <div className={`${styles.viewField} animate-item`}>
                                            <span className={styles.viewLabel}><FiMapPin /> Country</span>
                                            <strong className={styles.viewVal}>{profile.country || "—"}</strong>
                                        </div>
                                    </div>

                                    {/* Read-only system blocks */}
                                    <div className={styles.readOnlySeparator} />
                                    
                                    <div className={styles.viewFieldGrid}>
                                        <div className={`${styles.viewField} ${styles.readOnlyField} animate-item`}>
                                            <span className={styles.viewLabel}>
                                                <FiMail /> Email Address <FiLock className={styles.lockIconMini} />
                                            </span>
                                            <strong className={styles.viewVal}>{profile.email}</strong>
                                            <span className={styles.readOnlyHint}>Can only be modified by the Quivio system administrators.</span>
                                        </div>
                                        <div className={`${styles.viewField} ${styles.readOnlyField} animate-item`}>
                                            <span className={styles.viewLabel}>
                                                <FiAward /> Academic Level <FiLock className={styles.lockIconMini} />
                                            </span>
                                            <strong className={styles.viewVal}>Level {profile.level || 1}</strong>
                                            <span className={styles.readOnlyHint}>Level up by earning XP from passing quizzes!</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form className={styles.cardFormBody} onSubmit={handleSavePersonal}>
                                    <div className={`${styles.formGroup} animate-item`}>
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
                                    <div className={`${styles.formGroup} animate-item`}>
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
                                    <div className={`${styles.formGrid2} animate-item`}>
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

                                    {/* Display non-editable boxes grayed out in edit form */}
                                    <div className={styles.readOnlySeparator} />
                                    <div className={styles.formGrid2}>
                                        <div className={`${styles.formGroup} ${styles.readOnlyField} animate-item`}>
                                            <label className={styles.label}>Email Address (Read-only)</label>
                                            <input 
                                                type="text" 
                                                value={profile.email} 
                                                disabled 
                                                className={`${styles.input} ${styles.disabledInput}`} 
                                            />
                                        </div>
                                        <div className={`${styles.formGroup} ${styles.readOnlyField} animate-item`}>
                                            <label className={styles.label}>Academic Level (Read-only)</label>
                                            <input 
                                                type="text" 
                                                value={`Level ${profile.level || 1}`} 
                                                disabled 
                                                className={`${styles.input} ${styles.disabledInput}`} 
                                            />
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* 2. SECURITY TAB */}
                    {activeTab === "security" && (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardHeaderTitle}>
                                    <FiLock className={styles.headerIcon} />
                                    <h3>Security & Credentials</h3>
                                </div>
                            </div>

                            <div className={styles.securityWrapperCard}>
                                <p className={`${styles.securityInfoText} animate-item`}>
                                    For security purposes, you can change your password directly from our secure update portal. 
                                    Clicking the button below will redirect you to the password update page to type in a new secure credential.
                                </p>
                                
                                <div className={`${styles.resetButtonWrapper} animate-item`}>
                                    <MainButton 
                                        clickEvent={() => navigate("/reset-password")} 
                                        variant="primary" 
                                        size="lg"
                                        className={styles.resetButton}
                                    >
                                        <span>Proceed to Password Reset</span>
                                        <FiArrowRight style={{ marginLeft: "6px" }} />
                                    </MainButton>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. STATISTICS TAB */}
                    {activeTab === "statistics" && (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardHeaderTitle}>
                                    <FiBarChart2 className={styles.headerIcon} />
                                    <h3>Learning Statistics & Metrics</h3>
                                </div>
                                <span className={styles.readOnlyFlag}>
                                    <FiLock /> Read-only
                                </span>
                            </div>

                            <div className={styles.statsBoxGrid}>
                                {/* Level & Progress Bar Box */}
                                <div className={`${styles.statProgressCard} animate-item`}>
                                    <div className={styles.progressHeader}>
                                        <div className={styles.progressTitle}>
                                            <FiAward className={styles.levelIcon} />
                                            <span>Level {profile.level || 1} Rating</span>
                                        </div>
                                        <span className={styles.xpLabel}>{profile.xp || 0} XP Total</span>
                                    </div>
                                    <div className={styles.progressBarWrapper}>
                                        <div 
                                            className={styles.progressBar} 
                                            style={{ width: `${Math.min(100, ((profile.xp || 0) % 100))}%` }} 
                                        />
                                    </div>
                                    <span className={styles.nextLevelText}>
                                        {100 - ((profile.xp || 0) % 100)} XP to Next Level
                                    </span>
                                </div>

                                {/* Modern stat numbers grid */}
                                <div className={styles.statsMetricsGrid}>
                                    <div className={`${styles.statMetricBox} animate-item`}>
                                        <FiZap className={styles.metricIcon} style={{ color: "var(--color-warning)" }} />
                                        <strong>{profile.streak || 0} days</strong>
                                        <span>Current Streak</span>
                                    </div>
                                    <div className={`${styles.statMetricBox} animate-item`}>
                                        <FiAward className={styles.metricIcon} style={{ color: "var(--color-success)" }} />
                                        <strong>{profile.longest_streak || 0} days</strong>
                                        <span>Longest Streak</span>
                                    </div>
                                    <div className={`${styles.statMetricBox} animate-item`}>
                                        <FiActivity className={styles.metricIcon} style={{ color: "var(--color-accent)" }} />
                                        <strong>{stats?.total_attempts || 0}</strong>
                                        <span>Total Attempts</span>
                                    </div>
                                    <div className={`${styles.statMetricBox} animate-item`}>
                                        <FiCheck className={styles.metricIcon} style={{ color: "var(--color-success)" }} />
                                        <strong>{stats?.avg_score ? `${Math.round(stats.avg_score)}%` : "0%"}</strong>
                                        <span>Average Score</span>
                                    </div>
                                    <div className={`${styles.statMetricBox} ${styles.spanAllRowsMobile} animate-item`}>
                                        <FiAward className={styles.metricIcon} style={{ color: "#D4AF37" }} />
                                        <strong>{stats?.best_score ? `${Math.round(stats.best_score)}%` : "0%"}</strong>
                                        <span>Best Score</span>
                                    </div>
                                </div>

                                {/* Audit dates */}
                                <div className={styles.auditInfoList}>
                                    <div className={`${styles.auditItem} animate-item`}>
                                        <FiActivity className={styles.auditIcon} />
                                        <div>
                                            <span>Last Active Date</span>
                                            <strong>
                                                {profile.last_activity_date 
                                                    ? new Date(profile.last_activity_date).toLocaleDateString(undefined, { dateStyle: "medium" }) 
                                                    : "No recent activity recorded"}
                                            </strong>
                                        </div>
                                    </div>
                                    <div className={`${styles.auditItem} animate-item`}>
                                        <FiCalendar className={styles.auditIcon} />
                                        <div>
                                            <span>Enrolled Since</span>
                                            <strong>
                                                {profile.created_at 
                                                    ? new Date(profile.created_at).toLocaleDateString(undefined, { dateStyle: "medium" }) 
                                                    : "N/A"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. CERTIFICATES TAB */}
                    {activeTab === "certificates" && (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardHeaderTitle}>
                                    <FiAward className={styles.headerIcon} />
                                    <h3>Earned Achievements & Certificates</h3>
                                </div>
                            </div>

                            {certs.length === 0 ? (
                                <div className={styles.emptyStateContainer}>
                                    <FiAward className={styles.emptyIcon} />
                                    <p className="text-secondary text-sm">
                                        You haven't earned any certificates yet. Pass assigned quizzes with a high score to generate your credentials!
                                    </p>
                                </div>
                            ) : (
                                <div className={styles.certsGrid}>
                                    {certs.map((c) => (
                                        <div
                                            key={c.id}
                                            className={`${styles.certCard} animate-item`}
                                        >
                                            <div className={styles.certBadgeWrapper}>
                                                <FiAward className={styles.certGoldIcon} />
                                            </div>
                                            <span className={styles.certTitle}>
                                                {c.quiz?.title}
                                            </span>
                                            <div className={styles.certDetailsList}>
                                                <span className={styles.certMeta}>
                                                    Code: <code>{c.certificate_code}</code>
                                                </span>
                                                <span className={styles.certMeta}>
                                                    Score: <strong>{c.score}%</strong>
                                                </span>
                                                <span className={styles.certMeta}>
                                                    Issued: {format(new Date(c.issued_at), "PP")}
                                                </span>
                                            </div>

                                            <div className={styles.certActionsRow}>

                                                <MainButton
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleDownloadCertificate(c)}
                                                    className={styles.downloadPdfBtn}
                                                >
                                                    <FiDownload /> 
                                                    <span>PDF</span>
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

            {/* AVATAR SELECTION MODAL PORTAL */}
            {isAvatarModalOpen && (
                <ModalPortal onClose={() => setIsAvatarModalOpen(false)}>
                    <div className={styles.modalOverlay} onClick={() => setIsAvatarModalOpen(false)}>
                        <div className={styles.avatarModal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3>Select Profile Avatar</h3>
                                <button className={styles.modalCloseBtn} onClick={() => setIsAvatarModalOpen(false)}>
                                    <FiX />
                                </button>
                            </div>
                            
                            <div className={styles.modalBody}>
                                <p className={styles.modalHint}>Choose from one of our adventurer presets to represent your profile:</p>
                                <div className={styles.avatarsGrid}>
                                    {PRESET_AVATARS.map((url) => (
                                        <div 
                                            key={url}
                                            onClick={() => setPendingAvatar(url)}
                                            className={`${styles.avatarItemWrapper} ${pendingAvatar === url ? styles.avatarSelected : ""}`}
                                        >
                                            <img
                                                src={url}
                                                alt="avatar preset option"
                                                className={styles.modalAvatarImg}
                                            />
                                            {pendingAvatar === url && (
                                                <span className={styles.checkIndicator}>
                                                    <FiCheck />
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <MainButton onClick={() => setIsAvatarModalOpen(false)} variant="secondary">
                                    Cancel
                                </MainButton>
                                <MainButton onClick={handleSaveAvatar} variant="primary">
                                    Apply Avatar
                                </MainButton>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default StudentProfile;
