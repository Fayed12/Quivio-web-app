// local components
import PageHeader from "../components/PageHeader";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./QuestionBank.module.css";

// react
import { useState, useRef } from "react";

// redux
import { useDispatch } from "react-redux";
import { 
    fetchMyQuestions, 
    deleteQuestionThunk, 
    createQuestionThunk,
    duplicateQuestionThunk
} from "../../../redux/slices/questionsSlice";
// animation
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";
import ModalPortal from "../components/ModalPortal";

// react-icons
import { 
    FiPlus, 
    FiUpload, 
    FiDownload, 
    FiSearch, 
    FiTrash2, 
    FiCopy, 
    FiEdit2,
    FiX, 
    FiList, 
    FiToggleLeft,
    FiCheckSquare
} from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

// Material UI
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Checkbox 
} from "@mui/material";

// supabase client
import { supabase } from "../../../services/config/supabaseClient";

import { useQuestionBankData } from "../../../hooks/instructor/useQuestionBankData";

const QuestionBank = () => {
    const dispatch = useDispatch();

    const { questions, categories, quizzes } = useQuestionBankData();
    const totalCount = questions.length;

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [difficultyFilter, setDifficultyFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    // Table selections
    const [selectedQIds, setSelectedQIds] = useState([]);

    // Modal triggers
    const [activeQuestion, setActiveQuestion] = useState(null); // for create/edit question modal
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
    const [bulkQuizId, setBulkQuizId] = useState("");
    const [bulkCatId, setBulkCatId] = useState("");

    // Standalone Question Editor form states
    const [qText, setQText] = useState("");
    const [qType, setQType] = useState("mcq");
    const [qCategoryId, setQCategoryId] = useState("");
    const [qDifficulty, setQDifficulty] = useState("medium");
    const [qPoints, setQPoints] = useState(1);
    const [qHint, setQHint] = useState("");
    const [qExplanation, setQExplanation] = useState("");
    const [qTags, setQTags] = useState("");
    const [qOptions, setQOptions] = useState([
        { option_text: "Option A", option_order: 0, is_correct: true },
        { option_text: "Option B", option_order: 1, is_correct: false },
        { option_text: "Option C", option_order: 2, is_correct: false },
        { option_text: "Option D", option_order: 3, is_correct: false }
    ]);

    // CSV Bulk Import states
    const [csvFile, setCsvFile] = useState(null);
    const [csvPreview, setCsvPreview] = useState([]); // parsed rows
    const [csvErrors, setCsvErrors] = useState(0);
    const [csvValidCount, setCsvValidCount] = useState(0);
    const [isImporting, setIsImporting] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const containerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Page entrance animation
    usePageAnimation(containerRef);

    // Filters logic
    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.question_text.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || q.category?.id === categoryFilter;
        const matchesDifficulty = difficultyFilter === "all" || q.difficulty === difficultyFilter;
        const matchesType = typeFilter === "all" || q.question_type === typeFilter;
        return matchesSearch && matchesCategory && matchesDifficulty && matchesType;
    });

    const sortedQuestions = [...filteredQuestions].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
    });

    // Reset pagination to page 1 on filter changes during render to avoid cascading renders
    const filterKey = `${searchQuery}_${categoryFilter}_${difficultyFilter}_${typeFilter}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (filterKey !== prevFilterKey) {
        setPrevFilterKey(filterKey);
        setCurrentPage(1);
    }

    // Pagination slices
    const totalRows = sortedQuestions.length;
    const totalPages = Math.ceil(totalRows / pageSize);
    const paginatedQuestions = sortedQuestions.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );
    const startRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRow = Math.min(currentPage * pageSize, totalRows);

    // Checkbox selections
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedQIds(paginatedQuestions.map(q => q.id));
        } else {
            setSelectedQIds([]);
        }
    };

    const handleSelectRow = (qId) => {
        if (selectedQIds.includes(qId)) {
            setSelectedQIds(selectedQIds.filter(id => id !== qId));
        } else {
            setSelectedQIds([...selectedQIds, qId]);
        }
    };

    // stand-alone editor modal helper
    const openQuestionModal = (q = null) => {
        if (q) {
            // Edit mode
            setActiveQuestion(q);
            setQText(q.question_text || "");
            setQType(q.question_type || "MCQ");
            setQCategoryId(q.category?.id || "");
            setQDifficulty(q.difficulty || "medium");
            setQPoints(q.points || 1);
            setQHint(q.hint || "");
            setQExplanation(q.explanation || "");
            setQTags(q.tags?.join(", ") || "");
            if (q.question_options) {
                setQOptions(q.question_options.map(o => ({
                    id: o.id,
                    option_text: o.option_text,
                    option_order: o.option_order,
                    is_correct: o.is_correct
                })).sort((a, b) => a.option_order - b.option_order));
            }
        } else {
            // Create mode
            setActiveQuestion({ isNew: true });
            setQText("");
            setQType("mcq");
            setQCategoryId("");
            setQDifficulty("medium");
            setQPoints(1);
            setQHint("");
            setQExplanation("");
            setQTags("");
            setQOptions([
                { option_text: "", option_order: 0, is_correct: true },
                { option_text: "", option_order: 1, is_correct: false },
                { option_text: "", option_order: 2, is_correct: false },
                { option_text: "", option_order: 3, is_correct: false }
            ]);
        }
    };

    const handleSaveQuestion = async (e) => {
        e.preventDefault();
        if (!qText.trim()) {
            toast.error("Question query text is required");
            return;
        }
        if (!qCategoryId) {
            toast.error("Please select a Category");
            return;
        }

        const filteredOpts = qOptions.filter(o => o.option_text.trim() !== "");
        if (qType === "mcq" && filteredOpts.length < 2) {
            toast.error("MCQ requires at least 2 options");
            return;
        }

        const correctCount = filteredOpts.filter(o => o.is_correct).length;
        if (correctCount !== 1) {
            toast.error("Please mark exactly one option as correct");
            return;
        }

        const fields = {
            question_text: qText,
            question_type: qType,
            category_id: qCategoryId,
            difficulty: qDifficulty,
            points: Number(qPoints),
            hint: qHint || null,
            explanation: qExplanation || null,
            tags: qTags ? qTags.split(",").map(t => t.trim()).filter(Boolean) : [],
            options: filteredOpts
        };

        try {
            if (activeQuestion.isNew) {
                await dispatch(createQuestionThunk(fields)).unwrap();
                toast.success("Created bank question successfully!");
            } else {
                // Standalone update question with Supabase custom handler
                const { error } = await supabase
                    .from("questions")
                    .update({
                        question_text: qText,
                        question_type: qType,
                        category_id: qCategoryId,
                        difficulty: qDifficulty,
                        points: Number(qPoints),
                        hint: qHint || null,
                        explanation: qExplanation || null,
                        tags: qTags ? qTags.split(",").map(t => t.trim()).filter(Boolean) : []
                    })
                    .eq("id", activeQuestion.id);

                if (error) throw error;

                // options upsert
                await supabase.from("question_options").delete().eq("question_id", activeQuestion.id);
                await supabase.from("question_options").insert(
                    filteredOpts.map((o, idx) => ({
                        question_id: activeQuestion.id,
                        option_text: o.option_text,
                        option_order: idx,
                        is_correct: o.is_correct
                    }))
                );

                toast.success("Question updated successfully!");
                dispatch(fetchMyQuestions());
            }
            setActiveQuestion(null);
        } catch (err) {
            toast.error(err.message || "Failed to save question");
        }
    };

    // Standalone Operations
    const handleDeleteQuestion = async (qId, usageCount) => {
        if (usageCount > 0) {
            toast.error("Cannot delete a question currently in use by quizzes. Remove it from quizzes first.");
            return;
        }
        if (!confirm("Are you sure you want to delete this question?")) return;

        try {
            await dispatch(deleteQuestionThunk(qId)).unwrap();
            toast.success("Question deleted successfully!");
        } catch (err) {
            toast.error(err || "Failed to delete question");
        }
    };

    const handleDuplicateQuestion = async (qId) => {
        try {
            await dispatch(duplicateQuestionThunk(qId)).unwrap();
            toast.success("Duplicated question draft!");
        } catch (err) {
            toast.error(err || "Failed to duplicate");
        }
    };

    // Bulk actions
    const handleBulkAddToQuiz = async () => {
        if (!bulkQuizId) return;
        try {
            // Get current questions linked to selected quiz to determine display order offsets
            const { data } = await supabase
                .from("quiz_questions")
                .select("id")
                .eq("quiz_id", bulkQuizId);
            
            const startOrder = data?.length || 0;

            const links = selectedQIds.map((qId, idx) => ({
                quiz_id: bulkQuizId,
                question_id: qId,
                display_order: startOrder + idx + 1
            }));

            const { error } = await supabase.from("quiz_questions").insert(links);
            if (error) throw error;

            toast.success(`Successfully added ${selectedQIds.length} question(s) to Quiz!`);
            setSelectedQIds([]);
            setBulkQuizId("");
        } catch (err) {
            toast.error(err.message || "Failed to add questions to quiz");
        }
    };

    const handleBulkChangeCategory = async () => {
        if (!bulkCatId) return;
        try {
            const { error } = await supabase
                .from("questions")
                .update({ category_id: bulkCatId })
                .in("id", selectedQIds);

            if (error) throw error;

            toast.success(`Successfully updated category for ${selectedQIds.length} questions!`);
            setSelectedQIds([]);
            setBulkCatId("");
            dispatch(fetchMyQuestions());
        } catch (err) {
            toast.error(err.message || "Failed to change category");
        }
    };

    const handleBulkDelete = async () => {
        // Filter out questions currently in use
        const inUseList = questions.filter(q => selectedQIds.includes(q.id) && (q.usage_count || 0) > 0);
        if (inUseList.length > 0) {
            toast.error(`Cannot delete bulk. ${inUseList.length} of the selected questions are currently in use by active quizzes.`);
            return;
        }

        if (confirm(`Are you sure you want to permanently delete all ${selectedQIds.length} selected questions?`)) {
            try {
                // Delete from DB
                const { error } = await supabase.from("questions").delete().in("id", selectedQIds);
                if (error) throw error;

                toast.success(`Permanently deleted ${selectedQIds.length} questions!`);
                setSelectedQIds([]);
                dispatch(fetchMyQuestions());
            } catch (err) {
                toast.error(err.message || "Failed to delete questions");
            }
        }
    };

    // CSV Parse Logic
    const handleCsvUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCsvFile(file);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            parseCSVText(text);
        };
        reader.readAsText(file);
    };

    const parseCSVText = (text) => {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length <= 1) {
            toast.error("Uploaded CSV is empty or missing content rows");
            return;
        }

        // Header parsing: type, question_text, option_a, option_b, option_c, option_d, correct, points, difficulty, category
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        const previewRows = [];
        let errors = 0;
        let valids = 0;

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map(c => c.trim());
            const rowData = {};
            headers.forEach((h, idx) => {
                rowData[h] = cols[idx] || "";
            });

            // Basic Validation
            const rowErrors = [];
            if (!rowData.type || !['mcq', 'true_false', 'MCQ', 'TF'].includes(rowData.type)) {
                rowErrors.push("Type must be MCQ or TF");
            }
            if (!rowData.question_text) {
                rowErrors.push("Question text is required");
            }
            if (!rowData.correct) {
                rowErrors.push("Correct answer index/letter is required");
            }

            if (rowErrors.length > 0) {
                errors++;
                rowData.isValid = false;
                rowData.errorMsg = rowErrors.join(", ");
            } else {
                valids++;
                rowData.isValid = true;
            }
            previewRows.push(rowData);
        }

        setCsvPreview(previewRows);
        setCsvErrors(errors);
        setCsvValidCount(valids);
    };

    const handleImportCSVData = async () => {
        const validRows = csvPreview.filter(r => r.isValid);
        if (validRows.length === 0) {
            toast.error("No valid rows to import");
            return;
        }

        setIsImporting(true);
        try {
            for (const row of validRows) {
                // Find matching category or default to first
                const cat = categories.find(c => c.name.toLowerCase() === row.category?.toLowerCase()) || categories[0];
                
                const qFields = {
                    question_text: row.question_text,
                    question_type: row.type.toUpperCase() === 'TF' ? 'true_false' : 'mcq',
                    difficulty: row.difficulty?.toLowerCase() || "medium",
                    points: Number(row.points) || 1,
                    hint: row.hint || null,
                    explanation: row.explanation || null,
                    category_id: cat?.id
                };

                // Map options
                let opts = [];
                if (qFields.question_type === "mcq") {
                    const letter = row.correct.toUpperCase(); // A, B, C, D
                    opts = [
                        { option_text: row.option_a || "Choice A", option_order: 0, is_correct: letter === "A" },
                        { option_text: row.option_b || "Choice B", option_order: 1, is_correct: letter === "B" },
                        { option_text: row.option_c || "Choice C", option_order: 2, is_correct: letter === "C" },
                        { option_text: row.option_d || "Choice D", option_order: 3, is_correct: letter === "D" }
                    ].filter(o => o.option_text !== "");
                } else {
                    const val = row.correct.toLowerCase(); // true, false
                    opts = [
                        { option_text: "True", option_order: 0, is_correct: val === "true" },
                        { option_text: "False", option_order: 1, is_correct: val === "false" }
                    ];
                }

                // Insert to DB using redux thunk
                await dispatch(createQuestionThunk({ ...qFields, options: opts })).unwrap();
            }

            toast.success(`Imported ${validRows.length} questions successfully!`);
            setIsCsvModalOpen(false);
            setCsvFile(null);
            setCsvPreview([]);
            dispatch(fetchMyQuestions());
        } catch (err) {
            console.log(err);
            toast.error("Bulk CSV import encountered database insert issues.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = "type,question_text,option_a,option_b,option_c,option_d,correct,points,difficulty,category,hint,explanation\n";
        const sampleRow = "MCQ,What is the keyword to define variable in JS?,var,let,const,all,D,1,easy,Programming,Hint text,Explanation text\n";
        
        const blob = new Blob([headers + sampleRow], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "quivio_question_template.csv";
        link.click();
    };

    // Option modifications inside modal
    const handleSetCorrectOption = (idx) => {
        setQOptions(qOptions.map((o, i) => ({
            ...o,
            is_correct: i === idx
        })));
    };

    const handleOptionTextChange = (idx, text) => {
        const updated = [...qOptions];
        updated[idx].option_text = text;
        setQOptions(updated);
    };

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Header */}
            <PageHeader 
                title="Question Bank"
                subtitle={`A unified library of all your reusable quiz questions. Total: ${totalCount}`}
                breadcrumbs={["Quizzes", "Question Bank"]}
                actions={
                    <div className={styles.headerActions}>
                        <MainButton onClick={() => openQuestionModal()} variant="primary">
                            <FiPlus /> Create Question
                        </MainButton>
                        <MainButton onClick={() => setIsCsvModalOpen(true)} variant="outline">
                            <FiUpload /> Import CSV
                        </MainButton>
                        <MainButton onClick={handleDownloadTemplate} variant="secondary">
                            <FiDownload /> Template
                        </MainButton>
                    </div>
                }
            />

            {/* Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    <FiSearch className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Search question text..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && <FiX className={styles.clearIcon} onClick={() => setSearchQuery("")} />}
                </div>

                <div className={styles.filtersGrid}>
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={styles.select}>
                        <option value="all">All Categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className={styles.select}>
                        <option value="all">All Difficulties</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>

                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={styles.select}>
                        <option value="all">All Types</option>
                        <option value="mcq">Multiple Choice</option>
                        <option value="true_false">True / False</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedQIds.length > 0 && (
                <div className={styles.bulkBar}>
                    <div className={styles.bulkLeft}>
                        <FiCheckSquare className={styles.bulkIcon} />
                        <strong>{selectedQIds.length} questions selected</strong>
                    </div>

                    <div className={styles.bulkRight}>
                        {/* Add to Quiz Selector */}
                        <select 
                            value={bulkQuizId} 
                            onChange={(e) => setBulkQuizId(e.target.value)}
                            className={styles.bulkSelect}
                        >
                            <option value="">Add to Quiz...</option>
                            {quizzes.map(q => (
                                <option key={q.id} value={q.id}>{q.title}</option>
                            ))}
                        </select>
                        <MainButton onClick={handleBulkAddToQuiz} variant="secondary" size="sm" disabled={!bulkQuizId}>
                            Add
                        </MainButton>

                        <div className={styles.bulkDivider} />

                        {/* Change Category Selector */}
                        <select 
                            value={bulkCatId} 
                            onChange={(e) => setBulkCatId(e.target.value)}
                            className={styles.bulkSelect}
                        >
                            <option value="">Change Category...</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <MainButton onClick={handleBulkChangeCategory} variant="secondary" size="sm" disabled={!bulkCatId}>
                            Update
                        </MainButton>

                        <div className={styles.bulkDivider} />

                        <button className={styles.bulkDeleteBtn} onClick={handleBulkDelete} title="Delete Selected">
                            <FiTrash2 /> Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Table Listing */}
            <TableContainer component={Paper} className={styles.tableContainer} elevation={0}>
                <Table size="medium">
                    <TableHead className={styles.tableHead}>
                        <TableRow>
                            <TableCell className={styles.thCell} padding="checkbox">
                                <Checkbox 
                                    indeterminate={selectedQIds.length > 0 && selectedQIds.length < paginatedQuestions.length}
                                    checked={paginatedQuestions.length > 0 && selectedQIds.length === paginatedQuestions.length}
                                    onChange={handleSelectAll}
                                    sx={{color: "var(--border-medium)"}}
                                />
                            </TableCell>
                            <TableCell className={styles.thCell} align="center">Type</TableCell>
                            <TableCell className={styles.thCell}>Question Text</TableCell>
                            <TableCell className={styles.thCell} align="center">Difficulty</TableCell>
                            <TableCell className={styles.thCell}>Category</TableCell>
                            <TableCell className={styles.thCell} align="center">Used In</TableCell>
                            <TableCell className={styles.thCell} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedQuestions.map((q) => {
                            const isRowChecked = selectedQIds.includes(q.id);
                            return (
                                <TableRow key={q.id} className={styles.tableRow} data-checked={isRowChecked}>
                                    <TableCell padding="checkbox" className={styles.tdCell}>
                                        <Checkbox 
                                            checked={isRowChecked} 
                                            onChange={() => handleSelectRow(q.id)}
                                            sx={{color: "var(--border-medium)"}}
                                        />
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell}>
                                        <div className={styles.typeIcon} title={q.question_type}>
                                            {q.question_type === "mcq" ? <FiList /> : <FiToggleLeft />}
                                        </div>
                                    </TableCell>
                                    <TableCell className={styles.tdCell} style={{fontWeight: 500}}>
                                        {q.question_text}
                                        {q.tags && q.tags.length > 0 && (
                                            <div className={styles.tagsRow}>
                                                {q.tags.map(t => <span key={t} className={styles.tag}>#{t}</span>)}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell}>
                                        <span className={`${styles.statusChip} ${styles[q.difficulty || "medium"]}`}>
                                            {q.difficulty}
                                        </span>
                                    </TableCell>
                                    <TableCell className={styles.tdCell}>
                                        {q.category?.name || "General"}
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell}>
                                        <span className={styles.usageLink} title="Number of quizzes linking this question">
                                            {q.usage_count || 0} quiz(zes)
                                        </span>
                                    </TableCell>
                                    <TableCell align="center" className={styles.tdCell}>
                                        <div className={styles.actions}>
                                            <button className={styles.actionBtn} onClick={() => openQuestionModal(q)} title="Edit">
                                                <FiEdit2 />
                                            </button>
                                            <button className={styles.actionBtn} onClick={() => handleDuplicateQuestion(q.id)} title="Duplicate">
                                                <FiCopy />
                                            </button>
                                            <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDeleteQuestion(q.id, q.usage_count)} title="Delete">
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {sortedQuestions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" className={styles.emptyCell}>
                                    No questions registered in Question Bank. Click "+ Create Question" to add!
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className={styles.paginationRow}>
                    <div className={styles.paginationInfo}>
                        Showing <strong>{startRow}</strong>-<strong>{endRow}</strong> of <strong>{totalRows}</strong> questions
                    </div>
                    <div className={styles.paginationBtnGroup}>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={styles.pageBtn}
                        >
                            Previous
                        </button>
                        {[...Array(totalPages)].map((_, idx) => {
                            const pageNum = idx + 1;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`${styles.pageNumberBtn} ${currentPage === pageNum ? styles.pageNumberBtnActive : ""}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={styles.pageBtn}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* CREATE / EDIT QUESTION MODAL */}
            {activeQuestion && (
                <ModalPortal onClose={() => setActiveQuestion(null)}>
                <div 
                    className={styles.modalOverlay}
                    onClick={() => setActiveQuestion(null)} // Close on outside click
                >
                    <form 
                        className={styles.editorModal} 
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                        onSubmit={handleSaveQuestion}
                    >
                        <div className={styles.modalHeader}>
                            <h3>{activeQuestion.isNew ? "Create Bank Question" : "Edit Question Details"}</h3>
                            <button type="button" className={styles.closeBtn} onClick={() => setActiveQuestion(null)}>
                                <FiX />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Question Type & Category */}
                            <div className={styles.grid2}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Question Type</label>
                                    <select value={qType} onChange={(e) => setQType(e.target.value)} className={styles.select}>
                                        <option value="mcq">Multiple Choice (MCQ)</option>
                                        <option value="true_false">True / False</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Category <span className={styles.req}>*</span></label>
                                    <select value={qCategoryId} onChange={(e) => setQCategoryId(e.target.value)} className={styles.select} required>
                                        <option value="">Select Category...</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Question text */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Question Query</label>
                                <textarea 
                                    value={qText} 
                                    onChange={(e) => setQText(e.target.value)} 
                                    placeholder="Type the question query..." 
                                    rows={3} 
                                    className={styles.textarea} 
                                    required
                                />
                            </div>

                            {/* Options */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Answer Options</label>
                                {qType === "mcq" ? (
                                    <div className={styles.optionsList}>
                                        {qOptions.map((opt, oIdx) => (
                                            <div key={oIdx} className={styles.optionRow} data-correct={opt.is_correct}>
                                                <input 
                                                    type="radio" 
                                                    name="correct-option"
                                                    checked={opt.is_correct}
                                                    onChange={() => handleSetCorrectOption(oIdx)}
                                                    className={styles.optRadio}
                                                />
                                                <input 
                                                    type="text" 
                                                    value={opt.option_text}
                                                    onChange={(e) => handleOptionTextChange(oIdx, e.target.value)}
                                                    placeholder={`Choice option ${oIdx + 1}`}
                                                    className={styles.optInput}
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.tfWrapper}>
                                        <div className={`${styles.tfCard} ${qOptions[0]?.is_correct ? styles.tfActive : ""}`} onClick={() => {
                                            setQOptions([
                                                { option_text: "True", option_order: 0, is_correct: true },
                                                { option_text: "False", option_order: 1, is_correct: false }
                                            ]);
                                        }}>
                                            True
                                        </div>
                                        <div className={`${styles.tfCard} ${qOptions[1]?.is_correct ? styles.tfActive : ""}`} onClick={() => {
                                            setQOptions([
                                                { option_text: "True", option_order: 0, is_correct: false },
                                                { option_text: "False", option_order: 1, is_correct: true }
                                            ]);
                                        }}>
                                            False
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Custom Overrides */}
                            <div className={styles.grid3}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Points</label>
                                    <input type="number" value={qPoints} onChange={(e) => setQPoints(e.target.value)} min={1} className={styles.input} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Difficulty</label>
                                    <select value={qDifficulty} onChange={(e) => setQDifficulty(e.target.value)} className={styles.select}>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Tags (Comma separated)</label>
                                    <input type="text" value={qTags} onChange={(e) => setQTags(e.target.value)} placeholder="e.g. tag1, tag2" className={styles.input} />
                                </div>
                            </div>

                            {/* Hint & Explanation */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Hint (Optional)</label>
                                <input type="text" value={qHint} onChange={(e) => setQHint(e.target.value)} placeholder="Hint details..." className={styles.input} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Explanation (Optional)</label>
                                <textarea value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} placeholder="Explanation details..." rows={2} className={styles.textarea} />
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <MainButton onClick={() => setActiveQuestion(null)} variant="secondary">
                                Cancel
                            </MainButton>
                            <MainButton type="submit" variant="success">
                                Save Question
                            </MainButton>
                        </div>
                    </form>
                </div>
                </ModalPortal>
            )}

            {/* CSV BULK IMPORT MODAL */}
            {isCsvModalOpen && (
                <ModalPortal onClose={() => !isImporting && setIsCsvModalOpen(false)}>
                <div 
                    className={styles.modalOverlay}
                    onClick={() => !isImporting && setIsCsvModalOpen(false)} // Close on outside click
                >
                    <div 
                        className={styles.csvModal}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                    >
                        <div className={styles.modalHeader}>
                            <h3>Bulk Import Questions from CSV</h3>
                            <button type="button" className={styles.closeBtn} onClick={() => !isImporting && setIsCsvModalOpen(false)} disabled={isImporting}>
                                <FiX />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Upload Zone */}
                            <div 
                                className={styles.csvUploadZone} 
                                onClick={() => !isImporting && fileInputRef.current.click()}
                                style={{ pointerEvents: isImporting ? 'none' : 'auto', opacity: isImporting ? 0.6 : 1 }}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className={styles.fileInput} 
                                    onChange={handleCsvUpload} 
                                    accept=".csv"
                                    disabled={isImporting}
                                />
                                <FiUpload className={styles.csvIcon} />
                                <p>{csvFile ? csvFile.name : "Select or drag CSV file here to upload"}</p>
                            </div>

                            {/* CSV Preview */}
                            {csvPreview.length > 0 && (
                                <div className={styles.csvPreviewWrapper}>
                                    <div className={styles.csvSummaryText}>
                                        <span className={styles.validText}>{csvValidCount} Valid Rows</span> • 
                                        <span className={styles.errorText} style={{marginLeft: "5px"}}>{csvErrors} Error Rows</span>
                                    </div>
                                    
                                    <div className={styles.csvPreviewTableScroll}>
                                        <table className={styles.csvTable}>
                                            <thead>
                                                <tr>
                                                    <th>Type</th>
                                                    <th>Question Text</th>
                                                    <th>Correct</th>
                                                    <th>Category</th>
                                                    <th>Validation</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {csvPreview.map((row, idx) => (
                                                    <tr key={idx} className={row.isValid ? styles.csvRowValid : styles.csvRowError}>
                                                        <td>{row.type}</td>
                                                        <td>{row.question_text}</td>
                                                        <td align="center">{row.correct}</td>
                                                        <td>{row.category}</td>
                                                        <td>{row.isValid ? "✓ OK" : `✗ ${row.errorMsg}`}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <MainButton onClick={() => setIsCsvModalOpen(false)} variant="secondary" disabled={isImporting}>
                                Cancel
                            </MainButton>
                            <MainButton 
                                onClick={handleImportCSVData} 
                                variant="primary" 
                                disabled={csvValidCount === 0 || isImporting}
                                isLoading={isImporting}
                            >
                                {isImporting ? "Importing..." : `Import ${csvValidCount} Valid Questions`}
                            </MainButton>
                        </div>
                    </div>
                </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default QuestionBank;
