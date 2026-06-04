/**
 * LoginSignUpScreen
 *
 * Route: /login
 * Screen Name: Login / Sign Up
 *
 * Primary authentication screen for email/password login and social sign-in
 * (Google, Apple). This screen handles the complete login flow including
 * form validation, error handling, and session activation.
 *
 * Screen Naming Convention:
 * - Component export: LoginSignUpScreen
 * - Route file: login.tsx (kebab-case for Expo Router)
 * - User-facing heading: "Welcome back! Glad to see you, Again!"
 * - Button label: "Login"
 *
 * Authentication Flow:
 * - Email/password login via Clerk signIn.create()
 * - Social login via OAuth (Google, Apple) using startSSOFlow()
 * - On success: activates session and redirects to /onboarding
 * - On failure: displays error message
 *
 * Related Screens:
 * - /register → LoginStepTwoScreen (registration)
 * - /forgot-password → ForgotPasswordScreen (password reset)
 * - /otp-verification → OTPVerificationScreen (email verification)
 *
 * @see app/(auth)/register.tsx for registration
 * @see app/(auth)/forgot-password.tsx for password reset
 */

import { Link, Redirect, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { AppButton } from "@/components/AppButton";
import { AuthSocialButton } from "@/components/auth/AuthSocialButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthInput } from "@/components/auth/AuthInput";
import { AppScreen } from "@/components/AppScreen";
import { AuthBackButton } from "@/components/auth/AuthBackButton";
import { colors } from "@/constants/colors";
import { useAuth, useClerk, useSignIn, useSSO } from "@/lib/clerk";
import {
  getClerkErrorMessage,
  getReadableErrorMessage,
  ONBOARDING_ROUTE,
} from "@/lib/auth";
import { markSessionActivationPending } from "@/lib/session-activation";

WebBrowser.maybeCompleteAuthSession();

export default function LoginSignUpScreen() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const { setActive } = clerk;
  const { isLoaded: isSignInLoaded, signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivatingSession, setIsActivatingSession] = useState(false);
  const [activeSocialProvider, setActiveSocialProvider] = useState<
    "google" | "apple" | null
  >(null);

  const isSocialSubmitting =
    activeSocialProvider !== null || fetchStatus === "fetching";
  const isFormValid = emailAddress.trim().length > 0 && password.length > 0;
  const isLoginDisabled =
    isSubmitting || isActivatingSession || !isSignInLoaded || !isFormValid;

  console.log("[TEMP AUTH DEBUG][login render] email", emailAddress);
  console.log("[TEMP AUTH DEBUG][login render] password length", password.length);
  console.log("[TEMP AUTH DEBUG][login render] loading", isSubmitting);
  console.log(
    "[TEMP AUTH DEBUG][login render] activating session",
    isActivatingSession,
  );
  console.log("[TEMP AUTH DEBUG][login render] isDisabled", isLoginDisabled);

  if (!isAuthLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href={ONBOARDING_ROUTE} />;
  }

  function clearErrorState() {
    setFormError(null);
    setHasSubmitted(false);
  }

  async function handleLogin() {
    if (!isSignInLoaded) {
      return;
    }

    console.log("[TEMP AUTH DEBUG] login submit");
    setHasSubmitted(true);
    setFormError(null);
    setIsSubmitting(true);

    if (!emailAddress.trim()) {
      setFormError("Please enter your email.");
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      setFormError("Please enter your password.");
      setIsSubmitting(false);
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress.trim(),
        password,
      });

      console.log("[TEMP AUTH DEBUG] signIn status", signInAttempt.status);
      console.log(
        "[TEMP AUTH DEBUG] createdSessionId",
        signInAttempt.createdSessionId,
      );
      console.log(
        "[TEMP AUTH DEBUG] supportedFirstFactors",
        signInAttempt.supportedFirstFactors,
      );
      console.log(
        "[TEMP AUTH DEBUG] firstFactorVerification",
        signInAttempt.firstFactorVerification,
      );

      if (
        signInAttempt.status === "complete" &&
        signInAttempt.createdSessionId
      ) {
        console.log("[TEMP AUTH DEBUG] calling setActive");
        setIsActivatingSession(true);
        markSessionActivationPending(signInAttempt.createdSessionId);
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async () => {
            console.log("[TEMP AUTH DEBUG] setActive navigate callback");
            await new Promise((resolve) => setTimeout(resolve, 100));
            console.log("[TEMP AUTH DEBUG] redirecting /onboarding");
            router.replace(ONBOARDING_ROUTE);
          },
        });
        console.log("[TEMP AUTH DEBUG] setActive complete");
        console.log(
          "[TEMP AUTH DEBUG] current session id",
          clerk.session?.id ?? signInAttempt.createdSessionId,
        );
        return;
      }

      if (signInAttempt.status === "needs_second_factor") {
        setFormError(
          "This account requires a second verification factor before sign-in can finish.",
        );
        return;
      }

      if (signInAttempt.status === "needs_new_password") {
        setFormError(
          "This account requires a password reset before sign-in can finish.",
        );
        return;
      }

      if (signInAttempt.status === "needs_client_trust") {
        setFormError(
          "This sign-in requires additional client verification before it can finish.",
        );
        return;
      }

      setFormError("This sign-in attempt needs an additional step.");
    } catch (error) {
      setFormError(
        getReadableErrorMessage(error, "Unable to sign in right now."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSocialAuth(strategy: "oauth_google" | "oauth_apple") {
    setHasSubmitted(true);
    setFormError(null);
    setActiveSocialProvider(strategy === "oauth_google" ? "google" : "apple");

    try {
      const { createdSessionId, authSessionResult } =
        await startSSOFlow({ strategy });

      if (createdSessionId) {
        console.log("[TEMP AUTH DEBUG] signIn status", "complete");
        console.log("[TEMP AUTH DEBUG] createdSessionId", createdSessionId);
        console.log("[TEMP AUTH DEBUG] calling setActive");
        setIsActivatingSession(true);
        markSessionActivationPending(createdSessionId);
        await setActive({
          session: createdSessionId,
          navigate: async () => {
            console.log("[TEMP AUTH DEBUG] setActive navigate callback");
            await new Promise((resolve) => setTimeout(resolve, 100));
            console.log("[TEMP AUTH DEBUG] redirecting /onboarding");
            router.replace(ONBOARDING_ROUTE);
          },
        });
        console.log("[TEMP AUTH DEBUG] setActive complete");
        console.log(
          "[TEMP AUTH DEBUG] current session id",
          clerk.session?.id ?? createdSessionId,
        );
        return;
      }

      if (authSessionResult?.type === "cancel") {
        setFormError("Social sign-in was cancelled.");
        return;
      }

      setFormError("Unable to complete social sign-in.");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to complete social sign-in.",
      );
    } finally {
      setIsActivatingSession(false);
      setActiveSocialProvider(null);
    }
  }

  const errorMessage =
    formError ??
    (hasSubmitted
      ? getClerkErrorMessage(errors, ["emailAddress", "password", "identifier"], "")
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
              Welcome back! Glad{"\n"}to see you, Again!
            </Text>

            <View style={styles.form}>
              <AuthInput
                label=""
                placeholder="Enter your email"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                editable={!isSubmitting && !isSocialSubmitting}
                value={emailAddress}
                onChangeText={(value) => {
                  setEmailAddress(value);
                  clearErrorState();
                }}
              />

              <View style={styles.passwordGroup}>
                <PasswordInput
                  label=""
                  placeholder="Enter your password"
                  autoComplete="password"
                  textContentType="password"
                  editable={!isSubmitting && !isSocialSubmitting}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    clearErrorState();
                  }}
                />

                <View style={styles.forgotPasswordRow}>
                  <Link href="/forgot-password" asChild>
                    <Text style={styles.secondaryLink}>Forgot Password?</Text>
                  </Link>
                </View>
              </View>

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <AppButton
                label={isSubmitting ? "Logging In..." : "Login"}
                variant="register"
                disabled={isLoginDisabled}
                onPress={handleLogin}
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
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>
            <Link href="/register" asChild>
              <Text style={styles.footerLink}>Register Now</Text>
            </Link>
          </View>
        </View>
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
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 28,
  },
  logo: {
    width: 48,
    height: 48,
    marginTop: 18,
    marginBottom: 20,
  },
  heading: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 25,
    lineHeight: 32,
    marginBottom: 22,
  },
  form: {
    gap: 14,
  },
  passwordGroup: {
    gap: 10,
  },
  forgotPasswordRow: {
    alignItems: "flex-end",
    paddingRight: 4,
  },
  secondaryLink: {
    color: "rgba(255, 255, 255, 0.72)",
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
    lineHeight: 18,
  },
  errorText: {
    color: "#FCA5A5",
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  socialSection: {
    marginTop: 6,
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
