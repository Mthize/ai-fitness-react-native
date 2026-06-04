import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MontserratAlternates_700Bold } from "@expo-google-fonts/montserrat-alternates";

import { ClerkProvider, useAuth, useClerk } from "@/lib/clerk";
import { CLERK_TASK_URLS } from "@/lib/auth";
import { clerkTokenCache } from "@/lib/clerk-token-cache";
import { useSessionActivationState } from "@/lib/session-activation";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add it to your Expo environment before running the app.",
  );
}

function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const { pending } = useSessionActivationState();
  const clerkSessionId = clerk.session?.id ?? null;
  const allowProtected = isSignedIn || pending || Boolean(clerkSessionId);
  const allowAuth = !allowProtected;

  console.log("[TEMP AUTH DEBUG][root layout] isLoaded", isLoaded);
  console.log("[TEMP AUTH DEBUG][root layout] isSignedIn", isSignedIn);
  console.log("[TEMP AUTH DEBUG][root layout] pending activation", pending);
  console.log("[TEMP AUTH DEBUG][root layout] clerk session id", clerkSessionId);

  if (!isLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />

      <Stack.Protected guard={allowAuth}>
        <Stack.Screen name="splash-two" />
        <Stack.Screen name="splash-three" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={allowProtected}>
        <Stack.Screen name="(protected)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "MontserratAlternates-Bold": MontserratAlternates_700Bold,
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [error, loaded]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      taskUrls={CLERK_TASK_URLS}
      tokenCache={clerkTokenCache}
    >
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
