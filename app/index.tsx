/**
 * SplashStepOneScreen
 *
 * Route: / (index.tsx — first screen shown on app launch)
 * Screen Name: Step 1
 *
 * This is the initial splash screen that displays the app logo while
 * checking authentication state. It serves as the entry point for the
 * three-step onboarding splash flow.
 *
 * Screen Naming Convention:
 * - Component export: SplashStepOneScreen
 * - Route file: index.tsx (kept as-is to preserve Expo Router navigation)
 * - User-facing label: "Step 1" (if shown in UI)
 * - This screen auto-advances to /splash-two after 2 seconds
 *
 * Navigation Flow:
 * - Unauthenticated users: Step 1 → Step 2 → Step 3 → Login/Register
 * - Authenticated users: Redirects to onboarding or home
 *
 * @see app/splash-two.tsx for Step 2
 * @see app/splash-three.tsx for Step 3
 */

import { Redirect, router } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import {
  ONBOARDING_ROUTE,
  PRIVATE_HOME_ROUTE,
  useResolvedOnboardingCompletion,
} from "@/lib/auth";
import { useAuth, useClerk, useUser } from "@/lib/clerk";
import { useSessionActivationState } from "@/lib/session-activation";

export default function SplashStepOneScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const { user } = useUser();
  const { pending } = useSessionActivationState();
  const userId = user?.id ?? null;
  const clerkSessionId = clerk.session?.id ?? null;
  const hasActiveClerkSession = Boolean(userId && clerkSessionId);
  const isResolvedSignedIn = Boolean(isSignedIn || hasActiveClerkSession);
  const isAuthTransitioning = pending && !isResolvedSignedIn;
  const {
    hasCompletedOnboarding: onboardingCompleted,
    isLoading: isOnboardingStatusLoading,
  } = useResolvedOnboardingCompletion(user);
  const shouldEnterProtected = isResolvedSignedIn;
  const routeDecision = !isLoaded || isAuthTransitioning
    ? "loading-auth"
    : shouldEnterProtected && isOnboardingStatusLoading
      ? "loading-onboarding"
      : shouldEnterProtected
        ? onboardingCompleted
          ? PRIVATE_HOME_ROUTE
          : ONBOARDING_ROUTE
        : "/splash-two";

  useEffect(() => {
    if (!isLoaded || shouldEnterProtected) {
      return;
    }

    const timer = setTimeout(() => {
      router.replace("/splash-two");
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoaded, shouldEnterProtected]);

  if (__DEV__) {
    console.log("[ONBOARDING ROUTING][index]", {
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
    });
  }

  if (!isLoaded || isAuthTransitioning || (shouldEnterProtected && isOnboardingStatusLoading)) {
    return null;
  }

  if (shouldEnterProtected) {
    return (
      <Redirect
        href={
          onboardingCompleted ? PRIVATE_HOME_ROUTE : ONBOARDING_ROUTE
        }
      />
    );
  }

  return (
    <AppScreen>
      <View style={styles.container}>
        <Image
          source={require("../assets/Group 19104.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 44,
    height: 45,
  },
});
