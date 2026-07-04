/**
 * @file useRealtimeCategories.js
 * Watches categories table for any change and refreshes the list.
 * Usage: call on Categories page (instructor) or Browse page (student).
 */

// local
import { supabase } from "../services/config/supabaseClient";
import { fetchCategories } from "../redux/slices/categoriesSlice";

// react
import { useEffect } from "react";

// redux
import { useDispatch } from "react-redux";

export function useRealtimeCategories() {
  const dispatch = useDispatch();

  useEffect(() => {
    const channel = supabase
      .channel('categories:all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' },
        () => dispatch(fetchCategories()))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [dispatch]);
}
