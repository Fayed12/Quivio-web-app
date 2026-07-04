// local
import { supabase } from "./config/supabaseClient";
import { handleQuery, pageRange, clean } from "./config/serviceHelpers";

// ─────────────────────────────────────────────
// GET: Instructor's own rooms
// Request : none
// Response: rooms[] with member_count
// ─────────────────────────────────────────────
export async function getMyRooms() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  return handleQuery(
    supabase
      .from('rooms')
      .select('id, name, description, color, icon, is_active, member_count, created_at')
      .eq('instructor_uid', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
  );
}

// ─────────────────────────────────────────────
// GET: Rooms a student belongs to
// Request : none
// Response: rooms[] the student is a member of
// ─────────────────────────────────────────────
export async function getStudentRooms() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  return handleQuery(
    supabase
      .from('room_members')
      .select(`
        joined_at,
        room:rooms(id, name, description, color, icon, member_count)
      `)
      .eq('uid', user.id)
  );
}

// ─────────────────────────────────────────────
// GET: Single room by id with member + quiz counts
// Request : id: string
// Response: room row
// ─────────────────────────────────────────────
export async function getRoomById(id) {
  return handleQuery(
    supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()
  );
}

// ─────────────────────────────────────────────
// POST: Create room
// Request : { name, description?, color?, icon? }
// Response: created room row
// ─────────────────────────────────────────────
export async function createRoom({ name, description, color, icon }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  return handleQuery(
    supabase
      .from('rooms')
      .insert(clean({ name, description, color, icon, instructor_uid: user.id }))
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// PATCH: Update room
// Request : { id, name?, description?, color?, icon?, is_active? }
// Response: updated room row
// ─────────────────────────────────────────────
export async function updateRoom({ id, ...fields }) {
  return handleQuery(
    supabase
      .from('rooms')
      .update(clean(fields))
      .eq('id', id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// PATCH: Soft delete room
// Request : id: string
// Response: updated room row
// ─────────────────────────────────────────────
export async function deleteRoom(id) {
  return handleQuery(
    supabase
      .from('rooms')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// GET: Members of a room with profiles
// Request : { roomId, page?, pageSize?, search? }
// Response: { data: room_members[] with profile, count }
// ─────────────────────────────────────────────
export async function getRoomMembers({ roomId, page = 1, pageSize = 20, search = '' } = {}) {
  const { from, to } = pageRange(page, pageSize);

  let query = supabase
    .from('room_members')
    .select(`
      id, joined_at, added_by,
      profile:profiles!uid(uid, full_name, email, avatar_url, is_active, last_activity_date)
    `, { count: 'exact' })
    .eq('room_id', roomId);

  if (search) query = query.ilike('profile.full_name', `%${search}%`);

  query = query.range(from, to).order('joined_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

// ─────────────────────────────────────────────
// POST: Add student(s) to a room
// Request : { roomId, studentUids: string[] }
// Response: { data: inserted[], error }
// ─────────────────────────────────────────────
export async function addMembersToRoom({ roomId, studentUids }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const rows = studentUids.map(uid => ({
    room_id: roomId,
    uid,
    added_by: user.id,
  }));

  return handleQuery(
    supabase.from('room_members').insert(rows).select()
  );
}

// ─────────────────────────────────────────────
// DELETE: Remove a student from a room
// Request : { roomId, studentUid }
// Response: { data: null, error }
// ─────────────────────────────────────────────
export async function removeMemberFromRoom({ roomId, studentUid }) {
  return handleQuery(
    supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('uid', studentUid)
  );
}

// ─────────────────────────────────────────────
// GET: Instructor's students NOT in a given room (for add modal)
// Request : roomId: string
// Response: profiles[] eligible for adding
// ─────────────────────────────────────────────
export async function getMembersNotInRoom(roomId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  // Get current member uids
  const { data: members } = await supabase
    .from('room_members')
    .select('uid')
    .eq('room_id', roomId);

  const existingUids = (members ?? []).map(m => m.uid);

  let query = supabase
    .from('instructor_students')
    .select('student_uid, student_code, profile:profiles!student_uid(uid, full_name, email, avatar_url)')
    .eq('instructor_uid', user.id);

  if (existingUids.length) {
    query = query.not('student_uid', 'in', `(${existingUids.join(',')})`);
  }

  return handleQuery(query);
}
