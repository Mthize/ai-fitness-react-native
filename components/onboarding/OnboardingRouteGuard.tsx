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
  const { pending } = useSessionActivationState();
  const userId = user?.id ?? null;
  const clerkSessionId = clerk.session?.id ?? null;
  const hasActiveClerkSession = Boolean(userId && clerkSessionId);
  const isResolvedSignedIn = Boolean(isSignedIn || hasActiveClerkSession);
  const {
    hasCompletedOnboarding: onboardingCompleted,
    isLoading: isOnboardingStatusLoading,
  } = useResolvedOnboardingCompletion(user);

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
