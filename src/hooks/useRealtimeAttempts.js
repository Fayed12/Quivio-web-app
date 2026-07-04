/**
 * @file useRealtimeAttempts.js
 * Watches attempt status changes (e.g. server marks as completed after submit).
 * Usage:
 *   Student:    useRealtimeAttempts({ attemptId: 'uuid', onUpdate: fn })
 *   Instructor: useRealtimeAttempts({ quizId: 'uuid', onNew: fn })
 */

// local
import { supabase } from "../services/config/supabaseClient";
import { fetchAttemptsByQuiz } from "../redux/slices/attemptsSlice";

// react
import { useEffect } from "react";

// redux
import { useDispatch } from "react-redux";

export function useRealtimeAttempts({ attemptId, quizId, onUpdate, onNew } = {}) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!attemptId && !quizId) return;
    const channels = [];

    if (attemptId) {
      const ch = supabase
        .channel(`attempt:${attemptId}`)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'attempts',
          filter: `id=eq.${attemptId}`,
        }, ({ new: row }) => { if (typeof onUpdate === 'function') onUpdate(row); })
        .subscribe();
      channels.push(ch);
    }

    if (quizId) {
      const ch = supabase
        .channel(`attempts_quiz:${quizId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'attempts',
          filter: `quiz_id=eq.${quizId}`,
        }, ({ new: row }) => {
          dispatch(fetchAttemptsByQuiz({ quizId }));
          if (typeof onNew === 'function') onNew(row);
        })
        .subscribe();
      channels.push(ch);
    }

    return () => channels.forEach(c => supabase.removeChannel(c));
  }, [attemptId, quizId, dispatch, onUpdate, onNew]);
}
