/**
 * @file useRealtimeRooms.js
 * Watches rooms list and (optionally) a specific room's members for changes.
 * Usage:
 *   useRealtimeRooms()           — on Rooms list page
 *   useRealtimeRooms(roomId)     — on Room Detail page
 */

// local
import { supabase } from "../services/config/supabaseClient";
import { selectUser } from "../redux/slices/authSlice";
import { fetchMyRooms, fetchRoomMembers } from "../redux/slices/roomsSlice";

// react
import { useEffect } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";

export function useRealtimeRooms(roomId = null) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user?.id) return;
    const channels = [];

    const roomsCh = supabase
      .channel(`rooms:${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'rooms',
        filter: `instructor_uid=eq.${user.id}`,
      }, () => dispatch(fetchMyRooms()))
      .subscribe();
    channels.push(roomsCh);

    if (roomId) {
      const membersCh = supabase
        .channel(`room_members:${roomId}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'room_members',
          filter: `room_id=eq.${roomId}`,
        }, () => dispatch(fetchRoomMembers({ roomId })))
        .subscribe();
      channels.push(membersCh);
    }

    return () => channels.forEach(c => supabase.removeChannel(c));
  }, [user?.id, roomId, dispatch]);
}
