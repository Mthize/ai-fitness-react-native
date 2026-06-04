import type { ReactNode } from "react";
import { Redirect } from "expo-router";

import { RouteStatusScreen } from "@/components/RouteStatusScreen";
import {
  LOGIN_ROUTE,
  PRIVATE_HOME_ROUTE,
  useResolvedOnboardingCompletion,
} from "@/lib/auth";
import { useAuth, useClerk, useUser } from "@/lib/clerk";
import { useSessionActivationState } from "@/lib/session-activation";

type OnboardingRouteGuardProps = {
  children: ReactNode;
};

export function OnboardingRouteGuard({
  children,
}: OnboardingRouteGuardProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const { user } = useUser();
  const { pending, sessionId } = useSessionActivationState();
  const userId = user?.id ?? null;
  const clerkSessionId = clerk.session?.id ?? null;
  const hasActiveClerkSession = Boolean(userId && clerkSessionId);
  const isResolvedSignedIn = Boolean(isSignedIn || hasActiveClerkSession);
  const {
    hasCompletedOnboarding: onboardingCompleted,
    isLoading: isOnboardingStatusLoading,
  } = useResolvedOnboardingCompletion(user);
  const routeDecision = !isLoaded
    ? "loading-auth"
    : isResolvedSignedIn && isOnboardingStatusLoading
      ? "loading-onboarding"
      : isResolvedSignedIn && onboardingCompleted
        ? PRIVATE_HOME_ROUTE
        : isResolvedSignedIn
          ? "allow-onboarding"
          : pending
            ? "loading-pending-activation"
            : LOGIN_ROUTE;

  if (__DEV__) {
    console.log("[ONBOARDING ROUTING][guard]", {
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
      resolvedOnboardingCompleted: onboardingCompleted,
      finalRoute: routeDecision,
      pendingActivation: pending,
      pendingSessionId: sessionId,
    });
  }

  if (!isLoaded || pending || (isResolvedSignedIn && isOnboardingStatusLoading)) {
    return <RouteStatusScreen title="Loading session..." />;
  }

  if (isResolvedSignedIn && onboardingCompleted) {
    return <Redirect href={PRIVATE_HOME_ROUTE} />;
  }

  if (!isResolvedSignedIn) {
    return <Redirect href={LOGIN_ROUTE} />;
  }

  return <>{children}</>;
}
