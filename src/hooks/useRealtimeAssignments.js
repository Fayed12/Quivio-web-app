// local
import { supabase } from "../services/config/supabaseClient";
import { selectUser, selectRole } from "../redux/slices/authSlice";
import {
    fetchMyAssignments,
    fetchStudentAssignments,
} from "../redux/slices/assignmentsSlice";

// react
import { useEffect } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";

export function useRealtimeAssignments() {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const role = useSelector(selectRole);

    useEffect(() => {
        if (!user?.id) return;
        const isInstructor = role === "instructor";
        const filter = isInstructor
            ? `instructor_uid=eq.${user.id}`
            : `student_uid=eq.${user.id}`;
        const refresh = () =>
            dispatch(
                isInstructor ? fetchMyAssignments() : fetchStudentAssignments(),
            );

        const channel = supabase
            .channel(`assignments:${user.id}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "assignments", filter },
                refresh,
            )
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [user?.id, role, dispatch]);
}
