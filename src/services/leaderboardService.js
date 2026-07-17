// local
import { supabase } from "./config/supabaseClient";
import { handleQuery, pageRange } from "./config/serviceHelpers";

export async function getGlobalLeaderboard({ page = 1, pageSize = 25 } = {}) {
  const { from, to } = pageRange(page, pageSize);
  const { data, error, count } = await supabase
    .from('profiles')
    .select(`
      uid, full_name, avatar_url, level, xp, streak,
      leaderboard:leaderboard!uid(
        global_score, global_rank, total_attempts, avg_score, quizzes_passed, current_streak
      ),
      attempts:attempts!uid(score, status, passed)
    `, { count: 'exact' })
    .eq('role', 'student')
    .eq('is_active', true)
    .range(from, to)
    .order('xp', { ascending: false });

  if (error) return { data: null, error: error.message, count: 0 };

  const mappedData = (data ?? []).map(item => {
    const completedAttempts = (item.attempts ?? []).filter(a => a.status === 'completed');
    const totalAttempts = completedAttempts.length;
    const quizzesPassed = completedAttempts.filter(a => a.passed === true).length;
    const avgScore = totalAttempts > 0
      ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / totalAttempts)
      : 0;

    return {
      uid: item.uid,
      global_score: item.leaderboard?.global_score ?? item.xp ?? 0,
      global_rank: item.leaderboard?.global_rank,
      total_attempts: totalAttempts,
      avg_score: avgScore,
      quizzes_passed: quizzesPassed,
      current_streak: item.leaderboard?.current_streak ?? item.streak ?? 0,
      profile: {
        uid: item.uid,
        full_name: item.full_name,
        avatar_url: item.avatar_url,
        level: item.level,
        xp: item.xp,
        streak: item.streak
      }
    };
  });

  return { data: mappedData, error: null, count };
}

export async function getMonthlyLeaderboard({ page = 1, pageSize = 25 } = {}) {
  const { from, to } = pageRange(page, pageSize);
  const monthKey = new Date().toISOString().slice(0, 7);
  const { data, error, count } = await supabase
    .from('profiles')
    .select(`
      uid, full_name, avatar_url, level, xp, streak,
      leaderboard:leaderboard!uid(
        monthly_score, monthly_rank, total_attempts, avg_score, current_streak
      ),
      attempts:attempts!uid(score, status, passed, submitted_at)
    `, { count: 'exact' })
    .eq('role', 'student')
    .eq('is_active', true)
    .eq('leaderboard.month_key', monthKey)
    .range(from, to)
    .order('leaderboard(monthly_score)', { ascending: false, nullsFirst: false });

  if (error) return { data: null, error: error.message, count: 0 };

  const mappedData = (data ?? []).map(item => {
    const completedAttempts = (item.attempts ?? []).filter(a => a.status === 'completed');
    const monthlyAttempts = completedAttempts.filter(a => a.submitted_at && a.submitted_at.startsWith(monthKey));
    const totalAttempts = monthlyAttempts.length;
    const avgScore = totalAttempts > 0
      ? Math.round(monthlyAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / totalAttempts)
      : 0;
    const quizzesPassed = monthlyAttempts.filter(a => a.passed === true).length;

    return {
      uid: item.uid,
      monthly_score: item.leaderboard?.monthly_score ?? 0,
      monthly_rank: item.leaderboard?.monthly_rank,
      total_attempts: totalAttempts,
      avg_score: avgScore,
      quizzes_passed: quizzesPassed,
      current_streak: item.leaderboard?.current_streak ?? item.streak ?? 0,
      profile: {
        uid: item.uid,
        full_name: item.full_name,
        avatar_url: item.avatar_url,
        level: item.level,
        xp: item.xp,
        streak: item.streak
      }
    };
  });

  return { data: mappedData, error: null, count };
}

export async function getCategoryLeaderboard(categoryId, { page = 1, pageSize = 25 } = {}) {
  const { from, to } = pageRange(page, pageSize);
  
  // Try querying the category_leaderboard table first
  const { data, error, count } = await supabase
    .from('category_leaderboard')
    .select(`
      uid, score, rank, attempt_count, avg_score,
      profile:profiles!uid(uid, full_name, avatar_url, level, xp, streak)
    `, { count: 'exact' })
    .eq('category_id', categoryId)
    .range(from, to)
    .order('score', { ascending: false });

  if (!error && data && data.length > 0) {
    return { data, error: null, count };
  }

  // Fallback: If category_leaderboard table is empty, compute it dynamically from profiles and attempts
  const { data: profilesWithAttempts, error: attemptsError } = await supabase
    .from('profiles')
    .select(`
      uid, full_name, avatar_url, level, xp, streak,
      attempts:attempts!uid(
        score, xp_earned, status, passed,
        quiz:quizzes!quiz_id(id, category_id)
      )
    `)
    .eq('role', 'student')
    .eq('is_active', true);

  if (attemptsError || !profilesWithAttempts) {
    return { data: [], error: attemptsError ? attemptsError.message : null, count: 0 };
  }

  // Filter attempts by selected category and sum up their xp_earned
  const rankings = profilesWithAttempts.map(item => {
    const categoryAttempts = (item.attempts ?? []).filter(
      a => a.status === 'completed' && a.quiz && a.quiz.category_id === categoryId
    );

    const totalCategoryXp = categoryAttempts.reduce((sum, a) => sum + (a.xp_earned ?? 0), 0);
    const avgScore = categoryAttempts.length > 0 
      ? Math.round(categoryAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / categoryAttempts.length)
      : 0;
    const quizzesPassed = categoryAttempts.filter(a => a.passed === true).length;

    return {
      uid: item.uid,
      score: totalCategoryXp, // Category XP
      avg_score: avgScore,
      attempt_count: categoryAttempts.length,
      quizzes_passed: quizzesPassed,
      profile: {
        uid: item.uid,
        full_name: item.full_name,
        avatar_url: item.avatar_url,
        level: item.level,
        xp: item.xp,
        streak: item.streak
      }
    };
  });

  // Sort by score descending
  rankings.sort((a, b) => b.score - a.score);

  // Assign ranks
  rankings.forEach((item, index) => {
    item.rank = index + 1;
  });

  // Paginate in memory
  const paginatedData = rankings.slice(from, to + 1);

  return { data: paginatedData, error: null, count: rankings.length };
}

export async function getMyLeaderboardPosition() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };
  return handleQuery(
    supabase.from('leaderboard').select('*').eq('uid', user.id).maybeSingle()
  );
}


