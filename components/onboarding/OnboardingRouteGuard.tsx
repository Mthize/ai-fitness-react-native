import type { ReactNode } from "react";
import { Redirect } from "expo-router";

import { RouteStatusScreen } from "@/components/RouteStatusScreen";
import {
  getUserOnboardingCompleted,
  LOGIN_ROUTE,
  PRIVATE_HOME_ROUTE,
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
  const clerkSessionId = clerk.session?.id ?? null;
  const onboardingCompleted = getUserOnboardingCompleted(user);
  const isSessionAvailable =
    isSignedIn || pending || Boolean(clerkSessionId) || Boolean(user?.id);
  let redirectTarget: string | null = null;

  if (isLoaded) {
    if (isSignedIn && onboardingCompleted) {
      redirectTarget = PRIVATE_HOME_ROUTE;
    } else if (!isSessionAvailable) {
      redirectTarget = LOGIN_ROUTE;
    }
  }

  console.log("[ONBOARDING GUARD DEBUG] isLoaded", isLoaded);
  console.log("[ONBOARDING GUARD DEBUG] isSignedIn", isSignedIn);
  console.log("[ONBOARDING GUARD DEBUG] userId", user?.id ?? null);
  console.log("[ONBOARDING GUARD DEBUG] clerkSessionId", clerkSessionId);
  console.log("[ONBOARDING GUARD DEBUG] pendingActivation", pending);
  console.log("[ONBOARDING GUARD DEBUG] pendingSessionId", sessionId);
  console.log(
    "[ONBOARDING GUARD DEBUG] onboardingCompleted",
    onboardingCompleted,
  );
  console.log("[ONBOARDING GUARD DEBUG] redirectTarget", redirectTarget);

  if (!isLoaded) {
    return <RouteStatusScreen title="Loading session..." />;
  }

  if (pending || clerkSessionId) {
    return <>{children}</>;
  }

  if (redirectTarget === PRIVATE_HOME_ROUTE) {
    return <Redirect href={PRIVATE_HOME_ROUTE} />;
  }

  if (redirectTarget === LOGIN_ROUTE) {
    return <Redirect href={LOGIN_ROUTE} />;
  }

  return <>{children}</>;
}
