import { Redirect, Slot } from "expo-router";
import { useEffect } from "react";

import { RouteStatusScreen } from "@/components/RouteStatusScreen";
import { useAuth, useClerk, useUser } from "@/lib/clerk";
import { LOGIN_ROUTE, OnboardingProvider } from "@/lib/auth";
import {
  clearSessionActivationPending,
  useSessionActivationState,
} from "@/lib/session-activation";

export default function ProtectedLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const { user } = useUser();
  const { pending, sessionId } = useSessionActivationState();
  const clerkSessionId = clerk.session?.id ?? null;
  const hasSessionSignal =
    isSignedIn || Boolean(user?.id) || Boolean(clerkSessionId);
  const shouldAllowProtected = hasSessionSignal;

  useEffect(() => {
    const sessionMatchesPending =
      Boolean(clerkSessionId) &&
      (!sessionId || clerkSessionId === sessionId);

    if (pending && (Boolean(user?.id) || isSignedIn || sessionMatchesPending)) {
      clearSessionActivationPending(
        sessionMatchesPending
          ? "clerk session available and matched pending session"
          : isSignedIn
            ? "auth state signed in"
            : "user object available",
      );
    }
  }, [clerkSessionId, isSignedIn, pending, sessionId, user?.id]);

  if (pending || (!isLoaded && !shouldAllowProtected)) {
    return <RouteStatusScreen title="Loading session..." />;
  }

  if (!shouldAllowProtected) {
    return <Redirect href={LOGIN_ROUTE} />;
  }

  return (
    <OnboardingProvider key={user?.id ?? "onboarding"} user={user}>
      <Slot />
    </OnboardingProvider>
  );
}
