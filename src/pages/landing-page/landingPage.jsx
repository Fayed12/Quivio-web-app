// local
import MainButton from "../../components/ui/button/MainButton";
import styles from "./landingPage.module.css";
import { toggleTheme } from "../../redux/slices/themeSLice";

// react
import { useEffect, useRef, useState } from "react";

// react-redux
import { useDispatch, useSelector } from "react-redux";

// react-router
import { useNavigate } from "react-router";

// auth selectors
import { selectIsAuthenticated, selectRole } from "../../redux/slices/authSlice";

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
    FiMoon
} from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import { FaFireFlameCurved } from "react-icons/fa6";

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
            return document.documentElement.classList.contains("dark") || 
                   document.documentElement.getAttribute("data-theme") === "dark";
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
            question: "How do student accounts get created?",
            answer: "Student accounts are created directly by their course instructors. Instructors add students to specific rooms, and the system automatically sends students their credentials via email."
        },
        {
            question: "Can I try Quivio as an instructor for free?",
            answer: "Yes, instructors can register freely via the registration route and create their initial classrooms and quizzes. You'll gain access to our full suite of dashboard indicators and question banks."
        },
        {
            question: "Are certificates issued automatically?",
            answer: "Absolutely! Instructors can toggle certificates for individual quizzes and set a passing threshold. Once a student passes, their verifiable certificate is instantly generated as a PDF."
        },
        {
            question: "Does the quiz module auto-save student progress?",
            answer: "Yes. The quiz interface auto-saves student selections to our database every 2 seconds. If a connection drops, progress is safely cached locally and synced back when online."
        },
        {
            question: "Can we review quiz results and answers?",
            answer: "Students can review their results in detail once they submit, depending on room policies. They will see correct/incorrect answers, score statistics, and custom explanations written by their instructor."
        },
        {
            question: "Is there support for dark and light modes?",
            answer: "Yes, Quivio is built from the ground up using native CSS variables that support both light and dark themes. It respects your operating system's configuration or user profile selections."
        }
    ];

    // GSAP Scroll and Load animations
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero section animations
            const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
            heroTl.fromTo(
                `.${styles.heroBadge}`,
                { y: -20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6 }
            );
            heroTl.fromTo(
                `.${styles.heroTitle}`,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8 },
                "-=0.4"
            );
            heroTl.fromTo(
                `.${styles.heroSubtext}`,
                { y: 20, opacity: 0 },
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
                `.${styles.heroVisual}`,
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: 1.0, ease: "power2.out" },
                "-=0.6"
            );

            // Scroll animations for sections
            const animatedSections = [
                { selector: `.${styles.featuresSection} h2`, trigger: `.${styles.featuresSection}` },
                { selector: `.${styles.featureCard}`, trigger: `.${styles.featureCard}`, stagger: 0.15 },
                { selector: `.${styles.splitCol}`, trigger: `.${styles.splitSection}` },
                { selector: `.${styles.statItem}`, trigger: `.${styles.statsContainer}`, stagger: 0.15 },
                { selector: `.${styles.badgePreviewCard}`, trigger: `.${styles.badgeShowcase}` },
                { selector: `.${styles.faqItem}`, trigger: `.${styles.faqSection}`, stagger: 0.1 }
            ];

            animatedSections.forEach(({ selector, trigger, stagger }) => {
                const els = gsap.utils.toArray(selector);
                if (els.length > 0) {
                    gsap.fromTo(
                        els,
                        { y: 30, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.8,
                            stagger: stagger || 0,
                            scrollTrigger: {
                                trigger: trigger,
                                start: "top 80%",
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
                        duration: 2.0,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: stat,
                            start: "top 85%"
                        },
                        snap: { textContent: 1 },
                        onUpdate: function () {
                            stat.innerHTML = Math.ceil(this.targets()[0].textContent).toLocaleString() + (stat.innerHTML.includes("+") ? "+" : "");
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
                <div className={styles.navLogo}>
                    <img 
                        src={isDark ? "/dark-logo.png" : "/light-logo.png"} 
                        alt="Quivio Logo" 
                        className={styles.logoImg} 
                    />
                </div>
                
                <nav className={styles.navLinks} aria-label="Main navigation">
                    <a href="#features">Features</a>
                    <a href="#experience">Experiences</a>
                    <a href="#gamification">Gamification</a>
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
                    <span className={styles.heroBadge}>
                        <span className={styles.badgePulse} /> Now live: Verifiable Student Certificates
                    </span>
                    
                    <h1 className={styles.heroTitle}>
                        Empower Learning with <span className={styles.heroAccent}>Interactive</span> Quizzing
                    </h1>
                    
                    <p className={styles.heroSubtext}>
                        Quivio is the unified hub for educators to distribute structured examinations, automate score tracking, and incentivize students with gamified learning loops.
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
                                <a href="/login" className={styles.heroSecondaryLink}>
                                    Already have an account? Sign in
                                </a>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.heroVisual} aria-hidden="true">
                    <div className={styles.visualCard}>
                        <div className={styles.visualHeader}>
                            <span className={styles.visualDot} />
                            <span className={styles.visualDot} />
                            <span className={styles.visualDot} />
                        </div>
                        <div className={styles.visualBody}>
                            <div className={styles.visualStatsRow}>
                                <div className={styles.visualStatBox}>
                                    <span>Success Rate</span>
                                    <strong>84.2%</strong>
                                </div>
                                <div className={styles.visualStatBox}>
                                    <span>Average Score</span>
                                    <strong>78%</strong>
                                </div>
                            </div>
                            <div className={styles.visualLine} />
                            <div className={styles.visualLine} style={{ width: "80%" }} />
                            <div className={styles.visualBarChart}>
                                <div className={styles.chartBar} style={{ height: "40%" }} />
                                <div className={styles.chartBar} style={{ height: "65%" }} />
                                <div className={styles.chartBar} style={{ height: "90%" }} />
                                <div className={styles.chartBar} style={{ height: "55%" }} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className={styles.featuresSection} aria-labelledby="features-heading">
                <span className={styles.sectionLabel}>Features Grid</span>
                <h2 id="features-heading">Engineered for Academic Excellence</h2>
                
                <div className={styles.featuresGrid}>
                    <article className={styles.featureCard}>
                        <div className={styles.featureIconContainer} style={{ background: "var(--bg-accent)", color: "var(--color-accent)" }}>
                            <FiBookOpen aria-hidden="true" />
                        </div>
                        <h3>Dynamic Quiz Engine</h3>
                        <p>Construct multiple-choice and true/false assessments with real-time autograding, custom topic tags, and media support.</p>
                    </article>

                    <article className={styles.featureCard}>
                        <div className={styles.featureIconContainer} style={{ background: "var(--bg-success)", color: "var(--color-success)" }}>
                            <FiBarChart2 aria-hidden="true" />
                        </div>
                        <h3>Actionable Analytics</h3>
                        <p>Instructors get granular insights on student success rate. Students view score progress, category strengths, and averages.</p>
                    </article>

                    <article className={styles.featureCard}>
                        <div className={styles.featureIconContainer} style={{ background: "var(--bg-xp)", color: "var(--color-xp)" }}>
                            <FiAward aria-hidden="true" />
                        </div>
                        <h3>Gamified Incentives</h3>
                        <p>Engage learners with custom XP thresholds, deterministic achievement badges, weekly rankings, and daily streak counts.</p>
                    </article>

                    <article className={styles.featureCard}>
                        <div className={styles.featureIconContainer} style={{ background: "var(--bg-warning)", color: "var(--color-warning)" }}>
                            <FiShield aria-hidden="true" />
                        </div>
                        <h3>Verifiable Credentials</h3>
                        <p>Reward passing results with PDF certificate exports containing QR links that connect directly to our public validator.</p>
                    </article>
                </div>
            </section>

            {/* User Experience Split Section */}
            <section id="experience" className={styles.splitSection} aria-label="Experiences">
                <div className={styles.splitGrid}>
                    <div className={styles.splitCol}>
                        <span className={styles.splitLabel}>For Instructors</span>
                        <h2>Structure, Manage, and Refine</h2>
                        <ul className={styles.splitList} aria-label="Instructor capabilities">
                            <li>
                                <FiCheck className={styles.listIcon} aria-hidden="true" /> 
                                <span>Create isolated Rooms to cluster specific classes and students.</span>
                            </li>
                            <li>
                                <FiCheck className={styles.listIcon} aria-hidden="true" /> 
                                <span>Add student profiles directly and dispatch auto-generated credentials.</span>
                            </li>
                            <li>
                                <FiCheck className={styles.listIcon} aria-hidden="true" /> 
                                <span>Compile central Question Banks to reuse content across quizzes.</span>
                            </li>
                        </ul>
                    </div>

                    <div className={styles.splitCol}>
                        <span className={styles.splitLabel}>For Students</span>
                        <h2>Attempt, Review, and Earn</h2>
                        <ul className={styles.splitList} aria-label="Student capabilities">
                            <li>
                                <FiCheck className={styles.listIcon} aria-hidden="true" /> 
                                <span>Solve tests in a minimal, timer-locked environment.</span>
                            </li>
                            <li>
                                <FiCheck className={styles.listIcon} aria-hidden="true" /> 
                                <span>Review step-by-step logic explanations for missed questions.</span>
                            </li>
                            <li>
                                <FiCheck className={styles.listIcon} aria-hidden="true" /> 
                                <span>Climb the local class leaderboards by answering quickly and keeping streaks.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Platform Statistics Row */}
            <section className={styles.statsSection} aria-label="Statistics">
                <div className={styles.statsContainer}>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber} data-target="15000">15,000+</span>
                        <span className={styles.statLabel}>Quizzes Conducted</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber} data-target="4800">4,800+</span>
                        <span className={styles.statLabel}>Active Students</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber} data-target="98">98.5%</span>
                        <span className={styles.statLabel}>Satisfaction Rate</span>
                    </div>
                </div>
            </section>

            {/* Gamification Showcase */}
            <section id="gamification" className={styles.gamificationSection} aria-labelledby="gamification-heading">
                <div className={styles.gamificationGrid}>
                    <div className={styles.gamificationInfo}>
                        <span className={styles.sectionLabel}>Motivation First</span>
                        <h2 id="gamification-heading">Engineered for Academic Engagement</h2>
                        <p>
                            Quivio turns studying into a rewarding habit. The platform integrates structural game mechanics that encourage consistent daily interaction.
                        </p>

                        <div className={styles.badgeShowcase}>
                            <div className={styles.badgeItem}>
                                <div className={`${styles.badgeIcon} ${styles.bronze}`}>
                                    <FiAward aria-hidden="true" />
                                </div>
                                <span>Quick Solver</span>
                            </div>
                            <div className={styles.badgeItem}>
                                <div className={`${styles.badgeIcon} ${styles.silver}`}>
                                    <FaFireFlameCurved aria-hidden="true" />
                                </div>
                                <span>5-Day Streak</span>
                            </div>
                            <div className={styles.badgeItem}>
                                <div className={`${styles.badgeIcon} ${styles.gold}`}>
                                    <FiZap aria-hidden="true" />
                                </div>
                                <span>Century Club</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.gamificationVisual}>
                        <div className={styles.badgePreviewCard}>
                            <div className={styles.cardRank}>
                                <FiTrendingUp className={styles.rankIcon} aria-hidden="true" />
                                <span>Rank #1 — Leaderboard</span>
                            </div>
                            <div className={styles.userProgress}>
                                <div className={styles.avatarPlaceholder}>
                                    <FiUser aria-hidden="true" />
                                </div>
                                <div>
                                    <h4>Ahmed Farrag</h4>
                                    <span>Level 12 Scholar</span>
                                </div>
                            </div>
                            <div className={styles.progressContainer}>
                                <div className={styles.progressText}>
                                    <span>2,450 / 3,000 XP</span>
                                    <span>550 XP to Level 13</span>
                                </div>
                                <div className={styles.xpProgressTrack}>
                                    <div className={styles.xpProgressBar} style={{ width: "81%" }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Certificate Preview and Validator Mockup */}
            <section className={styles.certificatePreviewSection} aria-label="Certificate verification">
                <div className={styles.certificateGrid}>
                    <div className={styles.certificateVisual}>
                        <div className={styles.mockCertificate}>
                            <div className={styles.certHeader}>
                                <h3>Quivio</h3>
                                <span>Certificate of Excellence</span>
                            </div>
                            <div className={styles.certBody}>
                                <p className={styles.certMuted}>This is proudly presented to</p>
                                <h4>Jane Doe</h4>
                                <p className={styles.certDesc}>For successfully passing the Advanced JavaScript Systems examination with a score of 95% on June 29, 2026.</p>
                            </div>
                            <div className={styles.certFooter}>
                                <div>
                                    <span className={styles.certSig} />
                                    <span>Director Signature</span>
                                </div>
                                <div className={styles.certQR}>
                                    {/* Abstract QR block */}
                                    <div className={styles.qrBlock} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.certificateVerify}>
                        <span className={styles.sectionLabel}>Security Verification</span>
                        <h2>Public Credential Validator</h2>
                        <p>
                            Allow employers, academic directors, or team leads to confirm the legitimacy of your achievement instantly using our verification system.
                        </p>
                        
                        <form onSubmit={handleVerifyCertificate} className={styles.verifyForm}>
                            <input
                                type="text"
                                placeholder="Enter 8-digit verification code..."
                                value={certificateCode}
                                onChange={(e) => setCertificateCode(e.target.value)}
                                className={styles.verifyInput}
                                aria-label="Certificate verification code"
                                required
                            />
                            <MainButton type="submit" variant="primary" size="md">
                                Verify Now
                            </MainButton>
                        </form>
                    </div>
                </div>
            </section>

            {/* FAQ Accordion Section */}
            <section id="faq" className={styles.faqSection} aria-labelledby="faq-heading">
                <span className={styles.sectionLabel}>FAQ Section</span>
                <h2 id="faq-heading">Frequently Asked Questions</h2>

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
                                    {isOpen ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />}
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
                                src={isDark ?"/light-logo.png": "/dark-logo.png" } 
                                alt="Quivio Logo" 
                                className={styles.logoImg} 
                            />
                        </div>
                        <p className={styles.footerTagline}>
                            High-engagement academic quizzing built with precision, automation, and modern incentives.
                        </p>
                        <div className={styles.socials} aria-label="Social media links">
                            <a href="https://x.com/Faye1d" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                <FaXTwitter aria-hidden="true" />
                            </a>
                            <a href="https://github.com/Fayed12" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                                <FiGithub aria-hidden="true" />
                            </a>
                            <a href="https://www.linkedin.com/in/mohamed-fayed-b27928256/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                <FiLinkedin aria-hidden="true" />
                            </a>
                        </div>
                    </div>

                    <div className={styles.footerLinksGroup}>
                        <h4>Product</h4>
                        <nav aria-label="Product links">
                            <a href="#features">Features</a>
                            <a href="#experience">Student Experience</a>
                            <a href="#experience">Instructor Panel</a>
                            <a href="#gamification">Gamified Loop</a>
                        </nav>
                    </div>

                    <div className={styles.footerLinksGroup}>
                        <h4>Support</h4>
                        <nav aria-label="Support links">
                            <a href="#faq">FAQ</a>
                            <a href="/login">Help Center</a>
                            <a href="/register">Contact Sales</a>
                        </nav>
                    </div>

                    <div className={styles.footerLinksGroup}>
                        <h4>Legal</h4>
                        <nav aria-label="Legal links">
                            <a href="/terms">Terms of Service</a>
                            <a href="/privacy">Privacy Policy</a>
                            <a href="/login">Data Standards</a>
                        </nav>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <p>&copy; {new Date().getFullYear()} Quivio. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
