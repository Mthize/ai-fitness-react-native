import { Redirect, Stack } from "expo-router";

import { RouteStatusScreen } from "@/components/RouteStatusScreen";
import { useAuth, useUser } from "@/lib/clerk";
import { getSignedInRedirectRoute } from "@/lib/auth";
import { useSessionActivationState } from "@/lib/session-activation";

console.log("[TEMP AUTH DEBUG][auth layout] module evaluated");

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { pending, sessionId } = useSessionActivationState();
  const redirectTarget = getSignedInRedirectRoute(user);

  console.log("[TEMP AUTH DEBUG][auth layout] rendered");
  console.log("[TEMP AUTH DEBUG][auth layout] isLoaded", isLoaded);
  console.log("[TEMP AUTH DEBUG][auth layout] isSignedIn", isSignedIn);
  console.log("[TEMP AUTH DEBUG][auth layout] pending activation", pending);
  console.log("[TEMP AUTH DEBUG][auth layout] pending session id", sessionId);
  console.log("[TEMP AUTH DEBUG][auth layout] redirect target", redirectTarget);

  if (!isLoaded) {
    return <RouteStatusScreen title="Loading session..." />;
  }

  if (isSignedIn || pending) {
    return <Redirect href={redirectTarget} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
