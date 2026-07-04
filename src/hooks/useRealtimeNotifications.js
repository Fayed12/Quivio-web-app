/**
 * @file useRealtimeNotifications.js
 * Listens for INSERT on the current user's notifications.
 * Pushes new notification into Redux and calls optional onNew(notif) callback.
 * Usage: useRealtimeNotifications({ onNew: (n) => toast(n.title) })
 */

// local
import { supabase } from "../services/config/supabaseClient";
import { selectUser } from "../redux/slices/authSlice";
import { addNotifLocal } from "../redux/slices/notificationsSlice";

// react
import { useEffect } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";

export function useRealtimeNotifications({ onNew } = {}) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `uid=eq.${user.id}`,
      }, ({ new: notif }) => {
        dispatch(addNotifLocal(notif));
        if (typeof onNew === 'function') onNew(notif);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id, dispatch, onNew]);
}
