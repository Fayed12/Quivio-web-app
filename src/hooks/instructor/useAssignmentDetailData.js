import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../services/config/supabaseClient";

export const useAssignmentDetailData = (assignmentId) => {
    const isFirstMount = useRef(true);
    const [loading, setLoading] = useState(true);
    const [assignment, setAssignment] = useState(null);
    const [studentsStatus, setStudentsStatus] = useState([]);
    const [stats, setStats] = useState({
        completed: 0,
        total: 0,
        avgScore: 0,
        passRate: 0
    });

    const fetchAssignmentDetails = useCallback(async () => {
        if (!assignmentId) return;
        
        if (!isFirstMount.current) {
            setLoading(true);
        } else {
            isFirstMount.current = false;
        }

        try {
            // 1. Fetch assignment details
            const { data: ass, error: assErr } = await supabase
                .from("assignments")
                .select("*, quiz:quizzes(*), room:rooms(*)")
                .eq("id", assignmentId)
                .single();

            if (assErr) throw assErr;
            setAssignment(ass);

            // 2. Fetch classroom members
            const { data: members, error: memErr } = await supabase
                .from("room_members")
                .select("*, profile:profiles(*)")
                .eq("room_id", ass.room_id);

            if (memErr) throw memErr;

            // 3. Fetch attempts for this quiz
            const { data: attempts, error: attErr } = await supabase
                .from("attempts")
                .select("*")
                .eq("quiz_id", ass.quiz_id)
                .order("created_at", { ascending: false });

            if (attErr) throw attErr;

            // 4. Map students completion status
            let completedCount = 0;
            let totalScores = 0;
            let passedCount = 0;

            const statusList = members.map(m => {
                const userAttempt = attempts.find(a => a.uid === m.uid && a.status === "completed");
                const isCompleted = !!userAttempt;
                const score = isCompleted ? userAttempt.score : null;
                const isPassed = isCompleted ? (score >= (ass.quiz?.passing_score || 70)) : null;

                if (isCompleted) {
                    completedCount++;
                    totalScores += score;
                    if (isPassed) passedCount++;
                }

                return {
                    uid: m.uid,
                    fullName: m.profile?.full_name || "Unknown Student",
                    email: m.profile?.email || "",
                    avatarUrl: m.profile?.avatar_url || "",
                    isCompleted,
                    submittedAt: isCompleted ? new Date(userAttempt.completed_at || userAttempt.created_at).toLocaleString() : null,
                    score,
                    isPassed
                };
            });

            setStudentsStatus(statusList);
            setStats({
                completed: completedCount,
                total: members.length,
                avgScore: completedCount > 0 ? Math.round(totalScores / completedCount) : 0,
                passRate: completedCount > 0 ? Math.round((passedCount / completedCount) * 100) : 0
            });
        } catch (err) {
            console.error("Error loading assignment details:", err);
        } finally {
            setLoading(false);
        }
    }, [assignmentId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAssignmentDetails();
        }, 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignmentId]);

    return { loading, assignment, studentsStatus, stats, refetch: fetchAssignmentDetails };
};
export default useAssignmentDetailData;
