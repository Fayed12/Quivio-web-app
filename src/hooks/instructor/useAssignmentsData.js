import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyAssignments, selectMyAssignments } from "../../redux/slices/assignmentsSlice";
import { fetchMyQuizzes, selectMyQuizzes } from "../../redux/slices/quizzesSlice";
import { fetchMyRooms, selectMyRooms } from "../../redux/slices/roomsSlice";
import { supabase } from "../../services/config/supabaseClient";

export const useAssignmentsData = () => {
    const dispatch = useDispatch();
    const rawAssignments = useSelector(selectMyAssignments);
    const rawQuizzes = useSelector(selectMyQuizzes);
    const rawRooms = useSelector(selectMyRooms);

    const assignments = useMemo(() => rawAssignments || [], [rawAssignments]);
    const quizzes = useMemo(() => rawQuizzes || [], [rawQuizzes]);
    const rooms = useMemo(() => rawRooms || [], [rawRooms]);

    const [completionsMap, setCompletionsMap] = useState({});
    const [loadingCompletions, setLoadingCompletions] = useState(false);

    // Stabilize assignments identity so the effect below doesn't re-fire every render
    const assignmentIds = useMemo(
        () => assignments.map(a => a.id).join(","),
        [assignments]
    );

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

                if (!quizIds.length) {
                    setLoadingCompletions(false);
                    return;
                }

                // Fetch room members if any room assignments exist
                let members = [];
                if (roomIds.length > 0) {
                    const { data: memData } = await supabase
                        .from("room_members")
                        .select("room_id, uid")
                        .in("room_id", roomIds);
                    members = memData || [];
                }

                // Fetch attempts for the quizzes
                const { data: attempts } = await supabase
                    .from("attempts")
                    .select("uid, quiz_id, status, score, completed_at, submitted_at")
                    .in("quiz_id", quizIds);

                const map = {};
                assignments.forEach(ass => {
                    const qId = ass.quiz_id || ass.quiz?.id;
                    const rId = ass.room_id || ass.room?.id;
                    const stUid = ass.student_uid || ass.student?.uid;

                    if (!qId) {
                        map[ass.id] = { completed: 0, total: 0 };
                        return;
                    }

                    if (stUid) {
                        // Individual student assignment
                        const userAttempt = (attempts || []).find(att => {
                            const isUser = att.uid === stUid || att.student_uid === stUid;
                            const isDone = att.status === "completed" || att.status === "submitted" || att.score !== null || att.completed_at !== null;
                            return att.quiz_id === qId && isUser && isDone;
                        });
                        map[ass.id] = {
                            completed: userAttempt ? 1 : 0,
                            total: 1
                        };
                    } else if (rId) {
                        // Classroom assignment
                        const roomMembers = members.filter(m => m.room_id === rId);
                        const memberUids = new Set(roomMembers.map(m => m.uid || m.student_uid).filter(Boolean));
                        const uniqueCompletions = new Set(
                            (attempts || [])
                                .filter(att => {
                                    const isDone = att.status === "completed" || att.status === "submitted" || att.score !== null || att.completed_at !== null;
                                    return att.quiz_id === qId && memberUids.has(att.uid) && isDone;
                                })
                                .map(att => att.uid)
                        );
                        map[ass.id] = {
                            completed: uniqueCompletions.size,
                            total: roomMembers.length
                        };
                    } else {
                        map[ass.id] = { completed: 0, total: 0 };
                    }
                });
                setCompletionsMap(map);
            } catch (err) {
                console.error("Error fetching assignment completions:", err);
            } finally {
                setLoadingCompletions(false);
            }
        };

        fetchCompletions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignmentIds]);

    return { assignments, quizzes, rooms, completionsMap, loadingCompletions };
};
export default useAssignmentsData;

