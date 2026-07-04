// local
import { supabase } from "./config/supabaseClient";
import { handleQuery, pageRange, clean } from "./config/serviceHelpers";

// ─────────────────────────────────────────────
// GET: Instructor's announcements
// Request : { page?, pageSize?, status? }
// Response: { data: announcements[], count }
// ─────────────────────────────────────────────
export async function getMyAnnouncements({
    page = 1,
    pageSize = 15,
    status,
} = {}) {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Not authenticated" };
    const { from, to } = pageRange(page, pageSize);

    let q = supabase
        .from("announcements")
        .select(
            `
      *, room:rooms(id, name)
    `,
            { count: "exact" },
        )
        .eq("instructor_uid", user.id);

    if (status) q = q.eq("status", status);
    q = q.range(from, to).order("created_at", { ascending: false });

    const { data, error, count } = await q;
    if (error) return { data: null, error: error.message, count: 0 };
    return { data, error: null, count };
}

// ─────────────────────────────────────────────
// POST: Create announcement (send now or schedule)
// Request : { title, message, scope, room_id?, scheduled_for? }
// Response: created announcement row
// ─────────────────────────────────────────────
export async function createAnnouncement({
    title,
    message,
    scope,
    room_id,
    scheduled_for,
}) {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Not authenticated" };

    const isScheduled = !!scheduled_for;
    const status = isScheduled ? "scheduled" : "sent";
    const sent_at = isScheduled ? null : new Date().toISOString();

    const { data: announcement, error } = await supabase
        .from("announcements")
        .insert(
            clean({
                title,
                message,
                scope,
                room_id,
                scheduled_for,
                status,
                sent_at,
                instructor_uid: user.id,
            }),
        )
        .select()
        .single();

    if (error) return { data: null, error: error.message };

    // If sending now, create notifications immediately
    if (!isScheduled) {
        await _dispatchAnnouncementNotifications({
            announcement,
            instructorUid: user.id,
        });
    }

    return { data: announcement, error: null };
}

// ─────────────────────────────────────────────
// Internal: dispatch notification rows after announcement is sent
// ─────────────────────────────────────────────
async function _dispatchAnnouncementNotifications({
    announcement,
    instructorUid,
}) {
    let uids = [];

    if (announcement.scope === "room" && announcement.room_id) {
        const { data: members } = await supabase
            .from("room_members")
            .select("uid")
            .eq("room_id", announcement.room_id);
        uids = (members ?? []).map((m) => m.uid);
    } else if (announcement.scope === "all") {
        const { data: students } = await supabase
            .from("instructor_students")
            .select("student_uid")
            .eq("instructor_uid", instructorUid);
        uids = (students ?? []).map((s) => s.student_uid);
    }

    if (!uids.length) return;

    const notifications = uids.map((uid) => ({
        uid,
        type: "announcement",
        title: announcement.title,
        body: announcement.message.slice(0, 200),
    }));

    await supabase.from("notifications").insert(notifications);
}

// ─────────────────────────────────────────────
// DELETE: Remove a scheduled announcement (cannot delete sent ones)
// Request : id: string
// Response: { data: null, error }
// ─────────────────────────────────────────────
export async function deleteAnnouncement(id) {
    const { data: ann } = await supabase
        .from("announcements")
        .select("status")
        .eq("id", id)
        .single();

    if (ann?.status === "sent") {
        return {
            data: null,
            error: "Cannot delete an already-sent announcement.",
        };
    }

    return handleQuery(supabase.from("announcements").delete().eq("id", id));
}
