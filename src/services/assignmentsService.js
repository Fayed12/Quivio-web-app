// local
import { supabase } from "./config/supabaseClient";
import { handleQuery, pageRange, clean } from "./config/serviceHelpers";

export async function getMyAssignments({ page = 1, pageSize = 15, quizId, status } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };
  const { from, to } = pageRange(page, pageSize);

  let q = supabase
    .from('assignments')
    .select(`
      *, quiz:quizzes(id, title, status),
      room:rooms(id, name),
      student:profiles!student_uid(uid, full_name, email)
    `, { count: 'exact' })
    .eq('instructor_uid', user.id);

  if (quizId) q = q.eq('quiz_id', quizId);
  if (typeof status === 'boolean') q = q.eq('is_active', status);
  q = q.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await q;
  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

export async function getStudentAssignments({ page = 1, pageSize = 12 } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };
  const { from, to } = pageRange(page, pageSize);

  // Get student's room ids
  const { data: memberships } = await supabase
    .from('room_members').select('room_id').eq('uid', user.id);
  const roomIds = (memberships ?? []).map(m => m.room_id);

  let q = supabase
    .from('assignments')
    .select(`
      id, due_date, note, created_at,
      quiz:quizzes(id, title, difficulty, time_limit_minutes, passing_score, question_count,
        category:categories(id, name, icon, color))
    `, { count: 'exact' })
    .eq('is_active', true);

  const filters = [`student_uid.eq.${user.id}`];
  if (roomIds.length) filters.push(`room_id.in.(${roomIds.join(',')})`);
  q = q.or(filters.join(','));
  q = q.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await q;
  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

export async function getAssignmentById(id) {
  return handleQuery(
    supabase.from('assignments').select(`
      *, quiz:quizzes(*), room:rooms(id, name), student:profiles!student_uid(uid, full_name, email)
    `).eq('id', id).single()
  );
}

export async function createAssignment({ quiz_id, room_id, student_uid, due_date, attempt_limit_override, note }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  return handleQuery(
    supabase.from('assignments')
      .insert(clean({ quiz_id, room_id, student_uid, due_date, attempt_limit_override, note, instructor_uid: user.id }))
      .select().single()
  );
}

export async function updateAssignment({ id, due_date, note }) {
  return handleQuery(
    supabase.from('assignments').update(clean({ due_date, note })).eq('id', id).select().single()
  );
}

export async function deleteAssignment(id) {
  return handleQuery(supabase.from('assignments').delete().eq('id', id));
}

export async function sendReminder(assignmentId) {
  // Inserts a reminder notification for each student who hasn't completed the quiz
  const { data: assignment } = await supabase
    .from('assignments')
    .select('quiz_id, room_id, student_uid, quiz:quizzes(title)')
    .eq('id', assignmentId).single();

  if (!assignment) return { data: null, error: 'Assignment not found' };

  let studentUids = [];
  if (assignment.student_uid) {
    studentUids = [assignment.student_uid];
  } else if (assignment.room_id) {
    const { data: members } = await supabase
      .from('room_members').select('uid').eq('room_id', assignment.room_id);
    studentUids = (members ?? []).map(m => m.uid);
  }

  // Filter out those who already completed
  const { data: done } = await supabase
    .from('attempts').select('uid').eq('quiz_id', assignment.quiz_id).eq('status', 'completed')
    .in('uid', studentUids);

  const doneUids = new Set((done ?? []).map(d => d.uid));
  const pendingUids = studentUids.filter(uid => !doneUids.has(uid));

  if (!pendingUids.length) return { data: { sent: 0 }, error: null };

  const notifications = pendingUids.map(uid => ({
    uid,
    type: 'assignment_reminder',
    title: 'Quiz reminder',
    body: `Reminder: "${assignment.quiz?.title}" is still pending.`,
    quiz_id: assignment.quiz_id,
  }));

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) return { data: null, error: error.message };
  return { data: { sent: pendingUids.length }, error: null };
}
