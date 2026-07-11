const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://lhvfebuudlpfvxdqspxi.supabase.co/', 'sb_publishable_isYxJQHXs24IfpSqR0BcZQ_SAw2Ae_r');

async function check() {
  const { data: quizzes, error } = await supabase.from('quizzes').select('id, title, status, visibility');
  console.log("Quizzes:", quizzes, "Error:", error);
}
check();
