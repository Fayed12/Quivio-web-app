// local components
import PageHeader from "../components/PageHeader";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./CreateEditQuiz.module.css";
import ModalPortal from "../components/ModalPortal";

// react
import { useState, useEffect, useRef, useCallback } from "react";

// react-router
import { useNavigate, useParams, useLocation } from "react-router";

// redux
import { useDispatch } from "react-redux";
import {
    createQuizThunk,
    updateQuizThunk,
    publishQuizThunk,
    unpublishQuizThunk,
} from "../../../redux/slices/quizzesSlice";
import { removeFromQuizThunk } from "../../../redux/slices/questionsSlice";

// react-icons
import {
    FiArrowLeft,
    FiArrowRight,
    FiCheck,
    FiInfo,
    FiPlus,
    FiTrash2,
    FiUploadCloud,
    FiHelpCircle,
    FiMenu,
    FiSearch,
    FiDatabase,
    FiLock,
    FiUnlock,
    FiSettings,
    FiFileText,
    FiX,
} from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

// sweetalert2
import Swal from "sweetalert2";

// custom select
import CustomSelect from "../../../components/ui/select/CustomSelect";

// supabase Client
import { supabase } from "../../../services/config/supabaseClient";

import { useCreateEditQuizData } from "../../../hooks/instructor/useCreateEditQuizData";

const CreateEditQuiz = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const { state } = useLocation();

    // Custom hook loaders
    const { categories, bankQuestions, currentQuiz } =
        useCreateEditQuizData(id);

    // Wizard active step: 1, 2, 3
    const [activeStep, setActiveStep] = useState(state?.step || 1);

    // Autosave Status: "saved", "saving", "unsaved"
    const [saveStatus, setSaveStatus] = useState("saved");
    const [isDirty, setIsDirty] = useState(false);

    // Step 1 Form States
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [difficulty, setDifficulty] = useState("medium");
    const [coverImageUrl, setCoverImageUrl] = useState("");
    const [tags, setTags] = useState([]);
    const [dragActive, setDragActive] = useState(false);

    // Step 2 Question Editor States
    const [questionsList, setQuestionsList] = useState([]); // links
    const [selectedQuestionId, setSelectedQuestionId] = useState(null); // active question ID

    // Editor Form States (Active Question)
    const [qText, setQText] = useState("");
    const [qType, setQType] = useState("mcq"); // mcq or true_false
    const [qOptions, setQOptions] = useState([
        { option_text: "", option_order: 0, is_correct: false },
        { option_text: "", option_order: 1, is_correct: false },
        { option_text: "", option_order: 2, is_correct: false },
        { option_text: "", option_order: 3, is_correct: false },
    ]);
    const [qPoints, setQPoints] = useState(1);
    const [qDifficulty, setQDifficulty] = useState("medium");
    const [qTags, setQTags] = useState([]);
    const [qHint, setQHint] = useState("");
    const [qExplanation, setQExplanation] = useState("");

    // Step 3 Settings Form States
    const [hasTimeLimit, setHasTimeLimit] = useState(false);
    const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
    const [passingScore, setPassingScore] = useState(70);
    const [maxAttempts, setMaxAttempts] = useState("");
    const [availableFrom, setAvailableFrom] = useState("");
    const [availableUntil, setAvailableUntil] = useState("");
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [shuffleAnswers, setShuffleAnswers] = useState(false);
    const [visibility, setVisibility] = useState("public");
    const [showResults, setShowResults] = useState("immediately");
    const [certificatesEnabled, setCertificatesEnabled] = useState(false);

    // Modal toggles
    const [isBankModalOpen, setIsBankModalOpen] = useState(false);
    const [isEditWarningOpen, setIsEditWarningOpen] = useState(false);

    // Search and filter for Question Bank Modal
    const [bankSearch, setBankSearch] = useState("");
    const [bankCategory, setBankCategory] = useState("all");
    const [bankType, setBankType] = useState("all");
    const [selectedBankQIds, setSelectedBankQIds] = useState([]);

    const saveTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

    // Load active question into editor form
    const loadActiveQuestion = useCallback((linkItem) => {
        const q = linkItem.question;
        setSelectedQuestionId(linkItem.id); // links ID
        setQText(q.question_text || "");
        setQType(q.question_type || "MCQ");
        setQPoints(linkItem.points_override || q.points || 1);
        setQDifficulty(q.difficulty || "medium");
        setQTags(q.tags || []);
        setQHint(q.hint || "");
        setQExplanation(q.explanation || "");

        // Map options
        if (q.options && q.options.length > 0) {
            setQOptions(
                q.options
                    .map((o) => ({
                        id: o.id,
                        option_text: o.option_text || "",
                        option_order: o.option_order || 1,
                        is_correct: !!o.is_correct,
                    }))
                    .sort((a, b) => a.option_order - b.option_order),
            );
        } else {
            // Defaults
            setQOptions([
                { option_text: "", option_order: 0, is_correct: false },
                { option_text: "", option_order: 1, is_correct: false },
                { option_text: "", option_order: 2, is_correct: false },
                { option_text: "", option_order: 3, is_correct: false },
            ]);
        }
    }, []);

    // Load Quiz Questions
    const loadQuizQuestions = useCallback(
        async (quizId) => {
            const { data, error } = await supabase
                .from("quiz_questions")
                .select(
                    `
                id, display_order, points_override,
                question:questions(
                    id, question_text, question_type, image_url, hint, explanation, points, difficulty, tags,
                    options:question_options(id, option_text, option_order, is_correct)
                )
            `,
                )
                .eq("quiz_id", quizId)
                .order("display_order", { ascending: true });

            if (!error && data) {
                setQuestionsList(data);
                if (data.length > 0 && !selectedQuestionId) {
                    loadActiveQuestion(data[0]);
                }
            }
        },
        [selectedQuestionId, loadActiveQuestion],
    );

    // Autosave Handler
    const handleAutosave = useCallback(async () => {
        if (!id) return;
        setSaveStatus("saving");
        try {
            await dispatch(
                updateQuizThunk({
                    id,
                    title,
                    description,
                    category_id: categoryId || null,
                    difficulty,
                    cover_image_url: coverImageUrl || null,
                    tags,
                    time_limit_minutes: hasTimeLimit
                        ? Number(timeLimitMinutes)
                        : null,
                    passing_score: Number(passingScore),
                    max_attempts:
                        maxAttempts && maxAttempts !== ""
                            ? Number(maxAttempts)
                            : null,
                    available_from: availableFrom || null,
                    available_until: availableUntil || null,
                    shuffle_questions: shuffleQuestions,
                    shuffle_answers: shuffleAnswers,
                    visibility,
                    show_results: showResults,
                    certificates_enabled: certificatesEnabled,
                }),
            ).unwrap();
            setSaveStatus("saved");
            setIsDirty(false);
        } catch (err) {
            setSaveStatus("unsaved");
            console.error("Autosave failed:", err);
        }
    }, [
        id,
        title,
        description,
        categoryId,
        difficulty,
        coverImageUrl,
        tags,
        hasTimeLimit,
        timeLimitMinutes,
        passingScore,
        maxAttempts,
        availableFrom,
        availableUntil,
        shuffleQuestions,
        shuffleAnswers,
        visibility,
        showResults,
        certificatesEnabled,
        dispatch,
    ]);

    // 1. Initial Load & Fetch details if edit mode
    useEffect(() => {
        if (id) {
            loadQuizQuestions(id);
        }
    }, [id, loadQuizQuestions]);

    // 2. Populate states when currentQuiz details are loaded
    useEffect(() => {
        if (currentQuiz && id) {
            setTitle(currentQuiz.title || "");
            setDescription(currentQuiz.description || "");
            setCategoryId(currentQuiz.category_id || "");
            setDifficulty(currentQuiz.difficulty || "medium");
            setCoverImageUrl(currentQuiz.cover_image_url || "");
            setTags(currentQuiz.tags || []);

            setHasTimeLimit(!!currentQuiz.time_limit_minutes);
            setTimeLimitMinutes(currentQuiz.time_limit_minutes || 15);
            setPassingScore(currentQuiz.passing_score || 70);
            setMaxAttempts(
                currentQuiz.max_attempts != null
                    ? String(currentQuiz.max_attempts)
                    : "",
            );
            setAvailableFrom(
                currentQuiz.available_from
                    ? currentQuiz.available_from.substring(0, 16)
                    : "",
            );
            setAvailableUntil(
                currentQuiz.available_until
                    ? currentQuiz.available_until.substring(0, 16)
                    : "",
            );
            setShuffleQuestions(!!currentQuiz.shuffle_questions);
            setShuffleAnswers(!!currentQuiz.shuffle_answers);
            setVisibility(currentQuiz.visibility || "public");
            setShowResults(currentQuiz.show_results || "immediately");
            setCertificatesEnabled(!!currentQuiz.certificates_enabled);

            // If quiz is published and we just loaded, warn if attempting edit
            if (
                currentQuiz.status === "published" &&
                state?.warning !== false
            ) {
                setIsEditWarningOpen(true);
            }
        }
    }, [currentQuiz, id, state]);

    // 3. Debounced Autosave Trigger
    useEffect(() => {
        if (!isDirty || !id) return;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(() => {
            handleAutosave();
        }, 3000);

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [isDirty, id, handleAutosave]);

    // Warning on browser navigate-away when dirty
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (saveStatus !== "saved") {
                const message =
                    "You have unsaved changes. Are you sure you want to leave?";
                e.returnValue = message;
                return message;
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () =>
            window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [saveStatus]);

    const markDirty = () => {
        setIsDirty(true);
        setSaveStatus("unsaved");
    };

    // Step 1 Validation & Navigation
    const handleNextStep1 = async () => {
        if (!title.trim() || title.length < 3) {
            toast.error("Quiz Title is required (min 3 characters)");
            return;
        }
        if (!categoryId) {
            toast.error("Please select a Category");
            return;
        }

        try {
            if (!id) {
                // Create draft quiz first to obtain an ID
                const result = await dispatch(
                    createQuizThunk({
                        title,
                        description,
                        category_id: categoryId,
                        difficulty,
                        cover_image_url: coverImageUrl || null,
                        tags: tags,
                    }),
                ).unwrap();

                toast.success("Draft quiz created successfully!");
                navigate(`/instructor/quizzes/${result.id}/edit`, {
                    state: { step: 2, warning: false },
                });
                setActiveStep(2);
            } else {
                // Update quiz info and proceed
                await handleAutosave();
                setActiveStep(2);
            }
        } catch (err) {
            toast.error(err || "Failed to save quiz");
        }
    };

    // Save Active Question editor values into database
    const handleSaveActiveQuestion = async () => {
        if (!selectedQuestionId || !id) return;

        // Validations
        if (!qText.trim()) {
            toast.error("Question text cannot be empty");
            return;
        }

        const filteredOptions = qOptions.filter(
            (o) => o.option_text.trim() !== "",
        );
        if (qType === "mcq" && filteredOptions.length < 2) {
            toast.error("MCQ questions require at least 2 options");
            return;
        }

        const correctCount = filteredOptions.filter((o) => o.is_correct).length;
        if (correctCount !== 1) {
            toast.error("Please select exactly one correct answer option");
            return;
        }

        setSaveStatus("saving");
        try {
            // Find active question object
            const activeLink = questionsList.find(
                (ql) => ql.id === selectedQuestionId,
            );
            const questionId = activeLink.question.id;

            // 1. Update question fields
            await supabase
                .from("questions")
                .update({
                    question_text: qText,
                    question_type: qType,
                    difficulty: qDifficulty,
                    points: Number(qPoints),
                    hint: qHint || null,
                    explanation: qExplanation || null,
                    tags: qTags,
                })
                .eq("id", questionId);

            // 2. Update options (Upsert/Delete)
            // Delete existing options
            await supabase
                .from("question_options")
                .delete()
                .eq("question_id", questionId);
            // Insert updated options
            await supabase.from("question_options").insert(
                filteredOptions.map((o, idx) => ({
                    question_id: questionId,
                    option_text: o.option_text,
                    option_order: idx,
                    is_correct: o.is_correct,
                })),
            );

            // 3. Update points override on link row
            await supabase
                .from("quiz_questions")
                .update({ points_override: Number(qPoints) })
                .eq("id", selectedQuestionId);

            // Refresh quiz questions list
            await loadQuizQuestions(id);
            setSaveStatus("saved");
            toast.success("Question saved successfully!");
        } catch (err) {
            console.error("Error updating question", err);
            setSaveStatus("unsaved");
            toast.error("Failed to save question edits");
        }
    };

    // Add New Empty Question to quiz
    const handleAddNewQuestion = async () => {
        if (!id) return;
        try {
            // Create question in bank first
            const { data: newQ, error: qErr } = await supabase
                .from("questions")
                .insert({
                    question_text: `New MCQ Question ${questionsList.length + 1}`,
                    question_type: "mcq",
                    points: 1,
                    difficulty: "medium",
                    instructor_uid: currentQuiz.instructor_uid,
                    category_id: categoryId || null,
                })
                .select()
                .single();

            if (qErr) throw new Error(qErr.message);

            // Create default options
            await supabase.from("question_options").insert([
                {
                    question_id: newQ.id,
                    option_text: "Option A",
                    option_order: 0,
                    is_correct: true,
                },
                {
                    question_id: newQ.id,
                    option_text: "Option B",
                    option_order: 1,
                    is_correct: false,
                },
                {
                    question_id: newQ.id,
                    option_text: "Option C",
                    option_order: 2,
                    is_correct: false,
                },
                {
                    question_id: newQ.id,
                    option_text: "Option D",
                    option_order: 3,
                    is_correct: false,
                },
            ]);

            // Link to quiz
            const { data: link, error: lErr } = await supabase
                .from("quiz_questions")
                .insert({
                    quiz_id: id,
                    question_id: newQ.id,
                    display_order: questionsList.length + 1,
                })
                .select()
                .single();

            if (lErr) throw new Error(lErr.message);

            toast.success("Added new question draft!");
            await loadQuizQuestions(id);

            // Focus on new question
            const fullLink = {
                id: link.id,
                display_order: link.display_order,
                question: {
                    ...newQ,
                    options: [
                        {
                            option_text: "Option A",
                            option_order: 0,
                            is_correct: true,
                        },
                        {
                            option_text: "Option B",
                            option_order: 1,
                            is_correct: false,
                        },
                        {
                            option_text: "Option C",
                            option_order: 2,
                            is_correct: false,
                        },
                        {
                            option_text: "Option D",
                            option_order: 3,
                            is_correct: false,
                        },
                    ],
                },
            };
            loadActiveQuestion(fullLink);
        } catch (err) {
            toast.error(err.message || "Failed to add question");
        }
    };

    // Remove Question from quiz
    const handleRemoveQuestion = (linkId, e) => {
        e.stopPropagation();
        const isDark = document.documentElement.classList.contains("dark");
        Swal.fire({
            title: "Remove question?",
            text: "Are you sure you want to remove this question from the quiz?",
            icon: "warning",
            background: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            showCancelButton: true,
            confirmButtonText: "Remove",
            cancelButtonText: "Cancel",
            confirmButtonColor: "var(--color-danger, #ef4444)",
            cancelButtonColor: isDark ? "#475569" : "#94a3b8",
            customClass: {
                popup: "premium-swal-popup",
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await dispatch(removeFromQuizThunk(linkId)).unwrap();
                    toast.success("Question removed from quiz!");

                    // If we deleted the currently active question, clear active selection
                    if (selectedQuestionId === linkId) {
                        setSelectedQuestionId(null);
                        setQText("");
                    }
                    loadQuizQuestions(id);
                } catch (err) {
                    toast.error(err || "Failed to remove question");
                }
            }
        });
    };

    // Import questions from Question Bank modal handler
    const handleImportFromBank = async () => {
        if (selectedBankQIds.length === 0) {
            toast.error("No questions selected");
            return;
        }

        try {
            // Link each selected question
            const links = selectedBankQIds.map((qId, idx) => ({
                quiz_id: id,
                question_id: qId,
                display_order: questionsList.length + idx + 1,
            }));

            const { error } = await supabase
                .from("quiz_questions")
                .insert(links);
            if (error) throw error;

            toast.success(
                `Successfully imported ${selectedBankQIds.length} question(s)!`,
            );
            setSelectedBankQIds([]);
            setIsBankModalOpen(false);
            loadQuizQuestions(id);
        } catch (err) {
            toast.error(err.message || "Failed to import questions");
        }
    };

    // Drag-and-Drop Image Handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileUpload = async (file) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Only image uploads are allowed");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Maximum cover image size is 5MB");
            return;
        }

        // Mock upload or Supabase Storage upload
        const isDark = document.documentElement.classList.contains("dark");
        toast.info("Uploading cover image...", {
            theme: isDark ? "dark" : "light",
        });

        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${id || "temp"}-${Math.random()}.${fileExt}`;
            const filePath = `quiz-covers/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("assets")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from("assets").getPublicUrl(filePath);

            setCoverImageUrl(publicUrl);
            markDirty();
            toast.success("Cover image uploaded successfully!");
        } catch (err) {
            console.error("Error uploading cover image", err);
            // Fallback mock url if bucket doesn't exist
            const mockUrl = `https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop`;
            setCoverImageUrl(mockUrl);
            markDirty();
            toast.success("Demo cover image set!");
        }
    };

    // Final Settings & Publish Validation
    const handlePublishQuiz = async () => {
        if (questionsList.length < 2) {
            toast.error(
                "Quizzes must contain at least 2 questions to be published.",
            );
            return;
        }

        try {
            await handleAutosave();
            await dispatch(publishQuizThunk(id)).unwrap();
            toast.success(`"${title}" is now published and live for students!`);
            navigate("/instructor/quizzes");
        } catch (err) {
            toast.error(err || "Failed to publish quiz");
        }
    };

    const handleSaveDraft = async () => {
        try {
            await handleAutosave();
            toast.success("Quiz draft saved successfully!");
            navigate("/instructor/quizzes");
        } catch (err) {
            toast.error(err || "Failed to save draft");
        }
    };

    const handleEditAnyway = async () => {
        setIsEditWarningOpen(false);
        // Unpublish back to draft
        try {
            await dispatch(unpublishQuizThunk(id)).unwrap();
            toast.info(
                "Quiz unpublished to draft. You can publish again when ready.",
            );
        } catch (err) {
            toast.error(err || "Failed to unpublish quiz");
        }
    };

    // MCQ option changes
    const handleOptionTextChange = (idx, text) => {
        const updated = [...qOptions];
        updated[idx].option_text = text;
        setQOptions(updated);
    };

    const handleSetCorrectOption = (idx) => {
        const updated = qOptions.map((o, i) => ({
            ...o,
            is_correct: i === idx,
        }));
        setQOptions(updated);
    };

    const handleAddMcqOption = () => {
        if (qOptions.length >= 6) {
            toast.warn("Maximum 6 options allowed");
            return;
        }
        setQOptions([
            ...qOptions,
            {
                option_text: "",
                option_order: qOptions.length,
                is_correct: false,
            },
        ]);
    };

    const handleRemoveMcqOption = (idx) => {
        if (qOptions.length <= 2) {
            toast.warn("Minimum 2 options required");
            return;
        }
        const updated = qOptions
            .filter((_, i) => i !== idx)
            .map((o, i) => ({
                ...o,
                option_order: i,
            }));
        setQOptions(updated);
    };

    // Filter bank questions for Bank Modal
    const filteredBankQuestions = bankQuestions.filter((q) => {
        const matchesSearch = q.question_text
            .toLowerCase()
            .includes(bankSearch.toLowerCase());
        const matchesCategory =
            bankCategory === "all" || q.category?.id === bankCategory;
        const matchesType = bankType === "all" || q.question_type === bankType;
        // Don't show questions already in this quiz
        const alreadyLinked = questionsList.some(
            (ql) => ql.question.id === q.id,
        );
        return (
            matchesSearch && matchesCategory && matchesType && !alreadyLinked
        );
    });

    const handleToggleBankSelection = (qId) => {
        if (selectedBankQIds.includes(qId)) {
            setSelectedBankQIds(selectedBankQIds.filter((id) => id !== qId));
        } else {
            setSelectedBankQIds([...selectedBankQIds, qId]);
        }
    };

    return (
        <div className={styles.container}>
            {/* Header with Breadcrumb and Autosave status */}
            <PageHeader
                title={
                    id ? `Edit Quiz: ${title || "Draft"}` : "Create New Quiz"
                }
                subtitle="Build rich, responsive tests by configuring steps in order."
                breadcrumbs={["Quizzes", id ? "Edit" : "Create"]}
                actions={
                    <div className={styles.headerRight}>
                        {id && (
                            <div
                                className={styles.autosaveStatus}
                                data-status={saveStatus}
                            >
                                <span className={styles.statusDot} />
                                <span className={styles.statusText}>
                                    {saveStatus === "saved" && "Saved ✓"}
                                    {saveStatus === "saving" && "Saving..."}
                                    {saveStatus === "unsaved" &&
                                        "Unsaved changes ●"}
                                </span>
                            </div>
                        )}
                        <MainButton
                            onClick={() => navigate("/instructor/quizzes")}
                            variant="secondary"
                        >
                            <FiArrowLeft /> Back to Quizzes
                        </MainButton>
                    </div>
                }
            />

            {/* Horizontal Step Indicator */}
            <div className={styles.stepsBar}>
                <div
                    className={`${styles.stepItem} ${activeStep >= 1 ? styles.active : ""} ${activeStep > 1 ? styles.completed : ""}`}
                    onClick={() => id && setActiveStep(1)}
                >
                    <div className={styles.stepCircle}>
                        {activeStep > 1 ? <FiCheck /> : "1"}
                    </div>
                    <span>Basic Info</span>
                </div>
                <div className={styles.stepLine} />
                <div
                    className={`${styles.stepItem} ${activeStep >= 2 ? styles.active : ""} ${activeStep > 2 ? styles.completed : ""}`}
                    onClick={() => id && setActiveStep(2)}
                >
                    <div className={styles.stepCircle}>
                        {activeStep > 2 ? <FiCheck /> : "2"}
                    </div>
                    <span>Questions</span>
                </div>
                <div className={styles.stepLine} />
                <div
                    className={`${styles.stepItem} ${activeStep >= 3 ? styles.active : ""}`}
                    onClick={() => id && setActiveStep(3)}
                >
                    <div className={styles.stepCircle}>3</div>
                    <span>Settings & Publish</span>
                </div>
            </div>

            {/* STEP 1: BASIC INFO */}
            {activeStep === 1 && (
                <div className={styles.stepContentCard}>
                    <h3 className={styles.stepTitle}>
                        <FiFileText /> Step 1: Basic Quiz Specifications
                    </h3>

                    <div className={styles.formGrid}>
                        {/* Title */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Quiz Title <span className={styles.req}>*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    markDirty();
                                }}
                                placeholder="e.g. JavaScript Variables & Scopes"
                                className={styles.input}
                                required
                            />
                            <p className={styles.helperText}>
                                Between 3 and 200 characters.
                            </p>
                        </div>

                        {/* Category & Difficulty */}
                        <div className={styles.grid2}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    Category{" "}
                                    <span className={styles.req}>*</span>
                                </label>
                                <CustomSelect
                                    options={categories.map((c) => ({
                                        value: c.id,
                                        label: c.name,
                                    }))}
                                    value={categoryId}
                                    onChange={(val) => {
                                        setCategoryId(val);
                                        markDirty();
                                    }}
                                    placeholder="Select Category..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    Difficulty Level{" "}
                                    <span className={styles.req}>*</span>
                                </label>
                                <div className={styles.radioCards}>
                                    {["easy", "medium", "hard"].map((diff) => (
                                        <label
                                            key={diff}
                                            className={`${styles.radioCard} ${difficulty === diff ? styles.radioCardActive : ""}`}
                                        >
                                            <input
                                                type="radio"
                                                name="difficulty"
                                                value={diff}
                                                checked={difficulty === diff}
                                                onChange={(e) => {
                                                    setDifficulty(
                                                        e.target.value,
                                                    );
                                                    markDirty();
                                                }}
                                                className={styles.radioInput}
                                            />
                                            <span className={styles.radioLabel}>
                                                {diff}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => {
                                    setDescription(e.target.value);
                                    markDirty();
                                }}
                                placeholder="Describe what subjects are covered in this quiz..."
                                rows={4}
                                className={styles.textarea}
                            />
                        </div>

                        {/* Image Upload Zone */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Cover Image</label>
                            <div
                                className={`${styles.uploadZone} ${dragActive ? styles.dragActive : ""}`}
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className={styles.fileInput}
                                    onChange={(e) =>
                                        e.target.files[0] &&
                                        handleFileUpload(e.target.files[0])
                                    }
                                    accept="image/*"
                                />
                                {coverImageUrl ? (
                                    <div className={styles.coverPreview}>
                                        <img
                                            src={coverImageUrl}
                                            alt="Quiz Cover Preview"
                                        />
                                        <div className={styles.changeOverlay}>
                                            Click to Change Image
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.uploadPrompt}>
                                        <FiUploadCloud
                                            className={styles.uploadIcon}
                                        />
                                        <p>
                                            Drag and drop JPG/PNG file here, or{" "}
                                            <span>browse files</span>
                                        </p>
                                        <span>Max size: 5MB</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tags */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Tags</label>
                            <CustomSelect
                                isCreatable={true}
                                isMulti={true}
                                value={tags}
                                onChange={(val) => {
                                    setTags(val);
                                    markDirty();
                                }}
                                placeholder="Add tags..."
                            />
                        </div>
                    </div>

                    <div className={styles.stepFooter}>
                        <MainButton onClick={handleNextStep1} variant="primary">
                            Next: Add Questions <FiArrowRight />
                        </MainButton>
                    </div>
                </div>
            )}

            {/* STEP 2: QUESTIONS PANEL */}
            {activeStep === 2 && (
                <div className={styles.step2Grid}>
                    {/* Left Column: Questions Checklist */}
                    <div className={styles.questionsSidebar}>
                        <div className={styles.sidebarHeader}>
                            <h4>Questions ({questionsList.length})</h4>
                            <button
                                className={styles.addQBtn}
                                onClick={handleAddNewQuestion}
                            >
                                <FiPlus /> Add
                            </button>
                        </div>

                        <div className={styles.questionsScrollList}>
                            {questionsList.map((ql, idx) => (
                                <div
                                    key={ql.id}
                                    className={`${styles.qListItem} ${selectedQuestionId === ql.id ? styles.qListActive : ""}`}
                                    onClick={() => loadActiveQuestion(ql)}
                                >
                                    <FiMenu className={styles.dragHandle} />
                                    <span className={styles.qIndex}>
                                        Q{idx + 1}
                                    </span>
                                    <span className={styles.qTextTrunc}>
                                        {ql.question.question_text ||
                                            "(No question text)"}
                                    </span>
                                    <button
                                        className={styles.deleteQBtn}
                                        onClick={(e) =>
                                            handleRemoveQuestion(ql.id, e)
                                        }
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ))}
                            {questionsList.length === 0 && (
                                <div className={styles.emptySidebar}>
                                    No questions yet. Click "+ Add" or import
                                    from bank.
                                </div>
                            )}
                        </div>

                        <button
                            className={styles.bankImportBtn}
                            onClick={() => setIsBankModalOpen(true)}
                        >
                            <FiDatabase /> Import from Bank
                        </button>
                    </div>

                    {/* Right Column: Active Question Form Editor */}
                    <div className={styles.questionEditorCard}>
                        {selectedQuestionId ? (
                            <div className={styles.editorBody}>
                                <div className={styles.editorRow}>
                                    <h4>Edit Question details</h4>
                                    <MainButton
                                        onClick={handleSaveActiveQuestion}
                                        variant="success"
                                        size="sm"
                                    >
                                        Save Question
                                    </MainButton>
                                </div>

                                {/* Question Type */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Question Type
                                    </label>
                                    <CustomSelect
                                        options={[
                                            {
                                                value: "mcq",
                                                label: "Multiple Choice (MCQ)",
                                            },
                                            {
                                                value: "true_false",
                                                label: "True / False",
                                            },
                                        ]}
                                        value={qType}
                                        onChange={setQType}
                                    />
                                </div>

                                {/* Question text */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Question Text
                                    </label>
                                    <textarea
                                        value={qText}
                                        onChange={(e) => {
                                            setQText(e.target.value);
                                        }}
                                        placeholder="Type the question query..."
                                        rows={3}
                                        className={styles.textarea}
                                    />
                                    <div className={styles.textToolbar}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setQText(
                                                    (prev) =>
                                                        prev + " **bold**",
                                                )
                                            }
                                        >
                                            B
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setQText(
                                                    (prev) =>
                                                        prev + " *italic*",
                                                )
                                            }
                                        >
                                            I
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setQText(
                                                    (prev) => prev + " `code` ",
                                                )
                                            }
                                        >
                                            &lt;/&gt;
                                        </button>
                                    </div>
                                </div>

                                {/* Options Wrapper */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Answer Options
                                    </label>
                                    {qType === "mcq" ? (
                                        <div className={styles.optionsList}>
                                            {qOptions.map((opt, oIdx) => (
                                                <div
                                                    key={oIdx}
                                                    className={styles.optionRow}
                                                    data-correct={
                                                        opt.is_correct
                                                    }
                                                >
                                                    <input
                                                        type="radio"
                                                        name="correct-option"
                                                        checked={opt.is_correct}
                                                        onChange={() =>
                                                            handleSetCorrectOption(
                                                                oIdx,
                                                            )
                                                        }
                                                        className={
                                                            styles.optRadio
                                                        }
                                                    />
                                                    <input
                                                        type="text"
                                                        value={opt.option_text}
                                                        onChange={(e) =>
                                                            handleOptionTextChange(
                                                                oIdx,
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder={`Option ${oIdx + 1}`}
                                                        className={
                                                            styles.optInput
                                                        }
                                                    />
                                                    <button
                                                        type="button"
                                                        className={
                                                            styles.optDelete
                                                        }
                                                        onClick={() =>
                                                            handleRemoveMcqOption(
                                                                oIdx,
                                                            )
                                                        }
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            ))}
                                            {qOptions.length < 6 && (
                                                <button
                                                    type="button"
                                                    className={styles.addOptBtn}
                                                    onClick={handleAddMcqOption}
                                                >
                                                    + Add Option
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className={styles.tfWrapper}>
                                            {/* True / False static choices */}
                                            <div
                                                className={`${styles.tfCard} ${qOptions[0]?.is_correct ? styles.tfActive : ""}`}
                                                onClick={() => {
                                                    setQOptions([
                                                        {
                                                            option_text: "True",
                                                            option_order: 0,
                                                            is_correct: true,
                                                        },
                                                        {
                                                            option_text:
                                                                "False",
                                                            option_order: 1,
                                                            is_correct: false,
                                                        },
                                                    ]);
                                                }}
                                            >
                                                <span>True</span>
                                            </div>
                                            <div
                                                className={`${styles.tfCard} ${qOptions[1]?.is_correct ? styles.tfActive : ""}`}
                                                onClick={() => {
                                                    setQOptions([
                                                        {
                                                            option_text: "True",
                                                            option_order: 0,
                                                            is_correct: false,
                                                        },
                                                        {
                                                            option_text:
                                                                "False",
                                                            option_order: 1,
                                                            is_correct: true,
                                                        },
                                                    ]);
                                                }}
                                            >
                                                <span>False</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Custom overrides */}
                                <div className={styles.grid3}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>
                                            Points
                                        </label>
                                        <input
                                            type="number"
                                            value={qPoints}
                                            onChange={(e) =>
                                                setQPoints(e.target.value)
                                            }
                                            min={1}
                                            max={100}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>
                                            Difficulty
                                        </label>
                                        <CustomSelect
                                            options={[
                                                {
                                                    value: "easy",
                                                    label: "Easy",
                                                },
                                                {
                                                    value: "medium",
                                                    label: "Medium",
                                                },
                                                {
                                                    value: "hard",
                                                    label: "Hard",
                                                },
                                            ]}
                                            value={qDifficulty}
                                            onChange={setQDifficulty}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>
                                            Tags
                                        </label>
                                        <CustomSelect
                                            isCreatable={true}
                                            isMulti={true}
                                            value={qTags}
                                            onChange={setQTags}
                                            placeholder="Add tags..."
                                        />
                                    </div>
                                </div>

                                {/* Hint & Explanation */}
                                <div className={styles.grid2}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>
                                            Hint (Optional)
                                        </label>
                                        <textarea
                                            value={qHint}
                                            onChange={(e) =>
                                                setQHint(e.target.value)
                                            }
                                            placeholder="Type a hint..."
                                            rows={2}
                                            className={styles.textarea}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>
                                            Explanation (Optional)
                                        </label>
                                        <textarea
                                            value={qExplanation}
                                            onChange={(e) =>
                                                setQExplanation(e.target.value)
                                            }
                                            placeholder="Explain the solution..."
                                            rows={2}
                                            className={styles.textarea}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.emptyEditor}>
                                <FiHelpCircle
                                    className={styles.largeHelpIcon}
                                />
                                <h3>No Question Selected</h3>
                                <p>
                                    Select an existing question from the sidebar
                                    list, or click "+ Add" to draft a new
                                    question from scratch.
                                </p>
                            </div>
                        )}

                        <div
                            className={styles.stepFooter}
                            style={{ marginTop: "auto" }}
                        >
                            <MainButton
                                onClick={() => setActiveStep(1)}
                                variant="secondary"
                            >
                                Back: Basic Info
                            </MainButton>
                            <MainButton
                                onClick={() => {
                                    if (questionsList.length === 0) {
                                        toast.error(
                                            "Please add at least 1 question before proceeding",
                                        );
                                    } else {
                                        setActiveStep(3);
                                    }
                                }}
                                variant="primary"
                            >
                                Next: Settings & Publish <FiArrowRight />
                            </MainButton>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: SETTINGS & PUBLISH */}
            {activeStep === 3 && (
                <div className={styles.settingsGrid}>
                    {/* Settings Form */}
                    <div className={styles.settingsCard}>
                        <h3 className={styles.stepTitle}>
                            <FiSettings /> Advanced Quiz Settings
                        </h3>

                        <div className={styles.formGrid}>
                            {/* Time Limit */}
                            <div className={styles.toggleRow}>
                                <div>
                                    <label className={styles.toggleLabel}>
                                        Enable Time Limit
                                    </label>
                                    <p className={styles.toggleDesc}>
                                        Limit the amount of time students have
                                        to submit answers.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={hasTimeLimit}
                                    onChange={(e) => {
                                        setHasTimeLimit(e.target.checked);
                                        markDirty();
                                    }}
                                    className={styles.toggleSwitch}
                                />
                            </div>

                            {hasTimeLimit && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Time Limit (Minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={timeLimitMinutes}
                                        onChange={(e) => {
                                            setTimeLimitMinutes(e.target.value);
                                            markDirty();
                                        }}
                                        min={1}
                                        className={styles.input}
                                    />
                                </div>
                            )}

                            <div className={styles.divider} />

                            {/* Passing Score & Attempts */}
                            <div className={styles.grid2}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Passing Score (%){" "}
                                        <span className={styles.req}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={passingScore}
                                        onChange={(e) => {
                                            setPassingScore(e.target.value);
                                            markDirty();
                                        }}
                                        min={1}
                                        max={100}
                                        className={styles.input}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Maximum Attempts
                                    </label>
                                    <CustomSelect
                                        options={[
                                            {
                                                value: "",
                                                label: "Unlimited Attempts",
                                            },
                                            {
                                                value: "1",
                                                label: "1 Attempt Only",
                                            },
                                            { value: "2", label: "2 Attempts" },
                                            { value: "3", label: "3 Attempts" },
                                            { value: "5", label: "5 Attempts" },
                                        ]}
                                        value={maxAttempts}
                                        onChange={(val) => {
                                            setMaxAttempts(val);
                                            markDirty();
                                        }}
                                    />
                                </div>
                            </div>

                            <div className={styles.divider} />

                            {/* Availability Picker */}
                            <div className={styles.grid2}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Available From
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={availableFrom}
                                        onChange={(e) => {
                                            setAvailableFrom(e.target.value);
                                            markDirty();
                                        }}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Available Until
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={availableUntil}
                                        onChange={(e) => {
                                            setAvailableUntil(e.target.value);
                                            markDirty();
                                        }}
                                        className={styles.input}
                                    />
                                </div>
                            </div>

                            <div className={styles.divider} />

                            {/* Shufflers */}
                            <div className={styles.toggleRow}>
                                <div>
                                    <label className={styles.toggleLabel}>
                                        Shuffle Questions
                                    </label>
                                    <p className={styles.toggleDesc}>
                                        Randomize question displays for each
                                        student attempt.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={shuffleQuestions}
                                    onChange={(e) => {
                                        setShuffleQuestions(e.target.checked);
                                        markDirty();
                                    }}
                                    className={styles.toggleSwitch}
                                />
                            </div>

                            <div className={styles.toggleRow}>
                                <div>
                                    <label className={styles.toggleLabel}>
                                        Shuffle Answers
                                    </label>
                                    <p className={styles.toggleDesc}>
                                        Randomize MC choices order per question.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={shuffleAnswers}
                                    onChange={(e) => {
                                        setShuffleAnswers(e.target.checked);
                                        markDirty();
                                    }}
                                    className={styles.toggleSwitch}
                                />
                            </div>

                            <div className={styles.divider} />

                            {/* Visibility & Results display */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    Visibility Access
                                </label>
                                <div className={styles.radioCards}>
                                    <label
                                        className={`${styles.radioCard} ${visibility === "public" ? styles.radioCardActive : ""}`}
                                    >
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="public"
                                            checked={visibility === "public"}
                                            onChange={(e) => {
                                                setVisibility(e.target.value);
                                                markDirty();
                                            }}
                                            className={styles.radioInput}
                                        />
                                        <span className={styles.radioLabel}>
                                            <FiUnlock /> Public
                                        </span>
                                    </label>
                                    <label
                                        className={`${styles.radioCard} ${visibility === "private" ? styles.radioCardActive : ""}`}
                                    >
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="private"
                                            checked={visibility === "private"}
                                            onChange={(e) => {
                                                setVisibility(e.target.value);
                                                markDirty();
                                            }}
                                            className={styles.radioInput}
                                        />
                                        <span className={styles.radioLabel}>
                                            <FiLock /> Private
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    Reveal Results to Students
                                </label>
                                <CustomSelect
                                    options={[
                                        {
                                            value: "immediately",
                                            label: "Immediately after attempt submission",
                                        },
                                        {
                                            value: "after_due_date",
                                            label: "Only after due dates expire",
                                        },
                                        {
                                            value: "never",
                                            label: "Never (Instructor logs only)",
                                        },
                                    ]}
                                    value={showResults}
                                    onChange={(val) => {
                                        setShowResults(val);
                                        markDirty();
                                    }}
                                />
                            </div>

                            <div className={styles.divider} />

                            {/* Certificates */}
                            <div className={styles.toggleRow}>
                                <div>
                                    <label className={styles.toggleLabel}>
                                        Enable Certificates
                                    </label>
                                    <p className={styles.toggleDesc}>
                                        Automatically award verified PDF
                                        credentials to passing students.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={certificatesEnabled}
                                    onChange={(e) => {
                                        setCertificatesEnabled(
                                            e.target.checked,
                                        );
                                        markDirty();
                                    }}
                                    className={styles.toggleSwitch}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Summary Review Sidebar */}
                    <div className={styles.summarySidebar}>
                        <div className={styles.summaryCard}>
                            <h4>Quiz Review Summary</h4>
                            <div className={styles.summaryList}>
                                <div className={styles.summaryItem}>
                                    <span>Title</span>
                                    <strong>{title || "Untitled Draft"}</strong>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span>Category</span>
                                    <strong>
                                        {categories.find(
                                            (c) => c.id === categoryId,
                                        )?.name || "—"}
                                    </strong>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span>Difficulty</span>
                                    <strong
                                        style={{ textTransform: "capitalize" }}
                                    >
                                        {difficulty}
                                    </strong>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span>Questions count</span>
                                    <strong>
                                        {questionsList.length} linked
                                    </strong>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span>Time Limit</span>
                                    <strong>
                                        {hasTimeLimit
                                            ? `${timeLimitMinutes} min`
                                            : "No limit"}
                                    </strong>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span>Passing Rate</span>
                                    <strong>{passingScore}%</strong>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span>Max Attempts</span>
                                    <strong>{maxAttempts}</strong>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span>Visibility</span>
                                    <strong
                                        style={{ textTransform: "capitalize" }}
                                    >
                                        {visibility}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className={styles.actionsPanel}>
                            <MainButton
                                onClick={handlePublishQuiz}
                                variant="primary"
                                className={styles.fullBtn}
                            >
                                Publish Quiz
                            </MainButton>
                            <MainButton
                                onClick={handleSaveDraft}
                                variant="secondary"
                                className={styles.fullBtn}
                            >
                                Save as Draft
                            </MainButton>
                            <MainButton
                                onClick={() => setActiveStep(2)}
                                variant="ghost"
                                className={styles.fullBtn}
                            >
                                Back to Questions
                            </MainButton>
                        </div>
                    </div>
                </div>
            )}

            {/* QUESTION BANK IMPORT MODAL */}
            {isBankModalOpen && (
                <ModalPortal onClose={() => setIsBankModalOpen(false)}>
                    <div
                        className={styles.modalOverlay}
                        onClick={() => setIsBankModalOpen(false)} // Close on outside click
                    >
                        <div
                            className={styles.bankModal}
                            onClick={(e) => e.stopPropagation()} // Prevent bubble
                        >
                            <div className={styles.modalHeader}>
                                <h3>Import Questions from Bank</h3>
                                <button
                                    type="button"
                                    className={styles.closeBtn}
                                    onClick={() => setIsBankModalOpen(false)}
                                >
                                    <FiX />
                                </button>
                            </div>

                            {/* Search and Filters */}
                            <div className={styles.bankFilters}>
                                <div
                                    className={styles.searchWrapper}
                                    style={{ maxWidth: "none" }}
                                >
                                    <FiSearch className={styles.searchIcon} />
                                    <input
                                        type="text"
                                        placeholder="Search bank questions..."
                                        value={bankSearch}
                                        onChange={(e) =>
                                            setBankSearch(e.target.value)
                                        }
                                        className={styles.searchInput}
                                    />
                                </div>

                                <div
                                    className={styles.grid2}
                                    style={{
                                        gap: "var(--space-2)",
                                        width: "100%",
                                    }}
                                >
                                    <CustomSelect
                                        options={[
                                            {
                                                value: "all",
                                                label: "All Categories",
                                            },
                                            ...categories.map((c) => ({
                                                value: c.id,
                                                label: c.name,
                                            })),
                                        ]}
                                        value={bankCategory}
                                        onChange={setBankCategory}
                                        className={styles.select}
                                    />
                                    <CustomSelect
                                        options={[
                                            {
                                                value: "all",
                                                label: "All Types",
                                            },
                                            {
                                                value: "MCQ",
                                                label: "Multiple Choice",
                                            },
                                            {
                                                value: "TF",
                                                label: "True / False",
                                            },
                                        ]}
                                        value={bankType}
                                        onChange={setBankType}
                                        className={styles.select}
                                    />
                                </div>
                            </div>

                            {/* Question Selector List */}
                            <div className={styles.bankList}>
                                {filteredBankQuestions.map((q) => {
                                    const isChecked = selectedBankQIds.includes(
                                        q.id,
                                    );
                                    return (
                                        <div
                                            key={q.id}
                                            className={`${styles.bankItem} ${isChecked ? styles.bankItemChecked : ""}`}
                                            onClick={() =>
                                                handleToggleBankSelection(q.id)
                                            }
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => {}} // Controlled via row click
                                                className={styles.checkbox}
                                            />
                                            <div
                                                className={
                                                    styles.bankItemDetails
                                                }
                                            >
                                                <p
                                                    className={
                                                        styles.bankItemText
                                                    }
                                                >
                                                    {q.question_text}
                                                </p>
                                                <div
                                                    className={
                                                        styles.bankItemMeta
                                                    }
                                                >
                                                    <span
                                                        className={`${styles.statusChip} ${styles[q.difficulty]}`}
                                                    >
                                                        {q.difficulty}
                                                    </span>
                                                    <span>
                                                        Type: {q.question_type}
                                                    </span>
                                                    <span>
                                                        Points: {q.points}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredBankQuestions.length === 0 && (
                                    <div className={styles.emptyBank}>
                                        No eligible questions found in your
                                        bank.
                                    </div>
                                )}
                            </div>

                            <div className={styles.modalFooter}>
                                <span className={styles.selectedCount}>
                                    {selectedBankQIds.length} questions selected
                                </span>
                                <div>
                                    <MainButton
                                        onClick={() =>
                                            setIsBankModalOpen(false)
                                        }
                                        variant="secondary"
                                    >
                                        Cancel
                                    </MainButton>
                                    <MainButton
                                        onClick={handleImportFromBank}
                                        variant="primary"
                                        disabled={selectedBankQIds.length === 0}
                                    >
                                        Add Selected ({selectedBankQIds.length})
                                    </MainButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* EDIT PUBLISHED WARNING MODAL */}
            {isEditWarningOpen && (
                <ModalPortal onClose={() => navigate("/instructor/quizzes")}>
                    <div
                        className={styles.modalOverlay}
                        onClick={() => navigate("/instructor/quizzes")} // Redirect back if they click backdrop
                    >
                        <div
                            className={styles.warningModal}
                            onClick={(e) => e.stopPropagation()} // Prevent bubble
                        >
                            <div className={styles.warningIconCircle}>
                                <FiInfo />
                            </div>
                            <h3>Edit Live Published Quiz?</h3>
                            <p className={styles.modalWarningText}>
                                Editing this quiz will automatically
                                **Unpublish** it back to a draft. Students
                                currently in the middle of taking this quiz will
                                still be allowed to submit, but no new attempts
                                can be started until you publish it again.
                            </p>
                            <div className={styles.modalButtons}>
                                <MainButton
                                    onClick={() =>
                                        navigate("/instructor/quizzes")
                                    }
                                    variant="secondary"
                                >
                                    Cancel
                                </MainButton>
                                <MainButton
                                    onClick={handleEditAnyway}
                                    variant="primary"
                                >
                                    Edit Anyway
                                </MainButton>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default CreateEditQuiz;
