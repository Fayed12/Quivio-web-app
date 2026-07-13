import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyAnnouncements, selectAnnouncements } from "../../redux/slices/announcementsSlice";
import { fetchMyRooms, selectMyRooms } from "../../redux/slices/roomsSlice";
import { selectProfile } from "../../redux/slices/authSlice";
import { supabase } from "../../services/config/supabaseClient";

export const useNotificationsData = () => {
    const dispatch = useDispatch();
    const user = useSelector(selectProfile);
    const announcements = useSelector(selectAnnouncements);
    const rooms = useSelector(selectMyRooms);

    const [loadingLogs, setLoadingLogs] = useState(true);
    const [systemLogs, setSystemLogs] = useState([]);

    useEffect(() => {
        dispatch(fetchMyAnnouncements());
        dispatch(fetchMyRooms());
    }, [dispatch]);

    useEffect(() => {
        const userId = user?.uid || user?.id;
        if (!userId) return;

        const loadLogs = async () => {
            try {
                setLoadingLogs(true);

                // 1. Fetch room members (student joins)
                let roomJoins = [];
                if (rooms.length > 0) {
                    const roomIds = rooms.map(r => r.id);
                    const { data } = await supabase
                        .from("room_members")
                        .select(`
                            id, joined_at,
                            room:rooms(id, name),
                            profile:profiles!room_members_uid_fkey(uid, full_name)
                        `)
                        .in("room_id", roomIds)
                        .order("joined_at", { ascending: false })
                        .limit(20);
                    roomJoins = data || [];
                }

                // 2. Fetch quiz attempts
                const { data: quizAttempts } = await supabase
                    .from("attempts")
                    .select(`
                        id, status, score, passed, submitted_at, started_at,
                        quiz:quizzes!inner(id, title, instructor_uid),
                        profile:profiles!uid(uid, full_name)
                    `)
                    .eq("quiz.instructor_uid", userId)
                    .order("started_at", { ascending: false })
                    .limit(20);

                // 3. Fetch direct notifications
                const { data: dbNotifs } = await supabase
                    .from("notifications")
                    .select("*")
                    .eq("uid", userId)
                    .order("created_at", { ascending: false })
                    .limit(20);

                // Combine and format
                const logs = [];

                if (quizAttempts) {
                    quizAttempts.forEach(att => {
                        const time = att.submitted_at || att.started_at;
                        const isCompleted = att.status === "completed";
                        logs.push({
                            id: `attempt-${att.id}`,
                            type: "quiz_attempt",
                            text: isCompleted 
                                ? `${att.profile?.full_name || "A student"} completed "${att.quiz?.title}" with score ${att.score}%`
                                : `${att.profile?.full_name || "A student"} started "${att.quiz?.title}"`,
                            date: new Date(time),
                            unread: false
                        });
                    });
                }

                if (roomJoins) {
                    roomJoins.forEach(join => {
                        logs.push({
                            id: `join-${join.id}`,
                            type: "student_join",
                            text: `${join.profile?.full_name || "A student"} joined Classroom "${join.room?.name || "Room"}"`,
                            date: new Date(join.joined_at),
                            unread: false
                        });
                    });
                }

                if (dbNotifs) {
                    dbNotifs.forEach(notif => {
                        logs.push({
                            id: `notif-${notif.id}`,
                            type: notif.type || "system",
                            text: notif.body || `${notif.title}: ${notif.body}`,
                            date: new Date(notif.created_at),
                            unread: !notif.read_at,
                            rawId: notif.id
                        });
                    });
                }

                // Sort descending chronologically
                logs.sort((a, b) => b.date - a.date);

                setSystemLogs(logs);
            } catch (err) {
                console.error("Error loading system logs:", err);
            } finally {
                setLoadingLogs(false);
            }
        };

        loadLogs();
    }, [user, rooms?.length]);

    return { announcements, rooms, systemLogs, loadingLogs };
};

export default useNotificationsData;
