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
  if (!currentUid) return [];

  const contactsMap = new Map();

  if (role === 'instructor') {
    // 1. Direct students from instructor_students table
    try {
      const { data: directData } = await supabase
        .from('instructor_students')
        .select(`
          student_uid,
          profile:profiles!student_uid ( uid, full_name, email, avatar_url, role, is_active )
        `)
        .eq('instructor_uid', currentUid);

      (directData || []).forEach((row) => {
        const p = row.profile || row.profiles;
        if (p && p.uid && p.uid !== currentUid) {
          contactsMap.set(p.uid, p);
        }
      });
    } catch (e) {
      console.warn('Error fetching instructor_students contacts:', e);
    }

    // 2. Room students from rooms owned by this instructor
    try {
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id')
        .eq('instructor_uid', currentUid)
        .is('deleted_at', null);

      const roomIds = (rooms || []).map((r) => r.id);
      if (roomIds.length > 0) {
        const { data: roomMembers } = await supabase
          .from('room_members')
          .select(`
            uid,
            profile:profiles!room_members_uid_fkey ( uid, full_name, email, avatar_url, role, is_active )
          `)
          .in('room_id', roomIds);

        (roomMembers || []).forEach((rm) => {
          const p = rm.profile;
          if (p && p.uid && p.uid !== currentUid && p.role !== 'instructor') {
            contactsMap.set(p.uid, p);
          }
        });
      }
    } catch (e) {
      console.warn('Error fetching room student contacts:', e);
    }

    // 3. Fallback: If no contacts found yet, fetch student profiles
    if (contactsMap.size === 0) {
      try {
        const { data: students } = await supabase
          .from('profiles')
          .select('uid, full_name, email, avatar_url, role, is_active')
          .eq('role', 'student');

        (students || []).forEach((p) => {
          if (p.uid && p.uid !== currentUid) {
            contactsMap.set(p.uid, p);
          }
        });
      } catch (e) {
        console.warn('Error fetching fallback students:', e);
      }
    }
  } else {
    // Role is 'student'
    // 1. Direct instructors from instructor_students table
    try {
      const { data: directData } = await supabase
        .from('instructor_students')
        .select(`
          instructor_uid,
          profile:profiles!instructor_uid ( uid, full_name, email, avatar_url, role, is_active )
        `)
        .eq('student_uid', currentUid);

      (directData || []).forEach((row) => {
        const p = row.profile || row.profiles;
        if (p && p.uid && p.uid !== currentUid) {
          contactsMap.set(p.uid, p);
        }
      });
    } catch (e) {
      console.warn('Error fetching student instructor contacts:', e);
    }

    // 2. Instructors of rooms the student is enrolled in
    try {
      const { data: studentRooms } = await supabase
        .from('room_members')
        .select(`
          room_id,
          room:rooms (
            instructor_uid,
            instructor:profiles!rooms_instructor_uid_fkey ( uid, full_name, email, avatar_url, role, is_active )
          )
        `)
        .eq('uid', currentUid);

      (studentRooms || []).forEach((sr) => {
        const p = sr.room?.instructor;
        if (p && p.uid && p.uid !== currentUid) {
          contactsMap.set(p.uid, p);
        }
      });
    } catch (e) {
      console.warn('Error fetching room instructor contacts:', e);
    }

    // 3. Fallback: If no instructors found yet, fetch all instructor profiles
    if (contactsMap.size === 0) {
      try {
        const { data: instructors } = await supabase
          .from('profiles')
          .select('uid, full_name, email, avatar_url, role, is_active')
          .eq('role', 'instructor');

        (instructors || []).forEach((p) => {
          if (p.uid && p.uid !== currentUid) {
            contactsMap.set(p.uid, p);
          }
        });
      } catch (e) {
        console.warn('Error fetching fallback instructors:', e);
      }
    }
  }

  return Array.from(contactsMap.values());
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
  if (!currentUid || !otherUid) {
    throw new Error('Invalid parameters for conversation');
  }

  // 1. Try finding conversation where user1 = currentUid and user2 = otherUid
  const { data: conv1} = await supabase
    .from('conversations')
    .select('*')
    .eq('user1_uid', currentUid)
    .eq('user2_uid', otherUid)
    .maybeSingle();

  if (conv1) return conv1;

  // 2. Try finding conversation where user1 = otherUid and user2 = currentUid
  const { data: conv2} = await supabase
    .from('conversations')
    .select('*')
    .eq('user1_uid', otherUid)
    .eq('user2_uid', currentUid)
    .maybeSingle();

  if (conv2) return conv2;

  // 3. Create new conversation row if not exists
  const { data: created, error: createError } = await supabase
    .from('conversations')
    .insert({ user1_uid: currentUid, user2_uid: otherUid })
    .select('*')
    .single();

  if (createError) {
    // If concurrent insert occurred, try fetching one last time
    const { data: fallback } = await supabase
      .from('conversations')
      .select('*')
      .or(
        `and(user1_uid.eq.${currentUid},user2_uid.eq.${otherUid}),and(user1_uid.eq.${otherUid},user2_uid.eq.${currentUid})`
      )
      .maybeSingle();

    if (fallback) return fallback;
    throw new Error(createError.message || 'Failed to create conversation');
  }

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
      user1:user1_uid ( uid, full_name, email, avatar_url, role, is_active ),
      user2:user2_uid ( uid, full_name, email, avatar_url, role, is_active )
    `
    )
    .or(`user1_uid.eq.${currentUid},user2_uid.eq.${currentUid}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const convoIds = data.map((c) => c.id);

  // Fetch unread message counts per conversation for current user
  const { data: unreadMsgs } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', convoIds)
    .neq('sender_uid', currentUid)
    .is('read_at', null);

  const unreadCountsByConvo = {};
  (unreadMsgs || []).forEach((m) => {
    unreadCountsByConvo[m.conversation_id] = (unreadCountsByConvo[m.conversation_id] || 0) + 1;
  });

  return data.map((c) => {
    const otherUser = c.user1_uid === currentUid ? c.user2 : c.user1;
    return {
      id: c.id,
      user1_uid: c.user1_uid,
      user2_uid: c.user2_uid,
      lastMessage: c.last_message,
      lastMessageAt: c.last_message_at,
      createdAt: c.created_at,
      otherUser,
      unreadCount: unreadCountsByConvo[c.id] || 0,
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
 * Deletes a single message and updates the conversation preview in DB.
 */
export async function deleteMessage(messageId, senderUid, conversationId) {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) throw error;

  let latestMsg = null;
  if (conversationId) {
    const { data: latest } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    latestMsg = latest && latest[0] ? latest[0] : null;

    await supabase
      .from('conversations')
      .update({
        last_message: latestMsg ? latestMsg.content : '',
        last_message_at: latestMsg ? latestMsg.created_at : new Date().toISOString(),
      })
      .eq('id', conversationId);
  }

  return { messageId, conversationId, latestMsg };
}

/**
 * Deletes all messages in a conversation.
 */
export async function deleteAllConversationMessages(conversationId) {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('conversation_id', conversationId);

  if (error) throw error;
  await supabase
    .from('conversations')
    .update({ last_message: '', last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return { conversationId };
}

/**
 * Permanently deletes a conversation and all its messages.
 */
export async function deleteConversation(conversationId) {
  await supabase.from('messages').delete().eq('conversation_id', conversationId);
  const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
  if (error) throw error;
  return { conversationId };
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

/**
 * Fetch a user profile by UID for chat context.
 */
export async function getProfileByUid(uid) {
  if (!uid) return null;
  const { data } = await supabase
    .from('profiles')
    .select('uid, full_name, email, avatar_url, role, is_active')
    .eq('uid', uid)
    .maybeSingle();
  return data || null;
}

