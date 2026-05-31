import { Link, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";

import { AppButton } from "@/components/AppButton";
import { AuthSocialButton } from "@/components/auth/AuthSocialButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AppScreen } from "@/components/AppScreen";
import { AuthBackButton } from "@/components/auth/AuthBackButton";
import { colors } from "@/constants/colors";
import { useSSO } from "@/lib/clerk-expo-runtime";
import { useSignUp } from "@/lib/clerk-react-runtime";
import { getClerkErrorMessage, ONBOARDING_ROUTE } from "@/lib/auth";

WebBrowser.maybeCompleteAuthSession();

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

async function checkUsernameAvailability(username: string) {
  // TODO: Replace this client placeholder with a secure backend endpoint that
  // checks Clerk users for username uniqueness using Clerk Backend API.
  return {
    available: true,
    normalizedUsername: username.trim(),
  };
}

export default function RegisterScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [username, setUsername] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [activeSocialProvider, setActiveSocialProvider] = useState<
    "google" | "apple" | null
  >(null);

  const isSubmitting = fetchStatus === "fetching";
  const isSocialSubmitting = activeSocialProvider !== null;

  useEffect(() => {
    setFormError(null);
    setHasSubmitted(false);
  }, []);

  function clearErrorState() {
    setFormError(null);
    setHasSubmitted(false);
  }

  async function handleRegister() {
    setHasSubmitted(true);
    setFormError(null);

    const normalizedUsername = username.trim();
    const normalizedEmailAddress = emailAddress.trim();

    if (!normalizedUsername) {
      setFormError("Please enter your username.");
      return;
    }

    if (!normalizedEmailAddress) {
      setFormError("Please enter your email.");
      return;
    }

    if (!password) {
      setFormError("Please enter your password.");
      return;
    }

    if (!STRONG_PASSWORD_REGEX.test(password)) {
      setFormError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.",
      );
      return;
    }

    if (!confirmPassword) {
      setFormError("Please confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    const availability = await checkUsernameAvailability(normalizedUsername);

    if (!availability.available) {
      setFormError("That username is already taken.");
      return;
    }

    const { error } = await signUp.create({
      emailAddress: normalizedEmailAddress,
      password,
      unsafeMetadata: {
        username: availability.normalizedUsername,
      },
    });

    if (error) {
      setFormError(
        error.longMessage ?? error.message ?? "Unable to create your account.",
      );
      return;
    }

    const verification = await signUp.verifications.sendEmailCode();

    if (verification.error) {
      setFormError(
        verification.error.longMessage ??
          verification.error.message ??
          "Unable to send the verification code.",
      );
      return;
    }

    router.push({
      pathname: "/(auth)/otp-verification",
      params: {
        flow: "sign-up",
        email: normalizedEmailAddress,
      },
    });
  }

  async function handleSocialAuth(strategy: "oauth_google" | "oauth_apple") {
    setHasSubmitted(true);
    setFormError(null);
    setActiveSocialProvider(strategy === "oauth_google" ? "google" : "apple");

    try {
      const { createdSessionId, setActive, authSessionResult } =
        await startSSOFlow({ strategy });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace(ONBOARDING_ROUTE);
        return;
      }

      if (authSessionResult?.type === "cancel") {
        setFormError("Social sign-up was cancelled.");
        return;
      }

      setFormError("Unable to complete social sign-up.");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to complete social sign-up.",
      );
    } finally {
      setActiveSocialProvider(null);
    }
  }

  const errorMessage =
    formError ??
    (hasSubmitted
      ? getClerkErrorMessage(errors, ["emailAddress", "password", "username", "code"], "")
      : "");

  return (
    <AppScreen contentStyle={styles.screen}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <View>
            <AuthBackButton />

            <Image
              source={require("../../assets/Group 19104.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.heading}>
              Hello! Register to get{"\n"}started
            </Text>

            <View style={styles.form}>
              <AuthInput
                label=""
                placeholder="Username"
                autoComplete="username"
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  clearErrorState();
                }}
              />

              <AuthInput
                label=""
                placeholder="Email"
                keyboardType="email-address"
                autoComplete="email"
                value={emailAddress}
                onChangeText={(value) => {
                  setEmailAddress(value);
                  clearErrorState();
                }}
              />

              <PasswordInput
                label=""
                placeholder="Password"
                autoComplete="new-password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  clearErrorState();
                }}
              />

              <PasswordInput
                label=""
                placeholder="Confirm Password"
                autoComplete="new-password"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  clearErrorState();
                }}
              />

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <AppButton
                label={isSubmitting ? "Registering..." : "Register"}
                variant="register"
                disabled={isSubmitting || isSocialSubmitting}
                onPress={handleRegister}
              />

              <View style={styles.socialSection}>
                <Text style={styles.socialLabel}>Or continue with</Text>
                <View style={styles.socialRow}>
                  <AuthSocialButton
                    iconName="logo-google"
                    label={
                      activeSocialProvider === "google"
                        ? "Connecting..."
                        : "Google"
                    }
                    disabled={isSubmitting || isSocialSubmitting}
                    onPress={() => handleSocialAuth("oauth_google")}
                  />
                  <AuthSocialButton
                    iconName="logo-apple"
                    label={
                      activeSocialProvider === "apple"
                        ? "Connecting..."
                        : "Apple"
                    }
                    disabled={isSubmitting || isSocialSubmitting}
                    onPress={() => handleSocialAuth("oauth_apple")}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <Text style={styles.footerLink}>Login Now</Text>
            </Link>
          </View>
        </View>

        <View nativeID="clerk-captcha" />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 28,
    paddingTop: 12,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 28,
  },
  logo: {
    width: 48,
    height: 48,
    marginTop: 22,
    marginBottom: 24,
  },
  heading: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 25,
    lineHeight: 32,
    marginBottom: 24,
  },
  form: {
    gap: 12,
  },
  errorText: {
    color: "#FCA5A5",
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  socialSection: {
    marginTop: 4,
    gap: 10,
  },
  socialLabel: {
    color: "rgba(255,255,255,0.58)",
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  socialRow: {
    flexDirection: "row",
    gap: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingTop: 28,
  },
  footerText: {
    color: colors.journeyText,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  footerLink: {
    color: colors.fitnessText,
    fontFamily: "Poppins-Bold",
    fontSize: 14,
    lineHeight: 20,
  },
});
