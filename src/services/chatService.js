// supabase
import { supabase } from "./config/supabaseClient";

/* -----------------------------------------------------------------------
 * CONTACTS: who am I allowed to chat with?
 * Uses the existing instructor_students table — no new relationship table
 * needed, and profiles is never touched.
 * ---------------------------------------------------------------------*/

/**
 * Returns the list of people the current user is allowed to chat with.
 * - If the user is an instructor -> returns their students.
 * - If the user is a student -> returns their instructor(s).
 */
export async function getChatContacts(currentUid, role) {
  if (role === 'instructor') {
    const { data, error } = await supabase
      .from('instructor_students')
      .select(
        `
        student_uid,
        profiles:student_uid ( uid, full_name, email, avatar_url, is_active )
      `
      )
      .eq('instructor_uid', currentUid);

    if (error) throw error;
    return (data || []).map((row) => row.profiles).filter(Boolean);
  }

  const { data, error } = await supabase
    .from('instructor_students')
    .select(
      `
      instructor_uid,
      profiles:instructor_uid ( uid, full_name, email, avatar_url, is_active )
    `
    )
    .eq('student_uid', currentUid);

  if (error) throw error;
  return (data || []).map((row) => row.profiles).filter(Boolean);
}

/* -----------------------------------------------------------------------
 * CONVERSATIONS
 * ---------------------------------------------------------------------*/

/**
 * Gets an existing conversation between two users, or creates one.
 * RLS on insert already enforces the instructor_students link server-side,
 * so this is safe to call directly from the client.
 */
export async function getOrCreateConversation(currentUid, otherUid) {
  // Try to find it first (works regardless of column order)
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('*')
    .or(
      `and(user1_uid.eq.${currentUid},user2_uid.eq.${otherUid}),and(user1_uid.eq.${otherUid},user2_uid.eq.${currentUid})`
    )
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing;

  const { data: created, error: createError } = await supabase
    .from('conversations')
    .insert({ user1_uid: currentUid, user2_uid: otherUid })
    .select('*')
    .single();

  if (createError) throw createError;
  return created;
}

/**
 * Lists all conversations for the current user, with the "other participant"
 * profile info attached, ordered by most recent activity.
 */
export async function listConversations(currentUid) {
  const { data, error } = await supabase
    .from('conversations')
    .select(
      `
      id,
      user1_uid,
      user2_uid,
      last_message,
      last_message_at,
      created_at,
      user1:user1_uid ( uid, full_name, avatar_url, role ),
      user2:user2_uid ( uid, full_name, avatar_url, role )
    `
    )
    .or(`user1_uid.eq.${currentUid},user2_uid.eq.${currentUid}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;

  // Flatten so the UI always deals with "otherUser" instead of user1/user2
  return (data || []).map((c) => {
    const otherUser = c.user1_uid === currentUid ? c.user2 : c.user1;
    return {
      id: c.id,
      lastMessage: c.last_message,
      lastMessageAt: c.last_message_at,
      createdAt: c.created_at,
      otherUser,
    };
  });
}

/* -----------------------------------------------------------------------
 * MESSAGES
 * ---------------------------------------------------------------------*/

const PAGE_SIZE = 30;

/**
 * Loads a page of messages for a conversation, oldest -> newest.
 * Pass `beforeId` (a message id) to paginate further back in history.
 */
export async function listMessages(conversationId, { beforeCreatedAt } = {}) {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (beforeCreatedAt) {
    query = query.lt('created_at', beforeCreatedAt);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Return in chronological order for rendering
  return (data || []).reverse();
}

/**
 * Sends a message. RLS enforces sender_uid === auth.uid() and that the
 * sender is a participant of the conversation.
 */
export async function sendMessage(conversationId, senderUid, content) {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Message content cannot be empty');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_uid: senderUid,
      content: trimmed,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Marks all messages in a conversation NOT sent by the current user as read.
 */
export async function markConversationRead(conversationId, currentUid) {
  const { data, error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_uid', currentUid)
    .is('read_at', null)
    .select('id');

  if (error) throw error;
  return data;
}

/**
 * Counts unread messages across all conversations for a badge/notification icon.
 * Two-step query (get my conversation ids, then count unread within them) —
 * more reliable across supabase-js versions than a nested OR filter.
 */
export async function getUnreadCount(currentUid) {
  const { data: convos, error: convoError } = await supabase
    .from('conversations')
    .select('id')
    .or(`user1_uid.eq.${currentUid},user2_uid.eq.${currentUid}`);

  if (convoError) throw convoError;
  const convoIds = (convos || []).map((c) => c.id);
  if (convoIds.length === 0) return 0;

  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', convoIds)
    .neq('sender_uid', currentUid)
    .is('read_at', null);

  if (error) throw error;
  return count || 0;
}

/* -----------------------------------------------------------------------
 * REALTIME SUBSCRIPTIONS
 * ---------------------------------------------------------------------*/

/**
 * Subscribes to new/updated messages within a single open conversation.
 * Call the returned function to unsubscribe (e.g. on unmount / conversation switch).
 */
export function subscribeToMessages(conversationId, { onInsert, onUpdate }) {
  const channel = supabase
    .channel(`messages:conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onInsert && onInsert(payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onUpdate && onUpdate(payload.new)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to ANY new message addressed to/from the current user, useful
 * for a global "conversations list" screen or unread badge, without needing
 * to open every conversation channel individually.
 * Note: RLS still applies — the client will only ever receive rows it's
 * allowed to see.
 */
export function subscribeToInbox(currentUid, { onMessage }) {
  const channel = supabase
    .channel(`inbox:${currentUid}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => onMessage && onMessage(payload.new)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
