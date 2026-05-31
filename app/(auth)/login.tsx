import { Link, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";

import { AppButton } from "@/components/AppButton";
import { AuthSocialButton } from "@/components/auth/AuthSocialButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthInput } from "@/components/auth/AuthInput";
import { AppScreen } from "@/components/AppScreen";
import { AuthBackButton } from "@/components/auth/AuthBackButton";
import { colors } from "@/constants/colors";
import { useSSO } from "@/lib/clerk-expo-runtime";
import { useSignIn } from "@/lib/clerk-react-runtime";
import { getClerkErrorMessage, ONBOARDING_ROUTE } from "@/lib/auth";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
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

  async function handleLogin() {
    setHasSubmitted(true);
    setFormError(null);

    if (!emailAddress.trim()) {
      setFormError("Please enter your email.");
      return;
    }

    if (!password) {
      setFormError("Please enter your password.");
      return;
    }

    const { error } = await signIn.password({
      emailAddress: emailAddress.trim(),
      password,
    });

    if (error) {
      setFormError(
        error.longMessage ?? error.message ?? "Unable to sign in right now.",
      );
      return;
    }

    if (signIn.status === "complete") {
      const finalized = await signIn.finalize();

      if (finalized.error) {
        setFormError(
          finalized.error.longMessage ??
            finalized.error.message ??
            "Unable to finish signing in.",
        );
        return;
      }

      router.replace(ONBOARDING_ROUTE);
      return;
    }

    setFormError("This sign-in attempt needs an additional step.");
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
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    clearErrorState();
                  }}
                />

                <View style={styles.forgotPasswordRow}>
                  <Link href="/(auth)/forgot-password" asChild>
                    <Text style={styles.secondaryLink}>Forgot Password?</Text>
                  </Link>
                </View>
              </View>

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <AppButton
                label={isSubmitting ? "Logging In..." : "Login"}
                variant="register"
                disabled={isSubmitting || isSocialSubmitting}
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
            <Link href="/(auth)/register" asChild>
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
  passwordGroup: {
    gap: 8,
  },
  forgotPasswordRow: {
    alignItems: "flex-end",
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
