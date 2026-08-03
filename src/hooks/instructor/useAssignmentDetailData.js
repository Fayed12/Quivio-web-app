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
                .select("*, quiz:quizzes(*), room:rooms(*), student:profiles!student_uid(*)")
                .eq("id", assignmentId)
                .single();

            if (assErr || !ass) {
                console.error("Assignment fetch error:", assErr);
                setLoading(false);
                return;
            }
            setAssignment(ass);

            // 2. Determine target students (from room_members or direct student_uid)
            let targetMembers = [];
            if (ass.room_id) {
                // Query room_members directly without nested foreign key embedding error
                const { data: members, error: memErr } = await supabase
                    .from("room_members")
                    .select("*")
                    .eq("room_id", ass.room_id);

                if (memErr) console.error("Error fetching room members:", memErr);
                
                const memberUids = (members || []).map(m => m.uid || m.student_uid || m.user_id).filter(Boolean);
                let profileMap = new Map();
                if (memberUids.length > 0) {
                    const { data: profs } = await supabase
                        .from("profiles")
                        .select("*")
                        .in("uid", memberUids);
                    (profs || []).forEach(p => profileMap.set(p.uid, p));
                }

                targetMembers = (members || []).map(m => {
                    const mUid = m.uid || m.student_uid || m.user_id;
                    return {
                        ...m,
                        uid: mUid,
                        profile: profileMap.get(mUid) || null
                    };
                });
            } else if (ass.student_uid) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("uid", ass.student_uid)
                    .maybeSingle();
                targetMembers = [{
                    uid: ass.student_uid,
                    profile: profile || ass.student || null
                }];
            }

            // 3. Fetch attempts for this quiz (without assuming created_at column exists)
            const { data: attempts, error: attErr } = await supabase
                .from("attempts")
                .select("*")
                .eq("quiz_id", ass.quiz_id);

            if (attErr) console.error("Error fetching attempts for assignment quiz:", attErr);

            // 4. Map students completion status & calculate statistics
            let completedCount = 0;
            let totalScores = 0;
            let passedCount = 0;
            const passingScore = ass.quiz?.passing_score ?? 70;

            const statusList = targetMembers.map(m => {
                const memberUid = m.uid || m.student_uid || m.profile?.uid;
                // Find attempt for this student (check status completed/submitted/finished, or presence of score or completion timestamp)
                const userAttempt = (attempts || []).find(a => {
                    const matchesUser = a.uid === memberUid || a.student_uid === memberUid || a.user_id === memberUid;
                    if (!matchesUser) return false;
                    const isFinished = a.status === "completed" || 
                                       a.status === "submitted" || 
                                       a.status === "finished" || 
                                       a.score !== null || 
                                       a.completed_at !== null || 
                                       a.submitted_at !== null;
                    return isFinished;
                });

                const isCompleted = !!userAttempt;
                const score = isCompleted ? (userAttempt.score ?? userAttempt.final_score ?? 0) : null;
                const isPassed = isCompleted ? (score >= passingScore) : null;

                if (isCompleted) {
                    completedCount++;
                    totalScores += (score || 0);
                    if (isPassed) passedCount++;
                }

                const submittedTime = isCompleted 
                    ? (userAttempt.submitted_at || userAttempt.completed_at || userAttempt.started_at)
                    : null;

                return {
                    uid: memberUid,
                    fullName: m.profile?.full_name || "Student",
                    email: m.profile?.email || "No email provided",
                    avatarUrl: m.profile?.avatar_url || "",
                    isCompleted,
                    submittedAt: submittedTime ? new Date(submittedTime).toLocaleString() : null,
                    score,
                    isPassed
                };
            });

            setStudentsStatus(statusList);
            setStats({
                completed: completedCount,
                total: targetMembers.length,
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
