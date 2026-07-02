// local
import { supabase } from "./config/supabaseClient";

// ─────────────────────────────────────────────
// POST: Register instructor
// Request : { full_name, email, password }
// Response: { data: { user, session }, error }
// ─────────────────────────────────────────────
export async function registerInstructor({ full_name, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, role: 'instructor' },
    },
  });
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─────────────────────────────────────────────
// POST: Login
// Request : { email, password }
// Response: { data: { user, session }, error }
// ─────────────────────────────────────────────
export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─────────────────────────────────────────────
// POST: Logout
// Request : none
// Response: { error }
// ─────────────────────────────────────────────
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) return { error: error.message };
  return { error: null };
}

// ─────────────────────────────────────────────
// POST: Resend verification email
// Request : { email }
// Response: { error }
// ─────────────────────────────────────────────
export async function resendVerificationEmail(email) {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) return { error: error.message };
  return { error: null };
}

// ─────────────────────────────────────────────
// POST: Forgot password — send reset email
// Request : { email }
// Response: { error } — always returns success shape (no enumeration)
// ─────────────────────────────────────────────
export async function forgotPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) return { error: error.message };
  return { error: null };
}

// ─────────────────────────────────────────────
// PATCH: Reset / change password (from reset link or forced first-login)
// Request : { password }
// Response: { data: { user }, error }
// ─────────────────────────────────────────────
export async function resetPassword(password) {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─────────────────────────────────────────────
// GET: Current session
// Request : none
// Response: { data: { session }, error }
// ─────────────────────────────────────────────
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─────────────────────────────────────────────
// GET: Current user
// Request : none
// Response: { data: { user }, error }
// ─────────────────────────────────────────────
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─────────────────────────────────────────────
// SUBSCRIBE: Auth state changes
// Usage: const { data: { subscription } } = subscribeToAuthChanges(callback)
// Callback receives: (event, session)
// Remember to call subscription.unsubscribe() on cleanup
// ─────────────────────────────────────────────
export function subscribeToAuthChanges(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
