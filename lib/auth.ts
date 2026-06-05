import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Href } from "expo-router";

export const PRIVATE_HOME_ROUTE = "/home" as const satisfies Href;
export const LOGIN_ROUTE = "/login" as const satisfies Href;
export const ONBOARDING_ROUTE = "/onboarding" as const satisfies Href;
export const SESSION_TASK_ROUTES = {
  "choose-organization": "/session-tasks/choose-organization",
  "reset-password": "/session-tasks/reset-password",
  "setup-mfa": "/session-tasks/setup-mfa",
} as const satisfies Record<string, Href>;
export const CLERK_TASK_URLS = SESSION_TASK_ROUTES;
export const ONBOARDING_GOALS = [
  "Strength Training for Muscle Gain",
  "High-Intensity Interval Training for Fat Loss",
  "Cardiovascular Exercise for Fat Loss",
  "Functional Training for Overall Fitness",
] as const;

export type OtpFlow = "sign-up" | "reset-password";
export type WeightUnit = "kg" | "lb";
export type HeightUnit = "cm" | "inches";
export type OnboardingGoal = (typeof ONBOARDING_GOALS)[number];

type FieldError = {
  longMessage?: string;
  message?: string;
};

type ClerkErrorsShape = {
  errors?: FieldError[];
  general?: FieldError[];
  fields?: unknown;
};

type OnboardingMetadataShape = {
  weight?: unknown;
  weightUnit?: unknown;
  height?: unknown;
  heightUnit?: unknown;
  gender?: unknown;
  unitOfMeasure?: unknown;
  goals?: unknown;
  goal?: unknown;
  selectedGoal?: unknown;
};

type ProfileMetadataShape = {
  gender?: unknown;
  unitOfMeasure?: unknown;
} | null;

type SessionTaskKey = keyof typeof SESSION_TASK_ROUTES;
type SessionTaskLike = {
  key?: string | null;
} | null;
type SessionLike = {
  currentTask?: SessionTaskLike;
} | null;

type MetadataUpdatableUser = AuthUserShape & {
  publicMetadata?: Record<string, unknown> | null;
  update?: ((params: {
    publicMetadata?: Record<string, unknown>;
    unsafeMetadata?: Record<string, unknown>;
  }) => Promise<unknown>) | null;
  reload?: (() => Promise<unknown>) | null;
};

export type AuthUserShape = {
  id?: string | null;
  unsafeMetadata?: {
    onboardingCompleted?: unknown;
    onboarding?: OnboardingMetadataShape;
    profile?: ProfileMetadataShape;
  } | null;
  publicMetadata?: {
    onboardingCompleted?: unknown;
  } | null;
} | null;

export type OnboardingState = {
  weight: number;
  weightUnit: WeightUnit;
  height: number;
  heightUnit: HeightUnit;
  goals: OnboardingGoal[];
  selectedGoal: OnboardingGoal | null;
  onboardingCompleted: boolean;
};

export type UserProfileState = {
  height: number | null;
  heightUnit: HeightUnit;
  weight: number | null;
  weightUnit: WeightUnit;
  gender: string | null;
  unitOfMeasure: "Metric" | "Imperial";
};

export type UserProfileDisplayState = UserProfileState & {
  displayHeight: string;
  displayWeight: string;
  displayGender: string;
  displayUnitOfMeasure: string;
};

type OnboardingContextValue = {
  onboarding: OnboardingState;
  setWeight: (weight: number) => void;
  setWeightUnit: (unit: WeightUnit) => void;
  setHeight: (height: number) => void;
  setHeightUnit: (unit: HeightUnit) => void;
  setGoals: (goals: OnboardingGoal[]) => void;
  setSelectedGoal: (goal: OnboardingGoal | null) => void;
  markOnboardingCompleted: () => void;
};

const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  weight: 70,
  weightUnit: "kg",
  height: 170,
  heightUnit: "cm",
  goals: [],
  selectedGoal: null,
  onboardingCompleted: false,
};

export function getOnboardingStorageKey(userId: string) {
  return `onboarding_completed_${userId}`;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function getClerkErrorMessage(
  errors: ClerkErrorsShape | null | undefined,
  fields: string[] = [],
  fallback = "Something went wrong. Please try again.",
) {
  const fieldErrors = (errors?.fields ?? {}) as Record<
    string,
    FieldError | undefined
  >;

  for (const field of fields) {
    const value = fieldErrors[field];
    if (value?.longMessage) return value.longMessage;
    if (value?.message) return value.message;
  }

  const generalError = errors?.general?.[0];
  if (generalError?.longMessage) return generalError.longMessage;
  if (generalError?.message) return generalError.message;

  const topLevelError = errors?.errors?.[0];
  if (topLevelError?.longMessage) return topLevelError.longMessage;
  if (topLevelError?.message) return topLevelError.message;

  return fallback;
}

export function isSignUpVerificationPending(
  signUp: {
    status: string | null;
    unverifiedFields?: string[];
    missingFields?: string[];
  } | null,
) {
  return (
    signUp?.status === "missing_requirements" &&
    signUp.unverifiedFields?.includes("email_address") &&
    (signUp.missingFields?.length ?? 0) === 0
  );
}

export function getOtpFlowLabel(flow: OtpFlow) {
  return flow === "sign-up" ? "account verification" : "password reset";
}

function readPositiveNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function readOptionalPositiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function readWeightUnit(value: unknown): WeightUnit {
  return value === "lb" ? "lb" : "kg";
}

function readHeightUnit(value: unknown): HeightUnit {
  return value === "inches" ? "inches" : "cm";
}

function readNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readUnitOfMeasure(value: unknown): "Metric" | "Imperial" | null {
  if (value === "Imperial" || value === "Metric") {
    return value;
  }

  return null;
}

function isOnboardingGoal(value: unknown): value is OnboardingGoal {
  return (
    typeof value === "string" &&
    ONBOARDING_GOALS.includes(value as OnboardingGoal)
  );
}

function readSelectedGoals(
  value: unknown,
  legacyValue: unknown,
): OnboardingGoal[] {
  if (Array.isArray(value)) {
    const selectedGoals = ONBOARDING_GOALS.filter((goal) =>
      value.includes(goal),
    );

    if (selectedGoals.length > 0) {
      return selectedGoals;
    }
  }

  return isOnboardingGoal(legacyValue) ? [legacyValue] : [];
}

export function getInitialOnboardingState(user?: AuthUserShape): OnboardingState {
  const onboarding = user?.unsafeMetadata?.onboarding;
  const goals = readSelectedGoals(
    onboarding?.goals,
    onboarding?.selectedGoal ?? onboarding?.goal,
  );

  return {
    weight: readPositiveNumber(
      onboarding?.weight,
      DEFAULT_ONBOARDING_STATE.weight,
    ),
    weightUnit: readWeightUnit(onboarding?.weightUnit),
    height: readPositiveNumber(
      onboarding?.height,
      DEFAULT_ONBOARDING_STATE.height,
    ),
    heightUnit: readHeightUnit(onboarding?.heightUnit),
    goals,
    selectedGoal: goals[0] ?? null,
    onboardingCompleted: getUserOnboardingCompleted(user),
  };
}

function inferCompletedOnboardingFromMetadata(user?: AuthUserShape) {
  const onboarding = user?.unsafeMetadata?.onboarding;
  const goals = readSelectedGoals(
    onboarding?.goals,
    onboarding?.selectedGoal ?? onboarding?.goal,
  );
  const weight = readOptionalPositiveNumber(onboarding?.weight);
  const height = readOptionalPositiveNumber(onboarding?.height);

  return goals.length > 0 && weight !== null && height !== null;
}

function inferUnitOfMeasure({
  explicitUnitOfMeasure,
  weightUnit,
  heightUnit,
}: {
  explicitUnitOfMeasure: "Metric" | "Imperial" | null;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
}) {
  if (explicitUnitOfMeasure) {
    return explicitUnitOfMeasure;
  }

  return weightUnit === "lb" || heightUnit === "inches" ? "Imperial" : "Metric";
}

function formatImperialHeight(heightInches: number) {
  const feet = Math.floor(heightInches / 12);
  const inches = heightInches % 12;

  return `${feet} ft ${inches} in`;
}

function formatHeightValue(height: number | null, heightUnit: HeightUnit) {
  if (!height) {
    return "Not set";
  }

  return heightUnit === "inches"
    ? formatImperialHeight(height)
    : `${height} cm`;
}

function formatWeightValue(weight: number | null, weightUnit: WeightUnit) {
  if (!weight) {
    return "Not set";
  }

  return `${weight} ${weightUnit}`;
}

// TODO: Replace Clerk metadata-only profile reads with a persisted backend user profile.
export function getUserProfileDisplayState(
  user?: AuthUserShape,
): UserProfileDisplayState {
  const onboarding = user?.unsafeMetadata?.onboarding;
  const profile = user?.unsafeMetadata?.profile;
  const weight = readOptionalPositiveNumber(onboarding?.weight);
  const weightUnit = readWeightUnit(onboarding?.weightUnit);
  const height = readOptionalPositiveNumber(onboarding?.height);
  const heightUnit = readHeightUnit(onboarding?.heightUnit);
  const gender =
    readNonEmptyString(profile?.gender) ?? readNonEmptyString(onboarding?.gender);
  const unitOfMeasure = inferUnitOfMeasure({
    explicitUnitOfMeasure:
      readUnitOfMeasure(profile?.unitOfMeasure) ??
      readUnitOfMeasure(onboarding?.unitOfMeasure),
    weightUnit,
    heightUnit,
  });

  return {
    height,
    heightUnit,
    weight,
    weightUnit,
    gender,
    unitOfMeasure,
    displayHeight: formatHeightValue(height, heightUnit),
    displayWeight: formatWeightValue(weight, weightUnit),
    displayGender: gender ?? "Not set",
    displayUnitOfMeasure: unitOfMeasure,
  };
}

export function OnboardingProvider({
  children,
  user,
}: {
  children: ReactNode;
  user?: AuthUserShape;
}) {
  const [onboarding, setOnboarding] = useState<OnboardingState>(() =>
    getInitialOnboardingState(user),
  );

  return createElement(
    OnboardingContext.Provider,
    {
      value: {
        onboarding,
        setWeight: (weight: number) =>
          setOnboarding((current) => ({
            ...current,
            weight,
          })),
        setWeightUnit: (weightUnit: WeightUnit) =>
          setOnboarding((current) => ({
            ...current,
            weightUnit,
          })),
        setHeight: (height: number) =>
          setOnboarding((current) => ({
            ...current,
            height,
          })),
        setHeightUnit: (heightUnit: HeightUnit) =>
          setOnboarding((current) => ({
            ...current,
            heightUnit,
          })),
        setGoals: (goals: OnboardingGoal[]) =>
          setOnboarding((current) => ({
            ...current,
            goals,
            selectedGoal: goals[0] ?? null,
          })),
        setSelectedGoal: (selectedGoal: OnboardingGoal | null) =>
          setOnboarding((current) => ({
            ...current,
            goals: selectedGoal ? [selectedGoal] : [],
            selectedGoal,
          })),
        markOnboardingCompleted: () =>
          setOnboarding((current) => ({
            ...current,
            onboardingCompleted: true,
          })),
      },
    },
    children,
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider.");
  }

  return context;
}

export function getUserOnboardingCompleted(user?: AuthUserShape) {
  if (typeof user?.unsafeMetadata?.onboardingCompleted === "boolean") {
    return user.unsafeMetadata.onboardingCompleted;
  }

  if (user?.publicMetadata?.onboardingCompleted === true) {
    return true;
  }

  return inferCompletedOnboardingFromMetadata(user);
}

export async function setPersistedOnboardingCompleted(
  userId: string,
  completed: boolean,
) {
  await SecureStore.setItemAsync(
    getOnboardingStorageKey(userId),
    completed ? "true" : "false",
  );
}

async function tryPersistOnboardingCompletedToPublicMetadata(
  user?: MetadataUpdatableUser,
) {
  if (!user?.id || typeof user.update !== "function") {
    return false;
  }

  const nextPublicMetadata = {
    ...(user.publicMetadata ?? {}),
    onboardingCompleted: true,
  };

  try {
    await user.update({
      publicMetadata: nextPublicMetadata,
    });

    if (typeof user.reload === "function") {
      await user.reload();
    }

    return true;
  } catch (error) {
    if (__DEV__) {
      console.log("[ONBOARDING DEBUG] publicMetadata persist skipped", {
        userId: user.id,
        error,
      });
    }

    return false;
  }
}

export function useResolvedOnboardingCompletion(user?: AuthUserShape) {
  const userId = user?.id ?? null;
  const secureStoreKey = userId ? getOnboardingStorageKey(userId) : null;
  const inferredFromProfileData = inferCompletedOnboardingFromMetadata(user);
  const metadataCompleted =
    typeof user?.unsafeMetadata?.onboardingCompleted === "boolean"
      ? user.unsafeMetadata.onboardingCompleted
      : user?.publicMetadata?.onboardingCompleted === true
        ? true
        : inferredFromProfileData
          ? true
          : null;
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(
    metadataCompleted ?? false,
  );
  const [isLoading, setIsLoading] = useState(
    Boolean(userId) && metadataCompleted === null,
  );
  const lastMigrationRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setHasCompletedOnboarding(false);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (metadataCompleted !== null) {
      setHasCompletedOnboarding(metadataCompleted);
      setIsLoading(false);

      if (metadataCompleted) {
        void setPersistedOnboardingCompleted(userId, true);

        if (
          lastMigrationRef.current !== userId &&
          (user?.publicMetadata?.onboardingCompleted !== true ||
            typeof user?.unsafeMetadata?.onboardingCompleted !== "boolean")
        ) {
          lastMigrationRef.current = userId;
          void tryPersistOnboardingCompletedToPublicMetadata(
            user as MetadataUpdatableUser,
          );
        }
      }

      if (__DEV__) {
        console.log("[ONBOARDING DEBUG] resolved from metadata", {
          userId,
          clerkMetadataOnboardingValue: {
            unsafe: user?.unsafeMetadata?.onboardingCompleted ?? null,
            public: user?.publicMetadata?.onboardingCompleted ?? null,
          },
          secureStoreKey,
          secureStoreValue: metadataCompleted ? "true (write-through)" : null,
          inferredFromProfileData,
          resolvedOnboardingCompleted: metadataCompleted,
        });
      }

      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);

    // TODO: Replace this per-user device fallback with a persisted backend
    // onboarding-complete field when the profile backend is wired.
    void SecureStore.getItemAsync(getOnboardingStorageKey(userId))
      .then((value) => {
        if (cancelled) {
          return;
        }

        const resolvedOnboardingCompleted = value === "true";

        setHasCompletedOnboarding(resolvedOnboardingCompleted);
        setIsLoading(false);

        if (__DEV__) {
          console.log("[ONBOARDING DEBUG] resolved from fallback", {
            userId,
            clerkMetadataOnboardingValue: {
              unsafe: user?.unsafeMetadata?.onboardingCompleted ?? null,
              public: user?.publicMetadata?.onboardingCompleted ?? null,
            },
            secureStoreKey,
            secureStoreValue: value,
            inferredFromProfileData,
            resolvedOnboardingCompleted,
          });
        }

        if (
          resolvedOnboardingCompleted &&
          lastMigrationRef.current !== userId &&
          user
        ) {
          lastMigrationRef.current = userId;
          void tryPersistOnboardingCompletedToPublicMetadata(
            user as MetadataUpdatableUser,
          );
        }
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setHasCompletedOnboarding(false);
        setIsLoading(false);

        if (__DEV__) {
          console.log("[ONBOARDING DEBUG] fallback read failed", {
            userId,
            clerkMetadataOnboardingValue: {
              unsafe: user?.unsafeMetadata?.onboardingCompleted ?? null,
              public: user?.publicMetadata?.onboardingCompleted ?? null,
            },
            secureStoreKey,
            secureStoreValue: null,
            inferredFromProfileData,
            resolvedOnboardingCompleted: false,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [metadataCompleted, userId]);

  return { hasCompletedOnboarding, isLoading };
}

export function getSignedInRedirectRoute(user?: AuthUserShape) {
  return getUserOnboardingCompleted(user) ? PRIVATE_HOME_ROUTE : ONBOARDING_ROUTE;
}

export function getSessionTaskRoute(taskKey?: string | null) {
  if (!taskKey) {
    return null;
  }

  return SESSION_TASK_ROUTES[taskKey as SessionTaskKey] ?? null;
}

export async function navigateAfterClerkSetActive({
  session,
  decorateUrl,
}: {
  session?: SessionLike;
  decorateUrl: (url: string) => string;
}) {
  const destination =
    getSessionTaskRoute(session?.currentTask?.key) ?? ONBOARDING_ROUTE;
  const url = decorateUrl(destination as string);

  if (url.startsWith("http")) {
    await Linking.openURL(url);
    return;
  }

  router.replace(url as Href);
}

export function getReadableErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (error && typeof error === "object") {
    const clerkError = error as ClerkErrorsShape & FieldError;

    if (clerkError.longMessage) {
      return clerkError.longMessage;
    }

    if (clerkError.message) {
      return clerkError.message;
    }

    const nestedMessage = getClerkErrorMessage(clerkError, [], "");

    if (nestedMessage) {
      return nestedMessage;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function normalizeOtpFlow(value: string | string[] | undefined): OtpFlow {
  return value === "reset-password" ? "reset-password" : "sign-up";
}

export function readParam(
  value: string | string[] | undefined,
  fallback = "",
) {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}
