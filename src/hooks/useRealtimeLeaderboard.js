/**
 * @file useRealtimeLeaderboard.js
 * Watches leaderboard table for any UPDATE and triggers a re-fetch.
 * Creates a live leaderboard with smooth rank updates.
 * Usage: call on the Leaderboard page.
 */

// local
import { supabase } from "../services/config/supabaseClient";
import { fetchGlobalLeaderboard, fetchMonthlyLeaderboard } from "../redux/slices/leaderboardSlice";

// react
import { useEffect } from "react";

// redux
import { useDispatch } from "react-redux";

export function useRealtimeLeaderboard() {
  const dispatch = useDispatch();

  useEffect(() => {
    const channel = supabase
      .channel('leaderboard:all')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leaderboard' },
        () => {
          dispatch(fetchGlobalLeaderboard());
          dispatch(fetchMonthlyLeaderboard());
        })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [dispatch]);
}
