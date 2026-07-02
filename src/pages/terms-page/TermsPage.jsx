import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { selectTheme } from "../../redux/slices/themeSLice";
import MainButton from "../../components/ui/button/MainButton";
import { FiArrowLeft, FiArrowUp, FiFileText } from "react-icons/fi";
import styles from "./TermsPage.module.css";
import { gsap } from "gsap";

const TermsPage = () => {
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
        { id: "sec-1", label: "1. Acceptance of Terms" },
        { id: "sec-2", label: "2. Account Registration" },
        { id: "sec-3", label: "3. Intellectual Property" },
        { id: "sec-4", label: "4. User Conduct" },
        { id: "sec-5", label: "5. Grading & Certificates" },
        { id: "sec-6", label: "6. Platform Availability" },
        { id: "sec-7", label: "7. Limitation of Liability" },
        { id: "sec-8", label: "8. Termination" },
        { id: "sec-9", label: "9. Governing Law & Contact" }
    ];

    return (
        <div ref={containerRef} className={styles.pageContainer}>
            {/* Header Navbar */}
            <header className={styles.navbar} id="terms-navbar">
                <div className={styles.navLogo} onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                    <img 
                        src={isDark ? "/dark-logo.png" : "/light-logo.png"} 
                        alt="Quivio Logo" 
                        className={styles.logoImg} 
                    />
                </div>
                <div className={styles.navActions}>
                    <MainButton 
                        id="terms-back-btn"
                        variant="ghost" 
                        onClick={() => navigate("/")} 
                        size="sm"
                    >
                        <FiArrowLeft style={{ marginRight: "var(--space-2)" }} /> Back to Home
                    </MainButton>
                </div>
            </header>

            {/* Hero Header */}
            <section className={styles.heroSection} aria-labelledby="terms-heading">
                <div className={styles.heroGlow} />
                <div className={styles.heroContent}>
                    <div className={styles.iconWrapper}>
                        <FiFileText />
                    </div>
                    <h1 id="terms-heading" className={styles.pageTitle}>Terms of Service</h1>
                    <p className={styles.pageSubtitle}>Last updated: July 2, 2026</p>
                </div>
            </section>

            {/* Document Content Grid */}
            <main className={styles.contentGrid}>
                {/* Sidebar Table of Contents */}
                <aside className={styles.sidebar}>
                    <div className={styles.tocCard}>
                        <h3>Table of Contents</h3>
                        <nav aria-label="Terms of service sections">
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

                {/* Main Terms text */}
                <article className={styles.textContent}>
                    <section id="sec-1" className={styles.docSection}>
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            Welcome to Quivio (referred to as "Quivio", "we", "us", or "our"). By accessing or using our website, 
                            web applications, services, and software (collectively, the "Services"), you agree to be bound by these 
                            Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Services.
                        </p>
                        <p>
                            These Terms apply to all users of the Services, including without limitation educators, instructors, 
                            institutions, administrators (collectively, "Instructors"), and students or examinees (collectively, "Students").
                        </p>
                    </section>

                    <section id="sec-2" className={styles.docSection}>
                        <h2>2. Account Registration & User Accounts</h2>
                        <p>
                            To utilize most features of the Services, you must register for an account. 
                            <strong> For Instructors:</strong> You represent and warrant that the information you provide is accurate, current, 
                            and complete. You are solely responsible for maintaining the confidentiality of your account credentials.
                        </p>
                        <p>
                            <strong>For Students:</strong> Student accounts are created and managed directly by their course instructors. 
                            If you are a student, your credentials have been generated and provided to you by your institution or instructor. 
                            You are responsible for changing your temporary password upon initial login and keeping your account secure.
                        </p>
                        <p>
                            You agree to notify us immediately of any unauthorized use of your account or any other breach of security. 
                            Quivio will not be liable for any losses caused by any unauthorized use of your account.
                        </p>
                    </section>

                    <section id="sec-3" className={styles.docSection}>
                        <h2>3. Intellectual Property Rights</h2>
                        <p>
                            All content, features, and functionality on the Services, including but not limited to software, text, graphics, 
                            logos, icons, and designs, are the exclusive property of Quivio and are protected by copyright, trademark, and other laws.
                        </p>
                        <p>
                            Quivio grants you a limited, non-exclusive, non-transferable, and revocable license to access and use the Services 
                            for educational and academic evaluation purposes.
                        </p>
                        <p>
                            <strong>User Content:</strong> Instructors retain ownership of all quiz questions, question banks, course descriptions, 
                            and academic materials they upload or create ("User Content"). By uploading User Content, you grant Quivio a worldwide, 
                            royalty-free license to host, store, and display such content solely for the purpose of delivering the Services to you and your students.
                        </p>
                    </section>

                    <section id="sec-4" className={styles.docSection}>
                        <h2>4. User Conduct & Prohibited Activities</h2>
                        <p>
                            You agree to use the Services only for lawful, educational purposes. You are strictly prohibited from:
                        </p>
                        <ul className={styles.bulletList}>
                            <li>Using the platform for cheating, academic dishonesty, plagiarism, or distributing exam questions to unauthorized sites.</li>
                            <li>Attempting to bypass, disable, or tamper with quiz timers, anti-tab-switching guards, or local cache integrity checks.</li>
                            <li>Uploading malware, malicious code, or content that infringes upon the intellectual property of others.</li>
                            <li>Automating quiz attempts, scraping data, or using bots to answer assessments.</li>
                            <li>Impersonating another student, user, or instructor.</li>
                        </ul>
                    </section>

                    <section id="sec-5" className={styles.docSection}>
                        <h2>5. Academic Grading & Certificate Authenticity</h2>
                        <p>
                            Quivio operates as a software provider for academic assessments. Instructors are solely responsible for setting 
                            passing thresholds, grading criteria, and reviewing exam results. Quivio is not responsible for the accuracy of 
                            grades or evaluation metrics.
                        </p>
                        <p>
                            <strong>Verifiable Certificates:</strong> Certificates generated by the platform are issued under the authority of the 
                            respective Instructor or academic institution. The verification system acts as a validator that a student achieved a 
                            passing score on the platform; it does not constitute an independent accreditation by Quivio.
                        </p>
                    </section>

                    <section id="sec-6" className={styles.docSection}>
                        <h2>6. Platform Availability & Offline Synchronization</h2>
                        <p>
                            Quivio offers a local caching and synchronization module designed to preserve quiz progress during minor network interruptions. 
                            However, we do not guarantee that the Services will be uninterrupted, secure, or free from errors. We recommend keeping a 
                            stable internet connection when submitting final quiz attempts.
                        </p>
                    </section>

                    <section id="sec-7" className={styles.docSection}>
                        <h2>7. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, in no event shall Quivio, its affiliates, directors, or employees, be liable 
                            for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, 
                            data, use, goodwill, or other intangible losses, resulting from:
                        </p>
                        <ul className={styles.bulletList}>
                            <li>Your access to or use of (or inability to access or use) the Services.</li>
                            <li>Any academic consequences, failing grades, or institutional disciplinary actions resulting from quiz performance or detected anomalies.</li>
                            <li>Unauthorized access to or alteration of your transmissions or data.</li>
                        </ul>
                    </section>

                    <section id="sec-8" className={styles.docSection}>
                        <h2>8. Termination of Accounts</h2>
                        <p>
                            We reserve the right to suspend or terminate your access to the Services at any time, without prior notice, for conduct 
                            that we believe violates these Terms or is harmful to other users, our business interests, or academic integrity.
                        </p>
                        <p>
                            Instructors may delete their rooms, student rosters, or questionnaires at any time. Upon deletion, data is removed in accordance 
                            with our Privacy Policy.
                        </p>
                    </section>

                    <section id="sec-9" className={styles.docSection}>
                        <h2>9. Governing Law & Contact Information</h2>
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Quivio operates, 
                            without regard to its conflict of law provisions.
                        </p>
                        <p>
                            If you have any questions about these Terms, please contact us at:
                        </p>
                        <div className={styles.contactCard}>
                            <strong>Quivio Support Team</strong><br />
                            Email: legal@quivio.app<br />
                            GitHub: <a href="https://github.com/Fayed12" target="_blank" rel="noopener noreferrer">github.com/Fayed12</a>
                        </div>
                    </section>
                </article>
            </main>

            {/* Back to top button */}
            {showScrollTop && (
                <button 
                    id="terms-scroll-top-btn"
                    className={styles.scrollTopBtn} 
                    onClick={scrollToTop}
                    aria-label="Scroll to top"
                >
                    <FiArrowUp />
                </button>
            )}

            {/* Simple Footer */}
            <footer className={styles.footer}>
                <p>&copy; {new Date().getFullYear()} Quivio. All rights reserved. <a href="/privacy">Privacy Policy</a></p>
            </footer>
        </div>
    );
};

export default TermsPage;
