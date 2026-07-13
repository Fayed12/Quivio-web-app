import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyAssignments, selectMyAssignments } from "../../redux/slices/assignmentsSlice";
import { fetchMyQuizzes, selectMyQuizzes } from "../../redux/slices/quizzesSlice";
import { fetchMyRooms, selectMyRooms } from "../../redux/slices/roomsSlice";
import { supabase } from "../../services/config/supabaseClient";

export const useAssignmentsData = () => {
    const dispatch = useDispatch();
    const assignments = useSelector(selectMyAssignments) || [];
    const quizzes = useSelector(selectMyQuizzes) || [];
    const rooms = useSelector(selectMyRooms) || [];

    const [completionsMap, setCompletionsMap] = useState({});
    const [loadingCompletions, setLoadingCompletions] = useState(false);

    useEffect(() => {
        dispatch(fetchMyAssignments());
        dispatch(fetchMyQuizzes());
        dispatch(fetchMyRooms());
    }, [dispatch]);

    useEffect(() => {
        if (!assignments.length) return;

        const fetchCompletions = async () => {
            try {
                setLoadingCompletions(true);
                const roomIds = assignments.map(a => a.room_id).filter(Boolean);
                const quizIds = assignments.map(a => a.quiz_id).filter(Boolean);

                if (!roomIds.length || !quizIds.length) {
                    setLoadingCompletions(false);
                    return;
                }

                // Fetch room members
                const { data: members } = await supabase
                    .from("room_members")
                    .select("room_id, uid")
                    .in("room_id", roomIds);

                // Fetch attempts
                const { data: attempts } = await supabase
                    .from("attempts")
                    .select("uid, quiz_id, status")
                    .in("quiz_id", quizIds)
                    .eq("status", "completed");

                const map = {};
                assignments.forEach(ass => {
                    const rId = ass.room_id || ass.room?.id;
                    const qId = ass.quiz_id || ass.quiz?.id;
                    if (!rId || !qId) {
                        map[ass.id] = { completed: 0, total: 0 };
                        return;
                    }

                    const roomMembers = (members || []).filter(m => m.room_id === rId);
                    const memberUids = new Set(roomMembers.map(m => m.uid));
                    const uniqueCompletions = new Set(
                        (attempts || [])
                            .filter(att => att.quiz_id === qId && memberUids.has(att.uid))
                            .map(att => att.uid)
                    );

                    map[ass.id] = {
                        completed: uniqueCompletions.size,
                        total: roomMembers.length
                    };
                });
                setCompletionsMap(map);
            } catch (err) {
                console.error("Error fetching assignment completions:", err);
            } finally {
                setLoadingCompletions(false);
            }
        };

        fetchCompletions();
    }, [assignments]);

    return { assignments, quizzes, rooms, completionsMap, loadingCompletions };
};
export default useAssignmentsData;
