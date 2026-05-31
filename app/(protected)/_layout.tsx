import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/lib/clerk-expo-runtime";

export default function ProtectedLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  // Keep every private route inside this group so signed-out users cannot
  // reach onboarding, dashboard, workout, or user-data screens directly.
  return <Stack screenOptions={{ headerShown: false }} />;
}
