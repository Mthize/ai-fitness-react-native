import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";

import { AppButton } from "@/components/AppButton";
import { AuthBackButton } from "@/components/auth/AuthBackButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";
import { useSignIn } from "@/lib/clerk-react-runtime";
import { getClerkErrorMessage } from "@/lib/auth";

export default function ResetPasswordScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isSubmitting = fetchStatus === "fetching";
  const canReset = signIn.status === "needs_new_password";

  useEffect(() => {
    setFormError(null);
    setHasSubmitted(false);
  }, []);

  async function handleResetPassword() {
    setHasSubmitted(true);
    setFormError(null);

    if (!password) {
      setFormError("Please enter your password.");
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

    const result = await signIn.resetPasswordEmailCode.submitPassword({
      password,
      signOutOfOtherSessions: true,
    });

    if (result.error) {
      setFormError(
        result.error.longMessage ??
          result.error.message ??
          "Unable to reset your password.",
      );
      return;
    }

    signIn.reset();
    router.replace("/(auth)/password-changed");
  }

  const errorMessage =
    formError ??
    (hasSubmitted ? getClerkErrorMessage(errors, ["password", "code"], "") : "");

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

            <Text style={styles.heading}>
              Create new{"\n"}password
            </Text>
            <Text style={styles.helperText}>
              Your new password must be unique from those previously used.
            </Text>

            {canReset ? (
              <View style={styles.form}>
                <PasswordInput
                  label=""
                  placeholder="New Password"
                  autoComplete="new-password"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setFormError(null);
                    setHasSubmitted(false);
                  }}
                />

                <PasswordInput
                  label=""
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    setFormError(null);
                    setHasSubmitted(false);
                  }}
                />

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                <AppButton
                  label={isSubmitting ? "Updating..." : "Reset Password"}
                  variant="register"
                  disabled={isSubmitting}
                  onPress={handleResetPassword}
                />
              </View>
            ) : (
              <Text style={styles.guardText}>
                This screen is only available after a valid reset code has been
                verified.
              </Text>
            )}
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
  guardText: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    lineHeight: 20,
  },
});
