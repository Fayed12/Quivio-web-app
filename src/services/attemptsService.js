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
      attempt_answers(question_id, selected_option_id, time_spent_secs)
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
        *, quiz_id,
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
      id, quiz_id, status, started_at, submitted_at, score, passed,
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
// POST/PATCH: Batch-save ALL answers before submission
// Request : { attempt_id, answers: { [question_id]: selected_option_id } }
// Response: upserted rows
// ─────────────────────────────────────────────
export async function saveAllAnswers({ attempt_id, answers, timeSpent }) {
  const now = new Date().toISOString();
  const rows = Object.entries(answers)
    .filter(([qId, optId]) => qId && optId)
    .map(([question_id, selected_option_id]) => ({
      attempt_id,
      question_id,
      selected_option_id,
      time_spent_secs: timeSpent?.[question_id] ?? 0,
      answered_at: now,
    }));

  if (rows.length === 0) return { data: [], error: null };

  return handleQuery(
    supabase
      .from('attempt_answers')
      .upsert(rows, { onConflict: 'attempt_id,question_id' })
      .select()
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
// Grade attempt in database with strict total quiz questions denominator
// ─────────────────────────────────────────────
export async function gradeAttemptInDatabase(attemptId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  // 1. Fetch attempt + quiz details + all quiz questions + correct options
  const { data: attempt, error: attemptErr } = await supabase
    .from('attempts')
    .select(`
      id, uid, quiz_id, status, started_at, time_spent_secs,
      quiz:quizzes (
        id, passing_score, xp_reward,
        quiz_questions (
          question_id,
          question:questions (
            id,
            question_options (id, is_correct)
          )
        )
      )
    `)
    .eq('id', attemptId)
    .single();

  if (attemptErr || !attempt) {
    return { data: null, error: attemptErr?.message || 'Attempt not found' };
  }

  const allQuizQuestions = (attempt.quiz?.quiz_questions || [])
    .map(qq => qq.question)
    .filter(q => q && q.id);

  const totalQuizQuestions = allQuizQuestions.length || 1;

  // 2. Fetch existing attempt_answers
  const { data: savedAnswers } = await supabase
    .from('attempt_answers')
    .select('question_id, selected_option_id, time_spent_secs')
    .eq('attempt_id', attemptId);

  const savedMap = {};
  (savedAnswers || []).forEach(a => {
    savedMap[a.question_id] = a;
  });

  let correctCount = 0;
  const answerUpserts = [];

  // 3. Grade EVERY question in the quiz (unanswered questions count as 0/false)
  allQuizQuestions.forEach(q => {
    const saved = savedMap[q.id];
    const correctOption = (q.question_options || []).find(o => o.is_correct);
    const selectedOptionId = saved?.selected_option_id || null;

    const isCorrect = !!(
      selectedOptionId &&
      correctOption &&
      (String(selectedOptionId) === String(correctOption.id) ||
       String(selectedOptionId).trim().toLowerCase() === String(correctOption.option_text || '').trim().toLowerCase())
    );

    if (isCorrect) {
      correctCount += 1;
    }

    answerUpserts.push({
      attempt_id: attemptId,
      question_id: q.id,
      selected_option_id: selectedOptionId,
      is_correct: isCorrect,
      points_awarded: isCorrect ? 1 : 0,
      time_spent_secs: saved?.time_spent_secs || 0,
      answered_at: new Date().toISOString(),
    });
  });

  // Upsert all graded answer rows so unanswered questions are explicitly recorded as incorrect
  if (answerUpserts.length > 0) {
    await supabase
      .from('attempt_answers')
      .upsert(answerUpserts, { onConflict: 'attempt_id,question_id' });
  }

  // 4. Calculate metrics relative to ALL quiz questions
  const wrongCount = totalQuizQuestions - correctCount;
  const scorePercentage = Math.round((correctCount / totalQuizQuestions) * 100);
  const passingScore = attempt.quiz?.passing_score ?? 70;
  const passed = scorePercentage >= passingScore;
  const xpEarned = passed ? (attempt.quiz?.xp_reward || 50) : 0;

  // 5. Update attempt table
  const { data: updatedAttempt, error: updateErr } = await supabase
    .from('attempts')
    .update({
      status: 'completed',
      submitted_at: new Date().toISOString(),
      score: scorePercentage,
      passed: passed,
      correct_count: correctCount,
      wrong_count: wrongCount,
      total_questions: totalQuizQuestions,
      xp_earned: xpEarned
    })
    .eq('id', attemptId)
    .select()
    .single();

  if (updateErr) {
    return { data: null, error: updateErr.message };
  }

  // 6. Issue certificate if passed
  if (passed) {
    try {
      const { data: existingCert } = await supabase
        .from('certificates')
        .select('id')
        .eq('uid', user.id)
        .eq('quiz_id', attempt.quiz_id)
        .maybeSingle();

      if (!existingCert) {
        const certCode = `CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
        await supabase
          .from('certificates')
          .insert({
            uid: user.id,
            quiz_id: attempt.quiz_id,
            attempt_id: attemptId,
            score: scorePercentage,
            certificate_code: certCode,
            issued_at: new Date().toISOString()
          });
      }
    } catch (certErr) {
      console.warn("Certificate creation notice:", certErr);
    }
  }

  return {
    data: {
      id: attemptId,
      score: scorePercentage,
      passed,
      correct_count: correctCount,
      wrong_count: wrongCount,
      total_questions: totalQuizQuestions,
      xp_earned: xpEarned
    },
    error: null
  };
}

// ─────────────────────────────────────────────
// POST: Submit attempt — calls Edge Function with client DB scoring fallback
// Request : attemptId: string
// Response: { score, passed, correct_count }
// ─────────────────────────────────────────────
export async function submitAttempt(attemptId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: null, error: 'Not authenticated' };

  try {
    const res = await fetch(EFN('submit-quiz'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ attempt_id: attemptId }),
    });

    if (res.ok) {
      const json = await res.json();
      return { data: json, error: null };
    }
  } catch (e) {
    console.warn("Edge function unavailable, executing client DB scoring fallback:", e);
  }

  // Robust Client-side Database Scoring Fallback:
  return gradeAttemptInDatabase(attemptId);
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
