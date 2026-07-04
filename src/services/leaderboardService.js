// local
import { supabase } from "./config/supabaseClient";
import { handleQuery, pageRange } from "./config/serviceHelpers";

export async function getGlobalLeaderboard({ page = 1, pageSize = 25 } = {}) {
  const { from, to } = pageRange(page, pageSize);
  const { data, error, count } = await supabase
    .from('leaderboard')
    .select(`
      uid, global_score, global_rank, total_attempts, avg_score, quizzes_passed, current_streak,
      profile:profiles!uid(uid, full_name, avatar_url, level)
    `, { count: 'exact' })
    .range(from, to)
    .order('global_score', { ascending: false });
  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

export async function getMonthlyLeaderboard({ page = 1, pageSize = 25 } = {}) {
  const { from, to } = pageRange(page, pageSize);
  const monthKey = new Date().toISOString().slice(0, 7);
  const { data, error, count } = await supabase
    .from('leaderboard')
    .select(`
      uid, monthly_score, monthly_rank, total_attempts, avg_score,
      profile:profiles!uid(uid, full_name, avatar_url, level)
    `, { count: 'exact' })
    .eq('month_key', monthKey)
    .range(from, to)
    .order('monthly_score', { ascending: false });
  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

export async function getCategoryLeaderboard(categoryId, { page = 1, pageSize = 25 } = {}) {
  const { from, to } = pageRange(page, pageSize);
  const { data, error, count } = await supabase
    .from('category_leaderboard')
    .select(`
      uid, score, rank, attempt_count, avg_score,
      profile:profiles!uid(uid, full_name, avatar_url, level)
    `, { count: 'exact' })
    .eq('category_id', categoryId)
    .range(from, to)
    .order('score', { ascending: false });
  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

export async function getMyLeaderboardPosition() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };
  return handleQuery(
    supabase.from('leaderboard').select('*').eq('uid', user.id).maybeSingle()
  );
}
