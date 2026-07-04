// local
import { supabase } from "./config/supabaseClient";
import { handleQuery } from "./config/serviceHelpers";

export async function getAllAchievements() {
    return handleQuery(
        supabase
            .from("achievements")
            .select("*")
            .eq("is_active", true)
            .order("tier")
            .order("name"),
    );
}

export async function getMyAchievements() {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Not authenticated" };
    return handleQuery(
        supabase
            .from("user_achievements")
            .select("*, achievement:achievements(*)")
            .eq("uid", user.id)
            .order("earned_at", { ascending: false }),
    );
}

export async function getStudentAchievements(studentUid) {
    return handleQuery(
        supabase
            .from("user_achievements")
            .select("*, achievement:achievements(*)")
            .eq("uid", studentUid)
            .order("earned_at", { ascending: false }),
    );
}
