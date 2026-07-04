// local
import { supabase } from "./config/supabaseClient";
import { handleQuery, clean } from "./config/serviceHelpers";

// ─────────────────────────────────────────────
// GET: All active categories (for students / public use)
// Request : none
// Response: categories[]
// ─────────────────────────────────────────────
export async function getCategories() {
  return handleQuery(
    supabase
      .from('categories')
      .select('id, name, description, icon, color, slug, quiz_count')
      .eq('is_active', true)
      .order('name', { ascending: true })
  );
}

// ─────────────────────────────────────────────
// GET: Instructor's own categories (all statuses)
// Request : none
// Response: categories[] (all including inactive)
// ─────────────────────────────────────────────
export async function getMyCategories() {
  return handleQuery(
    supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
  );
}

// ─────────────────────────────────────────────
// GET: Single category by id
// Request : id: string
// Response: single category row
// ─────────────────────────────────────────────
export async function getCategoryById(id) {
  return handleQuery(
    supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
  );
}

// ─────────────────────────────────────────────
// POST: Create category
// Request : { name, description?, icon?, color?, slug? }
// Response: created category row
// ─────────────────────────────────────────────
export async function createCategory({ name, description, icon, color, slug }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const autoSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return handleQuery(
    supabase
      .from('categories')
      .insert(clean({ name, description, icon, color, slug: autoSlug, created_by: user.id }))
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// PATCH: Update category
// Request : { id, name?, description?, icon?, color?, slug? }
// Response: updated category row
// ─────────────────────────────────────────────
export async function updateCategory({ id, ...fields }) {
  return handleQuery(
    supabase
      .from('categories')
      .update(clean(fields))
      .eq('id', id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// PATCH: Toggle is_active
// Request : { id, isActive: boolean }
// Response: updated category row
// ─────────────────────────────────────────────
export async function toggleCategoryActive(id, isActive) {
  return handleQuery(
    supabase
      .from('categories')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// DELETE: Delete category
// Request : id: string
// Response: { data: null, error } — error if quiz_count > 0
// ─────────────────────────────────────────────
export async function deleteCategory(id) {
  // Guard: check quiz_count before deleting
  const { data: cat, error: fetchErr } = await supabase
    .from('categories')
    .select('quiz_count')
    .eq('id', id)
    .single();

  if (fetchErr) return { data: null, error: fetchErr.message };
  if (cat.quiz_count > 0) {
    return {
      data: null,
      error: `Cannot delete: ${cat.quiz_count} quiz(zes) are using this category. Reassign them first.`,
    };
  }

  return handleQuery(
    supabase.from('categories').delete().eq('id', id)
  );
}
