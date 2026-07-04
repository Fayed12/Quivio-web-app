// local
import { supabase } from "./config/supabaseClient";
import { handleQuery, pageRange } from "./config/serviceHelpers";

// ─────────────────────────────────────────────
// GET: Student's own certificates
// Request : { page?, pageSize? }
// Response: { data: certificates[] with quiz info, count }
// ─────────────────────────────────────────────
export async function getMyCertificates({ page = 1, pageSize = 10 } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };
  const { from, to } = pageRange(page, pageSize);

  const { data, error, count } = await supabase
    .from('certificates')
    .select(`
      id, certificate_code, score, pdf_url, issued_at,
      quiz:quizzes(id, title, difficulty, category:categories(id, name))
    `, { count: 'exact' })
    .eq('uid', user.id)
    .range(from, to)
    .order('issued_at', { ascending: false });

  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

// ─────────────────────────────────────────────
// GET: Certificates issued for a quiz (instructor view)
// Request : { quizId, page?, pageSize? }
// Response: { data: certificates[] with student info, count }
// ─────────────────────────────────────────────
export async function getCertificatesByQuiz({ quizId, page = 1, pageSize = 20 } = {}) {
  const { from, to } = pageRange(page, pageSize);

  const { data, error, count } = await supabase
    .from('certificates')
    .select(`
      id, certificate_code, score, pdf_url, issued_at,
      profile:profiles!uid(uid, full_name, email, avatar_url)
    `, { count: 'exact' })
    .eq('quiz_id', quizId)
    .range(from, to)
    .order('issued_at', { ascending: false });

  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count };
}

// ─────────────────────────────────────────────
// GET: Public certificate verification (no auth required)
// Request : certificateCode: string
// Response: { data: certificate with student + quiz info, error }
// ─────────────────────────────────────────────
export async function verifyCertificate(certificateCode) {
  return handleQuery(
    supabase
      .from('certificates')
      .select(`
        id, certificate_code, score, issued_at,
        profile:profiles!uid(full_name),
        quiz:quizzes(id, title, passing_score)
      `)
      .eq('certificate_code', certificateCode)
      .single()
  );
}

// ─────────────────────────────────────────────
// GET: Signed download URL for certificate PDF
// Request : pdfPath: string (the pdf_url stored in DB)
// Response: { data: signedUrl, error }
// ─────────────────────────────────────────────
export async function getCertificateDownloadUrl(pdfPath) {
  const { data, error } = await supabase.storage
    .from('certificates')
    .createSignedUrl(pdfPath, 60 * 10); // 10 minutes

  if (error) return { data: null, error: error.message };
  return { data: data.signedUrl, error: null };
}
