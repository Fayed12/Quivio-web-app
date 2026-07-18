// local
import { supabase } from "./config/supabaseClient";
import { handleQuery, pageRange, clean } from "./config/serviceHelpers";

// ─────────────────────────────────────────────
// GET: Published public quizzes (student discovery)
// Request : { page?, pageSize?, search?, categoryId?, difficulty?, sortBy? }
// Response: { data: quizzes[], count }
// ─────────────────────────────────────────────
export async function getPublishedQuizzes({
  page = 1,
  pageSize = 12,
  search = '',
  categoryId,
  difficulty,
  sortBy = 'published_at',
} = {}) {
  const { from, to } = pageRange(page, pageSize);

  let query = supabase
    .from('quizzes')
    .select(`
      id, title, description, cover_image_url, tags, difficulty,
      time_limit_minutes, passing_score, max_attempts, question_count,
      attempt_count, avg_score, pass_rate, published_at,
      category:categories(id, name, icon, color)
    `, { count: 'exact' })
    .eq('status', 'published')
    .eq('visibility', 'public');

  if (search) query = query.textSearch('title', search, { type: 'websearch' });
  if (categoryId) query = query.eq('category_id', categoryId);
  if (difficulty) query = query.eq('difficulty', difficulty);

  const orderMap = {
    published_at: 'published_at',
    attempt_count: 'attempt_count',
    avg_score: 'avg_score',
    title: 'title',
  };
  query = query
    .range(from, to)
    .order(orderMap[sortBy] ?? 'published_at', { ascending: sortBy === 'title' });

  const { data, error, count } = await query;
  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

// ─────────────────────────────────────────────
// GET: Assigned quizzes for current student
// Request : { page?, pageSize? }
// Response: { data: quizzes with assignment info[], count }
// ─────────────────────────────────────────────
export async function getAssignedQuizzes({ page = 1, pageSize = 12 } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { from, to } = pageRange(page, pageSize);

  const { data, error, count } = await supabase
    .from('assignments')
    .select(`
      id, due_date, attempt_limit_override, note, created_at,
      quiz:quizzes(
        id, title, description, cover_image_url, difficulty,
        time_limit_minutes, passing_score, question_count, status,
        attempt_count, avg_score, published_at, created_at,
        category:categories(id, name, icon, color)
      )
    `, { count: 'exact' })
    .or(`student_uid.eq.${user.id}`)
    .eq('is_active', true)
    .eq('quiz.status', 'published')
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

// ─────────────────────────────────────────────
// GET: Single quiz by id with questions (no correct answers exposed)
// Request : id: string
// Response: quiz with quiz_questions and questions (no is_correct)
// ─────────────────────────────────────────────
export async function getQuizById(id) {
  return handleQuery(
    supabase
      .from('quizzes')
      .select(`
        *,
        category:categories(id, name, icon, color),
        instructor:profiles!instructor_uid(uid, full_name, avatar_url),
        quiz_questions(
          id, display_order, points_override,
          question:questions(
            id, question_text, question_type, image_url, hint, points, difficulty, tags,
            question_options(id, option_text, option_order)
          )
        )
      `)
      .eq('id', id)
      .order('display_order', { referencedTable: 'quiz_questions', ascending: true })
      .single()
  );
}

// ─────────────────────────────────────────────
// GET: Instructor's own quizzes
// Request : { page?, pageSize?, search?, status?, categoryId?, sortBy? }
// Response: { data: quizzes[], count }
// ─────────────────────────────────────────────
export async function getMyQuizzes({
  page = 1,
  pageSize = 15,
  search = '',
  status,
  categoryId,
  sortBy = 'created_at',
} = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { from, to } = pageRange(page, pageSize);

  let query = supabase
    .from('quizzes')
    .select(`
      id, title, status, visibility, difficulty, time_limit_minutes,
      passing_score, question_count, attempt_count, avg_score, pass_rate,
      published_at, created_at, updated_at,
      category:categories(id, name, icon, color)
    `, { count: 'exact' })
    .eq('instructor_uid', user.id);

  if (status) query = query.eq('status', status);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (search) query = query.ilike('title', `%${search}%`);

  query = query.range(from, to).order(sortBy, { ascending: false });

  const { data, error, count } = await query;
  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

// ─────────────────────────────────────────────
// POST: Create quiz (as draft)
// Request : { title, description?, category_id?, difficulty?, cover_image_url?,
//             tags?, time_limit_minutes?, passing_score?, max_attempts?,
//             shuffle_questions?, shuffle_answers?, visibility?,
//             available_from?, available_until?, certificates_enabled?, show_results? }
// Response: created quiz row
// ─────────────────────────────────────────────
export async function createQuiz(fields) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  return handleQuery(
    supabase
      .from('quizzes')
      .insert(clean({ ...fields, instructor_uid: user.id, status: 'draft' }))
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// PATCH: Update quiz
// Request : { id, ...fields }
// Response: updated quiz row
// ─────────────────────────────────────────────
export async function updateQuiz({ id, ...fields }) {
  return handleQuery(
    supabase
      .from('quizzes')
      .update(clean(fields))
      .eq('id', id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// PATCH: Publish quiz
// Request : id: string
// Response: updated quiz row
// ─────────────────────────────────────────────
export async function publishQuiz(id) {
  return handleQuery(
    supabase
      .from('quizzes')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// PATCH: Unpublish quiz (back to draft)
// Request : id: string
// Response: updated quiz row
// ─────────────────────────────────────────────
export async function unpublishQuiz(id) {
  return handleQuery(
    supabase
      .from('quizzes')
      .update({ status: 'draft', published_at: null })
      .eq('id', id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// PATCH: Archive quiz
// Request : id: string
// Response: updated quiz row
// ─────────────────────────────────────────────
export async function archiveQuiz(id) {
  return handleQuery(
    supabase
      .from('quizzes')
      .update({ status: 'archived' })
      .eq('id', id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// POST: Duplicate quiz (deep copy: quiz + quiz_questions + options)
// Request : id: string
// Response: new quiz row
// ─────────────────────────────────────────────
export async function duplicateQuiz(id) {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { data: null, error: 'Not authenticated' };

  // 1. Fetch original quiz
  const { data: original, error: fetchErr } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr) return { data: null, error: fetchErr.message };

  // 2. Create copy
  const rest = { ...original };
  delete rest.id;
  delete rest.published_at;
  delete rest.created_at;
  delete rest.updated_at;
  delete rest.attempt_count;
  delete rest.avg_score;
  delete rest.pass_rate;
  delete rest.question_count;

  const { data: newQuiz, error: insertErr } = await supabase
    .from('quizzes')
    .insert({ ...rest, title: `Copy of ${original.title}`, status: 'draft', published_at: null })
    .select()
    .single();
  if (insertErr) return { data: null, error: insertErr.message };

  // 3. Copy quiz_questions links
  const { data: qs } = await supabase
    .from('quiz_questions')
    .select('question_id, display_order, points_override')
    .eq('quiz_id', id);

  if (qs?.length) {
    await supabase.from('quiz_questions').insert(
      qs.map(q => ({ ...q, quiz_id: newQuiz.id }))
    );
  }

  return { data: newQuiz, error: null };
}

// ─────────────────────────────────────────────
// DELETE: Delete quiz
// Request : id: string
// Response: { data: null, error }
// ─────────────────────────────────────────────
export async function deleteQuiz(id) {
  return handleQuery(
    supabase.from('quizzes').delete().eq('id', id)
  );
}

// ─────────────────────────────────────────────
// GET: Quiz aggregate stats (via RPC)
// Request : quizId: string
// Response: { total_attempts, avg_score, pass_rate, avg_time_secs, completion_rate }
// ─────────────────────────────────────────────
export async function getQuizStats(quizId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  return handleQuery(
    supabase.rpc('get_quiz_analytics', {
      p_quiz_id: quizId,
      p_instructor_uid: user.id,
    })
  );
}
