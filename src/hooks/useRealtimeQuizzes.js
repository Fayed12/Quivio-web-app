/**
 * @file useRealtimeQuizzes.js
 * Instructor: watches own quizzes for INSERT/UPDATE/DELETE → re-fetches.
 * Student:    watches published quizzes for INSERT → re-fetches browse list.
 * Usage: call on Browse page (student) or My Quizzes page (instructor).
 */

// local
import { supabase } from "../services/config/supabaseClient";
import { selectUser, selectRole } from "../redux/slices/authSlice";
import { fetchMyQuizzes, fetchPublishedQuizzes } from "../redux/slices/quizzesSlice";

// react
import { useEffect } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";

export function useRealtimeQuizzes() {
  const dispatch = useDispatch();
  const user  = useSelector(selectUser);
  const role  = useSelector(selectRole);

  useEffect(() => {
    if (!user?.id) return;
    const isInstructor = role === 'instructor';
    const filter  = isInstructor ? `instructor_uid=eq.${user.id}` : 'status=eq.published';
    const refresh  = () => dispatch(isInstructor ? fetchMyQuizzes() : fetchPublishedQuizzes());

    const channel = supabase
      .channel(`quizzes:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes', filter }, refresh)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id, role, dispatch]);
}
