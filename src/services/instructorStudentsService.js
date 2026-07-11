// local
import { supabase } from "./config/supabaseClient";
import { handleQuery, pageRange, clean } from "./config/serviceHelpers";

// Edge Function URL helper
const EFN = (name) => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;

// ─────────────────────────────────────────────
// POST: Create a single student account
// Request : { full_name, email, student_code, room_id? }
// Response: { data: { student_uid, instructor_students_id }, error }
// ─────────────────────────────────────────────
export async function createStudent({ full_name, email, student_code, room_id }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: null, error: 'Not authenticated' };

  const res = await fetch(EFN('create-student'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(clean({ full_name, email, student_code, room_id })),
  });

  const json = await res.json();
  if (!res.ok) return { data: null, error: json.error ?? 'Failed to create student' };
  return { data: json, error: null };
}

// ─────────────────────────────────────────────
// POST: Bulk create students from parsed CSV rows
// Request : rows: Array<{ full_name, email, student_code }>
// Response: { data: { success, failed, errors }, error }
// ─────────────────────────────────────────────
export async function bulkCreateStudents(rows) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: null, error: 'Not authenticated' };

  const res = await fetch(EFN('bulk-create-students'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ rows }),
  });

  const json = await res.json();
  if (!res.ok) return { data: null, error: json.error ?? 'Bulk import failed' };
  return { data: json, error: null };
}

// ─────────────────────────────────────────────
// GET: List all students belonging to this instructor
// Request : { page?, pageSize?, search?, isActive? }
// Response: { data: instructor_students[] with profile join, count, error }
// ─────────────────────────────────────────────
export async function getMyStudents({ page = 1, pageSize = 20, search = '', isActive } = {}) {
  const { from, to } = pageRange(page, pageSize);

  let query = supabase
    .from('instructor_students')
    .select(`
      id,
      student_uid,
      student_code,
      credentials_sent_at,
      credentials_resent_at,
      created_at,
      profile:profiles!student_uid (
        uid, full_name, email, avatar_url, is_active,
        xp, level, streak, last_activity_date
      )
    `, { count: 'exact' });

  if (search) {
    query = query.or(
      `student_code.ilike.%${search}%,profile.full_name.ilike.%${search}%`
    );
  }
  if (typeof isActive === 'boolean') {
    query = query.eq('profile.is_active', isActive);
  }

  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) return { data: null, error: error.message, count: 0 };

  if (data && data.length > 0) {
    const studentUids = data.map(s => s.student_uid).filter(Boolean);
    
    // Fetch attempts to compute average score
    const { data: attempts } = await supabase
      .from('attempts')
      .select('uid, score, status')
      .in('uid', studentUids)
      .eq('status', 'completed');
    
    // Fetch room memberships
    const { data: memberships } = await supabase
      .from('room_members')
      .select('uid, room_id, room:rooms(id, name)')
      .in('uid', studentUids);

    data.forEach(student => {
      const studentAttempts = (attempts ?? []).filter(a => a.uid === student.student_uid);
      const studentMemberships = (memberships ?? []).filter(m => m.uid === student.student_uid);
      
      const totalScore = studentAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0);
      const avgScore = studentAttempts.length > 0 ? Math.round(totalScore / studentAttempts.length) : 0;
      
      student.attempts_count = studentAttempts.length;
      student.avg_score = avgScore;
      student.rooms = studentMemberships.map(m => m.room).filter(Boolean);
      student.attempts = studentAttempts;
    });
  }

  return { data, error: null, count };
}

// ─────────────────────────────────────────────
// GET: Single student by student_uid
// Request : studentUid: string
// Response: { data: instructor_students row with profile, rooms, attempts, error }
// ─────────────────────────────────────────────
export async function getStudentById(studentUid) {
  const { data: student, error } = await supabase
    .from('instructor_students')
    .select(`
      id, student_code, credentials_sent_at, credentials_resent_at, created_at,
      profile:profiles!student_uid (*)
    `)
    .eq('student_uid', studentUid)
    .single();

  if (error) return { data: null, error: error.message };

  // Fetch rooms
  const { data: roomsData } = await supabase
    .from('room_members')
    .select('joined_at, room:rooms(id, name, description, color, icon)')
    .eq('uid', studentUid);

  // Fetch attempts
  const { data: attemptsData } = await supabase
    .from('attempts')
    .select('id, status, started_at, submitted_at, score, passed, time_spent_secs, quiz:quizzes(id, title)')
    .eq('uid', studentUid)
    .eq('status', 'completed')
    .order('submitted_at', { ascending: false })
    .limit(10);

  return {
    data: {
      ...student,
      rooms: (roomsData ?? []).map(r => r.room).filter(Boolean),
      attempts: attemptsData ?? []
    },
    error: null
  };
}

// ─────────────────────────────────────────────
// PATCH: Update student_code
// Request : { id, student_code }
// Response: { data: updated row, error }
// ─────────────────────────────────────────────
export async function updateStudentCode(id, student_code) {
  return handleQuery(
    supabase
      .from('instructor_students')
      .update({ student_code })
      .eq('id', id)
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────
// POST: Resend login credentials email
// Request : studentUid: string
// Response: { data: { sent: true }, error }
// ─────────────────────────────────────────────
export async function resendCredentials(studentUid) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: null, error: 'Not authenticated' };

  const res = await fetch(EFN('resend-credentials'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ student_uid: studentUid }),
  });

  // Update resent timestamp locally
  await supabase
    .from('instructor_students')
    .update({ credentials_resent_at: new Date().toISOString() })
    .eq('student_uid', studentUid);

  const json = await res.json();
  if (!res.ok) return { data: null, error: json.error ?? 'Failed to resend' };
  return { data: json, error: null };
}

// ─────────────────────────────────────────────
// DELETE: Remove a student (deactivates profile, removes link)
// Request : studentUid: string
// Response: { data: { deleted: true }, error }
// ─────────────────────────────────────────────
export async function deleteStudent(studentUid) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: null, error: 'Not authenticated' };

  const res = await fetch(EFN('delete-student'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ student_uid: studentUid }),
  });

  const json = await res.json();
  if (!res.ok) return { data: null, error: json.error ?? 'Failed to delete student' };
  return { data: json, error: null };
}
