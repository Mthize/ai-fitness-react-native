import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { OnboardingFooter } from "@/components/onboarding/OnboardingFooter";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OnboardingRouteGuard } from "@/components/onboarding/OnboardingRouteGuard";
import {
  getReadableErrorMessage,
  ONBOARDING_GOALS,
  PRIVATE_HOME_ROUTE,
  setPersistedOnboardingCompleted,
  type OnboardingGoal,
  useOnboarding,
} from "@/lib/auth";
import { useUser } from "@/lib/clerk";

export default function GoalScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { onboarding, setGoals, markOnboardingCompleted } = useOnboarding();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const selectedGoals = onboarding.goals ?? (
    onboarding.selectedGoal ? [onboarding.selectedGoal] : []
  );

  function toggleGoal(goal: OnboardingGoal) {
    const isSelected = selectedGoals.includes(goal);
    const nextGoals = isSelected
      ? selectedGoals.filter((item) => item !== goal)
      : [...selectedGoals, goal];

    setGoals(nextGoals);
    setErrorMessage(null);
  }

  async function handleStartNow() {
    if (selectedGoals.length === 0) {
      setErrorMessage("Please select at least one goal.");
      return;
    }

    if (!user) {
      setErrorMessage("Unable to save your onboarding information right now.");
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const updateUser = user as typeof user & {
        update?: ((params: {
          publicMetadata?: Record<string, unknown>;
        }) => Promise<unknown>) | null;
      };

      if (typeof updateUser.update === "function") {
        await updateUser.update({
          publicMetadata: {
            ...((user.publicMetadata as Record<string, unknown> | null) ?? {}),
            onboardingCompleted: true,
          },
        });
      }

      await user.updateMetadata({
        unsafeMetadata: {
          onboardingCompleted: true,
          onboarding: {
            weight: onboarding.weight,
            weightUnit: onboarding.weightUnit,
            height: onboarding.height,
            heightUnit: onboarding.heightUnit,
            goals: selectedGoals,
          },
        },
      });
      await setPersistedOnboardingCompleted(user.id, true);
      await user.reload();

      if (__DEV__) {
        console.log("[ONBOARDING DEBUG] completion persisted", {
          userId: user.id,
          secureStoreKey: `onboarding_completed_${user.id}`,
          secureStoreValue: "true",
          publicMetadataValue:
            user.publicMetadata?.onboardingCompleted ?? null,
          unsafeMetadataValue:
            user.unsafeMetadata?.onboardingCompleted ?? null,
          routeDecision: PRIVATE_HOME_ROUTE,
        });
      }

      markOnboardingCompleted();
      router.replace(PRIVATE_HOME_ROUTE);
    } catch (error) {
      setErrorMessage(
        getReadableErrorMessage(
          error,
          "Unable to save your onboarding information. Please try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <OnboardingRouteGuard>
      <AppScreen light contentStyle={styles.screen}>
        <View style={styles.content}>
          <OnboardingProgress step={3} />

          <Text style={styles.title}>What do you want to{"\n"}achieve?</Text>
          <Text style={styles.subtitle}>
            What you are going to select will{"\n"}effect your workout program
          </Text>

          <View style={styles.goalList}>
            {ONBOARDING_GOALS.map((goal) => {
              const isSelected = selectedGoals.includes(goal);

              return (
                <Pressable
                  key={goal}
                  onPress={() => toggleGoal(goal)}
                  style={[
                    styles.goalCard,
                    isSelected && styles.selectedGoalCard,
                  ]}
                >
                  <Text
                    style={[
                      styles.goalLabel,
                      isSelected && styles.selectedGoalLabel,
                    ]}
                  >
                    {goal}
                  </Text>

                  {isSelected ? (
                    <Image
                      source={require("@/assets/CheckBox.png")}
                      style={styles.checkIcon}
                      resizeMode="contain"
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <OnboardingFooter
            onBack={() => router.replace("/onboarding/height")}
            onNext={handleStartNow}
            nextLabel={isSaving ? "Saving..." : "Start Now"}
            disabled={isSaving}
            showNextArrows={false}
          />
        </View>
      </AppScreen>
    </OnboardingRouteGuard>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  title: {
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 24,
    lineHeight: 31,
    color: "#282536",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: "MontserratAlternates-semiBold",
    fontSize: 15,
    lineHeight: 19,
    color: "#A7A1AA",
    textAlign: "center",
  },
  goalList: {
    gap: 16,
    marginTop: 24,
  },
  goalCard: {
    minHeight: 70,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E9E6EC",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 18,
    position: "relative",
  },
  selectedGoalCard: {
    borderColor: "#292535",
    shadowColor: "#2B2339",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  goalLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 11.5,
    lineHeight: 17,
    color: "#15121C",
    textAlign: "center",
  },
  selectedGoalLabel: {
    fontFamily: "Poppins-SemiBold",
  },
  checkIcon: {
    position: "absolute",
    top: -8,
    right: -4,
    width: 18,
    height: 18,
  },
  errorText: {
    marginTop: 14,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    lineHeight: 18,
    color: "#B3261E",
  },
});
