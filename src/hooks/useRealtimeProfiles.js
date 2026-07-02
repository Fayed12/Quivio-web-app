// local
import { supabase } from '../services/config/supabaseClient';
import { selectUser } from '../redux/slices/authSlice';
import { updateProfileLocal } from '../redux/slices/profilesSlice';

// react
import { useEffect } from 'react';

// redux
import { useDispatch, useSelector } from 'react-redux';

export function useRealtimeProfiles() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`profiles:${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'profiles',
        filter: `uid=eq.${user.id}`,
      }, ({ new: row }) => dispatch(updateProfileLocal(row)))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id, dispatch]);
}
