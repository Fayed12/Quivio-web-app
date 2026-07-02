// local
import { supabase } from './config/supabaseClient';
import { handleQuery, clean } from './config/serviceHelpers';

// ─────────────────────────────────────────────
// GET: own profile
// Request : none (uses auth.uid() from session)
// Response: profiles row
// ─────────────────────────────────────────────
export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };
  return handleQuery(
    supabase
      .from('profiles')
      .select('*')
      .eq('uid', user.id)
      .single()
  );
}

// ─────────────────────────────────────────────
// GET: profile by uid (public fields only)
// Request : uid: string
// Response: { uid, full_name, avatar_url, role, level, xp, streak }
// ─────────────────────────────────────────────
export async function getProfileById(uid) {
  return handleQuery(
    supabase
      .from('profiles')
      .select('uid, full_name, avatar_url, role, level, xp, streak, longest_streak, created_at')
      .eq('uid', uid)
      .eq('is_active', true)
      .single()
  );
}

// ─────────────────────────────────────────────
// PATCH: update own profile
// Request : { full_name?, bio?, phone?, country? }
// Response: updated profiles row
// ─────────────────────────────────────────────
export async function updateMyProfile(updates) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const payload = clean({
    full_name: updates.full_name,
    bio:       updates.bio,
    phone:     updates.phone,
    country:   updates.country,
  });

  return handleQuery(
    supabase
      .from('profiles')
      .update(payload)
      .eq('uid', user.id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// PATCH: upload avatar image and update avatar_url
// Request : file: File object
// Response: updated profiles row with new avatar_url
// ─────────────────────────────────────────────
export async function updateAvatar(file) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const ext  = file.name.split('.').pop();
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { data: null, error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  return handleQuery(
    supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('uid', user.id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// PATCH: mark password as changed (first-login flow)
// Request : none
// Response: updated profiles row
// ─────────────────────────────────────────────
export async function markPasswordChanged() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  return handleQuery(
    supabase
      .from('profiles')
      .update({ must_change_password: false })
      .eq('uid', user.id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// GET: all student profiles owned by this instructor
// Request : { page?, pageSize?, search?, roomId?, isActive? }
// Response: { data: profiles[], count: number }
// ─────────────────────────────────────────────
export async function getInstructorStudentProfiles({
  page = 1,
  pageSize = 20,
  search = '',
  isActive,
} = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  let query = supabase
    .from('profiles')
    .select('uid, full_name, email, avatar_url, is_active, created_at, last_activity_date, xp, level, streak', { count: 'exact' })
    .eq('created_by_instructor', user.id)
    .eq('role', 'student');

  if (typeof isActive === 'boolean') query = query.eq('is_active', isActive);
  if (search) query = query.ilike('full_name', `%${search}%`);

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1).order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

// ─────────────────────────────────────────────
// PATCH: deactivate a student
// Request : studentUid: string
// Response: updated profiles row
// ─────────────────────────────────────────────
export async function deactivateStudent(studentUid) {
  return handleQuery(
    supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('uid', studentUid)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// PATCH: reactivate a student
// Request : studentUid: string
// Response: updated profiles row
// ─────────────────────────────────────────────
export async function reactivateStudent(studentUid) {
  return handleQuery(
    supabase
      .from('profiles')
      .update({ is_active: true })
      .eq('uid', studentUid)
      .select()
      .single()
  );
}
