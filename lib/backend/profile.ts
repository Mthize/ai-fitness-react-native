import type {
  ProfileDisplayFallbackInput,
  ProfileDisplayValues,
  ProfileRow,
  UpsertProfileInput,
} from "@/lib/backend/types";
import { requireClerkUserId } from "@/lib/backend/shared";
import { requireSupabaseClient } from "@/lib/supabase";

const KG_TO_LB = 2.2046226218;
const CM_TO_INCH = 0.3937007874;

export async function getCurrentUserProfile(clerkUserId?: string | null) {
  try {
    const resolvedClerkUserId = requireClerkUserId(clerkUserId);
    const supabase = await requireSupabaseClient({ requireAuth: true });
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_user_id", resolvedClerkUserId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data ?? null) as ProfileRow | null;
  } catch (error) {
    logProfileBackendWarning("getCurrentUserProfile", error, {
      clerkUserId,
    });
    return null;
  }
}

export async function ensureUserProfile(clerkUserId?: string | null) {
  const resolvedClerkUserId = requireClerkUserId(clerkUserId);
  const existingProfile = await getCurrentUserProfile(resolvedClerkUserId);

  if (existingProfile) {
    return existingProfile;
  }

  try {
    const supabase = await requireSupabaseClient({ requireAuth: true });
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: resolvedClerkUserId,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ProfileRow;
  } catch (error) {
    logProfileBackendWarning("ensureUserProfile", error, {
      clerkUserId: resolvedClerkUserId,
    });
    return null;
  }
}

export async function upsertUserProfile(input: UpsertProfileInput) {
  try {
    const clerkUserId = requireClerkUserId(input.clerkUserId);
    const supabase = await requireSupabaseClient({ requireAuth: true });
    const payload = {
      clerk_user_id: clerkUserId,
      full_name: input.fullName ?? null,
      avatar_url: input.avatarUrl ?? null,
      unit_of_measure: input.unitOfMeasure ?? "metric",
      height_cm: input.heightCm ?? null,
      weight_kg: input.weightKg ?? null,
      gender: input.gender ?? null,
      onboarding_completed: input.onboardingCompleted ?? false,
    };

    if (__DEV__) {
      const { data, error } = await supabase.rpc("debug_auth_context");
      console.log("[Supabase Auth Debug]", { data, error });
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, {
        onConflict: "clerk_user_id",
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ProfileRow;
  } catch (error) {
    logProfileBackendWarning("upsertUserProfile", error, {
      clerkUserId: input.clerkUserId,
    });
    return null;
  }
}

export async function markOnboardingCompleted(clerkUserId?: string | null) {
  try {
    const resolvedClerkUserId = requireClerkUserId(clerkUserId);
    const supabase = await requireSupabaseClient({ requireAuth: true });
    const { data, error } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
      })
      .eq("clerk_user_id", resolvedClerkUserId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data ?? null) as ProfileRow | null;
  } catch (error) {
    logProfileBackendWarning("markOnboardingCompleted", error, {
      clerkUserId,
    });
    return null;
  }
}

export function getProfileDisplayValues({
  profile,
  fallback,
}: {
  profile?: ProfileRow | null;
  fallback?: ProfileDisplayFallbackInput;
}): ProfileDisplayValues {
  if (profile) {
    const unitOfMeasure =
      profile.unit_of_measure === "imperial" ? "Imperial" : "Metric";
    const heightCm = readPositiveNumber(profile.height_cm);
    const weightKg = readPositiveNumber(profile.weight_kg);
    const height =
      unitOfMeasure === "Imperial" ? convertCmToInches(heightCm) : heightCm;
    const weight =
      unitOfMeasure === "Imperial" ? convertKgToLb(weightKg) : weightKg;
    const heightUnit = unitOfMeasure === "Imperial" ? "inches" : "cm";
    const weightUnit = unitOfMeasure === "Imperial" ? "lb" : "kg";

    return {
      fullName: profile.full_name?.trim() || fallback?.fullName?.trim() || "User",
      avatarUrl: profile.avatar_url ?? fallback?.avatarUrl ?? null,
      unitOfMeasure,
      height,
      heightCm,
      heightUnit,
      weight,
      weightKg,
      weightUnit,
      gender: readString(profile.gender),
      onboardingCompleted: profile.onboarding_completed,
      displayHeight: formatHeightValue(height, heightUnit),
      displayWeight: formatWeightValue(weight, weightUnit),
      displayGender: readString(profile.gender) ?? "Not set",
      displayUnitOfMeasure: unitOfMeasure,
    };
  }

  const fallbackUnitOfMeasure = fallback?.unitOfMeasure ?? "Metric";
  const fallbackHeight = readPositiveNumber(fallback?.height ?? null);
  const fallbackWeight = readPositiveNumber(fallback?.weight ?? null);
  const fallbackHeightUnit =
    fallback?.heightUnit ??
    (fallbackUnitOfMeasure === "Imperial" ? "inches" : "cm");
  const fallbackWeightUnit =
    fallback?.weightUnit ??
    (fallbackUnitOfMeasure === "Imperial" ? "lb" : "kg");

  return {
    fullName: fallback?.fullName?.trim() || "User",
    avatarUrl: fallback?.avatarUrl ?? null,
    unitOfMeasure: fallbackUnitOfMeasure,
    height: fallbackHeight,
    heightCm:
      fallbackHeightUnit === "inches"
        ? convertInchesToCm(fallbackHeight)
        : fallbackHeight,
    heightUnit: fallbackHeightUnit,
    weight: fallbackWeight,
    weightKg:
      fallbackWeightUnit === "lb"
        ? convertLbToKg(fallbackWeight)
        : fallbackWeight,
    weightUnit: fallbackWeightUnit,
    gender: readString(fallback?.gender ?? null),
    onboardingCompleted: fallback?.onboardingCompleted === true,
    displayHeight: formatHeightValue(fallbackHeight, fallbackHeightUnit),
    displayWeight: formatWeightValue(fallbackWeight, fallbackWeightUnit),
    displayGender: readString(fallback?.gender ?? null) ?? "Not set",
    displayUnitOfMeasure: fallbackUnitOfMeasure,
  };
}

function readPositiveNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function readString(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function convertKgToLb(weightKg: number | null) {
  if (!weightKg) {
    return null;
  }

  return Math.round(weightKg * KG_TO_LB * 10) / 10;
}

function convertLbToKg(weightLb: number | null) {
  if (!weightLb) {
    return null;
  }

  return Math.round((weightLb / KG_TO_LB) * 10) / 10;
}

function convertCmToInches(heightCm: number | null) {
  if (!heightCm) {
    return null;
  }

  return Math.round(heightCm * CM_TO_INCH);
}

function convertInchesToCm(heightInches: number | null) {
  if (!heightInches) {
    return null;
  }

  return Math.round(heightInches / CM_TO_INCH);
}

function formatImperialHeight(heightInches: number) {
  const feet = Math.floor(heightInches / 12);
  const inches = heightInches % 12;

  return `${feet} ft ${inches} in`;
}

function formatHeightValue(
  height: number | null,
  heightUnit: "cm" | "inches",
) {
  if (!height) {
    return "Not set";
  }

  return heightUnit === "inches"
    ? formatImperialHeight(height)
    : `${height} cm`;
}

function formatWeightValue(weight: number | null, weightUnit: "kg" | "lb") {
  if (!weight) {
    return "Not set";
  }

  return `${weight} ${weightUnit}`;
}

function logProfileBackendWarning(
  action: string,
  error: unknown,
  details: Record<string, unknown>,
) {
  if (__DEV__) {
    console.warn(`[profile backend] ${action} failed`, {
      ...details,
      error,
    });
  }
}
