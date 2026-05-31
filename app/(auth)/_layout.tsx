import { Stack, router } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/lib/clerk-expo-runtime";

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/(protected)/onboarding");
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || isSignedIn) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
