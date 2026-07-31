// local
import ModalPortal from "./ModalPortal";
import styles from "./QuizVersionHistoryModal.module.css";
import {
    fetchQuizVersions,
    saveQuizVersion,
    fetchQuizVersionDetail,
    selectQuizVersions,
    selectQuizVersionsStatus,
    clearSelectedVersion
} from "../../../redux/slices/quizVersionsSlice";
import { useRealtimeQuizVersions } from "../../../hooks/useRealtimeQuizVersions";

// react
import { useState, useEffect, useRef } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";

// date-fns
import { format, formatDistanceToNow } from "date-fns";

// gsap
import { gsap } from "gsap";

// sweetalert2
import Swal from "sweetalert2";

// toast
import { toast } from "react-toastify";

// icons
import {
    FiX,
    FiGitCommit,
    FiClock,
    FiPlus,
    FiEye,
    FiRotateCcw,
    FiList
} from "react-icons/fi";

const QuizVersionHistoryModal = ({ isOpen, onClose, quizId, quizTitle, onRestoreVersion }) => {
    const dispatch = useDispatch();
    
    // Subscribe to realtime updates for this quiz's versions
    useRealtimeQuizVersions(isOpen ? quizId : null);

    // Redux state selectors
    const versions = useSelector(selectQuizVersions(quizId));
    const status = useSelector(selectQuizVersionsStatus);

    const [isSaving, setIsSaving] = useState(false);
    const [versionNote, setVersionNote] = useState("");
    const [showSaveNoteInput, setShowSaveNoteInput] = useState(false);
    const [previewSnapshot, setPreviewSnapshot] = useState(null);

    const modalContentRef = useRef(null);

    const handleClose = () => {
        setShowSaveNoteInput(false);
        setVersionNote("");
        setPreviewSnapshot(null);
        if (onClose) onClose();
    };

    // Fetch version history list on modal open
    useEffect(() => {
        if (isOpen && quizId) {
            dispatch(fetchQuizVersions(quizId));
            dispatch(clearSelectedVersion());
        }
    }, [isOpen, quizId, dispatch]);

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

    // Save a new version manually
    const handleSaveVersion = async () => {
        if (!quizId) return;
        setIsSaving(true);
        try {
            await dispatch(saveQuizVersion({ quizId, note: versionNote.trim() || null })).unwrap();
            toast.success("New quiz version snapshot created!");
            setVersionNote("");
            setShowSaveNoteInput(false);
        } catch (err) {
            toast.error(err || "Failed to save quiz version");
        } finally {
            setIsSaving(false);
        }
    };

    // Inspect version snapshot details
    const handleViewVersionDetail = async (version) => {
        try {
            const detail = await dispatch(fetchQuizVersionDetail(version.id)).unwrap();
            setPreviewSnapshot(detail);
        } catch (err) {
            toast.error(err || "Could not load version details");
        }
    };

    // Restore version prompt
    const handleRestorePrompt = (version) => {
        const isDark = document.documentElement.classList.contains("dark");
        Swal.fire({
            title: `Restore Version ${version.version_number}?`,
            text: `This will revert the active quiz content and settings to Version ${version.version_number} snapshot created on ${version.created_at ? format(new Date(version.created_at), "PPP p") : 'earlier date'}.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, Restore Version",
            cancelButtonText: "Cancel",
            confirmButtonColor: "var(--color-accent, #6366f1)",
            background: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
        }).then((result) => {
            if (result.isConfirmed) {
                if (onRestoreVersion) {
                    onRestoreVersion(version);
                }
                toast.success(`Restored Version ${version.version_number} snapshot!`);
                handleClose();
            }
        });
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={handleClose}>
            <div className={styles.overlay} onClick={handleClose}>
                <div 
                    className={styles.modalContainer}
                    ref={modalContentRef}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerTitleGroup}>
                            <FiGitCommit className={styles.headerIcon} />
                            <div>
                                <h2>Version History</h2>
                                <p className={styles.subTitle}>{quizTitle || "Quiz Versions"}</p>
                            </div>
                        </div>
                        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
                            <FiX />
                        </button>
                    </div>

                    {/* Action Bar / Save Snapshot Banner */}
                    <div className={styles.actionsBar}>
                        {!showSaveNoteInput ? (
                            <button
                                className={styles.createVersionBtn}
                                onClick={() => setShowSaveNoteInput(true)}
                            >
                                <FiPlus /> Save Manual Version Snapshot
                            </button>
                        ) : (
                            <div className={styles.saveNoteForm}>
                                <input
                                    type="text"
                                    placeholder="Add version note (e.g. Added 5 mid-term questions)..."
                                    value={versionNote}
                                    onChange={e => setVersionNote(e.target.value)}
                                    className={styles.noteInput}
                                    autoFocus
                                />
                                <button
                                    className={styles.saveConfirmBtn}
                                    onClick={handleSaveVersion}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Saving..." : "Save Version"}
                                </button>
                                <button
                                    className={styles.saveCancelBtn}
                                    onClick={() => setShowSaveNoteInput(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Main Content Area */}
                    <div className={styles.bodyContent}>
                        {status === "loading" && versions.length === 0 ? (
                            <div className={styles.loadingContainer}>
                                <div className={styles.spinner} />
                                <p>Fetching Version History...</p>
                            </div>
                        ) : versions.length === 0 ? (
                            <div className={styles.emptyContainer}>
                                <FiClock className={styles.emptyIcon} />
                                <h3>No Version History Yet</h3>
                                <p>Version snapshots are automatically created when you edit or publish a quiz, or you can manually save a version above.</p>
                            </div>
                        ) : (
                            <div className={styles.versionsGrid}>
                                {/* Timeline Column */}
                                <div className={styles.timelineList}>
                                    {versions.map((ver, idx) => {
                                        const isSelected = previewSnapshot?.id === ver.id;
                                        const createdDate = ver.created_at ? new Date(ver.created_at) : new Date();

                                        return (
                                            <div 
                                                key={ver.id || idx}
                                                className={`${styles.versionCard} ${isSelected ? styles.selectedCard : ""}`}
                                                onClick={() => handleViewVersionDetail(ver)}
                                            >
                                                <div className={styles.verNode}>
                                                    <span className={styles.verBadge}>
                                                        v{ver.version_number}
                                                    </span>
                                                </div>

                                                <div className={styles.verMain}>
                                                    <div className={styles.verHeaderRow}>
                                                        <span className={styles.verTitle}>
                                                            Version {ver.version_number}
                                                        </span>
                                                        <span className={styles.verTime} title={format(createdDate, "PPP p")}>
                                                            {formatDistanceToNow(createdDate, { addSuffix: true })}
                                                        </span>
                                                    </div>

                                                    {ver.note && (
                                                        <p className={styles.verNote}>
                                                            "{ver.note}"
                                                        </p>
                                                    )}

                                                    <div className={styles.verMetaRow}>
                                                        <span className={styles.metaTag}>
                                                            <FiClock /> {format(createdDate, "MMM d, yyyy • HH:mm")}
                                                        </span>
                                                        {ver.snapshot?.questions?.length !== undefined && (
                                                            <span className={styles.metaTag}>
                                                                <FiList /> {ver.snapshot.questions.length} Qs
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className={styles.verActions}>
                                                        <button 
                                                            className={styles.viewBtn}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleViewVersionDetail(ver);
                                                            }}
                                                        >
                                                            <FiEye /> View Snapshot
                                                        </button>
                                                        {onRestoreVersion && (
                                                            <button 
                                                                className={styles.restoreBtn}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRestorePrompt(ver);
                                                                }}
                                                            >
                                                                <FiRotateCcw /> Restore
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Snapshot Inspection Detail Drawer */}
                                {previewSnapshot && (
                                    <div className={styles.detailPanel}>
                                        <div className={styles.detailHeader}>
                                            <h4>Version {previewSnapshot.version_number} Details</h4>
                                            <button 
                                                className={styles.closeDetailBtn} 
                                                onClick={() => setPreviewSnapshot(null)}
                                            >
                                                <FiX />
                                            </button>
                                        </div>

                                        <div className={styles.detailContent}>
                                            <div className={styles.detailSection}>
                                                <span className={styles.detailLabel}>Saved Date:</span>
                                                <span>
                                                    {previewSnapshot.created_at 
                                                        ? format(new Date(previewSnapshot.created_at), "PPP p") 
                                                        : "N/A"}
                                                </span>
                                            </div>

                                            {previewSnapshot.note && (
                                                <div className={styles.detailSection}>
                                                    <span className={styles.detailLabel}>Notes:</span>
                                                    <p className={styles.detailNote}>"{previewSnapshot.note}"</p>
                                                </div>
                                            )}

                                            <div className={styles.detailSection}>
                                                <span className={styles.detailLabel}>Quiz Title Snapshot:</span>
                                                <p className={styles.detailVal}>
                                                    {previewSnapshot.snapshot?.title || previewSnapshot.title || "N/A"}
                                                </p>
                                            </div>

                                            {/* Questions Snapshot Preview */}
                                            {previewSnapshot.snapshot?.questions && (
                                                <div className={styles.snapshotQuestionsBox}>
                                                    <h5 className={styles.sqTitle}>
                                                        Questions Snapshot ({previewSnapshot.snapshot.questions.length})
                                                    </h5>
                                                    <div className={styles.sqList}>
                                                        {previewSnapshot.snapshot.questions.map((q, qIdx) => (
                                                            <div key={qIdx} className={styles.sqItem}>
                                                                <span className={styles.sqNum}>{qIdx + 1}</span>
                                                                <span className={styles.sqText}>{q.question_text || q.text}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
};

export default QuizVersionHistoryModal;
