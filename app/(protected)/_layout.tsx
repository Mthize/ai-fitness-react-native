import { Redirect, Slot } from "expo-router";
import { useEffect } from "react";

import { RouteStatusScreen } from "@/components/RouteStatusScreen";
import { useAuth, useClerk, useUser } from "@/lib/clerk";
import { LOGIN_ROUTE, OnboardingProvider } from "@/lib/auth";
import {
  clearSessionActivationPending,
  useSessionActivationState,
} from "@/lib/session-activation";

console.log("[TEMP AUTH DEBUG][protected layout] module evaluated");

export default function ProtectedLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const { user } = useUser();
  const { pending, sessionId } = useSessionActivationState();
  const clerkSessionId = clerk.session?.id ?? null;
  const hasSessionSignal =
    isSignedIn || Boolean(user?.id) || Boolean(clerkSessionId);
  const shouldAllowProtected =
    isSignedIn || pending || Boolean(user?.id) || Boolean(clerkSessionId);

  console.log("[TEMP AUTH DEBUG][protected layout] rendered");
  console.log("[TEMP AUTH DEBUG][protected layout] isLoaded", isLoaded);
  console.log("[TEMP AUTH DEBUG][protected layout] isSignedIn", isSignedIn);
  console.log("[TEMP AUTH DEBUG][protected layout] pending activation", pending);
  console.log("[TEMP AUTH DEBUG][protected layout] pending session id", sessionId);
  console.log(
    "[TEMP AUTH DEBUG][protected layout] clerk session id",
    clerkSessionId,
  );
  console.log(
    "[TEMP AUTH DEBUG][protected layout] shouldAllowProtected",
    shouldAllowProtected,
  );

  useEffect(() => {
    const sessionMatchesPending =
      Boolean(clerkSessionId) &&
      (!sessionId || clerkSessionId === sessionId);

    if (pending && (Boolean(user?.id) || isSignedIn || sessionMatchesPending)) {
      console.log(
        "[TEMP AUTH DEBUG][protected layout] clearing pending activation safely",
      );
      clearSessionActivationPending(
        sessionMatchesPending
          ? "clerk session available and matched pending session"
          : isSignedIn
            ? "auth state signed in"
            : "user object available",
      );
    }
  }, [clerkSessionId, isSignedIn, pending, sessionId, user?.id]);

  if (!isLoaded && !shouldAllowProtected) {
    return <RouteStatusScreen title="Loading session..." />;
  }

  if (!shouldAllowProtected && !hasSessionSignal) {
    return <Redirect href={LOGIN_ROUTE} />;
  }

  console.log("[TEMP AUTH DEBUG][protected layout] rendering protected slot");

  return (
    <OnboardingProvider key={user?.id ?? "onboarding"} user={user}>
      <Slot />
    </OnboardingProvider>
  );
}
