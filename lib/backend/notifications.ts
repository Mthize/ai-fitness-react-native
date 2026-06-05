import {
  requireClerkUserId,
  resolveProfileIdByClerkUserId,
} from "@/lib/backend/shared";
import { requireSupabaseClient } from "@/lib/supabase";
import type {
  NotificationPreferencesRow,
  UpdateNotificationPreferencesInput,
} from "@/lib/backend/types";

export async function getNotificationPreferences(clerkUserId?: string | null) {
  const resolvedClerkUserId = requireClerkUserId(clerkUserId);
  const supabase = await requireSupabaseClient({ requireAuth: true });
  const profileId = await resolveProfileIdByClerkUserId(resolvedClerkUserId);
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", profileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as NotificationPreferencesRow | null;
}

export async function updateNotificationPreferences(
  input: UpdateNotificationPreferencesInput,
) {
  const supabase = await requireSupabaseClient({ requireAuth: true });
  const profileId = await resolveProfileIdByClerkUserId(
    requireClerkUserId(input.clerkUserId),
  );
  const payload = {
    user_id: profileId,
    workout_reminders_enabled: input.workoutRemindersEnabled ?? true,
    ai_suggestions_enabled: input.aiSuggestionsEnabled ?? true,
    weekly_insights_enabled: input.weeklyInsightsEnabled ?? true,
    sound_enabled: input.soundEnabled ?? true,
    vibration_enabled: input.vibrationEnabled ?? true,
  };
  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert(payload, {
      onConflict: "user_id",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as NotificationPreferencesRow;
}
