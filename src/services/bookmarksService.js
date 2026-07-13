// local
import { supabase } from "./config/supabaseClient";
import { handleQuery, pageRange } from "./config/serviceHelpers";

export async function getMyBookmarks({ page = 1, pageSize = 12 } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };
  const { from, to } = pageRange(page, pageSize);

  const { data, error, count } = await supabase
    .from('bookmarks')
    .select(`
      id, created_at,
      quiz:quizzes(id, title, description, cover_image_url, difficulty,
        time_limit_minutes, passing_score, question_count, attempt_count, avg_score,
        category:categories(id, name, icon, color))
    `, { count: 'exact' })
    .eq('uid', user.id)
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

export async function isBookmarked(quizId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: false, error: null };

  const { data } = await supabase
    .from('bookmarks').select('id').eq('uid', user.id).eq('quiz_id', quizId).maybeSingle();
  return { data: !!data, error: null };
}

export async function addBookmark(quizId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  return handleQuery(
    supabase
      .from('bookmarks')
      .insert({ uid: user.id, quiz_id: quizId })
      .select(`
        id, created_at,
        quiz:quizzes(id, title, description, cover_image_url, difficulty,
          time_limit_minutes, passing_score, question_count, attempt_count, avg_score,
          category:categories(id, name, icon, color))
      `)
      .single()
  );
}

export async function removeBookmark(quizId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  return handleQuery(
    supabase.from('bookmarks').delete().eq('uid', user.id).eq('quiz_id', quizId)
  );
}

export async function toggleBookmark(quizId) {
  const { data: bookmarked } = await isBookmarked(quizId);
  return bookmarked ? removeBookmark(quizId) : addBookmark(quizId);
}
