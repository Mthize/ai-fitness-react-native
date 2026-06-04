import { useSyncExternalStore } from "react";

export type WorkoutRoutePoint = {
  latitude: number;
  longitude: number;
};

export type WorkoutSegment = {
  id: string;
  label: string;
  durationSeconds: number;
  type: "ready" | "work" | "rest";
};

export type WorkoutStat = {
  label: string;
  value: string;
};

export type WorkoutStatus = "completed" | "current" | "upcoming";
export type WorkoutId = "warmup-run" | "pushups";

export type HomeWorkoutActivity = {
  id: WorkoutId;
  title: string;
  subtitle: string;
  status: WorkoutStatus;
  route: "/workout/map" | "/workout/workout";
  icon: "run" | "strength";
};

// Temporary workout data keeps the new flow self-contained until the real schedule and tracking layers are connected.
export const MOCK_WORKOUT = {
  mapTitle: "WarmUp",
  mapSubtitle: "Run 02 km",
  timerTitle: "Pushups session",
  timerSubtitle: "25 rep, 3 sets with 20 sec rest",
  distanceKm: "1.23",
  startedAt: "8:00",
  elapsedTime: "30:12",
  calories: "312",
  successMessage: "Training completed successfully",
} as const;

export const MOCK_ROUTE_COORDINATES: WorkoutRoutePoint[] = [
  { latitude: 37.78855, longitude: -122.4322 },
  { latitude: 37.7892, longitude: -122.4304 },
  { latitude: 37.7904, longitude: -122.4292 },
  { latitude: 37.7911, longitude: -122.4301 },
  { latitude: 37.7918, longitude: -122.4317 },
  { latitude: 37.7911, longitude: -122.4331 },
  { latitude: 37.7899, longitude: -122.4338 },
  { latitude: 37.78855, longitude: -122.4322 },
];

export const MOCK_MAP_REGION = {
  latitude: 37.7899,
  longitude: -122.4317,
  latitudeDelta: 0.009,
  longitudeDelta: 0.009,
} as const;

// TODO: Replace temporary map route with real GPS tracking from expo-location later.

export const MOCK_STATS: WorkoutStat[] = [
  { label: "Started", value: MOCK_WORKOUT.startedAt },
  { label: "Time", value: MOCK_WORKOUT.elapsedTime },
  { label: "Calories", value: MOCK_WORKOUT.calories },
];

// Timer step data stays local for now until the real workout session engine is connected.
export const PUSHUP_STEPS: WorkoutSegment[] = [
  { id: "ready", label: "Get ready", durationSeconds: 10, type: "ready" },
  { id: "work-1", label: "Work", durationSeconds: 40, type: "work" },
  { id: "rest-1", label: "Rest", durationSeconds: 10, type: "rest" },
  { id: "work-2", label: "Work", durationSeconds: 40, type: "work" },
  { id: "rest-2", label: "Rest", durationSeconds: 10, type: "rest" },
  { id: "work-3", label: "Work", durationSeconds: 40, type: "work" },
];

const HOME_WORKOUT_ORDER: Omit<HomeWorkoutActivity, "status">[] = [
  {
    id: "warmup-run",
    title: "WarmUp",
    subtitle: "Run 02 km",
    route: "/workout/map",
    icon: "run",
  },
  {
    id: "pushups",
    title: "Pushups session",
    subtitle: "25 reps, 3 sets with 20 sec rest",
    route: "/workout/workout",
    icon: "strength",
  },
];

type WorkoutProgressSnapshot = {
  activities: HomeWorkoutActivity[];
  currentWorkoutId: WorkoutId | null;
};

const progressListeners = new Set<() => void>();
const DEFAULT_COMPLETED_WORKOUT_IDS = ["warmup-run"] as const satisfies WorkoutId[];

// TODO: Replace temporary workout completion state with persisted user workout progress from backend.
const completedWorkoutIdsByUserId = new Map<string, Set<WorkoutId>>();
const cachedWorkoutProgressSnapshotsByUserId = new Map<
  string,
  WorkoutProgressSnapshot
>();

function createCompletedWorkoutIds() {
  return new Set<WorkoutId>(DEFAULT_COMPLETED_WORKOUT_IDS);
}

function notifyWorkoutProgress() {
  progressListeners.forEach((listener) => listener());
}

function createWorkoutProgressSnapshot(
  completedWorkoutIds: ReadonlySet<WorkoutId>,
): WorkoutProgressSnapshot {
  let hasCurrentWorkout = false;

  const activities = HOME_WORKOUT_ORDER.map((activity) => {
    if (completedWorkoutIds.has(activity.id)) {
      return { ...activity, status: "completed" as const };
    }

    if (!hasCurrentWorkout) {
      hasCurrentWorkout = true;
      return { ...activity, status: "current" as const };
    }

    return { ...activity, status: "upcoming" as const };
  });

  return {
    activities,
    currentWorkoutId:
      activities.find((activity) => activity.status === "current")?.id ?? null,
  };
}

function getWorkoutProgressSnapshot(userId?: string | null): WorkoutProgressSnapshot {
  if (!userId) {
    return createWorkoutProgressSnapshot(createCompletedWorkoutIds());
  }

  const cachedSnapshot = cachedWorkoutProgressSnapshotsByUserId.get(userId);
  if (cachedSnapshot) {
    return cachedSnapshot;
  }

  const completedWorkoutIds =
    completedWorkoutIdsByUserId.get(userId) ?? createCompletedWorkoutIds();
  completedWorkoutIdsByUserId.set(userId, completedWorkoutIds);

  const snapshot = createWorkoutProgressSnapshot(completedWorkoutIds);
  cachedWorkoutProgressSnapshotsByUserId.set(userId, snapshot);
  return snapshot;
}

function subscribeToWorkoutProgress(listener: () => void) {
  progressListeners.add(listener);

  return () => {
    progressListeners.delete(listener);
  };
}

export function useWorkoutProgress(userId?: string | null) {
  return useSyncExternalStore(
    subscribeToWorkoutProgress,
    () => getWorkoutProgressSnapshot(userId),
    () => getWorkoutProgressSnapshot(userId),
  );
}

export function markWorkoutCompleted(userId: string | null | undefined, workoutId: WorkoutId) {
  if (!userId) {
    return;
  }

  const completedWorkoutIds =
    completedWorkoutIdsByUserId.get(userId) ?? createCompletedWorkoutIds();

  if (completedWorkoutIds.has(workoutId)) {
    return;
  }

  completedWorkoutIdsByUserId.set(
    userId,
    new Set(completedWorkoutIds).add(workoutId),
  );
  cachedWorkoutProgressSnapshotsByUserId.delete(userId);
  notifyWorkoutProgress();
}
