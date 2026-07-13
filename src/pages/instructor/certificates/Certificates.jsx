// local components
import PageHeader from "../components/PageHeader";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./Certificates.module.css";

// react
import { useState, useRef } from "react";

// redux
import { useDispatch } from "react-redux";
import { fetchMyCertificates } from "../../../redux/slices/certificatesSlice";

// animation
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";
import ModalPortal from "../components/ModalPortal";

// react-icons
import {
    FiAward,
    FiDownload,
    FiTrash2,
    FiSettings,
    FiPenTool
} from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

// Material UI
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

// supabase client
import { supabase } from "../../../services/config/supabaseClient";

import { useCertificatesData } from "../../../hooks/instructor/useCertificatesData";

const Certificates = () => {
    const dispatch = useDispatch();

    // Use custom hook
    const { issuedCerts } = useCertificatesData();

    // Settings state (Persisted in LocalStorage)
    const [enabled, setEnabled] = useState(() => {
        const stored = localStorage.getItem("cert_enabled");
        return stored !== null ? stored === "true" : true;
    });
    const [passingThreshold, setPassingThreshold] = useState(() => {
        const stored = localStorage.getItem("cert_threshold");
        return stored !== null ? Number(stored) : 70;
    });
    const [certTitle, setCertTitle] = useState(() => {
        return localStorage.getItem("cert_title") || "Certificate of Completion";
    });
    const [signatureName, setSignatureName] = useState(() => {
        return localStorage.getItem("cert_sig") || "Dr. Sarah Adams";
    });
    const [bodyText, setBodyText] = useState(() => {
        return localStorage.getItem("cert_body") || "For outstanding performance in demonstrating mastery of the quiz syllabus.";
    });

    // Revocation state
    const [revokingCert, setRevokingCert] = useState(null);

    const containerRef = useRef(null);

    // Page entrance animation
    usePageAnimation(containerRef);

    // Save Certificate Settings to LocalStorage
    const handleSaveSettings = (e) => {
        e.preventDefault();
        localStorage.setItem("cert_enabled", enabled);
        localStorage.setItem("cert_threshold", passingThreshold);
        localStorage.setItem("cert_title", certTitle);
        localStorage.setItem("cert_sig", signatureName);
        localStorage.setItem("cert_body", bodyText);

        toast.success("Certificate template specifications saved successfully!");
    };

    const handleResetSettings = () => {
        setEnabled(true);
        setPassingThreshold(70);
        setCertTitle("Certificate of Completion");
        setSignatureName("Dr. Sarah Adams");
        setBodyText("For outstanding performance in demonstrating mastery of the quiz syllabus.");
        toast.info("Settings reset to defaults.");
    };

    // Revoke Certificate Handler
    const handleRevokeCertificate = async () => {
        if (!revokingCert) return;

        try {
            const { error } = await supabase
                .from("certificates")
                .delete()
                .eq("id", revokingCert.id);

            if (error) throw error;

            toast.success("Certificate revoked successfully!");
            setRevokingCert(null);
            dispatch(fetchMyCertificates());
        } catch (err) {
            toast.error(err.message || "Failed to revoke certificate");
        }
    };

    const handleDownloadPdf = (pdfUrl) => {
        if (!pdfUrl) {
            toast.info("Generating PDF download link...");
            return;
        }
        window.open(pdfUrl, "_blank");
    };

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Page Header */}
            <PageHeader 
                title="Certificates Settings"
                subtitle="Design global certificate templates and track student credentials."
                breadcrumbs={["Settings", "Certificates"]}
            />

            {/* Split layout (Left: settings form, Right: template canvas preview) */}
            <div className={styles.splitGrid}>
                
                {/* Form Settings */}
                <form className={styles.formCard} onSubmit={handleSaveSettings}>
                    <h3 className={styles.sectionTitle}><FiSettings /> Certificate Specifications</h3>

                    <div className={styles.formGrid}>
                        {/* Global Toggle */}
                        <div className={styles.toggleRow}>
                            <div>
                                <label className={styles.toggleLabel}>Enable Automated Certificates</label>
                                <p className={styles.toggleDesc}>Pass verification triggers email PDF credentials automatically.</p>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                                className={styles.toggleSwitch}
                            />
                        </div>

                        {/* Threshold score */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Passing Threshold Score (%)</label>
                            <input 
                                type="number" 
                                value={passingThreshold}
                                onChange={(e) => setPassingThreshold(Number(e.target.value))}
                                min={1} max={100}
                                className={styles.input}
                                required
                            />
                        </div>

                        {/* Certificate Title */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Certificate Title</label>
                            <input 
                                type="text" 
                                value={certTitle}
                                onChange={(e) => setCertTitle(e.target.value)}
                                className={styles.input}
                                required
                            />
                        </div>

                        {/* Signature line */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Instructor Signature Name</label>
                            <input 
                                type="text" 
                                value={signatureName}
                                onChange={(e) => setSignatureName(e.target.value)}
                                className={styles.input}
                                required
                            />
                        </div>

                        {/* customized text body */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>customized Body Text</label>
                            <textarea 
                                value={bodyText}
                                onChange={(e) => setBodyText(e.target.value)}
                                rows={3}
                                className={styles.textarea}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formFooter}>
                        <MainButton onClick={handleResetSettings} variant="secondary" type="button">
                            Reset
                        </MainButton>
                        <MainButton type="submit" variant="primary">
                            Save Settings
                        </MainButton>
                    </div>
                </form>

                {/* Live Preview canvas */}
                <div className={styles.canvasCard}>
                    <h3 className={styles.sectionTitle}><FiPenTool /> Live Template Preview</h3>
                    
                    <div className={styles.certificateOuterFrame}>
                        <div className={styles.certificateInnerFrame}>
                            
                            {/* Seal */}
                            <div className={styles.goldSeal}>
                                <FiAward className={styles.sealIcon} />
                            </div>

                            {/* Header */}
                            <h2 className={styles.certHeading}>{certTitle || "Certificate of Completion"}</h2>
                            <p className={styles.certSub}>This is to certify that</p>
                            
                            {/* Student placeholder name */}
                            <h3 className={styles.certStudentName}>John Doe Student</h3>
                            
                            <p className={styles.certBodyText}>{bodyText}</p>
                            
                            <p className={styles.certMetaText}>
                                Issued on: <strong>{new Date().toLocaleDateString()}</strong> • Passing Grade: <strong>{passingThreshold}%</strong>
                            </p>

                            <div className={styles.certSignatureRow}>
                                <div className={styles.sigBlock}>
                                    <span className={styles.sigValue}>{signatureName || "Instructor"}</span>
                                    <div className={styles.sigLine} />
                                    <span className={styles.sigLabel}>Authorized Signature</span>
                                </div>
                                <div className={styles.sigBlock}>
                                    <span className={styles.sigValue} style={{fontFamily: "monospace", fontSize: "10px"}}>CERT-9B2E8F</span>
                                    <div className={styles.sigLine} />
                                    <span className={styles.sigLabel}>Verification Code</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>

            {/* Issued Certificates table */}
            <div className={styles.tableCard}>
                <h3 className={styles.sectionTitle}>Issued Student Certificates ({issuedCerts.length})</h3>
                
                <TableContainer component={Paper} className={styles.tableContainer} elevation={0}>
                    <Table size="medium">
                        <TableHead className={styles.tableHead}>
                            <TableRow>
                                <TableCell className={styles.thCell}>Student UID</TableCell>
                                <TableCell className={styles.thCell}>Quiz Title</TableCell>
                                <TableCell className={styles.thCell} align="center">Score</TableCell>
                                <TableCell className={styles.thCell} align="center">Issued Date</TableCell>
                                <TableCell className={styles.thCell} align="center">Certificate Code</TableCell>
                                <TableCell className={styles.thCell} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {issuedCerts.map((cert) => (
                                <TableRow key={cert.id} className={styles.tableRow}>
                                    <TableCell className={styles.tdCell}>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 600 }}>{cert.profile?.full_name || "Unknown Student"}</span>
                                            {cert.profile?.email && (
                                                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>
                                                    {cert.profile.email}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className={styles.tdCell} style={{fontWeight: 600}}>
                                        {cert.quiz?.title || "Quiz"}
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell} style={{fontWeight: 700}}>
                                        {cert.score}%
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell}>
                                        {new Date(cert.issued_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell} style={{fontFamily: "monospace", fontSize: "12px"}}>
                                        {cert.certificate_code}
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell}>
                                        <div className={styles.actions}>
                                            <button 
                                                className={styles.actionBtn} 
                                                onClick={() => handleDownloadPdf(cert.pdf_url)}
                                                title="Open Certificate PDF"
                                            >
                                                <FiDownload />
                                            </button>
                                            <button 
                                                className={`${styles.actionBtn} ${styles.danger}`}
                                                onClick={() => setRevokingCert(cert)}
                                                title="Revoke Certificate"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {issuedCerts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" className={styles.emptyCell}>
                                        No student certificates have been issued yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>

            {/* REVOKE CERTIFICATE MODAL */}
            {revokingCert && (
                <ModalPortal onClose={() => setRevokingCert(null)}>
                <div 
                    className={styles.modalOverlay}
                    onClick={() => setRevokingCert(null)} // Close on outside click
                >
                    <div 
                        className={styles.confirmModal}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                    >
                        <div className={styles.revokeIconCircle}>
                            <FiTrash2 />
                        </div>
                        <h3>Revoke Certificate "{revokingCert.certificate_code}"?</h3>
                        <p className={styles.modalWarningText}>
                            Students will lose their verifications and badges from achievements. The certificate record is permanently deleted.
                        </p>
                        <div className={styles.modalButtons}>
                            <MainButton onClick={() => setRevokingCert(null)} variant="secondary">
                                Cancel
                            </MainButton>
                            <MainButton onClick={handleRevokeCertificate} variant="danger">
                                Revoke Certificate
                            </MainButton>
                        </div>
                    </div>
                </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default Certificates;
