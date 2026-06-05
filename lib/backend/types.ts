export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRow = {
  id: string;
  clerk_user_id: string | null;
  supabase_user_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  unit_of_measure: string;
  height_cm: number | null;
  weight_kg: number | null;
  gender: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkoutPlanRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  workout_type: string | null;
  duration_seconds: number | null;
  reps: number | null;
  sets: number | null;
  rest_seconds: number | null;
  distance_km: number | null;
  calories_target: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ScheduledWorkoutRow = {
  id: string;
  user_id: string;
  workout_plan_id: string;
  scheduled_for: string;
  reminder_enabled: boolean;
  reminder_minutes_before: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ScheduledWorkoutWithPlanRow = ScheduledWorkoutRow & {
  workout_plan: Pick<
    WorkoutPlanRow,
    | "id"
    | "title"
    | "description"
    | "workout_type"
    | "duration_seconds"
    | "status"
  > | null;
};

export type WorkoutSessionRow = {
  id: string;
  user_id: string;
  workout_plan_id: string | null;
  scheduled_workout_id: string | null;
  title: string;
  workout_type: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  distance_km: number | null;
  calories_burned: number | null;
  status: string;
  created_at: string;
};

export type WorkoutSessionStepRow = {
  id: string;
  session_id: string;
  label: string;
  duration_seconds: number | null;
  order_index: number;
  completed: boolean;
  completed_at: string | null;
};

export type NotificationPreferencesRow = {
  id: string;
  user_id: string;
  workout_reminders_enabled: boolean;
  ai_suggestions_enabled: boolean;
  weekly_insights_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type WeeklyInsightsRow = {
  id: string;
  user_id: string;
  week_start_date: string;
  total_workouts: number;
  total_duration_seconds: number;
  total_calories: number;
  total_distance_km: number;
  ai_summary: string | null;
  created_at: string;
};

export type UpsertProfileInput = {
  clerkUserId: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  unitOfMeasure?: "metric" | "imperial";
  heightCm?: number | null;
  weightKg?: number | null;
  gender?: string | null;
  onboardingCompleted?: boolean;
};

export type ProfileDisplayFallbackInput = {
  fullName?: string | null;
  avatarUrl?: string | null;
  unitOfMeasure?: "Metric" | "Imperial" | null;
  height?: number | null;
  heightUnit?: "cm" | "inches";
  weight?: number | null;
  weightUnit?: "kg" | "lb";
  gender?: string | null;
  onboardingCompleted?: boolean | null;
};

export type ProfileDisplayValues = {
  fullName: string;
  avatarUrl: string | null;
  unitOfMeasure: "Metric" | "Imperial";
  height: number | null;
  heightCm: number | null;
  heightUnit: "cm" | "inches";
  weight: number | null;
  weightKg: number | null;
  weightUnit: "kg" | "lb";
  gender: string | null;
  onboardingCompleted: boolean;
  displayHeight: string;
  displayWeight: string;
  displayGender: string;
  displayUnitOfMeasure: string;
};

export type CreateScheduledWorkoutInput = {
  clerkUserId: string;
  workoutPlanId: string;
  scheduledFor: string;
  reminderEnabled?: boolean;
  reminderMinutesBefore?: number;
  status?: "scheduled" | "completed" | "cancelled" | "missed";
};

export type CreateWorkoutPlanInput = {
  clerkUserId: string;
  title: string;
  description?: string | null;
  workoutType?: string | null;
  durationSeconds?: number | null;
  reps?: number | null;
  sets?: number | null;
  restSeconds?: number | null;
  distanceKm?: number | null;
  caloriesTarget?: number | null;
  status?: "draft" | "upcoming" | "active" | "archived" | "completed";
  scheduledFor?: string | null;
  reminderEnabled?: boolean;
  reminderMinutesBefore?: number | null;
  scheduledStatus?: "scheduled" | "completed" | "cancelled" | "missed";
};

export type CreateWorkoutPlanResult = {
  workoutPlan: WorkoutPlanRow | null;
  scheduledWorkout: ScheduledWorkoutRow | null;
  error: string | null;
  debug?: {
    profileId: string | null;
    workoutPlanPayload: Record<string, unknown> | null;
    scheduledWorkoutPayload: Record<string, unknown> | null;
    errorMessage: string | null;
    classification:
      | "supabase_auth_or_rls"
      | "missing_profile"
      | "supabase_env"
      | "unknown"
      | null;
    supabase: {
      isConfigured: boolean;
      hasUrl: boolean;
      hasAnonKey: boolean;
      hasPublishableKey: boolean;
    };
  } | null;
};

export type UpdateScheduledWorkoutInput = {
  clerkUserId: string;
  scheduledWorkoutId: string;
  workoutPlanId: string;
  title: string;
  description?: string | null;
  scheduledFor: string;
  reminderEnabled?: boolean;
  reminderMinutesBefore?: number | null;
};

export type CompleteWorkoutSessionInput = {
  clerkUserId: string;
  workoutPlanId?: string | null;
  scheduledWorkoutId?: string | null;
  title: string;
  workoutType?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  durationSeconds?: number | null;
  distanceKm?: number | null;
  caloriesBurned?: number | null;
  status?: "in_progress" | "completed" | "cancelled" | "abandoned";
  steps?: Array<{
    label: string;
    durationSeconds?: number | null;
    orderIndex: number;
    completed?: boolean;
    completedAt?: string | null;
  }>;
};

export type UpdateNotificationPreferencesInput = {
  clerkUserId: string;
  workoutRemindersEnabled?: boolean;
  aiSuggestionsEnabled?: boolean;
  weeklyInsightsEnabled?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProfileRow, "id" | "created_at">> & {
          id?: string;
          created_at?: string;
        };
      };
      workout_plans: {
        Row: WorkoutPlanRow;
        Insert: Omit<WorkoutPlanRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<WorkoutPlanRow, "id" | "created_at">> & {
          id?: string;
          created_at?: string;
        };
      };
      scheduled_workouts: {
        Row: ScheduledWorkoutRow;
        Insert: Omit<ScheduledWorkoutRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ScheduledWorkoutRow, "id" | "created_at">> & {
          id?: string;
          created_at?: string;
        };
      };
      workout_sessions: {
        Row: WorkoutSessionRow;
        Insert: Omit<WorkoutSessionRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<WorkoutSessionRow, "id" | "created_at">> & {
          id?: string;
          created_at?: string;
        };
      };
      workout_session_steps: {
        Row: WorkoutSessionStepRow;
        Insert: Omit<WorkoutSessionStepRow, "id"> & {
          id?: string;
        };
        Update: Partial<WorkoutSessionStepRow>;
      };
      notification_preferences: {
        Row: NotificationPreferencesRow;
        Insert: Omit<
          NotificationPreferencesRow,
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<NotificationPreferencesRow, "id" | "created_at">
        > & {
          id?: string;
          created_at?: string;
        };
      };
      weekly_insights: {
        Row: WeeklyInsightsRow;
        Insert: Omit<WeeklyInsightsRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<WeeklyInsightsRow, "id" | "created_at">> & {
          id?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
