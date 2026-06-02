import { Link, router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";

import { AppButton } from "@/components/AppButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { AppScreen } from "@/components/AppScreen";
import { AuthBackButton } from "@/components/auth/AuthBackButton";
import { colors } from "@/constants/colors";
import { useSignIn } from "@/lib/clerk";
import { getClerkErrorMessage } from "@/lib/auth";

export default function ForgotPasswordScreen() {
  const { isLoaded, signIn, errors, fetchStatus } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isSubmitting = fetchStatus === "fetching";

  useEffect(() => {
    setFormError(null);
    setHasSubmitted(false);
  }, []);

  async function handleSendCode() {
    if (!isLoaded) {
      return;
    }

    setHasSubmitted(true);
    setFormError(null);

    if (!emailAddress.trim()) {
      setFormError("Please enter your email.");
      return;
    }

    const created = await signIn.create({
      identifier: emailAddress.trim(),
    });

    if (created.error) {
      setFormError(
        created.error.longMessage ??
          created.error.message ??
          "Unable to start password reset.",
      );
      return;
    }

    const sent = await signIn.resetPasswordEmailCode.sendCode();

    if (sent.error) {
      setFormError(
        sent.error.longMessage ??
          sent.error.message ??
          "Unable to send the reset code.",
      );
      return;
    }

    router.push({
      pathname: "/(auth)/otp-verification",
      params: {
        flow: "reset-password",
        email: emailAddress.trim(),
      },
    });
  }

  const errorMessage =
    formError ??
    (hasSubmitted
      ? getClerkErrorMessage(errors, ["identifier", "emailAddress"], "")
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

            <Text style={styles.heading}>Forgot Password?</Text>
            <Text style={styles.helperText}>
              Don&apos;t worry! It occurs. Please enter the email address linked with
              your account.
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
                  setFormError(null);
                  setHasSubmitted(false);
                }}
              />

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <AppButton
                label={isSubmitting ? "Sending Code..." : "Send Code"}
                variant="register"
                disabled={!isLoaded || isSubmitting}
                onPress={handleSendCode}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember Password?</Text>
            <Link href="/(auth)/login" asChild>
              <Text style={styles.footerLink}>Login</Text>
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
  heading: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 25,
    lineHeight: 32,
    marginTop: 26,
    marginBottom: 10,
  },
  helperText: {
    color: "rgba(255, 255, 255, 0.66)",
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    lineHeight: 20,
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
