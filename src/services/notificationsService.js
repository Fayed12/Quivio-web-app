// local
import { supabase } from "./config/supabaseClient";
import { handleQuery, pageRange } from "./config/serviceHelpers";

export async function getMyNotifications({ page = 1, pageSize = 20, type } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };
  const { from, to } = pageRange(page, pageSize);

  let q = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('uid', user.id);

  if (type && type !== 'all') q = q.eq('type', type);
  q = q.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await q;
  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

export async function getUnreadCount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: 0, error: null };

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('uid', user.id)
    .is('read_at', null);

  if (error) return { data: 0, error: error.message };
  return { data: count, error: null };
}

export async function markAsRead(id) {
  return handleQuery(
    supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).select().single()
  );
}

export async function markAllAsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  return handleQuery(
    supabase.from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('uid', user.id)
      .is('read_at', null)
  );
}

export async function deleteNotification(id) {
  return handleQuery(supabase.from('notifications').delete().eq('id', id));
}

export async function createNotification({ uid, type, title, body, quiz_id, attempt_id }) {
  return handleQuery(
    supabase.from('notifications')
      .insert({ uid, type, title, body, quiz_id, attempt_id })
      .select().single()
  );
}
