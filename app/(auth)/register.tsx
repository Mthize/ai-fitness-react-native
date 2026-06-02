import { Link, Redirect, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { AppButton } from "@/components/AppButton";
import { AuthSocialButton } from "@/components/auth/AuthSocialButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AppScreen } from "@/components/AppScreen";
import { AuthBackButton } from "@/components/auth/AuthBackButton";
import { colors } from "@/constants/colors";
import { useAuth, useClerk, useSignUp, useSSO, useUser } from "@/lib/clerk";
import {
  getClerkErrorMessage,
  getReadableErrorMessage,
  getSignedInRedirectRoute,
  ONBOARDING_ROUTE,
} from "@/lib/auth";
import { markSessionActivationPending } from "@/lib/session-activation";

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
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const { setActive } = clerk;
  const { user } = useUser();
  const { isLoaded: isSignUpLoaded, signUp, errors, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [username, setUsername] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivatingSession, setIsActivatingSession] = useState(false);
  const [activeSocialProvider, setActiveSocialProvider] = useState<
    "google" | "apple" | null
  >(null);

  const isSocialSubmitting =
    activeSocialProvider !== null || fetchStatus === "fetching";
  const isStrongPassword = STRONG_PASSWORD_REGEX.test(password);
  const isFormValid =
    username.trim().length > 0 &&
    emailAddress.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword &&
    isStrongPassword;
  const isRegisterDisabled =
    isSubmitting || isActivatingSession || !isSignUpLoaded || !isFormValid;

  console.log("[TEMP AUTH DEBUG][register render] username", username);
  console.log("[TEMP AUTH DEBUG][register render] email", emailAddress);
  console.log(
    "[TEMP AUTH DEBUG][register render] password length",
    password.length,
  );
  console.log(
    "[TEMP AUTH DEBUG][register render] confirmPassword length",
    confirmPassword.length,
  );
  console.log("[TEMP AUTH DEBUG][register render] loading", isSubmitting);
  console.log(
    "[TEMP AUTH DEBUG][register render] activating session",
    isActivatingSession,
  );
  console.log("[TEMP AUTH DEBUG][register render] isFormValid", isFormValid);
  console.log(
    "[TEMP AUTH DEBUG][register render] isDisabled",
    isRegisterDisabled,
  );

  if (!isAuthLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href={getSignedInRedirectRoute(user)} />;
  }

  function clearErrorState() {
    setFormError(null);
    setHasSubmitted(false);
  }

  async function handleRegister() {
    if (!isSignUpLoaded) {
      return;
    }

    setHasSubmitted(true);
    setFormError(null);
    setIsSubmitting(true);

    const normalizedUsername = username.trim();
    const normalizedEmailAddress = emailAddress.trim();

    if (!normalizedUsername) {
      setFormError("Please enter your username.");
      setIsSubmitting(false);
      return;
    }

    if (!normalizedEmailAddress) {
      setFormError("Please enter your email.");
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      setFormError("Please enter your password.");
      setIsSubmitting(false);
      return;
    }

    if (!STRONG_PASSWORD_REGEX.test(password)) {
      setFormError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.",
      );
      setIsSubmitting(false);
      return;
    }

    if (!confirmPassword) {
      setFormError("Please confirm your password.");
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    const availability = await checkUsernameAvailability(normalizedUsername);

    if (!availability.available) {
      setFormError("That username is already taken.");
      setIsSubmitting(false);
      return;
    }

    try {
      const signUpAttempt = await signUp.create({
        emailAddress: normalizedEmailAddress,
        password,
        unsafeMetadata: {
          username: availability.normalizedUsername,
        },
      });

      console.log("[TEMP AUTH DEBUG] signUp status", signUpAttempt.status);
      console.log(
        "[TEMP AUTH DEBUG] signUp createdSessionId",
        signUpAttempt.createdSessionId,
      );
      console.log(
        "[TEMP AUTH DEBUG] signUp email verification status",
        signUpAttempt.verifications.emailAddress.status,
      );

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      console.log("[TEMP AUTH DEBUG] email verification prepared");
    } catch (error) {
      setFormError(
        getReadableErrorMessage(error, "Unable to create your account."),
      );
      return;
    } finally {
      setIsSubmitting(false);
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
      const { createdSessionId, authSessionResult } =
        await startSSOFlow({ strategy });

      if (createdSessionId) {
        console.log("[TEMP AUTH DEBUG] signUp status", "complete");
        console.log("[TEMP AUTH DEBUG] signUp createdSessionId", createdSessionId);
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
      setIsActivatingSession(false);
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
                textContentType="username"
                editable={!isSubmitting && !isSocialSubmitting}
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
                textContentType="emailAddress"
                editable={!isSubmitting && !isSocialSubmitting}
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
                textContentType="newPassword"
                editable={!isSubmitting && !isSocialSubmitting}
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
                textContentType="newPassword"
                editable={!isSubmitting && !isSocialSubmitting}
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
                disabled={isRegisterDisabled}
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
