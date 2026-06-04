/**
 * SplashStepThreeScreen
 *
 * Route: /splash-three
 * Screen Name: Step 3
 *
 * Final screen in the three-step onboarding splash flow. Displays the
 * "Start your Fitness Journey" tagline with Login and Register buttons.
 * This is the entry point for user authentication.
 *
 * Screen Naming Convention:
 * - Component export: SplashStepThreeScreen
 * - Route file: splash-three.tsx (kebab-case for Expo Router)
 * - User-facing label: "Step 3" (if shown in UI)
 *
 * Navigation Flow:
 * - Previous: /splash-two (Step 2 — SplashStepTwoScreen)
 * - Next: /login or /register
 *
 * @see app/index.tsx for Step 1
 * @see app/splash-two.tsx for Step 2
 * @see app/(auth)/login.tsx for LoginSignUpScreen
 * @see app/(auth)/register.tsx for LoginStepTwoScreen
 */

import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";

export default function SplashStepThreeScreen() {
  return (
    <AppScreen contentStyle={styles.screen}>
      <View style={styles.content}>
        <View style={styles.bottomContent}>
          <View style={styles.mainGroup}>
            <Image
              source={require("../assets/Group 19104.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.titleGroup}>
              <Text style={styles.titleText}>Start your</Text>
              <Text style={styles.titleText}>
                <Text style={{ color: colors.fitnessText }}>Fitness</Text>
                <Text style={{ color: colors.journeyText }}> Journey</Text>
              </Text>
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <AppButton
              label="Login"
              variant="login"
              onPress={() => router.push("/login")}
            />

            <View style={styles.buttonGap} />

            <AppButton
              label="Register"
              variant="register"
              onPress={() => router.push("/register")}
            />

            <Pressable onPress={() => router.push("/login")}>
              <Text style={styles.guestText}>Continue as a guest</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 28,
  },
  content: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    paddingBottom: 34,
  },
  bottomContent: {
    width: "100%",
    alignItems: "center",
  },
  mainGroup: {
    width: "100%",
    alignItems: "center",
    marginBottom: 72,
  },
  logo: {
    width: 52,
    height: 53,
  },
  titleGroup: {
    marginTop: 22,
    alignItems: "center",
  },
  titleText: {
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 33,
    lineHeight: 39,
    textAlign: "center",
    color: colors.journeyText,
  },
  buttonGroup: {
    width: "100%",
  },
  buttonGap: {
    height: 10,
  },
  guestText: {
    marginTop: 8,
    textAlign: "center",
    color: colors.guestText,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Poppins-SemiBold",
    textDecorationLine: "underline",
  },
});
