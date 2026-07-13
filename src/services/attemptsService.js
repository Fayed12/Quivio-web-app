// local
import { supabase } from "./config/supabaseClient";
import { handleQuery, pageRange, clean } from "./config/serviceHelpers";

const EFN = (name) => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;

// ─────────────────────────────────────────────
// POST: Start a new attempt
// Request : { quiz_id }
// Response: created attempt row
// ─────────────────────────────────────────────
export async function startAttempt(quizId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  // Check attempt limit
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('max_attempts, time_limit_minutes')
    .eq('id', quizId)
    .single();

  if (quiz?.max_attempts) {
    const { count } = await supabase
      .from('attempts')
      .select('id', { count: 'exact', head: true })
      .eq('uid', user.id)
      .eq('quiz_id', quizId)
      .eq('status', 'completed');

    if (count >= quiz.max_attempts) {
      return { data: null, error: 'Maximum attempts reached for this quiz.' };
    }
  }

  return handleQuery(
    supabase
      .from('attempts')
      .insert({
        uid: user.id,
        quiz_id: quizId,
        status: 'in_progress',
        time_remaining_secs: quiz?.time_limit_minutes ? quiz.time_limit_minutes * 60 : null,
      })
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// GET: Active (in_progress) attempt for a quiz
// Request : quizId: string
// Response: attempt row or null
// ─────────────────────────────────────────────
export async function getActiveAttempt(quizId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('attempts')
    .select(`
      *,
      attempt_answers(question_id, selected_option_id)
    `)
    .eq('uid', user.id)
    .eq('quiz_id', quizId)
    .eq('status', 'in_progress')
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─────────────────────────────────────────────
// GET: Specific attempt by ID for quiz-taking (with answers)
// Request : attemptId: string
// Response: attempt row with answers or null
// ─────────────────────────────────────────────
export async function getAttemptForTaking(attemptId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('attempts')
    .select(`
      *,
      attempt_answers(question_id, selected_option_id)
    `)
    .eq('id', attemptId)
    .eq('uid', user.id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─────────────────────────────────────────────
// GET: Single attempt by id (with answers)
// Request : id: string
// Response: attempt row with answers + question details
// ─────────────────────────────────────────────
export async function getAttemptById(id) {
  return handleQuery(
    supabase
      .from('attempts')
      .select(`
        *,
        quiz:quizzes(id, title, passing_score, time_limit_minutes),
        attempt_answers(
          id, question_id, selected_option_id, is_correct, points_awarded, time_spent_secs,
          question:questions(id, question_text, question_type, explanation, image_url,
            question_options(id, option_text, option_order, is_correct)
          )
        )
      `)
      .eq('id', id)
      .single()
  );
}

// ─────────────────────────────────────────────
// GET: Student's attempt history
// Request : { page?, pageSize?, quizId?, status?, sortBy? }
// Response: { data: attempts[], count }
// ─────────────────────────────────────────────
export async function getMyAttempts({
  page = 1,
  pageSize = 10,
  quizId,
  status,
  sortBy = 'started_at',
} = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { from, to } = pageRange(page, pageSize);

  let query = supabase
    .from('attempts')
    .select(`
      id, status, started_at, submitted_at, score, passed,
      correct_count, wrong_count, total_questions, time_spent_secs, xp_earned,
      quiz:quizzes(id, title, difficulty, category:categories(id, name))
    `, { count: 'exact' })
    .eq('uid', user.id);

  if (quizId) query = query.eq('quiz_id', quizId);
  if (status) query = query.eq('status', status);

  query = query.range(from, to).order(sortBy, { ascending: false });

  const { data, error, count } = await query;
  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

// ─────────────────────────────────────────────
// GET: All attempts for a quiz (instructor view)
// Request : { quizId, page?, pageSize? }
// Response: { data: attempts[] with student profiles, count }
// ─────────────────────────────────────────────
export async function getAttemptsByQuiz({ quizId, page = 1, pageSize = 20 } = {}) {
  const { from, to } = pageRange(page, pageSize);

  const { data, error, count } = await supabase
    .from('attempts')
    .select(`
      id, status, started_at, submitted_at, score, passed,
      correct_count, total_questions, time_spent_secs,
      profile:profiles!uid(uid, full_name, email, avatar_url)
    `, { count: 'exact' })
    .eq('quiz_id', quizId)
    .eq('status', 'completed')
    .range(from, to)
    .order('submitted_at', { ascending: false });

  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

// ─────────────────────────────────────────────
// GET: All attempts for a student (instructor view)
// Request : { studentUid, page?, pageSize? }
// Response: { data: attempts[], count }
// ─────────────────────────────────────────────
export async function getAttemptsByStudent({ studentUid, page = 1, pageSize = 10 } = {}) {
  const { from, to } = pageRange(page, pageSize);

  const { data, error, count } = await supabase
    .from('attempts')
    .select(`
      id, status, started_at, submitted_at, score, passed, time_spent_secs,
      quiz:quizzes(id, title)
    `, { count: 'exact' })
    .eq('uid', studentUid)
    .eq('status', 'completed')
    .range(from, to)
    .order('submitted_at', { ascending: false });

  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

// ─────────────────────────────────────────────
// POST/PATCH: Save (upsert) a single answer — auto-save every 2s
// Request : { attempt_id, question_id, selected_option_id, time_spent_secs? }
// Response: upserted attempt_answers row
// ─────────────────────────────────────────────
export async function saveAnswer({ attempt_id, question_id, selected_option_id, time_spent_secs }) {
  return handleQuery(
    supabase
      .from('attempt_answers')
      .upsert(
        clean({ attempt_id, question_id, selected_option_id, time_spent_secs, answered_at: new Date().toISOString() }),
        { onConflict: 'attempt_id,question_id' }
      )
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// PATCH: Update progress (current question + time remaining)
// Request : { id, current_question_order, time_remaining_secs }
// Response: updated attempt row
// ─────────────────────────────────────────────
export async function updateAttemptProgress({ id, current_question_order, time_remaining_secs }) {
  return handleQuery(
    supabase
      .from('attempts')
      .update(clean({ current_question_order, time_remaining_secs }))
      .eq('id', id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// PATCH: Toggle flag on a question
// Request : { attemptId, questionId, flagged: boolean }
// Response: updated attempt row
// ─────────────────────────────────────────────
export async function toggleFlagQuestion({ attemptId, questionId, flagged }) {
  const { data: attempt } = await supabase
    .from('attempts')
    .select('flagged_questions')
    .eq('id', attemptId)
    .single();

  const current = (attempt?.flagged_questions ?? []).filter(id => id != null);
  const updated = flagged
    ? [...new Set([...current, questionId].filter(id => id != null))]
    : current.filter(id => id !== questionId);

  return handleQuery(
    supabase
      .from('attempts')
      .update({ flagged_questions: updated })
      .eq('id', attemptId)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// POST: Submit attempt — calls Edge Function for server-side scoring
// Request : attemptId: string
// Response: { score, passed, correct_count }
// ─────────────────────────────────────────────
export async function submitAttempt(attemptId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: null, error: 'Not authenticated' };

  const res = await fetch(EFN('submit-quiz'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ attempt_id: attemptId }),
  });

  const json = await res.json();
  if (!res.ok) return { data: null, error: json.error ?? 'Submission failed' };
  return { data: json, error: null };
}

// ─────────────────────────────────────────────
// PATCH: Abandon attempt
// Request : id: string
// Response: updated attempt row
// ─────────────────────────────────────────────
export async function abandonAttempt(id) {
  return handleQuery(
    supabase
      .from('attempts')
      .update({ status: 'abandoned' })
      .eq('id', id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// GET: Student stats via RPC (for dashboard)
// Request : none (uses own uid)
// Response: { total_attempts, avg_score, best_score, pass_rate, total_quizzes }
// ─────────────────────────────────────────────
export async function getMyStats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  return handleQuery(
    supabase.rpc('get_student_stats', { p_uid: user.id })
  );
}
