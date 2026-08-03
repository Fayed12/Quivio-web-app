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
    let timer = null;
    const channel = supabase
      .channel('leaderboard:all')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leaderboard' },
        () => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            dispatch(fetchGlobalLeaderboard());
            dispatch(fetchMonthlyLeaderboard());
          }, 1500);
        })
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [dispatch]);
}
