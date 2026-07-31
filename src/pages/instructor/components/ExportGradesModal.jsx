// local
import ModalPortal from "./ModalPortal";
import styles from "./ExportGradesModal.module.css";
import { exportGradesToExcel, exportGradesToPDF } from "../../../utils/exportGrades";
import CustomSelect from "../../../components/ui/select/CustomSelect";

// react 
import { useState, useEffect, useRef } from "react";

// gsap
import { gsap } from "gsap";

// toast
import { toast } from "react-toastify";

// icons
import {
    FiX,
    FiDownload,
    FiFileText,
    FiGrid,
    FiCheck
} from "react-icons/fi";

const ExportGradesModal = ({ isOpen, onClose, students = [], attempts = [], rooms = [] }) => {
    const [exportFormat, setExportFormat] = useState("excel"); // "excel" | "pdf"
    const [selectedRoomId, setSelectedRoomId] = useState("all");
    const [includeAttempts, setIncludeAttempts] = useState(true);
    const modalContentRef = useRef(null);

    // GSAP entrance animation
    useEffect(() => {
        if (isOpen && modalContentRef.current) {
            gsap.fromTo(
                modalContentRef.current,
                { opacity: 0, scale: 0.95, y: 15 },
                { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "power2.out" }
            );
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Filter students by room if selected
    const filteredStudents = selectedRoomId === "all"
        ? students
        : students.filter(s => s.rooms && s.rooms.some(r => r.id === selectedRoomId));

    const handleExport = () => {
        try {
            if (filteredStudents.length === 0) {
                toast.warning("No student records available to export for the selected filter.");
                return;
            }

            if (exportFormat === "excel") {
                exportGradesToExcel(filteredStudents, includeAttempts ? attempts : [], {
                    filename: `Quivio_Grade_Report_${new Date().toISOString().split('T')[0]}.xlsx`
                });
                toast.success("Excel grade report exported successfully!");
            } else {
                exportGradesToPDF(filteredStudents, includeAttempts ? attempts : [], {
                    title: selectedRoomId === "all" ? "Quivio Class Grade Report" : "Quivio Room Grade Report"
                });
                toast.success("PDF grade report generated!");
            }
            onClose();
        } catch (err) {
            console.error("Export failed", err);
            toast.error("Failed to generate export report.");
        }
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className={styles.overlay} onClick={onClose}>
                <div 
                    className={styles.modalContainer}
                    ref={modalContentRef}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerTitleGroup}>
                            <FiDownload className={styles.headerIcon} />
                            <div>
                                <h2>Export Grade Reports</h2>
                                <p className={styles.subTitle}>Download student grades & performance logs</p>
                            </div>
                        </div>
                        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                            <FiX />
                        </button>
                    </div>

                    {/* Body */}
                    <div className={styles.body}>
                        {/* Export Format Selector */}
                        <div className={styles.section}>
                            <label className={styles.label}>Select Export Format</label>
                            <div className={styles.formatGrid}>
                                <div 
                                    className={`${styles.formatCard} ${exportFormat === "excel" ? styles.selectedFormat : ""}`}
                                    onClick={() => setExportFormat("excel")}
                                >
                                    <div className={styles.formatIconBox + " " + styles.excelIcon}>
                                        <FiGrid />
                                    </div>
                                    <div className={styles.formatInfo}>
                                        <h4>Microsoft Excel (.xlsx)</h4>
                                        <p>Multi-sheet spreadsheet with summary & detailed attempt records.</p>
                                    </div>
                                    {exportFormat === "excel" && <FiCheck className={styles.checkBadge} />}
                                </div>

                                <div 
                                    className={`${styles.formatCard} ${exportFormat === "pdf" ? styles.selectedFormat : ""}`}
                                    onClick={() => setExportFormat("pdf")}
                                >
                                    <div className={styles.formatIconBox + " " + styles.pdfIcon}>
                                        <FiFileText />
                                    </div>
                                    <div className={styles.formatInfo}>
                                        <h4>PDF Document (.pdf)</h4>
                                        <p>Formatted printable report card with header & class averages.</p>
                                    </div>
                                    {exportFormat === "pdf" && <FiCheck className={styles.checkBadge} />}
                                </div>
                            </div>
                        </div>

                        {/* Room Filter Select */}
                        {rooms.length > 0 && (
                            <div className={styles.section}>
                                <label className={styles.label}>Filter by Student Room</label>
                                <CustomSelect
                                    options={[
                                        { value: "all", label: "All Rooms & Students" },
                                        ...rooms.map(r => ({ value: r.id, label: r.name }))
                                    ]}
                                    value={selectedRoomId}
                                    onChange={setSelectedRoomId}
                                />
                            </div>
                        )}

                        {/* Checkbox Options */}
                        <div className={styles.section}>
                            <label className={`${styles.checkboxLabel} ${includeAttempts ? styles.checkedLabel : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={includeAttempts}
                                    onChange={e => setIncludeAttempts(e.target.checked)}
                                />
                                <span>Include detailed quiz attempt logs & time metrics</span>
                            </label>
                        </div>

                        {/* Summary Count */}
                        <div className={styles.summaryBox}>
                            <span>Export Scope: <strong>{filteredStudents.length} Students</strong> included</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={styles.footer}>
                        <button className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button className={styles.exportBtn} onClick={handleExport}>
                            <FiDownload /> Generate {exportFormat === "excel" ? "Excel" : "PDF"} Export
                        </button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
};

export default ExportGradesModal;
