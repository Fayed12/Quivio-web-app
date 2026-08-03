// react
import { useEffect, useRef, useState } from "react";

// react-router
import { useParams, Link } from "react-router";

// react-redux
import { useDispatch, useSelector } from "react-redux";
import {
    verifyCertificateThunk,
    selectVerifiedCert,
    clearVerified,
    clearCertError,
} from "../../redux/slices/certificatesSlice";

// react-icons
import {
    FiShield,
    FiUser,
    FiBookOpen,
    FiAward,
    FiCalendar,
    FiArrowLeft,
    FiCheckCircle,
    FiXCircle,
    FiHome,
    FiHash,
} from "react-icons/fi";

// gsap
import { gsap } from "gsap";

// local
import MainButton from "../../components/ui/button/MainButton";
import styles from "./VerifyCertificate.module.css";

const VerifyCertificatePage = () => {
    const { code } = useParams();
    const dispatch = useDispatch();
    const verified = useSelector(selectVerifiedCert);
    const loading = useSelector((s) => s.certificates.loading);
    const error = useSelector((s) => s.certificates.error);
    const cardRef = useRef(null);

    // Local flag so the error/not-found card never flashes on the very first
    // paint (the thunk dispatch happens in useEffect, after first render).
    const [checking, setChecking] = useState(() => Boolean(code));

    // Fetch certificate on mount
    useEffect(() => {
        let active = true;
        if (code) {
            dispatch(verifyCertificateThunk(code)).finally(() => {
                if (active) setChecking(false);
            });
        }
        return () => {
            active = false;
            dispatch(clearVerified());
            dispatch(clearCertError());
        };
    }, [code, dispatch]);

    // GSAP entrance animation
    useEffect(() => {
        if (cardRef.current && !loading) {
            gsap.fromTo(
                cardRef.current,
                { opacity: 0, y: 30, scale: 0.97 },
                { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
            );
        }
    }, [loading, verified, error]);

    // Format date nicely
    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // ─── Loading State ────────────────────────────────────────
    if (loading || checking) {
        return (
            <div className={styles.verifyContainer}>
                <div className={styles.loadingWrapper}>
                    <div className={styles.spinner} />
                    <p className={styles.loadingText}>Verifying certificate…</p>
                </div>
            </div>
        );
    }

    // ─── Error State ──────────────────────────────────────────
    if (error || (!loading && !verified && code)) {
        return (
            <div className={styles.verifyContainer}>
                <Link to="/" className={styles.backLink}>
                    <FiArrowLeft /> Back to Home
                </Link>

                <div className={styles.errorCard} ref={cardRef}>
                    <div className={styles.errorIcon}>
                        <FiXCircle />
                    </div>
                    <h2 className={styles.errorTitle}>Certificate Not Found</h2>
                    <p className={styles.errorDescription}>
                        The certificate code <strong>"{code}"</strong> does not match any
                        issued certificate. Please check the code and try again.
                    </p>
                    <div className={styles.actionsRow}>
                        <MainButton variant="primary" onClick={() => window.history.back()}>
                            <FiArrowLeft style={{ marginRight: 6 }} />
                            Go Back
                        </MainButton>
                        <Link to="/" style={{ textDecoration: "none" }}>
                            <MainButton variant="ghost">
                                <FiHome style={{ marginRight: 6 }} />
                                Home
                            </MainButton>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Success State ────────────────────────────────────────
    if (verified) {
        const passingScore = verified.quiz?.passing_score ?? 0;
        const passed = verified.score >= passingScore;

        return (
            <div className={styles.verifyContainer}>
                <Link to="/" className={styles.backLink}>
                    <FiArrowLeft /> Back to Home
                </Link>

                <Link to="/" className={styles.logo}>
                    <img
                        src="/light-logo.png"
                        alt="Quivio"
                        className={styles.logoImg}
                    />
                    <span className={styles.logoText}>Quivio</span>
                </Link>

                <div className={styles.resultCard} ref={cardRef}>
                    {/* Header */}
                    <div className={styles.resultHeader}>
                        <div className={styles.successBadge}>
                            <FiCheckCircle />
                            Verified Certificate
                        </div>
                        <h1 className={styles.resultTitle}>
                            {verified.quiz?.title || "Certificate"}
                        </h1>
                        <p className={styles.resultSubtitle}>
                            This certificate has been verified as authentic
                        </p>
                    </div>

                    {/* Details Grid */}
                    <div className={styles.detailsGrid}>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>
                                <FiUser className={styles.detailLabelIcon} />
                                Student
                            </span>
                            <span className={styles.detailValue}>
                                {verified.profile?.full_name || "—"}
                            </span>
                        </div>

                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>
                                <FiBookOpen className={styles.detailLabelIcon} />
                                Quiz
                            </span>
                            <span className={styles.detailValue}>
                                {verified.quiz?.title || "—"}
                            </span>
                        </div>

                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>
                                <FiAward className={styles.detailLabelIcon} />
                                Score
                            </span>
                            <span className={styles.detailValue}>
                                <span
                                    className={`${styles.scoreBadge} ${
                                        passed ? styles.pass : styles.fail
                                    }`}
                                >
                                    {verified.score}%
                                    {passed ? (
                                        <FiCheckCircle size={14} />
                                    ) : (
                                        <FiXCircle size={14} />
                                    )}
                                </span>
                            </span>
                        </div>

                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>
                                <FiCalendar className={styles.detailLabelIcon} />
                                Issued On
                            </span>
                            <span className={styles.detailValue}>
                                {formatDate(verified.issued_at)}
                            </span>
                        </div>
                    </div>

                    {/* Divider + Code */}
                    <div className={styles.divider} />

                    <div className={styles.codeDisplay}>
                        <FiHash size={16} />
                        <span className={styles.codeLabel}>Certificate Code:</span>
                        {verified.certificate_code}
                    </div>

                    {/* Actions */}
                    <div className={styles.actionsRow}>
                        <Link to="/" style={{ textDecoration: "none" }}>
                            <MainButton variant="ghost" size="md">
                                <FiHome style={{ marginRight: 6 }} />
                                Back to Home
                            </MainButton>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Initial / No code state (shouldn't happen but safety) ──
    return (
        <div className={styles.verifyContainer}>
            <Link to="/" className={styles.backLink}>
                <FiArrowLeft /> Back to Home
            </Link>

            <div className={styles.card} ref={cardRef}>
                <div className={styles.cardHeader}>
                    <div className={styles.iconWrapper}>
                        <FiShield />
                    </div>
                    <h1 className={styles.cardTitle}>Verify a Certificate</h1>
                    <p className={styles.cardSubtitle}>
                        Enter a certificate code on the home page to verify its authenticity.
                    </p>
                </div>
                <div className={styles.actionsRow}>
                    <Link to="/" style={{ textDecoration: "none" }}>
                        <MainButton variant="primary">
                            <FiHome style={{ marginRight: 6 }} />
                            Go to Home
                        </MainButton>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default VerifyCertificatePage;
