// react
import { useEffect, useRef, useState } from "react";

// react-router
import { useNavigate } from "react-router";

// react-redux
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../../redux/slices/themeSLice";
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
    FiGithub,
    FiLinkedin,
    FiArrowRight,
    FiCheck,
    FiUser,
    FiSun,
    FiMoon,
    FiMessageSquare,
    FiUsers,
    FiCheckCircle,
    FiSearch
} from "react-icons/fi";
import { FaXTwitter, FaFireFlameCurved } from "react-icons/fa6";

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
    const [activeFaq, setActiveFaq] = useState(null);

    // Certificate code verification state
    const [certificateCode, setCertificateCode] = useState("");

    const faqs = [
        {
            question: "How do student accounts get created in Quivio?",
            answer: "Student accounts are generated directly by course instructors via the Students Management portal. Instructors can add students individually or use Bulk CSV Import to provision an entire class in seconds."
        },
        {
            question: "How does the 2-second Quiz Autosave work?",
            answer: "While taking a quiz, Quivio automatically syncs student answers to the database every 2 seconds. If a connection loss occurs, answers are cached in localStorage and synced back upon reconnecting."
        },
        {
            question: "Are certificates generated automatically?",
            answer: "Yes! Instructors configure passing score thresholds. When a student passes, high-fidelity PDF certificates are dynamically rendered via client-side PDF engine and can be verified publicly."
        },
        {
            question: "Can instructors track real-time analytics and export data?",
            answer: "Instructors get deep analytics dashboards featuring Recharts charts, class averages, score deciles, pass rates, easiest/hardest questions, and one-click Excel (.xlsx) exports."
        },
        {
            question: "How do gamification XP, levels, and streaks work?",
            answer: "Students earn XP based on score accuracy and speed. Levels scale quadratically, daily streaks track consecutive study days, and real-time leaderboards feature 3D podiums for top performers."
        },
        {
            question: "Is there integrated messaging and live announcements?",
            answer: "Yes, Quivio features real-time chat between instructors and students, room-specific broadcast messaging, and instant notification alerts powered by Supabase Realtime."
        }
    ];

    // GSAP Scroll and Load animations
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Opening Hero Animation Timeline
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
                `.${styles.heroVisualContainer}`,
                { scale: 0.92, opacity: 0, y: 30 },
                { scale: 1, opacity: 1, y: 0, duration: 1.0, ease: "power2.out" },
                "-=0.6"
            );

            // ScrollTrigger Animations for Sections
            const animatedSections = [
                { selector: `.${styles.sectionHeader}`, trigger: `.${styles.featuresSection}` },
                { selector: `.${styles.featureCard}`, trigger: `.${styles.featuresGrid}`, stagger: 0.12 },
                { selector: `.${styles.splitCol}`, trigger: `.${styles.splitSection}`, stagger: 0.2 },
                { selector: `.${styles.statItem}`, trigger: `.${styles.statsContainer}`, stagger: 0.15 },
                { selector: `.${styles.gamificationCard}`, trigger: `.${styles.gamificationSection}` },
                { selector: `.${styles.certificateGrid}`, trigger: `.${styles.certificateSection}` },
                { selector: `.${styles.faqItem}`, trigger: `.${styles.faqSection}`, stagger: 0.1 }
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
                                start: "top 82%",
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
                gsap.fromTo(
                    stat,
                    { textContent: "0" },
                    {
                        textContent: targetVal,
                        duration: 2.2,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: stat,
                            start: "top 85%"
                        },
                        snap: { textContent: 1 },
                        onUpdate: function () {
                            const val = Math.ceil(this.targets()[0].textContent);
                            stat.innerHTML = val.toLocaleString() + "+";
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
                    <a href="#workflows">Workflows</a>
                    <a href="#gamification">Gamification</a>
                    <a href="#certificates">Certificates</a>
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

            {/* Hero Section */}
            <section className={styles.heroSection} ref={heroRef} aria-label="Introduction">
                <div className={styles.heroContent}>
                    <div className={styles.heroBadge}>
                        <span className={styles.badgePulse} /> Realtime Quizzing & Gamified Classrooms
                    </div>

                    <h1 className={styles.heroTitle}>
                        Empower Learning with <span className={styles.heroAccent}>Realtime</span> Quizzing
                    </h1>

                    <p className={styles.heroSubtext}>
                        Quivio is the all-in-one assessment engine for educators. Conduct secure exams, automate grading, track class analytics with Recharts, and motivate students with XP, daily streaks, and verifiable PDF certificates.
                    </p>

                    <div className={styles.heroActions}>
                        {isAuth ? (
                            <MainButton
                                variant="primary"
                                size="lg"
                                onClick={() => navigate(role === "instructor" ? "/instructor/dashboard" : "/student/dashboard")}
                            >
                                Go to Dashboard <FiArrowRight className={styles.btnIconRight} />
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

                    {/* Key Trust Highlights */}
                    <div className={styles.heroPills}>
                        <span className={styles.pillItem}><FiCheckCircle className={styles.pillIcon} /> 2-Sec Autosave</span>
                        <span className={styles.pillItem}><FiCheckCircle className={styles.pillIcon} /> Dynamic PDF Credentials</span>
                        <span className={styles.pillItem}><FiCheckCircle className={styles.pillIcon} /> Realtime Chat & Alerts</span>
                        <span className={styles.pillItem}><FiCheckCircle className={styles.pillIcon} /> Recharts Analytics</span>
                    </div>
                </div>

                {/* Hero Visual Image from /public/hero.webp */}
                <div className={styles.heroVisualContainer}>
                    <div className={styles.heroImageFrame}>
                        <img
                            src="/hero.webp"
                            alt="Quivio Platform Dashboard Preview"
                            className={styles.heroImage}
                        />
                        <div className={styles.heroImageGlow} />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className={styles.featuresSection} aria-labelledby="features-heading">
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionLabel}>Core Capabilities</span>
                    <h2 id="features-heading">Engineered for Modern Classrooms</h2>
                    <p className={styles.sectionSubtitle}>
                        Everything instructors and students need for high-engagement, zero-data-loss online assessment.
                    </p>
                </div>

                <div className={styles.featuresGrid}>
                    <article className={styles.featureCard}>
                        <div className={styles.featureIconBox} style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}>
                            <FiBookOpen />
                        </div>
                        <h3>Interactive Quiz Engine</h3>
                        <p>Construct MCQs & True/False quizzes with audio effects, seeded answer shuffling, question hints, and 2-second database + localStorage autosave.</p>
                    </article>

                    <article className={styles.featureCard}>
                        <div className={styles.featureIconBox} style={{ background: "var(--bg-success)", color: "var(--color-success)" }}>
                            <FiBarChart2 />
                        </div>
                        <h3>Recharts & Excel Analytics</h3>
                        <p>Instructors access real-time score deciles, pass rates, question accuracy ratios, and export statistical reports directly to Excel (.xlsx).</p>
                    </article>

                    <article className={styles.featureCard}>
                        <div className={styles.featureIconBox} style={{ background: "var(--bg-xp)", color: "var(--color-xp)" }}>
                            <FiAward />
                        </div>
                        <h3>Gamified Motivation Loop</h3>
                        <p>Incentivize learners with quadratic level scaling, XP calculation algorithms, daily active streak counters, and 3D podium leaderboards.</p>
                    </article>

                    <article className={styles.featureCard}>
                        <div className={styles.featureIconBox} style={{ background: "var(--bg-warning)", color: "var(--color-warning)" }}>
                            <FiShield />
                        </div>
                        <h3>Dynamic PDF Certificates</h3>
                        <p>Automatically generate printable PDF certificates rendered client-side with @react-pdf/renderer and verifiable via 8-character security codes.</p>
                    </article>

                    <article className={styles.featureCard}>
                        <div className={styles.featureIconBox} style={{ background: "var(--bg-info)", color: "var(--color-info)" }}>
                            <FiUsers />
                        </div>
                        <h3>Classroom Rooms & Assignments</h3>
                        <p>Group students into isolated room rosters, schedule assignment start and due windows, and track submission statuses live.</p>
                    </article>

                    <article className={styles.featureCard}>
                        <div className={styles.featureIconBox} style={{ background: "var(--bg-accent)", color: "var(--color-accent)" }}>
                            <FiMessageSquare />
                        </div>
                        <h3>Realtime Chat & Announcements</h3>
                        <p>Direct student-instructor messaging, room broadcast notifications, and live toast alerts powered by Supabase Realtime channels.</p>
                    </article>
                </div>
            </section>

            {/* Workflows & User Experience Split Section */}
            <section id="workflows" className={styles.splitSection} aria-label="Workflows">
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionLabel}>Seamless Dual Portals</span>
                    <h2>Tailored Portals for Instructors & Students</h2>
                </div>

                <div className={styles.splitGrid}>
                    <div className={styles.splitCol}>
                        <div className={styles.roleBadge} style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}>
                            <FiUser /> Instructor Hub
                        </div>
                        <h3>Manage Classrooms & Analyze Performance</h3>
                        <ul className={styles.splitList} aria-label="Instructor capabilities">
                            <li>
                                <FiCheck className={styles.listIcon} />
                                <span>Create reusable Question Banks to rapidly construct new quizzes.</span>
                            </li>
                            <li>
                                <FiCheck className={styles.listIcon} />
                                <span>Provision student accounts with auto-generated passwords & Bulk CSV import.</span>
                            </li>
                            <li>
                                <FiCheck className={styles.listIcon} />
                                <span>Schedule assignments with opening/closing time bounds and reminder alerts.</span>
                            </li>
                            <li>
                                <FiCheck className={styles.listIcon} />
                                <span>Monitor live room attempts and download complete statistical Excel sheets.</span>
                            </li>
                        </ul>
                    </div>

                    <div className={styles.splitCol}>
                        <div className={styles.roleBadge} style={{ background: "var(--bg-xp)", color: "var(--color-xp)" }}>
                            <FiAward /> Student Portal
                        </div>
                        <h3>Learn, Compete & Achieve</h3>
                        <ul className={styles.splitList} aria-label="Student capabilities">
                            <li>
                                <FiCheck className={styles.listIcon} />
                                <span>Solve tests with mono-spaced timers, navigator grid, and 2-sec autosave.</span>
                            </li>
                            <li>
                                <FiCheck className={styles.listIcon} />
                                <span>Review step-by-step logic explanations for incorrect quiz options.</span>
                            </li>
                            <li>
                                <FiCheck className={styles.listIcon} />
                                <span>Climb Global, Monthly, and Category leaderboards with 3D podiums.</span>
                            </li>
                            <li>
                                <FiCheck className={styles.listIcon} />
                                <span>Earn achievement badges, build 7-day streaks, and download PDF certificates.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Platform Statistics Row */}
            <section className={styles.statsSection} aria-label="Platform Statistics">
                <div className={styles.statsContainer}>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber} data-target="25000">25,000+</span>
                        <span className={styles.statLabel}>Quizzes Completed</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber} data-target="6500">6,500+</span>
                        <span className={styles.statLabel}>Active Students</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber} data-target="99">99.2%</span>
                        <span className={styles.statLabel}>Autosave Reliability</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber} data-target="1200">1,200+</span>
                        <span className={styles.statLabel}>Certificates Awarded</span>
                    </div>
                </div>
            </section>

            {/* Gamification Spotlight */}
            <section id="gamification" className={styles.gamificationSection} aria-labelledby="gamification-heading">
                <div className={styles.gamificationGrid}>
                    <div className={styles.gamificationInfo}>
                        <span className={styles.sectionLabel}>Habit Building</span>
                        <h2 id="gamification-heading">Gamified Motivation System</h2>
                        <p>
                            Quivio turns daily practice into an addictively rewarding habit. Students earn XP for accuracy and speed, level up through quadratic thresholds, and maintain active streak calendars.
                        </p>

                        <div className={styles.badgeShowcase}>
                            <div className={styles.badgeItem}>
                                <div className={`${styles.badgeIcon} ${styles.bronze}`}>
                                    <FiAward />
                                </div>
                                <span>Bronze Tier</span>
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
                                    <FiTrendingUp /> Rank #1 Global
                                </span>
                                <span className={styles.streakPill}>
                                    <FaFireFlameCurved /> 7-Day Streak
                                </span>
                            </div>

                            <div className={styles.userProfileRow}>
                                <div className={styles.avatarCircle}>
                                    <FiUser />
                                </div>
                                <div>
                                    <h4>Mohamed Fayed</h4>
                                    <span>Level 14 Master Scholar</span>
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
                        </div>
                    </div>
                </div>
            </section>

            {/* Certificate Verification Portal Section */}
            <section id="certificates" className={styles.certificateSection} aria-label="Certificate Verification">
                <div className={styles.certificateGrid}>
                    <div className={styles.certificateVisual}>
                        <div className={styles.mockCertificate}>
                            <div className={styles.certHeader}>
                                <h3>QUIVIO CERTIFICATE</h3>
                                <span>Official Academic Credential</span>
                            </div>
                            <div className={styles.certBody}>
                                <p>This certifies that</p>
                                <h4>Ahmed Samir</h4>
                                <p className={styles.certDesc}>Has successfully passed the Advanced Software Engineering Examination with a distinction score of 96%.</p>
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

            {/* Footer */}
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
                            <a href="https://github.com/Fayed12" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                                <FiGithub />
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
                            <a href="#workflows">Workflows</a>
                            <a href="#gamification">Gamification</a>
                            <a href="#certificates">Certificates</a>
                        </nav>
                    </div>

                    <div className={styles.footerLinksGroup}>
                        <h4>Support</h4>
                        <nav aria-label="Support links">
                            <a href="#faq">FAQ</a>
                            <a href="/login">Portal Login</a>
                            <a href="/register">Instructor Sign Up</a>
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
