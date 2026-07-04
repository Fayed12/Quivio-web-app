// local
import { supabase } from "./config/supabaseClient";
import { handleQuery, pageRange, clean } from "./config/serviceHelpers";

// ─────────────────────────────────────────────
// GET: Instructor's question bank
// Request : { page?, pageSize?, search?, categoryId?, difficulty?, type? }
// Response: { data: questions[] with options, count }
// ─────────────────────────────────────────────
export async function getMyQuestions({
  page = 1,
  pageSize = 20,
  search = '',
  categoryId,
  difficulty,
  type,
} = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { from, to } = pageRange(page, pageSize);

  let query = supabase
    .from('questions')
    .select(`
      id, question_text, question_type, image_url, hint, explanation,
      points, difficulty, tags, is_active, usage_count, created_at,
      question_options(id, option_text, option_order, is_correct),
      category:categories(id, name)
    `, { count: 'exact' })
    .eq('instructor_uid', user.id);

  if (search) query = query.ilike('question_text', `%${search}%`);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (difficulty) query = query.eq('difficulty', difficulty);
  if (type) query = query.eq('question_type', type);

  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

// ─────────────────────────────────────────────
// GET: Single question with options (instructor only)
// Request : id: string
// Response: question row with options[]
// ─────────────────────────────────────────────
export async function getQuestionById(id) {
  return handleQuery(
    supabase
      .from('questions')
      .select(`
        *,
        question_options(id, option_text, option_order, is_correct),
        category:categories(id, name)
      `)
      .eq('id', id)
      .order('option_order', { referencedTable: 'question_options', ascending: true })
      .single()
  );
}

// ─────────────────────────────────────────────
// GET: Questions for a specific quiz (student-safe: no is_correct)
// Request : quizId: string
// Response: questions[] ordered by display_order
// ─────────────────────────────────────────────
export async function getQuestionsByQuiz(quizId) {
  return handleQuery(
    supabase
      .from('quiz_questions')
      .select(`
        id, display_order, points_override,
        question:questions(
          id, question_text, question_type, image_url, hint, points, difficulty, tags,
          question_options(id, option_text, option_order)
        )
      `)
      .eq('quiz_id', quizId)
      .order('display_order', { ascending: true })
  );
}

// ─────────────────────────────────────────────
// POST: Create question + options atomically
// Request : {
//   question_text, question_type, category_id?, image_url?,
//   hint?, explanation?, points?, difficulty?, tags?,
//   options: [{ option_text, option_order, is_correct }]
// }
// Response: created question row with options
// ─────────────────────────────────────────────
export async function createQuestion({ options = [], ...fields }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data: question, error: qErr } = await supabase
    .from('questions')
    .insert(clean({ ...fields, instructor_uid: user.id }))
    .select()
    .single();

  if (qErr) return { data: null, error: qErr.message };

  if (options.length) {
    const { error: optErr } = await supabase
      .from('question_options')
      .insert(options.map(o => ({ ...o, question_id: question.id })));
    if (optErr) return { data: null, error: optErr.message };
  }

  return getQuestionById(question.id);
}

// ─────────────────────────────────────────────
// PATCH: Update question fields (not options)
// Request : { id, question_text?, hint?, explanation?, points?, difficulty?, tags?, image_url? }
// Response: updated question row
// ─────────────────────────────────────────────
export async function updateQuestion({ id, ...fields }) {
  return handleQuery(
    supabase
      .from('questions')
      .update(clean(fields))
      .eq('id', id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// POST: Add option to question
// Request : { question_id, option_text, option_order, is_correct }
// Response: created option row
// ─────────────────────────────────────────────
export async function addOption({ question_id, option_text, option_order, is_correct = false }) {
  return handleQuery(
    supabase
      .from('question_options')
      .insert({ question_id, option_text, option_order, is_correct })
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// PATCH: Update an option
// Request : { id, option_text?, option_order?, is_correct? }
// Response: updated option row
// ─────────────────────────────────────────────
export async function updateOption({ id, ...fields }) {
  return handleQuery(
    supabase
      .from('question_options')
      .update(clean(fields))
      .eq('id', id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// DELETE: Remove an option
// Request : id: string
// Response: { data: null, error }
// ─────────────────────────────────────────────
export async function deleteOption(id) {
  return handleQuery(
    supabase.from('question_options').delete().eq('id', id)
  );
}

// ─────────────────────────────────────────────
// DELETE: Delete a question
// Request : id: string
// Response: { data: null, error } — error if used in published quiz
// ─────────────────────────────────────────────
export async function deleteQuestion(id) {
  const { data: q } = await supabase
    .from('questions')
    .select('usage_count')
    .eq('id', id)
    .single();

  if (q?.usage_count > 0) {
    return { data: null, error: `Question is used in ${q.usage_count} quiz(zes). Remove it from all quizzes first.` };
  }

  return handleQuery(supabase.from('questions').delete().eq('id', id));
}

// ─────────────────────────────────────────────
// POST: Duplicate a question (copies options)
// Request : id: string
// Response: new question row with options
// ─────────────────────────────────────────────
export async function duplicateQuestion(id) {
  const { data: original } = await getQuestionById(id);
  if (!original) return { data: null, error: 'Question not found' };

  const rest = { ...original };
  delete rest.question_options;
  delete rest.id;
  delete rest.created_at;
  delete rest.updated_at;
  delete rest.usage_count;
  delete rest.category;

  const opts = original.question_options || [];
  const cleanOpts = opts.map(o => {
    const copy = { ...o };
    delete copy.id;
    delete copy.question_id;
    return copy;
  });

  return createQuestion({ ...rest, options: cleanOpts });
}

// ─────────────────────────────────────────────
// POST: Link a question to a quiz
// Request : { quiz_id, question_id, display_order, points_override? }
// Response: created quiz_questions row
// ─────────────────────────────────────────────
export async function addQuestionToQuiz({ quiz_id, question_id, display_order, points_override }) {
  return handleQuery(
    supabase
      .from('quiz_questions')
      .insert(clean({ quiz_id, question_id, display_order, points_override }))
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// DELETE: Unlink a question from a quiz
// Request : quizQuestionId: string (quiz_questions.id)
// Response: { data: null, error }
// ─────────────────────────────────────────────
export async function removeQuestionFromQuiz(quizQuestionId) {
  return handleQuery(
    supabase.from('quiz_questions').delete().eq('id', quizQuestionId)
  );
}

// ─────────────────────────────────────────────
// PATCH: Reorder quiz questions
// Request : updates: [{ id, display_order }]
// Response: { data: updated[], error }
// ─────────────────────────────────────────────
export async function reorderQuizQuestions(updates) {
  const results = await Promise.all(
    updates.map(({ id, display_order }) =>
      supabase.from('quiz_questions').update({ display_order }).eq('id', id)
    )
  );
  const err = results.find(r => r.error);
  if (err) return { data: null, error: err.error.message };
  return { data: updates, error: null };
}

// ─────────────────────────────────────────────
// GET: Hardest questions for a quiz (via RPC)
// Request : { quizId, limit? }
// Response: [{ question_id, question_text, accuracy_pct }]
// ─────────────────────────────────────────────
export async function getHardestQuestions(quizId, limit = 5) {
  return handleQuery(
    supabase.rpc('get_hardest_questions', { p_quiz_id: quizId, p_limit: limit })
  );
}
