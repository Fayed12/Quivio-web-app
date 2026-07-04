/**
 * @file useRealtimeUserAchievements.js
 * Watches user_achievements for INSERT (new achievement awarded by server).
 * Dispatches to Redux and calls optional onUnlock(row) for animation/toast.
 * Usage: useRealtimeUserAchievements({ onUnlock: (a) => showConfetti(a) })
 */

// local
import { supabase } from "../services/config/supabaseClient";
import { selectUser } from "../redux/slices/authSlice";
import { addEarnedAchievement } from "../redux/slices/achievementsSlice";

// react
import { useEffect } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";

export function useRealtimeUserAchievements({ onUnlock } = {}) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`user_achievements:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'user_achievements',
        filter: `uid=eq.${user.id}`,
      }, ({ new: row }) => {
        dispatch(addEarnedAchievement(row));
        if (typeof onUnlock === 'function') onUnlock(row);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id, dispatch, onUnlock]);
}
