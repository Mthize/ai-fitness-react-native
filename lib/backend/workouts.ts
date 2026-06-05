import {
  ensureUserProfile,
  getCurrentUserProfile,
  upsertUserProfile,
} from "@/lib/backend/profile";
import {
  requireClerkUserId,
  resolveProfileIdByClerkUserId,
} from "@/lib/backend/shared";
import { getSupabaseDebugState, requireSupabaseClient } from "@/lib/supabase";
import type {
  CompleteWorkoutSessionInput,
  CreateScheduledWorkoutInput,
  CreateWorkoutPlanInput,
  CreateWorkoutPlanResult,
  ScheduledWorkoutRow,
  ScheduledWorkoutWithPlanRow,
  UpdateScheduledWorkoutInput,
  WorkoutPlanRow,
  WorkoutSessionRow,
} from "@/lib/backend/types";

const scheduledWorkoutChangeListeners = new Set<() => void>();

function emitScheduledWorkoutChange() {
  scheduledWorkoutChangeListeners.forEach((listener) => {
    listener();
  });
}

export function subscribeToScheduledWorkoutChanges(listener: () => void) {
  scheduledWorkoutChangeListeners.add(listener);

  return () => {
    scheduledWorkoutChangeListeners.delete(listener);
  };
}

export async function getScheduledWorkouts(clerkUserId?: string | null) {
  const resolvedClerkUserId = requireClerkUserId(clerkUserId);
  const supabase = await requireSupabaseClient({ requireAuth: true });
  const profileId = await resolveProfileIdByClerkUserId(resolvedClerkUserId);
  const { data, error } = await supabase
    .from("scheduled_workouts")
    .select(
      `
        *,
        workout_plan:workout_plans (
          id,
          title,
          description,
          workout_type,
          duration_seconds,
          status
        )
      `,
    )
    .eq("user_id", profileId)
    .order("scheduled_for", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ScheduledWorkoutWithPlanRow[];
}

export async function createScheduledWorkout(
  input: CreateScheduledWorkoutInput,
) {
  const supabase = await requireSupabaseClient({ requireAuth: true });
  const profileId = await resolveProfileIdByClerkUserId(
    requireClerkUserId(input.clerkUserId),
  );
  const { data, error } = await supabase
    .from("scheduled_workouts")
    .insert({
      user_id: profileId,
      workout_plan_id: input.workoutPlanId,
      scheduled_for: input.scheduledFor,
      reminder_enabled: input.reminderEnabled ?? false,
      reminder_minutes_before: input.reminderMinutesBefore ?? 10,
      status: input.status ?? "scheduled",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  emitScheduledWorkoutChange();
  return data as ScheduledWorkoutRow;
}

export async function createWorkoutPlan(
  input: CreateWorkoutPlanInput,
): Promise<CreateWorkoutPlanResult> {
  let createdWorkoutPlan: WorkoutPlanRow | null = null;
  const debug: NonNullable<CreateWorkoutPlanResult["debug"]> = {
    profileId: null,
    workoutPlanPayload: null,
    scheduledWorkoutPayload: null,
    errorMessage: null,
    classification: null,
    supabase: getSupabaseDebugState(),
  };

  try {
    let supabase;

    try {
      supabase = await requireSupabaseClient({ requireAuth: true });
      debug.supabase = getSupabaseDebugState();
    } catch (error) {
      debug.errorMessage = getErrorMessage(error);
      debug.classification = "supabase_env";
      if (__DEV__) {
        console.warn(
          "[workouts] Supabase client unavailable in createWorkoutPlan",
          {
            ...debug.supabase,
            error,
          },
        );
      }

      return {
        workoutPlan: null,
        scheduledWorkout: null,
        error:
          "We couldn't save your workout plan right now. Please try again.",
        debug,
      };
    }

    const resolvedClerkUserId = requireClerkUserId(input.clerkUserId);
    let profile = await getCurrentUserProfile(resolvedClerkUserId);

    if (!profile?.id) {
      profile =
        (await upsertUserProfile({
          clerkUserId: resolvedClerkUserId,
        })) ?? (await ensureUserProfile(resolvedClerkUserId));
    }

    if (!profile?.id) {
      if (__DEV__) {
        console.warn("[workouts] Unable to resolve a profile for workout creation.", {
          clerkUserId: resolvedClerkUserId,
        });
      }

      debug.classification = "missing_profile";
      return {
        workoutPlan: null,
        scheduledWorkout: null,
        error:
          "We couldn't save your workout plan right now. Please try again.",
        debug,
      };
    }

    debug.profileId = profile.id;

    const workoutPlanInsertPayload = {
      user_id: profile.id,
      title: input.title,
      description: input.description ?? null,
      workout_type: input.workoutType ?? null,
      duration_seconds: input.durationSeconds ?? null,
      reps: input.reps ?? null,
      sets: input.sets ?? null,
      rest_seconds: input.restSeconds ?? null,
      distance_km: input.distanceKm ?? null,
      calories_target: input.caloriesTarget ?? null,
      status: input.status ?? "upcoming",
    };
    debug.workoutPlanPayload = workoutPlanInsertPayload;

    const { data: workoutPlan, error: workoutPlanError } = await supabase
      .from("workout_plans")
      .insert(workoutPlanInsertPayload)
      .select("*")
      .single();

    if (workoutPlanError) {
      if (__DEV__) {
        console.warn("[workouts] workout_plans insert failed", {
          profileId: profile.id,
          error: workoutPlanError,
        });
      }
      throw workoutPlanError;
    }

    createdWorkoutPlan = workoutPlan as WorkoutPlanRow;

    if (!input.scheduledFor) {
      return {
        workoutPlan: createdWorkoutPlan,
        scheduledWorkout: null,
        error: null,
        debug,
      };
    }

    const scheduledWorkoutInsertPayload = {
      user_id: profile.id,
      workout_plan_id: createdWorkoutPlan.id,
      scheduled_for: input.scheduledFor,
      reminder_enabled: input.reminderEnabled ?? false,
      reminder_minutes_before: Math.max(
        input.reminderMinutesBefore ?? 10,
        0,
      ),
      status: input.scheduledStatus ?? "scheduled",
    };
    debug.scheduledWorkoutPayload = scheduledWorkoutInsertPayload;

    const { data: scheduledWorkout, error: scheduledWorkoutError } =
      await supabase
        .from("scheduled_workouts")
        .insert(scheduledWorkoutInsertPayload)
        .select("*")
        .single();

    if (scheduledWorkoutError) {
      if (__DEV__) {
        console.warn("[workouts] scheduled_workouts insert failed", {
          profileId: profile.id,
          workoutPlanId: createdWorkoutPlan.id,
          scheduledFor: input.scheduledFor,
          error: scheduledWorkoutError,
        });
      }
      throw scheduledWorkoutError;
    }

    return {
      workoutPlan: createdWorkoutPlan,
      scheduledWorkout: scheduledWorkout as ScheduledWorkoutRow,
      error: null,
      debug,
    };
  } catch (error) {
    debug.errorMessage = getErrorMessage(error);
    debug.classification = classifyWorkoutSaveError(error);

    if (createdWorkoutPlan) {
      try {
        const cleanupSupabase = await requireSupabaseClient({ requireAuth: true });
        await cleanupSupabase
          .from("workout_plans")
          .delete()
          .eq("id", createdWorkoutPlan.id)
          .eq("user_id", createdWorkoutPlan.user_id);
      } catch (cleanupError) {
        if (__DEV__) {
          console.warn(
            "[workouts] Failed to roll back workout_plan after schedule creation failed.",
            cleanupError,
          );
        }
      }
    }

    if (__DEV__) {
      console.warn("[workouts] Failed to create workout plan.", {
        error,
        ...debug.supabase,
        classification: debug.classification,
        profileId: debug.profileId,
        workoutPlanPayload: debug.workoutPlanPayload,
        scheduledWorkoutPayload: debug.scheduledWorkoutPayload,
        errorMessage: debug.errorMessage,
      });
    }

    return {
      workoutPlan: null,
      scheduledWorkout: null,
      error:
        "We couldn't save your workout plan right now. Please try again.",
      debug,
    };
  }
}

function classifyWorkoutSaveError(error: unknown) {
  const errorCode =
    typeof error === "object" &&
    error &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : null;
  const message =
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message
      : String(error ?? "");

  if (
    errorCode === "42501" ||
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("JWT") ||
    message.includes("No active Clerk session") ||
    message.includes("not configured")
  ) {
    return "supabase_auth_or_rls";
  }

  if (message.includes("No profile row exists")) {
    return "missing_profile";
  }

  return "unknown";
}

function getErrorMessage(error: unknown) {
  return typeof error === "object" &&
    error &&
    "message" in error &&
    typeof error.message === "string"
    ? error.message
    : String(error ?? "");
}

export async function completeWorkoutSession(
  input: CompleteWorkoutSessionInput,
) {
  const supabase = await requireSupabaseClient({ requireAuth: true });
  const profileId = await resolveProfileIdByClerkUserId(
    requireClerkUserId(input.clerkUserId),
  );
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: profileId,
      workout_plan_id: input.workoutPlanId ?? null,
      scheduled_workout_id: input.scheduledWorkoutId ?? null,
      title: input.title,
      workout_type: input.workoutType ?? null,
      started_at: input.startedAt ?? null,
      completed_at: input.completedAt ?? new Date().toISOString(),
      duration_seconds: input.durationSeconds ?? null,
      distance_km: input.distanceKm ?? null,
      calories_burned: input.caloriesBurned ?? null,
      status: input.status ?? "completed",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if ((input.steps?.length ?? 0) > 0) {
    const { error: stepsError } = await supabase
      .from("workout_session_steps")
      .insert(
        input.steps!.map((step) => ({
          session_id: data.id,
          label: step.label,
          duration_seconds: step.durationSeconds ?? null,
          order_index: step.orderIndex,
          completed: step.completed ?? false,
          completed_at: step.completedAt ?? null,
        })),
      );

    if (stepsError) {
      throw stepsError;
    }
  }

  if (input.scheduledWorkoutId) {
    const { error: scheduledWorkoutError } = await supabase
      .from("scheduled_workouts")
      .update({ status: "completed" })
      .eq("id", input.scheduledWorkoutId)
      .eq("user_id", profileId);

    if (scheduledWorkoutError) {
      throw scheduledWorkoutError;
    }

    emitScheduledWorkoutChange();
  }

  return data as WorkoutSessionRow;
}

export async function deleteScheduledWorkout(
  scheduledWorkoutId: string,
  clerkUserId?: string | null,
) {
  const resolvedClerkUserId = requireClerkUserId(clerkUserId);
  const supabase = await requireSupabaseClient({ requireAuth: true });
  const profileId = await resolveProfileIdByClerkUserId(resolvedClerkUserId);
  const { error } = await supabase
    .from("scheduled_workouts")
    .delete()
    .eq("id", scheduledWorkoutId)
    .eq("user_id", profileId);

  if (error) {
    if (__DEV__) {
      console.warn("[workouts] Failed to delete scheduled workout.", {
        scheduledWorkoutId,
        profileId,
        error,
      });
    }
    throw error;
  }

  emitScheduledWorkoutChange();
}

export async function updateScheduledWorkout(
  input: UpdateScheduledWorkoutInput,
) {
  const supabase = await requireSupabaseClient({ requireAuth: true });
  const profileId = await resolveProfileIdByClerkUserId(
    requireClerkUserId(input.clerkUserId),
  );

  const { error: workoutPlanError } = await supabase
    .from("workout_plans")
    .update({
      title: input.title,
      description: input.description ?? null,
    })
    .eq("id", input.workoutPlanId)
    .eq("user_id", profileId);

  if (workoutPlanError) {
    if (__DEV__) {
      console.warn("[workouts] Failed to update workout plan.", {
        workoutPlanId: input.workoutPlanId,
        profileId,
        error: workoutPlanError,
      });
    }
    throw workoutPlanError;
  }

  const { data, error: scheduledWorkoutError } = await supabase
    .from("scheduled_workouts")
    .update({
      scheduled_for: input.scheduledFor,
      reminder_enabled: input.reminderEnabled ?? false,
      reminder_minutes_before: Math.max(input.reminderMinutesBefore ?? 10, 0),
    })
    .eq("id", input.scheduledWorkoutId)
    .eq("user_id", profileId)
    .select("*")
    .single();

  if (scheduledWorkoutError) {
    if (__DEV__) {
      console.warn("[workouts] Failed to update scheduled workout.", {
        scheduledWorkoutId: input.scheduledWorkoutId,
        profileId,
        error: scheduledWorkoutError,
      });
    }
    throw scheduledWorkoutError;
  }

  emitScheduledWorkoutChange();
  return data as ScheduledWorkoutRow;
}

export async function getWorkoutHistory(clerkUserId?: string | null) {
  const resolvedClerkUserId = requireClerkUserId(clerkUserId);
  const supabase = await requireSupabaseClient({ requireAuth: true });
  const profileId = await resolveProfileIdByClerkUserId(resolvedClerkUserId);
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", profileId)
    .order("completed_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as WorkoutSessionRow[];
}
