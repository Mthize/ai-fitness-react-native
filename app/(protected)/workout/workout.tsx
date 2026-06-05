import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Pause, Play } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { AppScreen } from "@/components/AppScreen";
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { WorkoutTimerRing } from "@/components/workout/WorkoutTimerRing";
import { MOCK_WORKOUT, PUSHUP_STEPS } from "@/components/workout/workoutData";
import { colors } from "@/constants/colors";
import { completeWorkoutSession } from "@/lib/backend/workouts";
import { useUser } from "@/lib/clerk";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;

const SCALE_X = SCREEN_WIDTH / DESIGN_WIDTH;
const SCALE_Y = SCREEN_HEIGHT / DESIGN_HEIGHT;

const PANEL_LEFT = -18 * SCALE_X;
const PANEL_WIDTH = 426 * SCALE_X;
const PANEL_RADIUS = 27 * SCALE_X;
const PANEL_TOP = 518 * SCALE_Y;
const PAUSE_BUTTON_SIZE = 80 * SCALE_X;
const PAUSE_BUTTON_RADIUS = PAUSE_BUTTON_SIZE / 2;

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

async function playStepSound() {
  // TODO: Add short beep sound asset for step transitions.
}

async function playCompleteSound() {
  // TODO: Add completion sound asset.
}

function WorkoutSessionPanelShape({ height }: { height: number }) {
  const w = PANEL_WIDTH;
  const h = height;
  const r = PANEL_RADIUS;
  const topLeftX = 38 * SCALE_X;
  const topRightX = w - 38 * SCALE_X;

  /**
   * TODO: Extract shared WorkoutBottomPanel once both workout screens are finalized.
   *
   * This mirrors the WarmUp screen panel geometry so the white bottom sheet keeps
   * the same widened lower body and narrower rounded top shape from the reference.
   */
  const d = `
    M ${topLeftX + r} 0
    H ${topRightX - r}
    Q ${topRightX} 0 ${topRightX} ${r}
    C ${topRightX + 6 * SCALE_X} ${h * 0.38} ${w - 2 * SCALE_X} ${h * 0.72} ${w} ${h}
    H 0
    C ${2 * SCALE_X} ${h * 0.72} ${topLeftX - 6 * SCALE_X} ${h * 0.38} ${topLeftX} ${r}
    Q ${topLeftX} 0 ${topLeftX + r} 0
    Z
  `;

  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={StyleSheet.absoluteFill}
    >
      <Path d={d} fill="#FFFFFF" />
    </Svg>
  );
}

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const {
    durationSeconds: durationSecondsParam,
    mode,
    scheduledWorkoutId,
    title,
    workoutPlanId,
  } = useLocalSearchParams<{
    durationSeconds?: string;
    mode?: string;
    scheduledWorkoutId?: string;
    title?: string;
    workoutPlanId?: string;
  }>();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(
    PUSHUP_STEPS[0].durationSeconds,
  );
  const [hasStarted, setHasStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [completedStepTimestamps, setCompletedStepTimestamps] = useState<
    (string | null)[]
  >(() => PUSHUP_STEPS.map(() => null));
  const [isCompletingWorkout, setIsCompletingWorkout] = useState(false);
  const lastScrollHapticAt = useRef(0);
  const sessionStartedAtRef = useRef<string | null>(null);
  const hasSubmittedCompletionRef = useRef(false);

  const isHistoryMode = mode === "history";
  const workoutTitle = title?.trim() || MOCK_WORKOUT.timerTitle;
  const workoutSubtitle = MOCK_WORKOUT.timerSubtitle;
  const plannedDurationSeconds = parseOptionalPositiveInteger(durationSecondsParam);

  const currentStep = PUSHUP_STEPS[currentStepIndex] ?? null;
  const panelHeight = SCREEN_HEIGHT - PANEL_TOP;

  // Progress ring calculation stays local until the real session engine replaces this screen state.
  const progress = useMemo(() => {
    if (!currentStep) {
      return 1;
    }

    return (
      (currentStep.durationSeconds - remainingSeconds) / currentStep.durationSeconds
    );
  }, [currentStep, remainingSeconds]);

  const timerButtonLabel = !hasStarted
    ? isHistoryMode
      ? "Completed workout"
      : "Start workout"
    : isPaused
      ? "Resume workout"
      : "Pause workout";

  const timerHeading = isHistoryMode
    ? "Completed"
    : !hasStarted
    ? "Start!"
    : isComplete
      ? "Completed"
      : currentStep?.label ?? "Start!";

  const handleBackPress = () => {
    router.replace("/home");
  };

  const finalizeWorkoutCompletion = useCallback(
    async (
      completedAt: string,
      completedTimestamps: (string | null)[],
    ) => {
      if (hasSubmittedCompletionRef.current) {
        return;
      }

      hasSubmittedCompletionRef.current = true;
      setIsCompletingWorkout(true);

      const fallbackDurationSeconds =
        plannedDurationSeconds ?? getPushupWorkoutFallbackDurationSeconds();
      const startedAt = sessionStartedAtRef.current;

      try {
        if (!isHistoryMode && user?.id) {
          const session = await completeWorkoutSession({
            clerkUserId: user.id,
            workoutPlanId,
            scheduledWorkoutId,
            title: workoutTitle,
            workoutType: "strength",
            startedAt,
            completedAt,
            durationSeconds: getCompletedDurationSeconds(
              startedAt,
              completedAt,
              fallbackDurationSeconds,
            ),
            status: "completed",
            steps: buildCompletedPushupSessionSteps(completedTimestamps, completedAt),
          });

          router.replace({
            pathname: "/workout/success",
            params: {
              sessionId: session.id,
              workoutId: "pushups",
            },
          });

          return;
        }

        router.replace({
          pathname: "/workout/success",
          params: {
            saveStatus: "fallback",
            workoutId: "pushups",
          },
        });
      } catch (error) {
        if (__DEV__) {
          console.warn(
            "[workout] Failed to persist completed pushup session. Falling back to local success state until a retry/offline queue exists.",
            error,
          );
        }

        router.replace({
          pathname: "/workout/success",
          params: {
            saveStatus: "fallback",
            workoutId: "pushups",
          },
        });
      } finally {
        setIsCompletingWorkout(false);
      }
    },
    [
      isHistoryMode,
      plannedDurationSeconds,
      router,
      scheduledWorkoutId,
      user?.id,
      workoutPlanId,
      workoutTitle,
    ],
  );

  const handleStepComplete = useCallback(() => {
    const completedAt = new Date().toISOString();
    const completedTimestamps = [...completedStepTimestamps];
    completedTimestamps[currentStepIndex] = completedAt;

    setCompletedStepTimestamps(completedTimestamps);

    const nextStepIndex = currentStepIndex + 1;

    if (nextStepIndex >= PUSHUP_STEPS.length) {
      setIsComplete(true);
      setHasStarted(false);
      setIsPaused(true);
      void playCompleteSound();
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => undefined);
      void finalizeWorkoutCompletion(completedAt, completedTimestamps);
      return;
    }

    setCurrentStepIndex(nextStepIndex);
    setRemainingSeconds(PUSHUP_STEPS[nextStepIndex].durationSeconds);
    void playStepSound();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
  }, [completedStepTimestamps, currentStepIndex, finalizeWorkoutCompletion]);

  const handleTimerButtonPress = useCallback(() => {
    if (isComplete || isHistoryMode || isCompletingWorkout) {
      return;
    }

    if (!hasStarted) {
      if (!sessionStartedAtRef.current) {
        sessionStartedAtRef.current = new Date().toISOString();
      }

      setHasStarted(true);
      setIsPaused(false);
      return;
    }

    setIsPaused((currentValue) => !currentValue);
  }, [hasStarted, isComplete, isCompletingWorkout, isHistoryMode]);

  const handleSelectStep = useCallback((index: number) => {
    if (isHistoryMode || isCompletingWorkout) {
      return;
    }

    const selectedStep = PUSHUP_STEPS[index];

    if (!selectedStep) {
      return;
    }

    setCurrentStepIndex(index);
    setRemainingSeconds(selectedStep.durationSeconds);
    setHasStarted(false);
    setIsPaused(true);
    setIsComplete(false);
  }, [isCompletingWorkout, isHistoryMode]);

  const triggerScrollHaptic = useCallback(() => {
    const now = Date.now();

    if (now - lastScrollHapticAt.current < 450) {
      return;
    }

    lastScrollHapticAt.current = now;
    void Haptics.selectionAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (
      !hasStarted ||
      isPaused ||
      isComplete ||
      isHistoryMode ||
      isCompletingWorkout ||
      !currentStep
    ) {
      return;
    }

    // Timer updates run in a single interval and are always cleared on dependency changes or unmount.
    const intervalId = setInterval(() => {
      setRemainingSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [currentStep, hasStarted, isComplete, isPaused, isHistoryMode, isCompletingWorkout]);

  useEffect(() => {
    if (isComplete || remainingSeconds !== 0) {
      return;
    }

    handleStepComplete();
  }, [handleStepComplete, isComplete, remainingSeconds]);

  const stepRows = [...PUSHUP_STEPS, { id: "done", label: "Done" as const }];

  return (
    <AppScreen backgroundColor={colors.background}>
      <View style={styles.container}>
        <View style={[styles.header, { top: Math.max(8 - insets.top, - 3) }]}>
          <WorkoutHeader
            action={
              <MaterialCommunityIcons
                color={colors.background}
                name="dumbbell"
                size={25}
              />
            }
            onBackPress={handleBackPress}
            subtitle={workoutSubtitle}
            title={workoutTitle}
          />
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.startText}>{timerHeading}</Text>

          <View style={styles.ringWrap}>
            <WorkoutTimerRing
              progress={progress}
              size={210 * SCALE_X}
              strokeWidth={12}
              trackColor="rgba(255,255,255,0.18)"
              useGradient
            />

            <View pointerEvents="none" style={styles.ringCenter}>
              <Text style={styles.timerText}>
                {formatSeconds(isComplete ? 0 : remainingSeconds)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.bottomPanel, { top: PANEL_TOP, height: panelHeight }]}>
          <WorkoutSessionPanelShape height={panelHeight} />
          {/* Safe-area filler keeps the white panel covering the bottom edge cleanly behind the home indicator. */}
          <View
            pointerEvents="none"
            style={[
              styles.bottomWhiteFill,
              { height: Math.max(insets.bottom, 24) },
            ]}
          />

          <Pressable
            accessibilityLabel={timerButtonLabel}
            onPress={handleTimerButtonPress}
            style={styles.pauseButton}
          >
            {isHistoryMode || !hasStarted || isPaused ? (
              <Play color="#16121D" fill="#16121D" size={26} strokeWidth={2.6} />
            ) : (
              <Pause color="#16121D" size={28} strokeWidth={2.6} />
            )}
          </Pressable>

          <View style={styles.panelContent}>
            <ScrollView
              nestedScrollEnabled
              onMomentumScrollBegin={triggerScrollHaptic}
              onScrollBeginDrag={triggerScrollHaptic}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              style={styles.stepsScroll}
              contentContainerStyle={[
                styles.workoutStepsContent,
                { paddingBottom: Math.max(insets.bottom + 42, 64) },
              ]}
            >
              {stepRows.map((step, index) => {
                const isDoneRow = step.id === "done";
                const isActive =
                  !isDoneRow && !isComplete && index === currentStepIndex;
                const isCompleted = isDoneRow
                  ? isComplete
                  : isComplete || index < currentStepIndex;
                const duration =
                  "durationSeconds" in step ? step.durationSeconds : undefined;

                if (isDoneRow) {
                  return (
                    <View key={step.id} style={styles.stepRow}>
                      <Text
                        style={[
                          styles.stepLabel,
                          isCompleted && styles.stepLabelCompleted,
                        ]}
                      >
                        {step.label}
                      </Text>

                      {isCompleted ? (
                        <View style={styles.checkmarkWrap}>
                          <Check
                            color={colors.background}
                            size={14}
                            strokeWidth={3}
                          />
                        </View>
                      ) : null}
                    </View>
                  );
                }

                return (
                  <Pressable
                    key={step.id}
                    onPress={() => handleSelectStep(index)}
                    style={[styles.stepRow, isActive && styles.stepRowActive]}
                  >
                    <Text
                      style={[
                        styles.stepLabel,
                        isActive && styles.stepLabelActive,
                        isCompleted && styles.stepLabelCompleted,
                      ]}
                    >
                      {step.label}
                    </Text>

                    {isCompleted ? (
                      <View style={styles.checkmarkWrap}>
                        <Check color={colors.background} size={14} strokeWidth={3} />
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.stepDuration,
                          isActive && styles.stepDurationActive,
                        ]}
                      >
                        {duration ?? ""}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

function parseOptionalPositiveInteger(value?: string) {
  if (!value) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function getPushupWorkoutFallbackDurationSeconds() {
  return PUSHUP_STEPS.reduce((total, step) => total + step.durationSeconds, 0);
}

function getCompletedDurationSeconds(
  startedAt: string | null,
  completedAt: string,
  fallbackDurationSeconds: number,
) {
  if (!startedAt) {
    return fallbackDurationSeconds;
  }

  const durationSeconds = Math.max(
    1,
    Math.round(
      (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000,
    ),
  );

  return Number.isFinite(durationSeconds)
    ? durationSeconds
    : fallbackDurationSeconds;
}

function buildCompletedPushupSessionSteps(
  completedStepTimestamps: (string | null)[],
  completedAt: string,
) {
  const completedSteps = PUSHUP_STEPS.map((step, index) => ({
    label: step.label,
    durationSeconds: step.durationSeconds,
    orderIndex: index,
    completed: true,
    completedAt: completedStepTimestamps[index] ?? completedAt,
  }));

  return [
    ...completedSteps,
    {
      label: "Done",
      durationSeconds: null,
      orderIndex: PUSHUP_STEPS.length,
      completed: true,
      completedAt,
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: "absolute",
    left: 18,
    right: 18,
    zIndex: 30,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    paddingTop: 90 * SCALE_Y,
    paddingBottom: 166 * SCALE_Y,
  },
  startText: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 28 * SCALE_X,
    lineHeight: 33 * SCALE_X,
    textAlign: "center",
  },
  ringWrap: {
    marginTop: 28 * SCALE_Y,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 44 * SCALE_X,
    lineHeight: 50 * SCALE_X,
    textAlign: "center",
  },
  bottomPanel: {
    position: "absolute",
    left: PANEL_LEFT,
    width: PANEL_WIDTH,
    alignItems: "center",
    overflow: "visible",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -10 },
    shadowRadius: 20,
    elevation: 10,
  },
  bottomWhiteFill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 1,
  },
  pauseButton: {
    position: "absolute",
    top: -PAUSE_BUTTON_RADIUS,
    left: SCREEN_WIDTH / 2 - PANEL_LEFT - PAUSE_BUTTON_RADIUS,
    width: PAUSE_BUTTON_SIZE,
    height: PAUSE_BUTTON_SIZE,
    borderRadius: PAUSE_BUTTON_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.homeCream,
    zIndex: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 14,
    elevation: 8,
  },
  panelContent: {
    width: SCREEN_WIDTH,
    marginLeft: -PANEL_LEFT,
    paddingTop: 82 * SCALE_Y,
    paddingHorizontal: 26,
    paddingBottom: 28 * SCALE_Y,
    zIndex: 2,
  },
  stepsScroll: {
    maxHeight: 170 * SCALE_Y,
    width: "100%",
  },
  workoutStepsContent: {
    paddingBottom: 12,
  },
  stepRow: {
    minHeight: 28,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepRowActive: {
    backgroundColor: "rgba(255, 201, 233, 0.72)",
  },
  stepLabel: {
    color: "rgba(43,35,57,0.28)",
    // Panel typography stays weightier than body copy so the workout steps read clearly inside the white sheet.
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 14,
  },
  stepLabelActive: {
    color: colors.background,
    fontFamily: "MontserratAlternates-Bold",
  },
  stepLabelCompleted: {
    color: colors.background,
    fontFamily: "MontserratAlternates-Bold",
  },
  stepDuration: {
    minWidth: 18,
    color: "rgba(43,35,57,0.48)",
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 12,
    textAlign: "right",
  },
  stepDurationActive: {
    color: colors.background,
    fontFamily: "MontserratAlternates-Bold",
  },
  checkmarkWrap: {
    width: 18,
    alignItems: "flex-end",
  },
});
