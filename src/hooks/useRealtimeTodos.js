// local
import { supabase } from "../services/config/supabaseClient";
import { mapTodoRow } from "../services/todosService";
import { selectUser } from "../redux/slices/authSlice";
import { todoInserted, todoUpdated, todoDeleted } from "../redux/slices/todosSlice";

// react
import { useEffect } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";

export function useRealtimeTodos() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user?.id) return;

    const uniqueId = Math.random().toString(36).substring(2, 9);
    const channel = supabase
      .channel(`todos:${user.id}:${uniqueId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "todos",
          filter: `user_uid=eq.${user.id}`,
        },
        (payload) => dispatch(todoInserted(mapTodoRow(payload.new)))
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "todos",
          filter: `user_uid=eq.${user.id}`,
        },
        (payload) => dispatch(todoUpdated(mapTodoRow(payload.new)))
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "todos",
          filter: `user_uid=eq.${user.id}`,
        },
        // todos has REPLICA IDENTITY FULL, so payload.old is the full deleted row
        (payload) => dispatch(todoDeleted(payload.old.id))
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id, dispatch]);
}
