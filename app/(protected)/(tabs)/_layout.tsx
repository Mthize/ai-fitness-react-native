import { Redirect, Tabs } from "expo-router";

import { RouteStatusScreen } from "@/components/RouteStatusScreen";
import {
  getUserOnboardingCompleted,
  LOGIN_ROUTE,
  ONBOARDING_ROUTE,
} from "@/lib/auth";
import { useAuth, useClerk, useUser } from "@/lib/clerk";
import { useSessionActivationState } from "@/lib/session-activation";

export default function ProtectedTabsLayout() {
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
    if (pending) {
      redirectTarget = ONBOARDING_ROUTE;
    } else if (!isSessionAvailable) {
      redirectTarget = LOGIN_ROUTE;
    } else if (!onboardingCompleted) {
      redirectTarget = ONBOARDING_ROUTE;
    }
  }

  console.log("[TABS ONBOARDING DEBUG] isLoaded", isLoaded);
  console.log("[TABS ONBOARDING DEBUG] pendingActivation", pending);
  console.log("[TABS ONBOARDING DEBUG] pendingSessionId", sessionId);
  console.log("[TABS ONBOARDING DEBUG] isSignedIn", isSignedIn);
  console.log("[TABS ONBOARDING DEBUG] userId", user?.id ?? null);
  console.log("[TABS ONBOARDING DEBUG] clerkSessionId", clerkSessionId);
  console.log(
    "[TABS ONBOARDING DEBUG] unsafeMetadata",
    user?.unsafeMetadata ?? null,
  );
  console.log(
    "[TABS ONBOARDING DEBUG] onboardingCompleted",
    onboardingCompleted,
  );
  console.log("[TABS ONBOARDING DEBUG] redirectTarget", redirectTarget);

  if (!isLoaded) {
    return <RouteStatusScreen title="Loading session..." />;
  }

  if (redirectTarget) {
    return <Redirect href={redirectTarget} />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="schedule" options={{ title: "Schedule" }} />
      <Tabs.Screen name="statistics" options={{ title: "Statistics" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
