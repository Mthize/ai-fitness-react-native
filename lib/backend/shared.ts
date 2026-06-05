import { requireSupabaseClient } from "@/lib/supabase";

export function requireClerkUserId(clerkUserId?: string | null) {
  if (!clerkUserId) {
    throw new Error("A Clerk user id is required for backend access.");
  }

  return clerkUserId;
}

export async function resolveProfileIdByClerkUserId(clerkUserId: string) {
  const supabase = await requireSupabaseClient({ requireAuth: true });
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error(
      "No profile row exists for this Clerk user. Create or upsert the profile first.",
    );
  }

  return data.id;
}
