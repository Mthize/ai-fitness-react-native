/**
 * SplashStepTwoScreen
 *
 * Route: /splash-two
 * Screen Name: Step 2
 *
 * Second screen in the three-step onboarding splash flow. Displays the
 * "Start your Fitness Journey" tagline with the app logo. Auto-advances
 * to Step 3 after 2.2 seconds, or on tap.
 *
 * Screen Naming Convention:
 * - Component export: SplashStepTwoScreen
 * - Route file: splash-two.tsx (kebab-case for Expo Router)
 * - User-facing label: "Step 2" (if shown in UI)
 *
 * Navigation Flow:
 * - Previous: / (Step 1 — SplashStepOneScreen)
 * - Next: /splash-three (Step 3 — SplashStepThreeScreen)
 *
 * @see app/index.tsx for Step 1
 * @see app/splash-three.tsx for Step 3
 */

import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";

export default function SplashStepTwoScreen() {
  const hasNavigatedRef = useRef(false);

  const goToNextScreen = () => {
    if (hasNavigatedRef.current) return;

    hasNavigatedRef.current = true;
    router.replace("/splash-three");
  };

  useEffect(() => {
    const timer = setTimeout(goToNextScreen, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppScreen pressable onPress={goToNextScreen}>
      <View style={styles.container}>
        <Image
          source={require("../assets/Group 19104.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.textGroup}>
          <Text
            style={{
              ...styles.heading,
              fontFamily: "MontserratAlternates-Bold",
              color: colors.journeyText,
            }}
          >
            Start your
          </Text>

          <Text
            style={{
              ...styles.subheading,
              fontFamily: "MontserratAlternates-Bold",
            }}
          >
            <Text style={{ color: colors.fitnessText }}>Fitness</Text>
            <Text style={{ color: colors.journeyText }}> Journey</Text>
          </Text>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  logo: {
    width: 52,
    height: 53,
  },
  textGroup: {
    marginTop: 22,
    alignItems: "center",
  },
  heading: {
    textAlign: "center",
    fontSize: 33,
    lineHeight: 39,
  },
  subheading: {
    marginTop: -1,
    textAlign: "center",
    fontSize: 33,
    lineHeight: 39,
  },
});
