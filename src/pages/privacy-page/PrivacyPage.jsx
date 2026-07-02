import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { selectTheme } from "../../redux/slices/themeSLice";
import MainButton from "../../components/ui/button/MainButton";
import { FiArrowLeft, FiArrowUp, FiShield } from "react-icons/fi";
import styles from "./PrivacyPage.module.css";
import { gsap } from "gsap";

const PrivacyPage = () => {
    const navigate = useNavigate();
    const currentTheme = useSelector(selectTheme);
    const isDark = currentTheme === "dark";

    const [activeSection, setActiveSection] = useState("sec-1");
    const [showScrollTop, setShowScrollTop] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        // Scroll to top on mount
        window.scrollTo(0, 0);

        const handleScroll = () => {
            // Show/hide scroll-to-top button
            setShowScrollTop(window.scrollY > 300);

            // Determine active section based on scroll position
            const sections = [
                "sec-1", "sec-2", "sec-3", "sec-4", "sec-5", "sec-6", "sec-7", "sec-8", "sec-9"
            ];
            
            for (const sectionId of sections) {
                const el = document.getElementById(sectionId);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    // If the section header is near the top of the viewport
                    if (rect.top >= 0 && rect.top <= 150) {
                        setActiveSection(sectionId);
                        break;
                    } else if (rect.top < 0 && rect.bottom > 150) {
                        setActiveSection(sectionId);
                        break;
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // GSAP entrance animations
    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            // Navbar drop-in
            tl.fromTo(
                `.${styles.navbar}`,
                { opacity: 0, y: -20 },
                { opacity: 1, y: 0, duration: 0.5 }
            );

            // Hero section animations
            tl.fromTo(
                `.${styles.iconWrapper}`,
                { opacity: 0, scale: 0.5 },
                { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)" },
                "-=0.3"
            );

            tl.fromTo(
                [`.${styles.pageTitle}`, `.${styles.pageSubtitle}`],
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 },
                "-=0.4"
            );

            // TOC Card (left) and Sections (right) entrance
            tl.fromTo(
                `.${styles.tocCard}`,
                { opacity: 0, x: -30 },
                { opacity: 1, x: 0, duration: 0.6 },
                "-=0.4"
            );

            tl.fromTo(
                `.${styles.docSection}`,
                { opacity: 0, y: 25 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
                "-=0.5"
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) {
            const offset = 100; // offset for sticky navbar
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = el.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            setActiveSection(id);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const tocItems = [
        { id: "sec-1", label: "1. Information Collection" },
        { id: "sec-2", label: "2. How We Use Data" },
        { id: "sec-3", label: "3. Sharing and Disclosures" },
        { id: "sec-4", label: "4. Data Security" },
        { id: "sec-5", label: "5. Cookies & Local Storage" },
        { id: "sec-6", label: "6. Data Retention" },
        { id: "sec-7", label: "7. FERPA & Children's Privacy" },
        { id: "sec-8", label: "8. Your Rights & Choices" },
        { id: "sec-9", label: "9. Updates & Contact Info" }
    ];

    return (
        <div ref={containerRef} className={styles.pageContainer}>
            {/* Header Navbar */}
            <header className={styles.navbar} id="privacy-navbar">
                <div className={styles.navLogo} onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                    <img 
                        src={isDark ? "/dark-logo.png" : "/light-logo.png"} 
                        alt="Quivio Logo" 
                        className={styles.logoImg} 
                    />
                </div>
                <div className={styles.navActions}>
                    <MainButton 
                        id="privacy-back-btn"
                        variant="ghost" 
                        onClick={() => navigate("/")} 
                        size="sm"
                    >
                        <FiArrowLeft style={{ marginRight: "var(--space-2)" }} /> Back to Home
                    </MainButton>
                </div>
            </header>

            {/* Hero Header */}
            <section className={styles.heroSection} aria-labelledby="privacy-heading">
                <div className={styles.heroGlow} />
                <div className={styles.heroContent}>
                    <div className={styles.iconWrapper}>
                        <FiShield />
                    </div>
                    <h1 id="privacy-heading" className={styles.pageTitle}>Privacy Policy</h1>
                    <p className={styles.pageSubtitle}>Last updated: July 2, 2026</p>
                </div>
            </section>

            {/* Document Content Grid */}
            <main className={styles.contentGrid}>
                {/* Sidebar Table of Contents */}
                <aside className={styles.sidebar}>
                    <div className={styles.tocCard}>
                        <h3>Table of Contents</h3>
                        <nav aria-label="Privacy policy sections">
                            <ul className={styles.tocList}>
                                {tocItems.map((item) => (
                                    <li key={item.id}>
                                        <button
                                            id={`toc-btn-${item.id}`}
                                            onClick={() => scrollToSection(item.id)}
                                            className={`${styles.tocLink} ${activeSection === item.id ? styles.activeToc : ""}`}
                                        >
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                </aside>

                {/* Main Privacy text */}
                <article className={styles.textContent}>
                    <section id="sec-1" className={styles.docSection}>
                        <h2>1. Information We Collect</h2>
                        <p>
                            Quivio respects your privacy and is committed to protecting your personal data. 
                            We collect information from and about you in the following ways:
                        </p>
                        <p>
                            <strong>For Instructors:</strong> When you register an account, we collect personal details including your 
                            name, email address, school or organization name, and system credentials.
                        </p>
                        <p>
                            <strong>For Students:</strong> Student account details are provided to the platform by their respective 
                            Instructors or institution administrators. This includes the student's name, email, student ID, and classroom association.
                        </p>
                        <p>
                            <strong>Assessment Logs:</strong> When students attempt a quiz, we record response metrics including answer selections, 
                            attempt durations, quiz timers, submission timestamps, and tab-focus change alerts (used solely to assist instructors 
                            in evaluating examination integrity).
                        </p>
                        <p>
                            <strong>Technical Logs:</strong> We collect hardware and connection details, including IP addresses, browser types, 
                            and OS configurations to ensure server stability and help troubleshoot offline synchronization errors.
                        </p>
                    </section>

                    <section id="sec-2" className={styles.docSection}>
                        <h2>2. How We Use Your Information</h2>
                        <p>
                            We use the collected information for purposes necessary to run the Services, including:
                        </p>
                        <ul className={styles.bulletList}>
                            <li>Authenticating users and syncing session data via our secure database provider.</li>
                            <li>Compiling student performance analytics and generating dashboard statistics for Instructors.</li>
                            <li>Generating and verifying PDF course certificates with unique validation codes.</li>
                            <li>Calculating user level-ups, weekly leaderboard positions, achievements, and active streaks.</li>
                            <li>Managing offline synchronization queues so that progress is cached locally and uploaded when connectivity returns.</li>
                        </ul>
                    </section>

                    <section id="sec-3" className={styles.docSection}>
                        <h2>3. Sharing and Disclosures of Data</h2>
                        <p>
                            We do not sell, trade, or rent your personal information to third parties. We share data only in the following contexts:
                        </p>
                        <p>
                            <strong>Academic Scope:</strong> A student's performance metrics, quiz answers, and account details are fully accessible 
                            to their course Instructor and institutional administrator.
                        </p>
                        <p>
                            <strong>Service Providers:</strong> We share data with verified infrastructure providers (such as Supabase for database 
                            hosting and session authentication) strictly for the purpose of maintaining the platform. These providers are bound by 
                            confidentiality covenants.
                        </p>
                        <p>
                            <strong>Public Validation:</strong> Anyone possessing a student's unique 8-digit certificate verification code can view 
                            that certificate's public metadata (student name, quiz score, date, and issuer) on our validator screen.
                        </p>
                    </section>

                    <section id="sec-4" className={styles.docSection}>
                        <h2>4. Data Security</h2>
                        <p>
                            We implement industry-standard administrative, physical, and technical safeguards to secure your personal data. 
                            Database connections are fully encrypted via Secure Sockets Layer (SSL) protocols, passwords are cryptographically 
                            hashed, and session authentication utilizes encrypted JSON Web Tokens (JWT).
                        </p>
                        <p>
                            However, no transmission method over the Internet is 100% secure. You are responsible for protecting your account credentials 
                            and logging out of shared devices.
                        </p>
                    </section>

                    <section id="sec-5" className={styles.docSection}>
                        <h2>5. Cookies & Local Storage</h2>
                        <p>
                            Quivio utilizes local cookies and browser Local Storage to facilitate session maintenance and quiz durability.
                        </p>
                        <p>
                            <strong>Session Maintenance:</strong> We store authorization tokens so you remain authenticated across page reloads.
                        </p>
                        <p>
                            <strong>Offline Progress Cache:</strong> In-progress quiz answers are saved locally every 2 seconds. In the event of network dropouts, 
                            this cache enables you to continue writing responses offline without losing progress.
                        </p>
                        <p>
                            <strong>Preferences:</strong> We store your selected appearance preference ('light' or 'dark') to apply the correct theme on load.
                        </p>
                    </section>

                    <section id="sec-6" className={styles.docSection}>
                        <h2>6. Data Retention Policies</h2>
                        <p>
                            We retain user data for as long as accounts remain active or as required by the educational institution. 
                            Instructors have full control over the classrooms (Rooms) they create and can delete Student records, quiz metrics, 
                            and question banks at any time.
                        </p>
                        <p>
                            Upon deletion by an instructor or account termination, corresponding records are permanently deleted from active databases, 
                            except where minimal data retention is legally required.
                        </p>
                    </section>

                    <section id="sec-7" className={styles.docSection}>
                        <h2>7. FERPA & Children's Privacy</h2>
                        <p>
                            We recognize the sensitive nature of student records and comply with academic privacy guidelines including the 
                            Family Educational Rights and Privacy Act (FERPA).
                        </p>
                        <p>
                            Quivio does not allow child registrations. Student accounts are added under institutional licensing where the school 
                            or instructor acts as the primary consent agent. If we discover that personal data of children under 13 was provided 
                            without appropriate institutional consent, we will promptly delete it.
                        </p>
                    </section>

                    <section id="sec-8" className={styles.docSection}>
                        <h2>8. Your Rights & Choices</h2>
                        <p>
                            Depending on your location and role, you have specific rights regarding your personal information:
                        </p>
                        <ul className={styles.bulletList}>
                            <li><strong>Access & Correction:</strong> You can review and edit your user profile details via your dashboard settings.</li>
                            <li><strong>Password Management:</strong> You can change your password or initiate password reset requests at any time.</li>
                            <li><strong>Student Requests:</strong> Because Student accounts are managed by Instructors, students should contact their 
                            instructor or institution to request deletion, exports, or alterations of their academic records.</li>
                        </ul>
                    </section>

                    <section id="sec-9" className={styles.docSection}>
                        <h2>9. Policy Updates & Contact Info</h2>
                        <p>
                            We may revise this Privacy Policy periodically. We will notify you of any material changes by updating the "Last updated" 
                            date at the top of this document or posting notices inside the application dashboards.
                        </p>
                        <p>
                            For privacy inquiries or request coordination, contact us at:
                        </p>
                        <div className={styles.contactCard}>
                            <strong>Quivio Privacy Office</strong><br />
                            Email: privacy@quivio.app<br />
                            GitHub: <a href="https://github.com/Fayed12" target="_blank" rel="noopener noreferrer">github.com/Fayed12</a>
                        </div>
                    </section>
                </article>
            </main>

            {/* Back to top button */}
            {showScrollTop && (
                <button 
                    id="privacy-scroll-top-btn"
                    className={styles.scrollTopBtn} 
                    onClick={scrollToTop}
                    aria-label="Scroll to top"
                >
                    <FiArrowUp />
                </button>
            )}

            {/* Simple Footer */}
            <footer className={styles.footer}>
                <p>&copy; {new Date().getFullYear()} Quivio. All rights reserved. <a href="/terms">Terms of Service</a></p>
            </footer>
        </div>
    );
};

export default PrivacyPage;
