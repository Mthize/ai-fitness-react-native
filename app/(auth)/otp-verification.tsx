/**
 * OTPVerificationScreen
 *
 * Route: /otp-verification
 * Screen Name: OTP Verification
 *
 * One-time password verification screen used for two purposes:
 * 1. Email verification during sign-up (flow="sign-up")
 * 2. Password reset verification (flow="reset-password")
 *
 * Screen Naming Convention:
 * - Component export: OTPVerificationScreen
 * - Route file: otp-verification.tsx (kebab-case for Expo Router)
 * - User-facing heading: "OTP Verification"
 * - Button label: "Verify"
 *
 * Verification Flow:
 * 1. Receive flow and email params from previous screen
 * 2. Display 6-digit OTP input fields
 * 3. On verify: complete sign-up or redirect to reset-password
 * 4. On resend: send new code and restart timer
 *
 * OTP Configuration:
 * - Length: 6 digits
 * - Expiry: 15 seconds (resend cooldown)
 * - Input: Numeric only, auto-advance on digit entry
 *
 * Flow Handling:
 * - sign-up: Uses signUp.attemptEmailAddressVerification()
 * - reset-password: Uses signIn.resetPasswordEmailCode.verifyCode()
 *
 * Related Screens:
 * - /register → LoginStepTwoScreen (sign-up flow)
 * - /forgot-password → ForgotPasswordScreen (reset flow)
 * - /reset-password → ResetPasswordScreen (new password)
 *
 * @see app/(auth)/register.tsx for sign-up initiation
 * @see app/(auth)/forgot-password.tsx for password reset initiation
 * @see app/(auth)/reset-password.tsx for new password entry
 */

import { Link, router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useRef, useState } from "react";

import { AppButton } from "@/components/AppButton";
import { AuthBackButton } from "@/components/auth/AuthBackButton";
import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";
import { useClerk, useSignIn, useSignUp } from "@/lib/clerk";
import {
  getClerkErrorMessage,
  getReadableErrorMessage,
  isSignUpVerificationPending,
  normalizeOtpFlow,
  readParam,
} from "@/lib/auth";
import { markSessionActivationPending } from "@/lib/session-activation";

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 15;
const EMPTY_DIGITS = Array.from({ length: OTP_LENGTH }, () => "");

export default function OTPVerificationScreen() {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { flow: flowParam, email: emailParam } = useLocalSearchParams<{
    flow?: string;
    email?: string;
  }>();
  const flow = normalizeOtpFlow(flowParam);
  const email = readParam(emailParam);

  const {
    signUp,
    errors: signUpErrors,
    fetchStatus: signUpFetchStatus,
  } = useSignUp();
  const {
    signIn,
    errors: signInErrors,
    fetchStatus: signInFetchStatus,
  } = useSignIn();
  const { setActive } = useClerk();

  const [digits, setDigits] = useState<string[]>(() => [...EMPTY_DIGITS]);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(OTP_EXPIRY_SECONDS);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const isSubmitting =
    (flow === "sign-up" ? signUpFetchStatus : signInFetchStatus) === "fetching";

  const code = digits.join("");
  const isCodeComplete = digits.every((digit) => digit.length === 1);
  const isVerifyDisabled = isSubmitting || !isCodeComplete;

  useEffect(() => {
    setFormError(null);
    setSuccessMessage(null);
    setHasSubmitted(false);
  }, []);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      return;
    }

    const timerId = setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          clearInterval(timerId);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [secondsRemaining]);

  function clearMessages() {
    setFormError(null);
    setSuccessMessage(null);
    setHasSubmitted(false);
  }

  function resetCodeState() {
    setDigits([...EMPTY_DIGITS]);
    setFocusedIndex(0);
  }

  function restartExpiryTimer() {
    setSecondsRemaining(OTP_EXPIRY_SECONDS);
  }

  function focusInput(index: number) {
    inputRefs.current[index]?.focus();
    setFocusedIndex(index);
  }

  function handleDigitChange(index: number, value: string) {
    const nextDigits = [...digits];
    const sanitized = value.replace(/\D/g, "");

    clearMessages();

    if (!sanitized) {
      nextDigits[index] = "";
      setDigits(nextDigits);
      return;
    }

    if (sanitized.length > 1) {
      for (let offset = 0; offset < sanitized.length; offset += 1) {
        const nextIndex = index + offset;

        if (nextIndex >= OTP_LENGTH) break;
        nextDigits[nextIndex] = sanitized[offset] ?? "";
      }

      setDigits(nextDigits);
      focusInput(Math.min(index + sanitized.length, OTP_LENGTH - 1));
      return;
    }

    nextDigits[index] = sanitized;
    setDigits(nextDigits);

    if (index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  }

  function handleDigitKeyPress(index: number, key: string) {
    if (key !== "Backspace") return;

    clearMessages();

    if (digits[index]) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      setDigits(nextDigits);
      return;
    }

    if (index === 0) return;

    const nextDigits = [...digits];
    nextDigits[index - 1] = "";
    setDigits(nextDigits);
    focusInput(index - 1);
  }

  function formatTimer(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  async function handleVerify() {
    setHasSubmitted(true);
    setFormError(null);
    setSuccessMessage(null);

    if (!isCodeComplete) {
      setFormError("Please enter the 6-digit verification code.");
      return;
    }

    if (flow === "sign-up") {
      try {
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code,
        });

        if (
          completeSignUp.status === "complete" &&
          completeSignUp.createdSessionId
        ) {
          markSessionActivationPending(completeSignUp.createdSessionId);
          await setActive({
            session: completeSignUp.createdSessionId,
            navigate: async () => {
              await new Promise((resolve) => setTimeout(resolve, 100));
              router.replace("/");
            },
          });
          return;
        }

        setFormError("Verification is not complete yet.");
      } catch (error) {
        setFormError(
          getReadableErrorMessage(
            error,
            "Invalid verification code. Please try again.",
          ),
        );
      }
      return;
    }

    const result = await signIn.resetPasswordEmailCode.verifyCode({
      code,
    });

    if (result.error) {
      setFormError("Invalid verification code. Please try again.");
      return;
    }

    router.replace({
      pathname: "/reset-password",
      params: { email },
    });
  }

  async function handleResendCode() {
    if (secondsRemaining > 0) {
      return;
    }

    setHasSubmitted(true);
    setFormError(null);
    setSuccessMessage(null);

    if (flow === "sign-up") {
      try {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
      } catch (error) {
        setFormError(
          getReadableErrorMessage(error, "Unable to resend the code."),
        );
        return;
      }
    } else {
      const result = await signIn.resetPasswordEmailCode.sendCode();

      if (result.error) {
        setFormError(
          result.error.longMessage ??
            result.error.message ??
            "Unable to resend the reset code.",
        );
        return;
      }
    }

    resetCodeState();
    restartExpiryTimer();
    setSuccessMessage("A new code has been sent.");
  }

  const signUpReady = isSignUpVerificationPending(signUp);
  const resetReady =
    flow === "reset-password" &&
    signIn.identifier &&
    (signIn.status === "needs_first_factor" ||
      signIn.status === "needs_new_password" ||
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust");

  const canUseRoute = flow === "sign-up" ? signUpReady : resetReady;

  const errorMessage =
    formError ??
    (hasSubmitted
      ? getClerkErrorMessage(
          flow === "sign-up" ? signUpErrors : signInErrors,
          ["code", "emailAddress", "identifier"],
          "",
        )
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
            <AuthBackButton
              fallbackHref={flow === "sign-up" ? "/register" : "/forgot-password"}
            />

            <Text style={styles.heading}>OTP Verification</Text>
            <Text style={styles.helperText}>
              Enter the verification code we just sent to your email address.
            </Text>

            {canUseRoute ? (
              <View style={styles.form}>
                <View style={styles.otpRow}>
                  {Array.from({ length: OTP_LENGTH }).map((_, index) => {
                    const value = digits[index] ?? "";
                    const isActive = focusedIndex === index;

                    return (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          inputRefs.current[index] = ref;
                        }}
                        value={value}
                        autoFocus={index === 0}
                        onFocus={() => setFocusedIndex(index)}
                        onPressIn={() => focusInput(index)}
                        onChangeText={(nextValue) => handleDigitChange(index, nextValue)}
                        onKeyPress={({ nativeEvent }) =>
                          handleDigitKeyPress(index, nativeEvent.key)
                        }
                        keyboardType="number-pad"
                        autoComplete="one-time-code"
                        textContentType="oneTimeCode"
                        maxLength={OTP_LENGTH}
                        selectionColor={colors.journeyText}
                        returnKeyType="done"
                        style={[
                          styles.otpBox,
                          styles.otpInput,
                          isActive ? styles.otpBoxActive : null,
                        ]}
                      />
                    );
                  })}
                </View>

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                {successMessage ? (
                  <Text style={styles.successText}>{successMessage}</Text>
                ) : null}

                <AppButton
                  label={isSubmitting ? "Verifying..." : "Verify"}
                  variant="register"
                  disabled={isVerifyDisabled}
                  onPress={handleVerify}
                />
              </View>
            ) : (
              <View style={styles.guardBlock}>
                <Text style={styles.guardText}>
                  This verification step only works after the matching sign-up
                  or password reset flow has started on this device.
                </Text>

                <Link
                  href={flow === "sign-up" ? "/register" : "/forgot-password"}
                  asChild
                >
                  <Text style={styles.restartLink}>Start over</Text>
                </Link>
              </View>
            )}
          </View>

          {canUseRoute ? (
            <View style={styles.footer}>
              <View style={styles.footerGroup}>
                <Text style={styles.footerText}>Didn&apos;t receive code?</Text>
                <Pressable
                  onPress={handleResendCode}
                  disabled={secondsRemaining > 0 || isSubmitting}
                >
                  <Text
                    style={[
                      styles.footerLink,
                      secondsRemaining > 0 || isSubmitting
                        ? styles.footerLinkDisabled
                        : null,
                    ]}
                  >
                    Resend
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.timerText}>{formatTimer(secondsRemaining)}</Text>
            </View>
          ) : null}
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
    maxWidth: 300,
  },
  form: {
    gap: 12,
  },
  otpRow: {
    flexDirection: "row",
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  otpInput: {
    color: colors.journeyText,
    fontFamily: "Poppins-SemiBold",
    fontSize: 22,
    lineHeight: 28,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlign: "center",
  },
  otpBoxActive: {
    borderColor: "rgba(255,255,255,0.4)",
  },
  errorText: {
    color: "#FCA5A5",
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  successText: {
    color: colors.fitnessText,
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  guardBlock: {
    gap: 10,
  },
  guardText: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    lineHeight: 20,
  },
  restartLink: {
    color: colors.fitnessText,
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 28,
  },
  footerGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  footerLinkDisabled: {
    color: "rgba(255, 255, 255, 0.34)",
  },
  timerText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    lineHeight: 20,
  },
});
