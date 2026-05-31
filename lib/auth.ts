import type { Href } from "expo-router";

export const PRIVATE_HOME_ROUTE = "/(protected)/(tabs)" as Href;
export const ONBOARDING_ROUTE = "/(protected)/onboarding" as Href;

export type OtpFlow = "sign-up" | "reset-password";

type FieldError = {
  longMessage?: string;
  message?: string;
};

type ClerkErrorsShape = {
  errors?: FieldError[];
  general?: FieldError[];
  fields?: unknown;
};

type AuthUserShape = {
  publicMetadata?: {
    onboardingCompleted?: unknown;
  } | null;
} | null;

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

export function getSignedInRedirectRoute(user?: AuthUserShape) {
  return user?.publicMetadata?.onboardingCompleted === true
    ? PRIVATE_HOME_ROUTE
    : ONBOARDING_ROUTE;
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
