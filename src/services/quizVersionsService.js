// local
import { supabase } from "./config/supabaseClient";

/**
 * Lists all versions for a quiz, newest first.
 */
export async function listQuizVersions(quizId) {
  const { data, error } = await supabase
    .from("quiz_versions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("version_number", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Fetches a single version's full snapshot (metadata + question list).
 */
export async function getQuizVersion(versionId) {
  const { data, error } = await supabase
    .from("quiz_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Manually saves the CURRENT state of a quiz as a new version, with an
 * optional note (e.g. "Before adding 5 new questions").
 * Calls the create_quiz_version() DB function, which verifies the caller
 * owns the quiz before writing anything.
 */
export async function createQuizVersion(quizId, note = null) {
  const { data, error } = await supabase.rpc("create_quiz_version", {
    p_quiz_id: quizId,
    p_note: note,
  });

  if (error) throw error;
  return data;
}
