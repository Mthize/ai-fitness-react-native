import { Redirect, Stack } from "expo-router";

import { RouteStatusScreen } from "@/components/RouteStatusScreen";
import { useAuth, useClerk, useUser } from "@/lib/clerk";
import { ONBOARDING_ROUTE, PRIVATE_HOME_ROUTE, useResolvedOnboardingCompletion } from "@/lib/auth";
import { useSessionActivationState } from "@/lib/session-activation";

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const { user } = useUser();
  const { pending } = useSessionActivationState();
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

  if (!isLoaded || pending || (isResolvedSignedIn && isOnboardingStatusLoading)) {
    return <RouteStatusScreen title="Loading session..." />;
  }

  if (isResolvedSignedIn) {
    return <Redirect href={redirectTarget} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
