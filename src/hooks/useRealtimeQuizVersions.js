// local
import { supabase } from "../services/config/supabaseClient";
import { versionReceived } from "../redux/slices/quizVersionsSlice";

// react
import { useEffect } from "react";

// redux
import { useDispatch } from "react-redux";

export function useRealtimeQuizVersions(quizId) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!quizId) return;

    const uniqueId = Math.random().toString(36).substring(2, 9);
    const channel = supabase
      .channel(`quiz_versions:${quizId}:${uniqueId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "quiz_versions",
          filter: `quiz_id=eq.${quizId}`,
        },
        (payload) => dispatch(versionReceived(payload.new))
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [quizId, dispatch]);
}
