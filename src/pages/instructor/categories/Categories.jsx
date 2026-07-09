// local components
import PageHeader from "../components/PageHeader";
import MainButton from "../../../components/ui/button/MainButton";
import styles from "./Categories.module.css";

// react
import { useState, useRef } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";
import { selectProfile } from "../../../redux/slices/authSlice";
import { 
    fetchMyCategories,
    createCategoryThunk, 
    updateCategoryThunk, 
    deleteCategoryThunk,
    toggleCategoryThunk
} from "../../../redux/slices/categoriesSlice";

// animation
import usePageAnimation from "../../../hooks/instructor/usePageAnimation";
import ModalPortal from "../components/ModalPortal";

// react-icons
import * as Icons from "react-icons/fi";
import { FiTrash2, FiFolder, FiInfo } from "react-icons/fi";

// react-toastify
import { toast } from "react-toastify";

// sweetalert2
import Swal from "sweetalert2";

// custom select
import CustomSelect from "../../../components/ui/select/CustomSelect";

// supabase client
import { supabase } from "../../../services/config/supabaseClient";

// Colors for category picker
const COLOR_PRESETS = [
    "#3B82F6", // Blue
    "#6366F1", // Indigo
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#EF4444", // Red
    "#F97316", // Orange
    "#F59E0B", // Amber
    "#10B981", // Green
    "#14B8A6", // Teal
    "#06B6D4"  // Cyan
];

// Icons for category picker
const ICON_OPTIONS = [
    { name: "FiBookOpen", comp: <Icons.FiBookOpen /> },
    { name: "FiCode", comp: <Icons.FiCode /> },
    { name: "FiDatabase", comp: <Icons.FiDatabase /> },
    { name: "FiGlobe", comp: <Icons.FiGlobe /> },
    { name: "FiCpu", comp: <Icons.FiCpu /> },
    { name: "FiAward", comp: <Icons.FiAward /> },
    { name: "FiBriefcase", comp: <Icons.FiBriefcase /> },
    { name: "FiCompass", comp: <Icons.FiCompass /> },
    { name: "FiFeather", comp: <Icons.FiFeather /> },
    { name: "FiHeart", comp: <Icons.FiHeart /> },
    { name: "FiSettings", comp: <Icons.FiSettings /> },
    { name: "FiShield", comp: <Icons.FiShield /> }
];

import { useCategoriesData } from "../../../hooks/instructor/useCategoriesData";

const Categories = () => {
    const dispatch = useDispatch();
    const currentUser = useSelector(selectProfile);
    const currentUserId = currentUser?.uid || currentUser?.id;

    // Use custom data hook
    const { categories } = useCategoriesData();

    // Editing state (null for Add Mode, category object for Edit Mode)
    const [editingCategory, setEditingCategory] = useState(null);

    // Form inputs
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(COLOR_PRESETS[0]);
    const [icon, setIcon] = useState("FiBookOpen");

    // Deletion safeguards
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [reassignTargetId, setReassignTargetId] = useState("");

    const containerRef = useRef(null);
    const reassignModalRef = useRef(null);

    // Page entrance animation
    usePageAnimation(containerRef, {
        staggerSelector: `.${styles.categoryItem}`,
    });

    const handleSelectCategoryForEdit = (cat) => {
        setEditingCategory(cat);
        setName(cat.name || "");
        setDescription(cat.description || "");
        setColor(cat.color || COLOR_PRESETS[0]);
        setIcon(cat.icon || "FiBookOpen");
    };

    const handleClearForm = () => {
        setEditingCategory(null);
        setName("");
        setDescription("");
        setColor(COLOR_PRESETS[0]);
        setIcon("FiBookOpen");
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        if (!name.trim() || name.length < 2) {
            toast.error("Category name must be at least 2 characters");
            return;
        }

        if (editingCategory && editingCategory.created_by !== currentUserId) {
            toast.error("System or default categories cannot be modified.");
            return;
        }

        const fields = {
            name,
            description,
            icon,
            color
        };

        try {
            if (editingCategory) {
                await dispatch(updateCategoryThunk({ id: editingCategory.id, ...fields })).unwrap();
                toast.success(`Category "${name}" updated successfully!`);
            } else {
                await dispatch(createCategoryThunk(fields)).unwrap();
                toast.success(`Category "${name}" created successfully!`);
            }
            handleClearForm();
            dispatch(fetchMyCategories());
        } catch (err) {
            toast.error(err || "Failed to save category");
        }
    };

    // Toggle active state
    const handleToggleActive = async (id, currentStatus) => {
        const cat = categories.find(c => c.id === id);
        if (cat && cat.created_by !== currentUserId) {
            toast.error("System or default categories cannot be modified.");
            return;
        }

        try {
            await dispatch(toggleCategoryThunk({ id, isActive: !currentStatus })).unwrap();
            toast.success(`Category status updated successfully!`);
            dispatch(fetchMyCategories());
        } catch (err) {
            toast.error(err || "Failed to update category status");
        }
    };

    // Safe Deletion checks
    const handleDeleteClick = (cat) => {
        if (cat.created_by !== currentUserId) {
            toast.error("System or default categories cannot be deleted.");
            return;
        }

        if ((cat.quiz_count || 0) > 0) {
            setCategoryToDelete(cat);
            setReassignTargetId("");
        } else {
            const isDark = document.documentElement.classList.contains("dark");
            Swal.fire({
                title: "Delete Category?",
                text: `Are you sure you want to delete category "${cat.name}"?`,
                icon: "warning",
                background: isDark ? "#1e293b" : "#ffffff",
                color: isDark ? "#f8fafc" : "#0f172a",
                showCancelButton: true,
                confirmButtonText: "Delete",
                cancelButtonText: "Cancel",
                confirmButtonColor: "var(--color-danger, #ef4444)",
                cancelButtonColor: isDark ? "#475569" : "#94a3b8",
                customClass: {
                    popup: "premium-swal-popup"
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    triggerDelete(cat.id);
                }
            });
        }
    };

    const triggerDelete = async (catId) => {
        try {
            await dispatch(deleteCategoryThunk(catId)).unwrap();
            toast.success("Category deleted successfully!");
            dispatch(fetchMyCategories());
            if (editingCategory?.id === catId) {
                handleClearForm();
            }
        } catch (err) {
            toast.error(err || "Failed to delete category");
        }
    };

    const handleReassignAndDelete = async () => {
        if (!reassignTargetId) {
            toast.error("Please select a target category");
            return;
        }

        try {
            // 1. Reassign quizzes in Supabase
            const { error: updateErr } = await supabase
                .from("quizzes")
                .update({ category_id: reassignTargetId })
                .eq("category_id", categoryToDelete.id);

            if (updateErr) throw updateErr;

            // 2. Perform deletion thunk
            await triggerDelete(categoryToDelete.id);
            setCategoryToDelete(null);
        } catch (err) {
            toast.error(err.message || "Failed to reassign quizzes");
        }
    };

    const renderIcon = (iconName) => {
        const found = ICON_OPTIONS.find(i => i.name === iconName);
        return found ? found.comp : <FiFolder />;
    };

    // Filter other categories for reassign options
    const otherCategories = categories.filter(c => c.id !== categoryToDelete?.id && c.is_active);

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Page Header */}
            <PageHeader 
                title="Category Settings"
                subtitle="Manage quiz categories, icons, and theme accent colors."
                breadcrumbs={["Categories"]}
            />

            {/* Split View */}
            <div className={styles.splitGrid}>
                {/* Left Column: Categories List */}
                <div className={styles.listCard}>
                    <h3 className={styles.sectionTitle}>Available Categories ({categories.length})</h3>
                    
                    <div className={styles.listScroll}>
                        {categories.map((cat) => (
                            <div 
                                key={cat.id} 
                                className={`${styles.categoryItem} ${editingCategory?.id === cat.id ? styles.itemActive : ""}`}
                                onClick={() => handleSelectCategoryForEdit(cat)}
                            >
                                <div className={styles.iconBox} style={{ color: cat.color, backgroundColor: `${cat.color}15` }}>
                                    {renderIcon(cat.icon)}
                                </div>

                                <div className={styles.catMeta}>
                                    <h4>{cat.name}</h4>
                                    <span>{cat.quiz_count || 0} quiz(zes) linked</span>
                                </div>

                                <div className={styles.actionsRow} onClick={(e) => e.stopPropagation()}>
                                    {/* Active toggle */}
                                    <label className={styles.switch} title="Toggle active status">
                                        <input 
                                            type="checkbox" 
                                            checked={!!cat.is_active}
                                            onChange={() => handleToggleActive(cat.id, cat.is_active)}
                                        />
                                        <span className={styles.slider} />
                                    </label>

                                    <button className={styles.deleteBtn} onClick={() => handleDeleteClick(cat)} title="Delete Category">
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <div className={styles.emptyList}>No categories created yet. Fill in the fields on the right to start!</div>
                        )}
                    </div>
                </div>

                {/* Right Column: Add / Edit Form Panel */}
                <form className={styles.formCard} onSubmit={handleSaveCategory}>
                    <h3 className={styles.sectionTitle}>
                        {editingCategory ? "Edit Category specifications" : "Create Category specifications"}
                    </h3>

                    <div className={styles.formGrid}>
                        {/* Name */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Category Name <span className={styles.req}>*</span></label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. JavaScript Frameworks"
                                className={styles.input}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Description</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Details about this subject pool..."
                                rows={3}
                                className={styles.textarea}
                            />
                        </div>

                        {/* Color Selector Preset Swatches */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Theme Accent Color</label>
                            <div className={styles.colorPalette}>
                                {COLOR_PRESETS.map((col) => (
                                    <div 
                                        key={col} 
                                        className={`${styles.colorSwatch} ${color === col ? styles.colorSwatchActive : ""}`}
                                        style={{ backgroundColor: col }}
                                        onClick={() => setColor(col)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Icon Picker Grid */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Select Category Icon</label>
                            <div className={styles.iconGrid}>
                                {ICON_OPTIONS.map((item) => (
                                    <div 
                                        key={item.name}
                                        className={`${styles.iconItem} ${icon === item.name ? styles.iconItemActive : ""}`}
                                        onClick={() => setIcon(item.name)}
                                        style={{ color: icon === item.name ? color : undefined }}
                                    >
                                        {item.comp}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={styles.formFooter}>
                        {editingCategory && (
                            <MainButton onClick={handleClearForm} variant="secondary" type="button">
                                Cancel
                            </MainButton>
                        )}
                        <MainButton type="submit" variant="primary">
                            {editingCategory ? "Save Changes" : "Create Category"}
                        </MainButton>
                    </div>
                </form>
            </div>

            {/* SAFE DELETION REASSIGN QUIZZES MODAL */}
            {categoryToDelete && (
                <ModalPortal onClose={() => setCategoryToDelete(null)}>
                <div 
                    className={styles.modalOverlay}
                    onClick={() => setCategoryToDelete(null)} // Close on outside click
                >
                    <div 
                        className={styles.modal} 
                        ref={reassignModalRef}
                        onClick={(e) => e.stopPropagation()} // Prevent bubble
                    >
                        <div className={styles.warningIconCircle}>
                            <FiInfo />
                        </div>
                        <h3>Reassign Quizzes before Deleting</h3>
                        <p className={styles.modalWarningText}>
                            The category <strong>"{categoryToDelete.name}"</strong> is currently associated with <strong>{categoryToDelete.quiz_count}</strong> quiz(zes). Please choose a replacement category to safely reassign them.
                        </p>

                        <div className={styles.formGroup} style={{ width: "100%", textAlign: "left" }}>
                            <label className={styles.label}>Choose Replacement Category</label>
                            <CustomSelect
                                options={otherCategories.map(c => ({ value: c.id, label: c.name }))}
                                value={reassignTargetId}
                                onChange={setReassignTargetId}
                                placeholder="Select Category..."
                            />
                        </div>

                        <div className={styles.modalButtons}>
                            <MainButton onClick={() => setCategoryToDelete(null)} variant="secondary">
                                Cancel
                            </MainButton>
                            <MainButton 
                                onClick={handleReassignAndDelete} 
                                variant="danger"
                                disabled={!reassignTargetId}
                            >
                                Reassign & Delete
                            </MainButton>
                        </div>
                    </div>
                </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default Categories;
