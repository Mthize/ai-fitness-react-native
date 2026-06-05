import { Redirect, Stack } from "expo-router";

import { RouteStatusScreen } from "@/components/RouteStatusScreen";
import { useAuth, useClerk, useUser } from "@/lib/clerk";
import { ONBOARDING_ROUTE, PRIVATE_HOME_ROUTE, useResolvedOnboardingCompletion } from "@/lib/auth";
import { useSessionActivationState } from "@/lib/session-activation";

console.log("[TEMP AUTH DEBUG][auth layout] module evaluated");

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const { user } = useUser();
  const { pending, sessionId } = useSessionActivationState();
  const userId = user?.id ?? null;
  const clerkSessionId = clerk.session?.id ?? null;
  const hasActiveClerkSession = Boolean(userId && clerkSessionId);
  const isResolvedSignedIn = Boolean(isSignedIn || hasActiveClerkSession);
  const {
    hasCompletedOnboarding,
    isLoading: isOnboardingStatusLoading,
  } = useResolvedOnboardingCompletion(user);
  const redirectTarget = hasCompletedOnboarding
    ? PRIVATE_HOME_ROUTE
    : ONBOARDING_ROUTE;
  const routeDecision = !isLoaded
    ? "loading-auth"
    : isResolvedSignedIn && isOnboardingStatusLoading
      ? "loading-onboarding"
      : isResolvedSignedIn
        ? redirectTarget
        : pending
          ? "loading-pending-activation"
          : "auth-stack";

  if (__DEV__) {
    console.log("[ONBOARDING ROUTING][auth layout]", {
      signedInStatus: isSignedIn,
      userId,
      clerkSessionId,
      hasActiveClerkSession,
      isResolvedSignedIn,
      clerkMetadataOnboardingValue: {
        unsafe: user?.unsafeMetadata?.onboardingCompleted ?? null,
        public: user?.publicMetadata?.onboardingCompleted ?? null,
      },
      secureStoreKey: userId ? `onboarding_completed_${userId}` : null,
      resolvedOnboardingCompleted: hasCompletedOnboarding,
      finalRoute: routeDecision,
      pendingActivation: pending,
      pendingSessionId: sessionId,
    });
  }

  if (!isLoaded || pending || (isResolvedSignedIn && isOnboardingStatusLoading)) {
    return <RouteStatusScreen title="Loading session..." />;
  }

  if (isResolvedSignedIn) {
    return <Redirect href={redirectTarget} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
