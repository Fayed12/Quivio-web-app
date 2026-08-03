// react
import { useEffect, useRef, useState } from "react";

// react-router
import { useNavigate } from "react-router";

// react-redux
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../../redux/slices/themeSlice";
import { selectIsAuthenticated, selectRole } from "../../redux/slices/authSlice";

// components
import MainButton from "../../components/ui/button/MainButton";
import styles from "./landingPage.module.css";

// gsap
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// react-icons
import {
    FiZap,
    FiBookOpen,
    FiBarChart2,
    FiAward,
    FiShield,
    FiTrendingUp,
    FiChevronDown,
    FiChevronUp,
    FiLinkedin,
    FiArrowRight,
    FiUser,
    FiSun,
    FiMoon,
    FiMessageSquare,
    FiUsers,
    FiCheckCircle,
    FiSearch,
    FiFileText,
    FiActivity,
    FiDatabase,
    FiMail,
    FiEdit3,
    FiHelpCircle
} from "react-icons/fi";
import { FaXTwitter, FaFireFlameCurved, FaWhatsapp, FaBug } from "react-icons/fa6";

// Register GSAP plugins
if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const LandingPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isAuth = useSelector(selectIsAuthenticated);
    const role = useSelector(selectRole);
    const mainRef = useRef(null);
    const heroRef = useRef(null);

    // Active Portal Tab for interactive dual workflow showcase
    const [portalTab, setPortalTab] = useState("instructor");

    // Developer Contact & Feedback Form State
    const [feedbackCategory, setFeedbackCategory] = useState("Bug Report");
    const [feedbackText, setFeedbackText] = useState("");

    // Dynamic light/dark mode observer
    const [isDark, setIsDark] = useState(() => {
        if (typeof document !== "undefined") {
            return (
                document.documentElement.classList.contains("dark") ||
                document.documentElement.getAttribute("data-theme") === "dark"
            );
        }
        return false;
    });

    useEffect(() => {
        if (typeof document === "undefined") return;
        const observer = new MutationObserver(() => {
            setIsDark(
                document.documentElement.classList.contains("dark") ||
                document.documentElement.getAttribute("data-theme") === "dark"
            );
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "data-theme"]
        });
        return () => observer.disconnect();
    }, []);

    // Active Accordion Index (FAQ)
    const [activeFaq, setActiveFaq] = useState(0);

    // Certificate code verification state
    const [certificateCode, setCertificateCode] = useState("");

    const faqs = [
        {
            question: "How do student accounts get provisioned in Quivio?",
            answer: "Instructors create student accounts through the Students Management portal. Accounts can be provisioned individually with auto-generated secure credentials or imported in bulk via CSV file import with real-time field validation."
        },
        {
            question: "How does the 2-second Quiz Autosave & Offline Fallback work?",
            answer: "During any active quiz session, Quivio syncs student selections to the Supabase database every 2 seconds. If network latency or disconnection occurs, answers are cached locally in browser storage and seamlessly resynced upon reconnecting."
        },
        {
            question: "Are certificates generated automatically upon passing?",
            answer: "Yes! Instructors configure target passing percentages (e.g. 70%). Upon reaching or exceeding the score, high-fidelity PDF certificates are rendered client-side via @react-pdf/renderer, complete with unique 8-character verification hash codes."
        },
        {
            question: "Can instructors track real-time analytics and export data to Excel?",
            answer: "Instructors enjoy comprehensive Recharts analytics dashboards—visualizing attempt distributions, student grade deciles, question difficulty ratios, and pass rates. Reports can be exported directly as statistical Excel (.xlsx) spreadsheets."
        },
        {
            question: "How do gamification XP, levels, daily streaks, and leaderboards work?",
            answer: "Students earn XP based on score accuracy, first-attempt bonuses, and completion speed. Level requirements scale quadratically (100 * N²). Active daily streaks track consecutive practice days, and real-time leaderboards feature 3D podiums for top ranks."
        },
        {
            question: "Is there integrated messaging and live classroom announcements?",
            answer: "Yes! Quivio includes real-time 1-on-1 chat between instructors and students, room-specific broadcast notifications, and instant in-app alerts powered by Supabase Realtime channels."
        }
    ];

    // GSAP Scroll and Load animations
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero Entrance Animation Timeline
            const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
            
            heroTl.fromTo(
                `.${styles.heroBadge}`,
                { y: -25, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6 }
            );
            heroTl.fromTo(
                `.${styles.heroTitle}`,
                { y: 35, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8 },
                "-=0.4"
            );
            heroTl.fromTo(
                `.${styles.heroSubtext}`,
                { y: 25, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8 },
                "-=0.6"
            );
            heroTl.fromTo(
                `.${styles.heroActions}`,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8 },
                "-=0.6"
            );
            heroTl.fromTo(
                `.${styles.heroPills}`,
                { y: 15, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6 },
                "-=0.5"
            );
            heroTl.fromTo(
                `.${styles.heroVisualContainer}`,
                { scale: 0.94, opacity: 0, y: 40 },
                { scale: 1, opacity: 1, y: 0, duration: 1.1, ease: "power2.out" },
                "-=0.6"
            );
            heroTl.fromTo(
                `.${styles.floatingBadge}`,
                { scale: 0.8, opacity: 0, y: 15 },
                { scale: 1, opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "back.out(1.7)" },
                "-=0.4"
            );

            // ScrollTrigger Animations for Core Sections
            const animatedSections = [
                { selector: `.${styles.sectionHeader}`, trigger: `.${styles.featuresSection}` },
                { selector: `.${styles.featureCard}`, trigger: `.${styles.featuresGrid}`, stagger: 0.1 },
                { selector: `.${styles.portalCard}`, trigger: `.${styles.portalsSection}` },
                { selector: `.${styles.statItem}`, trigger: `.${styles.statsContainer}`, stagger: 0.12 },
                { selector: `.${styles.gamificationGrid}`, trigger: `.${styles.gamificationSection}` },
                { selector: `.${styles.certificateGrid}`, trigger: `.${styles.certificateSection}` },
                { selector: `.${styles.faqItem}`, trigger: `.${styles.faqSection}`, stagger: 0.08 }
            ];

            animatedSections.forEach(({ selector, trigger, stagger }) => {
                const els = gsap.utils.toArray(selector);
                if (els.length > 0) {
                    gsap.fromTo(
                        els,
                        { y: 35, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.8,
                            stagger: stagger || 0,
                            ease: "power2.out",
                            scrollTrigger: {
                                trigger: trigger,
                                start: "top 85%",
                                toggleActions: "play none none none"
                            }
                        }
                    );
                }
            });

            // Animated Stats Counters
            const statNumbers = gsap.utils.toArray(`.${styles.statNumber}`);
            statNumbers.forEach((stat) => {
                const targetVal = parseInt(stat.getAttribute("data-target"), 10);
                const suffix = stat.getAttribute("data-suffix") || "+";
                gsap.fromTo(
                    stat,
                    { textContent: "0" },
                    {
                        textContent: targetVal,
                        duration: 2.2,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: stat,
                            start: "top 88%"
                        },
                        snap: { textContent: 1 },
                        onUpdate: function () {
                            const val = Math.ceil(this.targets()[0].textContent);
                            stat.innerHTML = val.toLocaleString() + suffix;
                        }
                    }
                );
            });
        }, mainRef);

        return () => ctx.revert();
    }, []);

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    const handleVerifyCertificate = (e) => {
        e.preventDefault();
        if (certificateCode.trim()) {
            navigate(`/verify/${certificateCode.trim()}`);
        }
    };

    const handleSendEmail = (e) => {
        e.preventDefault();
        const subject = encodeURIComponent(`Quivio Feedback - ${feedbackCategory}`);
        const body = encodeURIComponent(
            `Category: ${feedbackCategory}\n\nFeedback Details:\n${feedbackText}\n\nSent from Quivio Web App`
        );
        window.location.href = `mailto:mohamedfaye12d@gmail.com?subject=${subject}&body=${body}`;
    };

    const handleSendWhatsapp = () => {
        const text = encodeURIComponent(
            `Hello Mohamed! I have a ${feedbackCategory} regarding Quivio:\n\n${feedbackText || "I'd like to get in touch regarding updates or styling improvements."}`
        );
        window.open(`https://wa.me/201093650836?text=${text}`, "_blank");
    };

    const handleNavLogin = () => navigate("/login");
    const handleNavRegister = () => navigate("/register");

    return (
        <div ref={mainRef} className={styles.landingContainer}>
            {/* Header / Top Sticky Navbar */}
            <header className={styles.navbar}>
                <div className={styles.navLogo} onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                    <img
                        src={isDark ? "/dark-logo.png" : "/light-logo.png"}
                        alt="Quivio Logo"
                        className={styles.logoImg}
                    />
                </div>

                <nav className={styles.navLinks} aria-label="Main navigation">
                    <a href="#features">Features</a>
                    <a href="#portals">Workflows</a>
                    <a href="#gamification">Gamification</a>
                    <a href="#certificates">Certificates</a>
                    <a href="#contact">Contact</a>
                    <a href="#faq">FAQ</a>
                </nav>

                <div className={styles.navActions}>
                    <button
                        className={styles.themeToggle}
                        onClick={() => dispatch(toggleTheme())}
                        aria-label="Toggle Theme"
                    >
                        {isDark ? <FiSun /> : <FiMoon />}
                    </button>
                    {isAuth ? (
                        <MainButton
                            variant="primary"
                            onClick={() => navigate(role === "instructor" ? "/instructor/dashboard" : "/student/dashboard")}
                            size="sm"
                        >
                            Go to Dashboard
                        </MainButton>
                    ) : (
                        <>
                            <MainButton variant="ghost" onClick={handleNavLogin} size="sm">
                                Sign In
                            </MainButton>
                            <MainButton variant="primary" onClick={handleNavRegister} size="sm">
                                Get Started
                            </MainButton>
                        </>
                    )}
                </div>
            </header>

            {/* Redesigned Hero Section */}
            <section className={styles.heroSection} ref={heroRef} aria-label="Introduction">
                <div className={styles.heroGlowBackdrop} />

                <div className={styles.heroContent}>
                    <div className={styles.heroBadge}>
                        <span className={styles.badgePulse} />
                        <FiZap style={{ color: "#f59e0b", marginRight: "4px" }} />
                        <span className={styles.badgeText}>Next-Gen Gamified Assessment Engine</span>
                    </div>

                    <h1 className={styles.heroTitle}>
                        Empower Assessment with <span className={styles.heroAccent}>Realtime Quizzing</span> & Gamified Intelligence
                    </h1>

                    <p className={styles.heroSubtext}>
                        Quivio unites instructors and students in a seamless assessment ecosystem. Build custom exams, automate grading, track Recharts statistical analytics, and inspire continuous learning through XP rewards, 3D leaderboards, and verifiable PDF credentials.
                    </p>

                    <div className={styles.heroActions}>
                        {isAuth ? (
                            <MainButton
                                variant="primary"
                                size="lg"
                                onClick={() => navigate(role === "instructor" ? "/instructor/dashboard" : "/student/dashboard")}
                            >
                                Open Dashboard <FiArrowRight className={styles.btnIconRight} />
                            </MainButton>
                        ) : (
                            <>
                                <MainButton variant="primary" size="lg" onClick={handleNavRegister}>
                                    Get Started as Instructor <FiArrowRight className={styles.btnIconRight} />
                                </MainButton>
                                <MainButton variant="secondary" size="lg" onClick={handleNavLogin}>
                                    Student Portal Sign In
                                </MainButton>
                            </>
                        )}
                    </div>

                    {/* Trust Highlights Pills */}
                    <div className={styles.heroPills}>
                        <span className={styles.pillItem}><FiCheckCircle className={styles.pillIcon} /> 2-Sec Database Autosave</span>
                        <span className={styles.pillItem}><FiCheckCircle className={styles.pillIcon} /> Excel (.xlsx) Analytics</span>
                        <span className={styles.pillItem}><FiCheckCircle className={styles.pillIcon} /> 3D Podium Leaderboards</span>
                        <span className={styles.pillItem}><FiCheckCircle className={styles.pillIcon} /> Verified PDF Credentials</span>
                    </div>
                </div>

                {/* Hero Visual Image Showcase with Floating Interactive Badges */}
                <div className={styles.heroVisualContainer}>
                    <div className={styles.heroImageFrame}>
                        <div className={styles.macOSWindowHeader}>
                            <div className={styles.macOSDots}>
                                <span className={styles.dotRed} />
                                <span className={styles.dotYellow} />
                                <span className={styles.dotGreen} />
                            </div>
                            <span className={styles.macOSWindowTitle}>Quivio Platform — Assessment Dashboard</span>
                            <div className={styles.macOSStatus}>
                                <span className={styles.liveIndicator} /> Live Workspace
                            </div>
                        </div>

                        <div className={styles.imageWrapper}>
                            <img
                                src="/hero.webp"
                                alt="Quivio Quiz & Assessment Dashboard Preview"
                                className={styles.heroImage}
                            />
                            <div className={styles.heroImageOverlayGlow} />
                        </div>
                    </div>

                    {/* Floating Stat Badges overlaying hero preview */}
                    <div className={`${styles.floatingBadge} ${styles.badgeTopLeft}`}>
                        <div className={styles.floatingIconCircle} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                            <FiActivity />
                        </div>
                        <div>
                            <div className={styles.badgeTitle}>99.8% Autosave</div>
                            <div className={styles.badgeSub}>Zero Data Loss Engine</div>
                        </div>
                    </div>

                    <div className={`${styles.floatingBadge} ${styles.badgeTopRight}`}>
                        <div className={styles.floatingIconCircle} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                            <FaFireFlameCurved />
                        </div>
                        <div>
                            <div className={styles.badgeTitle}>XP Streak +7 Days</div>
                            <div className={styles.badgeSub}>Level 14 Scholar</div>
                        </div>
                    </div>

                    <div className={`${styles.floatingBadge} ${styles.badgeBottomRight}`}>
                        <div className={styles.floatingIconCircle} style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>
                            <FiAward />
                        </div>
                        <div>
                            <div className={styles.badgeTitle}>Verified PDF</div>
                            <div className={styles.badgeSub}>Public Code Validation</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Features Showcase Section */}
            <section id="features" className={styles.featuresSection} aria-labelledby="features-heading">
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionLabel}>Cutting-Edge Capabilities</span>
                    <h2 id="features-heading">Engineered for Academic Precision & High Engagement</h2>
                    <p className={styles.sectionSubtitle}>
                        Explore the powerful assessment, analytics, and social features built into the Quivio platform.
                    </p>
                </div>

                <div className={styles.featuresGrid}>
                    <article className={styles.featureCard}>
                        <div className={styles.featureIconBox} style={{ background: "rgba(37, 99, 235, 0.12)", color: "var(--color-accent)" }}>
                            <FiBookOpen />
                        </div>
                        <h3>Interactive Quiz Engine</h3>
                        <p>Construct MCQs & True/False quizzes with audio effects, seeded answer shuffling, question hints, and 2-second database + localStorage autosave.</p>
                    </article>

                    <article className={styles.featureCard}>
                        <div className={styles.featureIconBox} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                            <FiBarChart2 />
                        </div>
                        <h3>Recharts & Excel Analytics</h3>
                        <p>Instructors access real-time score deciles, pass rates, question accuracy ratios, and export complete statistical reports directly to Excel (.xlsx).</p>
                    </article>

                    <article className={styles.featureCard}>
                        <div className={styles.featureIconBox} style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
                            <FiAward />
                        </div>
                        <h3>Gamified Motivation Loop</h3>
                        <p>Incentivize learners with quadratic level scaling, XP calculation algorithms, daily active streak calendars, and 3D podium leaderboards.</p>
                    </article>

                    <article className={styles.featureCard}>
                        <div className={styles.featureIconBox} style={{ background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6" }}>
                            <FiShield />
                        </div>
                        <h3>Dynamic PDF Certificates</h3>
                        <p>Automatically generate printable PDF certificates rendered client-side with @react-pdf/renderer and verifiable via unique security hash codes.</p>
                    </article>

                    <article className={styles.featureCard}>
                        <div className={styles.featureIconBox} style={{ background: "rgba(236, 72, 153, 0.12)", color: "#ec4899" }}>
                            <FiUsers />
                        </div>
                        <h3>Classrooms & Assignments</h3>
                        <p>Group students into isolated room rosters, schedule assignment start and due windows, and track submission progress live in real time.</p>
                    </article>

                    <article className={styles.featureCard}>
                        <div className={styles.featureIconBox} style={{ background: "rgba(6, 182, 212, 0.12)", color: "#06b6d4" }}>
                            <FiMessageSquare />
                        </div>
                        <h3>Realtime Chat & Announcements</h3>
                        <p>Direct student-instructor messaging, room broadcast notifications, and live toast alerts powered by Supabase Realtime channels.</p>
                    </article>

                    <article className={styles.featureCard}>
                        <div className={styles.featureIconBox} style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>
                            <FiDatabase />
                        </div>
                        <h3>Centralized Question Banks</h3>
                        <p>Build and curate organized question repositories categorized by subject, enabling rapid exam creation with reusable items.</p>
                    </article>

                    <article className={styles.featureCard}>
                        <div className={styles.featureIconBox} style={{ background: "rgba(20, 184, 166, 0.12)", color: "#14b8a6" }}>
                            <FiFileText />
                        </div>
                        <h3>Bulk Student Provisioning</h3>
                        <p>Add students individually or import entire classes in seconds via CSV files with client-side format checking and auto-generated credentials.</p>
                    </article>
                </div>
            </section>

            {/* Interactive Dual Portals Showcase */}
            <section id="portals" className={styles.portalsSection} aria-label="Portals and Workflows">
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionLabel}>Dual Specialized Workflows</span>
                    <h2>Tailored Portals for Instructors and Students</h2>
                    <p className={styles.sectionSubtitle}>
                        Switch between portals below to explore dedicated features for educators and learners.
                    </p>
                </div>

                <div className={styles.portalTabsWrapper}>
                    <button
                        className={`${styles.portalTabBtn} ${portalTab === "instructor" ? styles.portalTabActive : ""}`}
                        onClick={() => setPortalTab("instructor")}
                    >
                        <FiUser className={styles.tabIcon} /> Instructor Workspace
                    </button>
                    <button
                        className={`${styles.portalTabBtn} ${portalTab === "student" ? styles.portalTabActive : ""}`}
                        onClick={() => setPortalTab("student")}
                    >
                        <FiAward className={styles.tabIcon} /> Student Portal
                    </button>
                </div>

                <div className={styles.portalCardContainer}>
                    {portalTab === "instructor" ? (
                        <div className={styles.portalCard}>
                            <div className={styles.portalContentCol}>
                                <span className={styles.roleBadge} style={{ background: "rgba(37, 99, 235, 0.15)", color: "var(--color-accent)" }}>
                                    <FiUser /> Educator & Admin Workspace
                                </span>
                                <h3>Complete Assessment Control & Class Intelligence</h3>
                                <p className={styles.portalDesc}>
                                    Empower your teaching with automated grading workflows, deep analytics, room roster management, and bulk student onboarding.
                                </p>

                                <ul className={styles.portalCheckList}>
                                    <li>
                                        <FiCheckCircle className={styles.checkIcon} />
                                        <div>
                                            <strong>Question Bank & Exam Builder:</strong> Construct rich quizzes with MCQs, True/False, image attachments, hint text, and point values.
                                        </div>
                                    </li>
                                    <li>
                                        <FiCheckCircle className={styles.checkIcon} />
                                        <div>
                                            <strong>Bulk CSV Student Provisioning:</strong> Onboard entire cohorts at once with auto-generated secure credentials and format validation.
                                        </div>
                                    </li>
                                    <li>
                                        <FiCheckCircle className={styles.checkIcon} />
                                        <div>
                                            <strong>Recharts Statistical Analytics:</strong> Track grade distributions, student averages, item difficulty, and export reports to Excel (.xlsx).
                                        </div>
                                    </li>
                                    <li>
                                        <FiCheckCircle className={styles.checkIcon} />
                                        <div>
                                            <strong>Room Assignments & Realtime Alerts:</strong> Broadcast classroom announcements and monitor exam progress live.
                                        </div>
                                    </li>
                                </ul>

                                <div className={styles.portalCtaRow}>
                                    <MainButton variant="primary" size="md" onClick={handleNavRegister}>
                                        Register as Instructor <FiArrowRight />
                                    </MainButton>
                                </div>
                            </div>

                            <div className={styles.portalVisualCol}>
                                <div className={styles.visualCardMock}>
                                    <div className={styles.mockCardHeader}>
                                        <FiBarChart2 className={styles.mockHeaderIcon} />
                                        <span>Classroom Performance Summary</span>
                                    </div>
                                    <div className={styles.mockStatRow}>
                                        <div className={styles.mockStatBox}>
                                            <span className={styles.mockStatVal}>87.4%</span>
                                            <span className={styles.mockStatLbl}>Class Average</span>
                                        </div>
                                        <div className={styles.mockStatBox}>
                                            <span className={styles.mockStatVal}>94%</span>
                                            <span className={styles.mockStatLbl}>Pass Rate</span>
                                        </div>
                                        <div className={styles.mockStatBox}>
                                            <span className={styles.mockStatVal}>142</span>
                                            <span className={styles.mockStatLbl}>Submissions</span>
                                        </div>
                                    </div>
                                    <div className={styles.mockChartPreview}>
                                        <div className={styles.barItem} style={{ height: "60%" }}><span className={styles.barLabel}>Q1</span></div>
                                        <div className={styles.barItem} style={{ height: "85%" }}><span className={styles.barLabel}>Q2</span></div>
                                        <div className={styles.barItem} style={{ height: "45%" }}><span className={styles.barLabel}>Q3</span></div>
                                        <div className={styles.barItem} style={{ height: "92%" }}><span className={styles.barLabel}>Q4</span></div>
                                        <div className={styles.barItem} style={{ height: "78%" }}><span className={styles.barLabel}>Q5</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.portalCard}>
                            <div className={styles.portalContentCol}>
                                <span className={styles.roleBadge} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                                    <FiAward /> Student Learning Hub
                                </span>
                                <h3>Immersive Testing, XP Progression & Credentials</h3>
                                <p className={styles.portalDesc}>
                                    Take quizzes with confidence using 2-second autosave, level up your profile with XP, track daily streaks, and download verified PDF certificates.
                                </p>

                                <ul className={styles.portalCheckList}>
                                    <li>
                                        <FiCheckCircle className={styles.checkIcon} />
                                        <div>
                                            <strong>Zero-Data-Loss Quiz Engine:</strong> Mono-spaced timers, seeded answer shuffling, question navigator grid, and 2-sec database sync.
                                        </div>
                                    </li>
                                    <li>
                                        <FiCheckCircle className={styles.checkIcon} />
                                        <div>
                                            <strong>Gamification & 3D Leaderboards:</strong> Gain XP for accuracy and speed, maintain daily streaks, and climb global rank podiums.
                                        </div>
                                    </li>
                                    <li>
                                        <FiCheckCircle className={styles.checkIcon} />
                                        <div>
                                            <strong>Review & Detailed Feedback:</strong> Analyze step-by-step logic explanations for incorrect options after exam submission.
                                        </div>
                                    </li>
                                    <li>
                                        <FiCheckCircle className={styles.checkIcon} />
                                        <div>
                                            <strong>Instant PDF Certificates:</strong> Download client-side rendered PDF credentials with unique 8-character verification codes.
                                        </div>
                                    </li>
                                </ul>

                                <div className={styles.portalCtaRow}>
                                    <MainButton variant="primary" size="md" onClick={handleNavLogin}>
                                        Sign In to Student Portal <FiArrowRight />
                                    </MainButton>
                                </div>
                            </div>

                            <div className={styles.portalVisualCol}>
                                <div className={styles.visualCardMock}>
                                    <div className={styles.mockCardHeader}>
                                        <FaFireFlameCurved style={{ color: "#f59e0b" }} />
                                        <span>Student Achievement & XP Card</span>
                                    </div>
                                    <div className={styles.mockStudentProfile}>
                                        <div className={styles.mockAvatar}>MF</div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Mohamed Fayed</h4>
                                            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Level 14 • Master Scholar</span>
                                        </div>
                                    </div>
                                    <div className={styles.mockXpTrack}>
                                        <div className={styles.xpBarFill} style={{ width: "86%" }} />
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                                        <span>3,450 / 4,000 XP</span>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                            7-Day Streak <FaFireFlameCurved style={{ color: "#f59e0b" }} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Platform Statistics Section */}
            <section className={styles.statsSection} aria-label="Platform Statistics">
                <div className={styles.statsContainer}>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber} data-target="25000" data-suffix="+">25,000+</span>
                        <span className={styles.statLabel}>Quizzes Completed</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber} data-target="6500" data-suffix="+">6,500+</span>
                        <span className={styles.statLabel}>Active Students</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber} data-target="99" data-suffix=".2%">99.2%</span>
                        <span className={styles.statLabel}>Autosave Reliability</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber} data-target="1200" data-suffix="+">1,200+</span>
                        <span className={styles.statLabel}>Certificates Issued</span>
                    </div>
                </div>
            </section>

            {/* Gamification Spotlight Section */}
            <section id="gamification" className={styles.gamificationSection} aria-labelledby="gamification-heading">
                <div className={styles.gamificationGrid}>
                    <div className={styles.gamificationInfo}>
                        <span className={styles.sectionLabel}>Habit Building & Social Learning</span>
                        <h2 id="gamification-heading">Gamified Motivation Ecosystem</h2>
                        <p>
                            Quivio transforms routine studying into an addictively rewarding experience. Learners earn XP for accuracy and speed, advance through quadratic level thresholds, maintain active streak calendars, and unlock tier badges.
                        </p>

                        <div className={styles.badgeShowcase}>
                            <div className={styles.badgeItem}>
                                <div className={`${styles.badgeIcon} ${styles.bronze}`}>
                                    <FiAward />
                                </div>
                                <span>Bronze Novice</span>
                            </div>
                            <div className={styles.badgeItem}>
                                <div className={`${styles.badgeIcon} ${styles.silver}`}>
                                    <FaFireFlameCurved />
                                </div>
                                <span>Silver Streak</span>
                            </div>
                            <div className={styles.badgeItem}>
                                <div className={`${styles.badgeIcon} ${styles.gold}`}>
                                    <FiZap />
                                </div>
                                <span>Gold Scholar</span>
                            </div>
                            <div className={styles.badgeItem}>
                                <div className={`${styles.badgeIcon} ${styles.platinum}`}>
                                    <FiShield />
                                </div>
                                <span>Platinum Elite</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.gamificationVisual}>
                        <div className={styles.gamificationCard}>
                            <div className={styles.cardHeaderRow}>
                                <span className={styles.rankPill}>
                                    <FiTrendingUp /> Global Rank #1
                                </span>
                                <span className={styles.streakPill}>
                                    <FaFireFlameCurved /> 7-Day Active Streak
                                </span>
                            </div>

                            <div className={styles.userProfileRow}>
                                <div className={styles.avatarCircle}>
                                    <FiUser />
                                </div>
                                <div>
                                    <h4>Mohamed Fayed</h4>
                                    <span>Level 14 • Master Scholar</span>
                                </div>
                            </div>

                            <div className={styles.xpProgressContainer}>
                                <div className={styles.xpLabels}>
                                    <span>3,450 / 4,000 XP</span>
                                    <span>550 XP to Level 15</span>
                                </div>
                                <div className={styles.xpTrack}>
                                    <div className={styles.xpFill} style={{ width: "86%" }} />
                                </div>
                            </div>

                            <div className={styles.podiumMiniPreview}>
                                <div className={`${styles.podiumCol} ${styles.podium2}`}>
                                    <span className={styles.podiumRank}>2</span>
                                    <span className={styles.podiumName}>Sara K.</span>
                                </div>
                                <div className={`${styles.podiumCol} ${styles.podium1}`}>
                                    <span className={styles.podiumRank}>1</span>
                                    <span className={styles.podiumName}>Mohamed F.</span>
                                </div>
                                <div className={`${styles.podiumCol} ${styles.podium3}`}>
                                    <span className={styles.podiumRank}>3</span>
                                    <span className={styles.podiumName}>Ahmed S.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Public Certificate Verification Section */}
            <section id="certificates" className={styles.certificateSection} aria-label="Certificate Verification">
                <div className={styles.certificateGrid}>
                    <div className={styles.certificateVisual}>
                        <div className={styles.mockCertificate}>
                            <div className={styles.certHeader}>
                                <h3>QUIVIO ACADEMIC CREDENTIAL</h3>
                                <span>Official Verified Certificate</span>
                            </div>
                            <div className={styles.certBody}>
                                <p>This document certifies that</p>
                                <h4>Ahmed Samir</h4>
                                <p className={styles.certDesc}>Has successfully passed the Advanced Software Engineering Examination with a score of 96%.</p>
                            </div>
                            <div className={styles.certFooter}>
                                <div>
                                    <span className={styles.certCodeLabel}>VERIFICATION CODE</span>
                                    <span className={styles.certCodeValue}>QV-8924-SE</span>
                                </div>
                                <div className={styles.certStamp}>
                                    <FiCheckCircle /> VERIFIED
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.certificateVerify}>
                        <span className={styles.sectionLabel}>Public Credential Validator</span>
                        <h2>Instant Credential Verification</h2>
                        <p>
                            Employers, academic institutions, and leads can publicly verify the validity of any Quivio digital certificate using its unique 8-character verification code.
                        </p>

                        <form onSubmit={handleVerifyCertificate} className={styles.verifyForm}>
                            <div className={styles.inputWrapper}>
                                <FiSearch className={styles.searchIcon} />
                                <input
                                    type="text"
                                    placeholder="Enter verification code (e.g. QV-8924)..."
                                    value={certificateCode}
                                    onChange={(e) => setCertificateCode(e.target.value)}
                                    className={styles.verifyInput}
                                    aria-label="Certificate verification code"
                                    required
                                />
                            </div>
                            <MainButton type="submit" variant="primary" size="md">
                                Verify Credential
                            </MainButton>
                        </form>
                    </div>
                </div>
            </section>

            {/* Developer Contact & Feedback Section */}
            <section id="contact" className={styles.contactSection} aria-labelledby="contact-heading">
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionLabel}>Direct Developer Support</span>
                    <h2 id="contact-heading">Contact Developer & Share Feedback</h2>
                    <p className={styles.sectionSubtitle}>
                        Have a bug report, styling tweak, or feature request? Reach out directly to Mohamed Fayed for rapid resolution.
                    </p>
                </div>

                <div className={styles.contactGrid}>
                    {/* Developer Info & Direct Channels */}
                    <div className={styles.devCardInfo}>
                        <div className={styles.devAvatarContainer}>
                            <div className={styles.devAvatarBadge}>MF</div>
                            <div>
                                <h3 className={styles.devName}>Mohamed Fayed</h3>
                                <span className={styles.devTitle}>Creator & Lead Full-Stack Engineer</span>
                            </div>
                        </div>

                        <p className={styles.devBio}>
                            Quivio is continuously evolving. If you encounter any UI alignment issues, state bugs, or have ideas for new assessment capabilities, feel free to connect directly!
                        </p>

                        <div className={styles.contactChannelsGrid}>
                            <a
                                href="https://wa.me/201093650836"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.channelCard}
                            >
                                <div className={styles.channelIconBox} style={{ background: "rgba(37, 211, 102, 0.15)", color: "#25D366" }}>
                                    <FaWhatsapp />
                                </div>
                                <div>
                                    <span className={styles.channelLabel}>WhatsApp Direct</span>
                                    <span className={styles.channelVal}>+20 1093650836</span>
                                </div>
                            </a>

                            <a
                                href="mailto:mohamedfaye12d@gmail.com"
                                className={styles.channelCard}
                            >
                                <div className={styles.channelIconBox} style={{ background: "rgba(37, 99, 235, 0.15)", color: "var(--color-accent)" }}>
                                    <FiMail />
                                </div>
                                <div>
                                    <span className={styles.channelLabel}>Official Email</span>
                                    <span className={styles.channelVal}>mohamedfaye12d@gmail.com</span>
                                </div>
                            </a>

                            <a
                                href="https://www.linkedin.com/in/mohamed-fayed-b27928256/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.channelCard}
                            >
                                <div className={styles.channelIconBox} style={{ background: "rgba(10, 102, 194, 0.15)", color: "#0A66C2" }}>
                                    <FiLinkedin />
                                </div>
                                <div>
                                    <span className={styles.channelLabel}>LinkedIn</span>
                                    <span className={styles.channelVal}>Mohamed Fayed</span>
                                </div>
                            </a>

                            <a
                                href="https://x.com/Faye1d"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.channelCard}
                            >
                                <div className={styles.channelIconBox} style={{ background: "rgba(148, 163, 184, 0.15)", color: "var(--text-primary)" }}>
                                    <FaXTwitter />
                                </div>
                                <div>
                                    <span className={styles.channelLabel}>Twitter / X</span>
                                    <span className={styles.channelVal}>@Faye1d</span>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Interactive Quick Feedback Form */}
                    <div className={styles.devFeedbackFormCard}>
                        <h3>Send Message or Report an Issue</h3>
                        <p className={styles.feedbackFormSub}>Select a category and send your message directly via Email or WhatsApp.</p>

                        <form onSubmit={handleSendEmail} className={styles.feedbackForm}>
                            <div className={styles.categoryPillsGroup}>
                                {[
                                    { label: "Bug Report", icon: <FaBug /> },
                                    { label: "Styling & UI Fix", icon: <FiEdit3 /> },
                                    { label: "Feature Request", icon: <FiZap /> },
                                    { label: "General Inquiry", icon: <FiHelpCircle /> }
                                ].map((cat) => (
                                    <button
                                        key={cat.label}
                                        type="button"
                                        className={`${styles.catPillBtn} ${feedbackCategory === cat.label ? styles.catPillActive : ""}`}
                                        onClick={() => setFeedbackCategory(cat.label)}
                                    >
                                        {cat.icon} {cat.label}
                                    </button>
                                ))}
                            </div>

                            <div className={styles.textareaWrapper}>
                                <textarea
                                    rows="4"
                                    placeholder={`Describe your ${feedbackCategory.toLowerCase()} or feedback in detail...`}
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    className={styles.feedbackTextarea}
                                    required
                                />
                            </div>

                            <div className={styles.formActionRow}>
                                <MainButton type="submit" variant="primary" size="md">
                                    <FiMail style={{ marginRight: "6px" }} /> Send Email
                                </MainButton>
                                <MainButton type="button" variant="secondary" size="md" onClick={handleSendWhatsapp}>
                                    <FaWhatsapp style={{ color: "#25D366", marginRight: "6px" }} /> WhatsApp Message
                                </MainButton>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className={styles.faqSection} aria-labelledby="faq-heading">
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionLabel}>Frequently Asked Questions</span>
                    <h2 id="faq-heading">Everything You Need to Know</h2>
                </div>

                <div className={styles.faqList}>
                    {faqs.map((faq, index) => {
                        const isOpen = activeFaq === index;
                        return (
                            <div key={index} className={styles.faqItem}>
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className={styles.faqQuestion}
                                    aria-expanded={isOpen}
                                    aria-controls={`faq-answer-${index}`}
                                >
                                    <span>{faq.question}</span>
                                    {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                                </button>
                                <div
                                    id={`faq-answer-${index}`}
                                    className={`${styles.faqAnswer} ${isOpen ? styles.faqAnswerOpen : ""}`}
                                    role="region"
                                    aria-hidden={!isOpen}
                                >
                                    <p>{faq.answer}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Modern Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerGrid}>
                    <div className={styles.footerBrand}>
                        <div className={styles.navLogo}>
                            <img
                                src={isDark ? "/dark-logo.png" : "/light-logo.png"}
                                alt="Quivio Logo"
                                className={styles.logoImg}
                            />
                        </div>
                        <p className={styles.footerTagline}>
                            High-engagement academic quizzing built with precision, real-time automation, and modern gamification.
                        </p>
                        <div className={styles.socials} aria-label="Social media links">
                            <a href="https://x.com/Faye1d" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                <FaXTwitter />
                            </a>
                            <a href="https://wa.me/201093650836" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                                <FaWhatsapp />
                            </a>
                            <a href="https://www.linkedin.com/in/mohamed-fayed-b27928256/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                <FiLinkedin />
                            </a>
                        </div>
                    </div>

                    <div className={styles.footerLinksGroup}>
                        <h4>Product</h4>
                        <nav aria-label="Product links">
                            <a href="#features">Features</a>
                            <a href="#portals">Workflows</a>
                            <a href="#gamification">Gamification</a>
                            <a href="#certificates">Certificates</a>
                            <a href="#contact">Contact Developer</a>
                        </nav>
                    </div>

                    <div className={styles.footerLinksGroup}>
                        <h4>Support & Portals</h4>
                        <nav aria-label="Support links">
                            <a href="#faq">FAQ</a>
                            <a href="/login">Student Sign In</a>
                            <a href="/register">Instructor Registration</a>
                        </nav>
                    </div>

                    <div className={styles.footerLinksGroup}>
                        <h4>Legal</h4>
                        <nav aria-label="Legal links">
                            <a href="/terms">Terms of Service</a>
                            <a href="/privacy">Privacy Policy</a>
                        </nav>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <p>&copy; {new Date().getFullYear()} Quivio — QuizMaster Pro. Engineered by Mohamed Fayed.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

