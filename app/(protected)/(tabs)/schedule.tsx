import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  Activity,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Footprints,
  Plus,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";
import type { ScheduledWorkoutWithPlanRow } from "@/lib/backend/types";
import {
  deleteScheduledWorkout,
  getScheduledWorkouts,
  subscribeToScheduledWorkoutChanges,
} from "@/lib/backend/workouts";
import { useUser } from "@/lib/clerk";

type ScheduleActivity = {
  id: string;
  title: string;
  description: string;
  detail: string;
  date: string;
  time?: string;
  scheduledFor: string;
  status: "scheduled" | "completed" | "cancelled" | "missed";
  source: "user" | "system" | "ai";
  isPremium?: boolean;
  scheduledWorkoutId: string;
  workoutPlanId: string;
  durationSeconds?: number;
  workoutType?: string | null;
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
};

const weekDayLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const monthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// These layout constants keep the timeline markers aligned with cards in both collapsed and expanded sheet states.
const timelineColumnWidth = 24;
const timelineColumnGap = 12;
const scheduleCardHeight = 168;
const scheduleCardGap = 18;
const timelineNodeTop = 24;
export default function ScheduleScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [selectedDate, setSelectedDate] = useState(() =>
    toDateKey(clampDateToTwoWeekWindow(new Date())),
  );
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [focusedMonth, setFocusedMonth] = useState(() =>
    startOfMonth(toDate(selectedDate)),
  );
  const [scheduledWorkouts, setScheduledWorkouts] = useState<
    ScheduledWorkoutWithPlanRow[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutatingWorkoutId, setMutatingWorkoutId] = useState<string | null>(null);
  const [selectedScheduleForActions, setSelectedScheduleForActions] =
    useState<ScheduleActivity | null>(null);
  const actionSheetTranslateY = useRef(new Animated.Value(32)).current;
  const actionSheetOpacity = useRef(new Animated.Value(0)).current;

  const selectedDateObject = toDate(selectedDate);
  const visibleDays = useMemo(() => getVisibleDays(focusedMonth), [focusedMonth]);
  const visibleDayKeys = useMemo(
    () => new Set(visibleDays.map((day) => day.dateString)),
    [visibleDays],
  );

  const normalizedSelectedDate = visibleDayKeys.has(selectedDate)
    ? selectedDate
    : visibleDays[0]?.dateString ?? selectedDate;

  const normalizedSelectedDateObject = toDate(normalizedSelectedDate);

  const scheduleActivities = useMemo<ScheduleActivity[]>(
    () => scheduledWorkouts.map(mapScheduledWorkoutToActivity),
    [scheduledWorkouts],
  );

  const selectedActivities = scheduleActivities.filter(
    (activity) => activity.date === normalizedSelectedDate,
  );
  const sheetBottomInset = Math.max(insets.bottom + 92, 116);

  const hasAnySchedules = scheduleActivities.length > 0;
  const hasSchedules = selectedActivities.length > 0;
  const hasMultipleSchedules = selectedActivities.length > 1;
  const visibleScheduleActivities = selectedActivities;

  const headerDateLabel = formatHeaderDate(normalizedSelectedDateObject);

  // The panel changes its resting height based on how many cards can be shown for the selected day.
  const expandedPanelTop = hasMultipleSchedules
    ? Math.max(insets.top + 230, 320)
    : Math.max(insets.top + 330, 420);
  const collapsedVisibleHeight = hasSchedules
    ? hasMultipleSchedules
      ? 540
      : 430
    : 300;
  const collapsedPanelTop = screenHeight - collapsedVisibleHeight;
  const collapsedTranslate = Math.max(
    collapsedPanelTop - expandedPanelTop,
    0,
  );
  const expandedTranslate = 0;

  const sheetTranslateY = useRef(new Animated.Value(collapsedTranslate)).current;
  const sheetTranslateYRef = useRef(collapsedTranslate);
  const dragStartTranslateYRef = useRef(collapsedTranslate);
  const expandedTranslateRef = useRef(expandedTranslate);
  const collapsedTranslateRef = useRef(collapsedTranslate);

  const targetTranslate = isSheetExpanded
    ? expandedTranslate
    : collapsedTranslate;

  const loadScheduledWorkouts = useCallback(async () => {
    if (!user?.id) {
      setScheduledWorkouts([]);
      setLoadError(
        "Your workout schedule will appear here once your signed-in profile is ready.",
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const workouts = await getScheduledWorkouts(user.id);
      setScheduledWorkouts(workouts);
    } catch (error) {
      if (__DEV__) {
        console.warn("[Schedule] Supabase unavailable or blocked by RLS", error);
      }
      setScheduledWorkouts([]);
      setLoadError(
        "We couldn't load your saved workouts right now. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (sheetTranslateYRef.current !== targetTranslate) {
      sheetTranslateY.setValue(targetTranslate);
      sheetTranslateYRef.current = targetTranslate;
    }
  }, [sheetTranslateY, targetTranslate]);

  useEffect(() => {
    expandedTranslateRef.current = expandedTranslate;
    collapsedTranslateRef.current = collapsedTranslate;
  }, [collapsedTranslate, expandedTranslate]);

  useFocusEffect(
    useCallback(() => {
      void loadScheduledWorkouts();
    }, [loadScheduledWorkouts]),
  );

  useEffect(() => {
    return subscribeToScheduledWorkoutChanges(() => {
      void loadScheduledWorkouts();
    });
  }, [loadScheduledWorkouts]);

  useEffect(() => {
    if (selectedScheduleForActions) {
      actionSheetTranslateY.setValue(32);
      actionSheetOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(actionSheetTranslateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(actionSheetOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [actionSheetOpacity, actionSheetTranslateY, selectedScheduleForActions]);

  // Snaps the schedule panel to its expanded or collapsed resting point after taps or drag gestures.
  const snapSheet = (toValue: number) => {
    sheetTranslateYRef.current = toValue;
    setIsSheetExpanded(toValue === expandedTranslateRef.current);

    Animated.spring(sheetTranslateY, {
      toValue,
      damping: 22,
      mass: 0.9,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  };

  // Keeps drag gestures vertical and clamps the sheet between its two snap points.
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 8 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: () => {
        dragStartTranslateYRef.current = sheetTranslateYRef.current;
        sheetTranslateY.stopAnimation((value) => {
          sheetTranslateYRef.current = value;
          dragStartTranslateYRef.current = value;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const nextValue = clampNumber(
          dragStartTranslateYRef.current + gestureState.dy,
          expandedTranslateRef.current,
          collapsedTranslateRef.current,
        );

        sheetTranslateYRef.current = nextValue;
        sheetTranslateY.setValue(nextValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentValue = sheetTranslateYRef.current;
        const midpoint = collapsedTranslateRef.current / 2;

        if (gestureState.dy < -40 || gestureState.vy < -0.7) {
          snapSheet(expandedTranslateRef.current);
          return;
        }

        if (gestureState.dy > 40 || gestureState.vy > 0.7) {
          snapSheet(collapsedTranslateRef.current);
          return;
        }

        if (currentValue < midpoint) {
          snapSheet(expandedTranslateRef.current);
          return;
        }

        snapSheet(collapsedTranslateRef.current);
      },
      onPanResponderTerminate: () => {
        const midpoint = collapsedTranslateRef.current / 2;
        snapSheet(
          sheetTranslateYRef.current <= midpoint
            ? expandedTranslateRef.current
            : collapsedTranslateRef.current,
        );
      },
      onShouldBlockNativeResponder: () => false,
    }),
  ).current;

  const handleDayPress = async (dateString: string) => {
    if (dateString === normalizedSelectedDate) {
      return;
    }

    await Haptics.selectionAsync();
    setSelectedScheduleForActions(null);
    setSelectedDate(dateString);
  };

  const handleChangeMonth = async (direction: -1 | 1) => {
    await Haptics.selectionAsync();
    setSelectedScheduleForActions(null);

    // The calendar only renders the first 14 days, so month changes clamp the selected date back into that visible window.
    const nextMonth = addMonths(focusedMonth, direction);
    const nextSelectedDate = toDateKey(
      clampDateToTwoWeekWindow(
        new Date(
          nextMonth.getFullYear(),
          nextMonth.getMonth(),
          selectedDateObject.getDate(),
        ),
      ),
    );

    setFocusedMonth(nextMonth);
    setSelectedDate(nextSelectedDate);
  };

  const handleCreateActivity = async () => {
    await Haptics.selectionAsync();
    router.push({
      pathname: "/create-activity",
      params: { returnTo: "schedule" },
    });
  };

  const handleScheduledWorkoutPress = async (activity: ScheduleActivity) => {
    await Haptics.selectionAsync();

    router.push({
      pathname: resolveWorkoutRoute(activity),
      params: {
        workoutPlanId: activity.workoutPlanId,
        scheduledWorkoutId: activity.scheduledWorkoutId,
        title: activity.title,
        durationSeconds:
          activity.durationSeconds != null
            ? String(activity.durationSeconds)
            : undefined,
      },
    });
  };

  const handleEditScheduledWorkout = async (activity: ScheduleActivity) => {
    setSelectedScheduleForActions(null);
    await Haptics.selectionAsync();
    router.push({
      pathname: "/create-activity",
      params: {
        returnTo: "schedule",
        mode: "edit",
        scheduledWorkoutId: activity.scheduledWorkoutId,
        workoutPlanId: activity.workoutPlanId,
        title: activity.title,
        description: activity.description,
        scheduledFor: activity.scheduledFor,
        reminderEnabled: activity.reminderEnabled ? "true" : "false",
        reminderMinutesBefore: String(activity.reminderMinutesBefore),
      },
    });
  };

  const handleDeleteScheduledWorkout = (activity: ScheduleActivity) => {
    setSelectedScheduleForActions(null);
    Alert.alert(
      "Delete scheduled workout?",
      "This removes it from your schedule only.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              if (!user?.id) {
                return;
              }

              setMutatingWorkoutId(activity.scheduledWorkoutId);

              try {
                await deleteScheduledWorkout(activity.scheduledWorkoutId, user.id);
                await loadScheduledWorkouts();
              } catch (error) {
                if (__DEV__) {
                  console.warn("[Schedule] Failed to delete scheduled workout", {
                    scheduledWorkoutId: activity.scheduledWorkoutId,
                    error,
                  });
                }

                Alert.alert(
                  "Delete failed",
                  "We couldn't remove this scheduled workout right now. Please try again.",
                );
              } finally {
                setMutatingWorkoutId(null);
              }
            })();
          },
        },
      ],
    );
  };

  const closeActionSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(actionSheetTranslateY, {
        toValue: 32,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(actionSheetOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedScheduleForActions(null);
    });
  }, [actionSheetOpacity, actionSheetTranslateY]);

  const handleScheduleCardLongPress = useCallback(
    async (activity: ScheduleActivity) => {
      await Haptics.selectionAsync();
      setSelectedScheduleForActions(activity);
    },
    [],
  );

  return (
    <AppScreen
      backgroundColor={colors.appDarkBlue}
      contentStyle={styles.screen}
    >
      <View style={styles.root}>
        <View
          pointerEvents="none"
          style={[
            styles.sheetBottomFill,
            {
              bottom: -insets.bottom,
              height: Math.max(insets.bottom + 140, 160),
            },
          ]}
        />

        <View
          style={[
            styles.topSection,
            { paddingTop: Math.max(insets.top, 16) + 8 },
          ]}
        >
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.overline}>TODAY IS</Text>
              <Text style={styles.dateTitle}>{headerDateLabel}</Text>
              <Text style={styles.dateYear}>
                {normalizedSelectedDateObject.getFullYear()}
              </Text>
            </View>

            <View style={styles.arrowRow}>
              <Pressable
                onPress={() => void handleChangeMonth(-1)}
                style={styles.arrowButton}
                accessibilityRole="button"
                accessibilityLabel="Show previous month"
              >
                <ChevronLeft
                  color="rgba(255,255,255,0.32)"
                  size={42}
                  strokeWidth={2.8}
                />
              </Pressable>

              <Pressable
                onPress={() => void handleChangeMonth(1)}
                style={styles.arrowButton}
                accessibilityRole="button"
                accessibilityLabel="Show next month"
              >
                <ChevronRight
                  color={colors.journeyText}
                  size={42}
                  strokeWidth={2.8}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.calendarBlock}>
            <View style={styles.weekdayRow}>
              {weekDayLabels.map((label) => (
                <Text key={label} style={styles.weekdayLabel}>
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.twoWeekGrid}>
              {[0, 1].map((weekIndex) => (
                <View key={weekIndex} style={styles.weekRow}>
                  {visibleDays
                    .slice(weekIndex * 7, weekIndex * 7 + 7)
                    .map((day) => {
                      const isSelected =
                        day.dateString === normalizedSelectedDate;
                      const isToday = day.dateString === toDateKey(new Date());

                      return (
                        <Pressable
                          key={day.dateString}
                          onPress={() => void handleDayPress(day.dateString)}
                          accessibilityRole="button"
                          accessibilityLabel={`Select ${formatAccessibilityDate(
                            day.dateString,
                          )}`}
                          style={styles.dayCell}
                        >
                          <View
                            style={[
                              styles.dayCircle,
                              isToday && styles.todayCircle,
                              isSelected && styles.selectedDayCircle,
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayNumber,
                                isToday && styles.todayDayNumber,
                                isSelected && styles.selectedDayNumber,
                              ]}
                            >
                              {day.day}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                </View>
              ))}
            </View>
          </View>
        </View>

        <Animated.View
          style={[
            styles.sheet,
            {
              top: expandedPanelTop,
              bottom: -insets.bottom,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View
              style={styles.sheetDragArea}
              {...sheetPanResponder.panHandlers}
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Your Schedule</Text>
            </View>

            <Pressable
              onPress={() => void handleCreateActivity()}
              style={styles.panelAddButton}
              accessibilityRole="button"
              accessibilityLabel="Create activity"
            >
              <Plus size={22} color={colors.background} strokeWidth={2.4} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={closeActionSheet}
            contentContainerStyle={[
              styles.sheetContent,
              {
                paddingBottom: sheetBottomInset,
              },
            ]}
          >
            {isLoading ? (
              <View style={styles.statusState}>
                <ActivityIndicator size="small" color={colors.background} />
                <Text style={styles.emptyTitle}>Loading schedule...</Text>
              </View>
            ) : hasSchedules ? (
              <View style={styles.scheduleItemsWrapper}>
                <View pointerEvents="none" style={styles.timelineColumn}>
                  <View style={styles.timelineLine} />

                  {visibleScheduleActivities.map((activity, index) => (
                    <View
                      key={`timeline-${activity.id}`}
                      style={[
                        styles.timelineNode,
                        index === 0
                          ? styles.timelineNodeActive
                          : styles.timelineNodeInactive,
                        {
                          // Each marker uses the same height and gap math as the cards so the timeline stays visually locked to them.
                          top:
                            index * (scheduleCardHeight + scheduleCardGap) +
                            timelineNodeTop,
                        },
                      ]}
                    >
                      {index === 0 ? (
                        <Check
                          size={12}
                          color={colors.background}
                          strokeWidth={3}
                        />
                      ) : null}
                    </View>
                  ))}
                </View>

                <View style={styles.scheduleCardsColumn}>
                  {visibleScheduleActivities.map((activity, index) => (
                    <View key={activity.id} style={styles.scheduleItemRow}>
                      <ScheduleCard
                        activity={activity}
                        index={index}
                        onPress={handleScheduledWorkoutPress}
                        onLongPress={handleScheduleCardLongPress}
                        isMutating={mutatingWorkoutId === activity.scheduledWorkoutId}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : loadError ? (
              <View style={styles.statusState}>
                <Text style={styles.emptyTitle}>Schedule unavailable</Text>
                <Text style={styles.emptyDescription}>{loadError}</Text>

                <Pressable
                  onPress={() => void loadScheduledWorkouts()}
                  style={styles.retryButton}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading schedule"
                >
                  <Text style={styles.retryButtonText}>Try again</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>
                  {hasAnySchedules ? "No workouts for this day." : "No schedules yet."}
                </Text>
                <Text style={styles.emptyDescription}>
                  {hasAnySchedules
                    ? "Pick another day or create a new workout to add to your schedule."
                    : "Create a workout to add it to your schedule."}
                </Text>

                <Pressable
                  onPress={() => void handleCreateActivity()}
                  style={styles.createButton}
                  accessibilityRole="button"
                  accessibilityLabel="Create activity"
                  accessibilityHint="Create activity route is not available yet"
                >
                  <Plus color={colors.background} size={24} strokeWidth={2.4} />
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Animated.View>

        <Modal
          visible={selectedScheduleForActions != null}
          transparent
          animationType="fade"
          onRequestClose={closeActionSheet}
        >
          <Pressable
            style={styles.actionSheetBackdrop}
            onPress={closeActionSheet}
            accessibilityRole="button"
            accessibilityLabel="Close schedule actions"
          >
            {selectedScheduleForActions ? (
              <Animated.View
                style={[
                  styles.actionSheet,
                  {
                    marginBottom: Math.max(insets.bottom + 92, 110),
                    opacity: actionSheetOpacity,
                    transform: [{ translateY: actionSheetTranslateY }],
                  },
                ]}
              >
                <Pressable onPress={(event) => event.stopPropagation()}>
                  <View style={styles.actionSheetHandle} />

                  <Pressable
                    onPress={() =>
                      void handleEditScheduledWorkout(selectedScheduleForActions)
                    }
                    style={({ pressed }) => [
                      styles.actionRow,
                      pressed && styles.actionRowPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${selectedScheduleForActions.title}`}
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={20}
                      color={colors.journeyText}
                    />
                    <Text style={styles.actionText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      handleDeleteScheduledWorkout(selectedScheduleForActions)
                    }
                    style={({ pressed }) => [
                      styles.actionRow,
                      pressed && styles.actionRowPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${selectedScheduleForActions.title}`}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={20}
                      color="#FF8FA3"
                    />
                    <Text style={styles.actionDeleteText}>Delete</Text>
                  </Pressable>

                  <View style={styles.actionSheetSeparator} />

                  <Pressable
                    onPress={closeActionSheet}
                    style={({ pressed }) => [
                      styles.actionRow,
                      styles.cancelActionRow,
                      pressed && styles.actionRowPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel schedule actions"
                  >
                    <Text style={styles.actionText}>Cancel</Text>
                  </Pressable>
                </Pressable>
              </Animated.View>
            ) : null}
          </Pressable>
        </Modal>
      </View>
    </AppScreen>
  );
}

function ScheduleCard({
  activity,
  index,
  onPress,
  onLongPress,
  isMutating,
}: {
  activity: ScheduleActivity;
  index: number;
  onPress: (activity: ScheduleActivity) => void;
  onLongPress: (activity: ScheduleActivity) => void;
  isMutating: boolean;
}) {
  const ActivityIcon = getScheduleActivityIcon(activity.title);
  const handledLongPressRef = useRef(false);

  const handleLongPress = () => {
    if (isMutating) {
      return;
    }

    handledLongPressRef.current = true;
    void onLongPress(activity);
  };

  const handlePress = () => {
    if (handledLongPressRef.current) {
      handledLongPressRef.current = false;
      return;
    }

    void onPress(activity);
  };

  return (
    <View
      style={[
        styles.scheduleCard,
        index % 2 === 0
          ? styles.scheduleCardPrimary
          : styles.scheduleCardSecondary,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={220}
        accessibilityRole="button"
        accessibilityLabel={`Open ${activity.title}`}
        style={styles.scheduleCardPressable}
      >
        <View style={styles.scheduleContentBlock}>
          <Text
            style={styles.scheduleMeta}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {formatCardMeta(activity.date, activity.time)}
          </Text>
          <Text style={styles.scheduleTitleCard} numberOfLines={2}>
            {activity.title}
          </Text>
          <Text style={styles.scheduleDetail} numberOfLines={3}>
            {activity.detail}
          </Text>

          <View style={styles.scheduleBottomRow}>
            <View style={styles.scheduleFooterMeta}>
              {activity.status !== "scheduled" ? (
                <View style={styles.scheduleStatusBadge}>
                  <Text style={styles.scheduleStatus}>
                    {formatStatusLabel(activity.status)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>

      <View style={styles.scheduleCardSide}>
        <View style={styles.scheduleCardIconCircle}>
          <ActivityIcon color={colors.background} size={18} strokeWidth={2.4} />
        </View>
        {isMutating ? (
          <View style={styles.scheduleMutationIndicator}>
            <ActivityIndicator size="small" color={colors.background} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

// Uses simple keyword matching so placeholder activities still get distinct icons before real activity types exist.
function getScheduleActivityIcon(title: string) {
  const normalizedTitle = title.trim().toLowerCase();

  if (normalizedTitle.includes("warm")) {
    return Footprints;
  }

  if (normalizedTitle.includes("push")) {
    return Dumbbell;
  }

  return Activity;
}

function mapScheduledWorkoutToActivity(
  workout: ScheduledWorkoutWithPlanRow,
): ScheduleActivity {
  const scheduledAt = new Date(workout.scheduled_for);
  const workoutPlan = workout.workout_plan;
  const title = workoutPlan?.title?.trim() || "Scheduled workout";
  const workoutType = workoutPlan?.workout_type?.trim() || null;
  const description = workoutPlan?.description?.trim() || "";

  return {
    id: workout.id,
    title,
    description,
    detail: description || workoutType || "Workout scheduled",
    date: toDateKey(scheduledAt),
    time: formatTimeLabel(scheduledAt),
    scheduledFor: workout.scheduled_for,
    status: normalizeScheduledStatus(workout.status),
    source: "user",
    scheduledWorkoutId: workout.id,
    workoutPlanId: workout.workout_plan_id,
    durationSeconds: workoutPlan?.duration_seconds ?? undefined,
    workoutType,
    reminderEnabled: workout.reminder_enabled,
    reminderMinutesBefore: workout.reminder_minutes_before,
  };
}

function normalizeScheduledStatus(
  status: string | null | undefined,
): ScheduleActivity["status"] {
  if (status === "completed" || status === "cancelled" || status === "missed") {
    return status;
  }

  return "scheduled";
}

function resolveWorkoutRoute(activity: ScheduleActivity) {
  const normalizedContent = `${activity.title} ${activity.detail} ${activity.workoutType ?? ""}`
    .trim()
    .toLowerCase();

  if (normalizedContent.includes("warm") || normalizedContent.includes("run")) {
    return "/workout/map" as const;
  }

  return "/workout/workout" as const;
}

// Builds the fixed two-week calendar window shown on this screen.
function getVisibleDays(monthDate: Date) {
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      index + 1,
    );

    return {
      dateString: toDateKey(date),
      day: index + 1,
    };
  });
}

// Keeps the selected date inside the two-week range that the schedule screen renders.
function clampDateToTwoWeekWindow(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    clampNumber(date.getDate(), 1, 14),
  );
}

// Normalizes month navigation to the first day because the screen renders a month header plus a custom two-week slice.
function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// Converts the stored YYYY-MM-DD key back into a local Date for formatting and month math.
function toDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
}

// Uses a stable local date key so selections stay comparable without time-zone offsets.
function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatHeaderDate(date: Date) {
  return `${date.getDate()}, ${monthLabels[date.getMonth()]}`;
}

function formatAccessibilityDate(dateString: string) {
  const date = toDate(dateString);

  return `${monthLabels[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatCardMeta(dateString: string, time?: string) {
  const date = toDate(dateString);
  const baseLabel = `${monthLabels[date.getMonth()]} ${date.getDate()}`;

  return time ? `${baseLabel}, ${time}` : baseLabel;
}

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStatusLabel(status: ScheduleActivity["status"]) {
  switch (status) {
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "missed":
      return "Missed";
    default:
      return "Scheduled";
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  root: {
    flex: 1,
    backgroundColor: colors.appDarkBlue,
  },

  topSection: {
    flex: 1,
    paddingHorizontal: 24,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  overline: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 14,
    letterSpacing: 4,
  },

  dateTitle: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 36,
    lineHeight: 44,
    marginTop: 4,
  },

  dateYear: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 36,
    lineHeight: 44,
  },

  arrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
    marginRight: 6,
  },

  arrowButton: {
    width: 36,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  calendarBlock: {
    marginTop: 20,
  },

  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  weekdayLabel: {
    width: 40,
    textAlign: "center",
    color: "rgba(255,255,255,0.72)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 12,
  },

  twoWeekGrid: {
    gap: 8,
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  dayCell: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  todayCircle: {
    borderColor: colors.homePink,
    backgroundColor: "rgba(255,201,233,0.08)",
  },

  selectedDayCircle: {
    borderColor: colors.homePink,
    backgroundColor: colors.homePink,
  },

  dayNumber: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 13,
  },

  todayDayNumber: {
    color: colors.homePink,
    fontFamily: "MontserratAlternates-SemiBold",
  },

  selectedDayNumber: {
    color: colors.background,
    fontFamily: "MontserratAlternates-SemiBold",
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: "#FBF8FC",
    paddingHorizontal: 24,
    paddingTop: 14,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
  },

  sheetBottomFill: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#FBF8FC",
  },

  sheetDragArea: {
    alignItems: "center",
    paddingBottom: 10,
    flex: 1,
    paddingHorizontal: 56,
  },

  sheetHandle: {
    alignSelf: "center",
    width: 60,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.background,
    opacity: 0.9,
  },

  sheetHeader: {
    width: "100%",
    position: "relative",
    minHeight: 78,
  },

  sheetTitleRow: {
    width: "100%",
  },

  sheetTitle: {
    color: colors.background,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 28,
    lineHeight: 34,
    marginTop: 18,
  },

  sheetContent: {
    paddingTop: 24,
    paddingBottom: 116,
  },

  panelAddButton: {
    position: "absolute",
    right: 0,
    top: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.homeCream,
    alignItems: "center",
    justifyContent: "center",
  },

  scheduleItemsWrapper: {
    position: "relative",
    flexDirection: "row",
    paddingLeft: 0,
    paddingRight: 8,
    marginTop: 16,
  },

  timelineColumn: {
    width: timelineColumnWidth,
    position: "relative",
    alignItems: "center",
    marginRight: timelineColumnGap,
    marginLeft: 5,
  },

  timelineLine: {
    position: "absolute",
    top: timelineNodeTop,
    bottom: scheduleCardHeight - timelineNodeTop,
    left: "50%",
    width: 1,
    marginLeft: -0.5,
    backgroundColor: "rgba(43, 35, 57, 0.12)",
  },

  scheduleCardsColumn: {
    flex: 1,
    rowGap: scheduleCardGap,
  },

  scheduleItemRow: {
    height: scheduleCardHeight,
  },

  timelineNode: {
    position: "absolute",
    left: "50%",
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: 7,
    backgroundColor: "rgba(43, 35, 57, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  timelineNodeActive: {
    width: 28,
    height: 28,
    marginLeft: -14,
    borderRadius: 14,
    backgroundColor: colors.homeCream,
  },

  timelineNodeInactive: {
    width: 14,
    height: 14,
    marginLeft: -7,
  },

  scheduleCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    height: scheduleCardHeight,
    borderRadius: 26,
    paddingLeft: 20,
    paddingRight: 18,
    paddingTop: 16,
    paddingBottom: 16,
  },

  scheduleCardPrimary: {
    backgroundColor: "#F4C7E7",
  },

  scheduleCardSecondary: {
    backgroundColor: "#F5EDAE",
  },

  scheduleCardPressable: {
    flex: 1,
    paddingRight: 16,
  },
  scheduleContentBlock: {
    flex: 1,
    minHeight: scheduleCardHeight - 32,
    justifyContent: "space-between",
  },

  scheduleMeta: {
    color: "rgba(43, 35, 57, 0.72)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 12,
    lineHeight: 17,
  },

  scheduleTitleCard: {
    color: colors.background,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 20,
    lineHeight: 26,
    marginTop: 8,
  },

  scheduleDetail: {
    color: "rgba(43, 35, 57, 0.72)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  scheduleBottomRow: {
    marginTop: 10,
  },

  scheduleFooterMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 12,
  },

  scheduleStatus: {
    color: colors.background,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 12,
    lineHeight: 16,
  },

  scheduleStatusBadge: {
    minHeight: 28,
    borderRadius: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(43, 35, 57, 0.08)",
  },

  scheduleCardSide: {
    width: 48,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 2,
  },

  scheduleCardIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  scheduleMutationIndicator: {
    marginTop: 12,
    minHeight: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  actionSheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(7,9,14,0.28)",
  },

  actionSheet: {
    marginHorizontal: 18,
    borderRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
    backgroundColor: "rgba(39,32,56,0.98)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 18,
  },

  actionSheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginBottom: 8,
  },

  actionRow: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  actionRowPressed: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  actionText: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 15,
  },

  actionDeleteText: {
    color: "#FF8FA3",
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 15,
  },

  actionSheetSeparator: {
    height: 1,
    marginHorizontal: 12,
    marginVertical: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  cancelActionRow: {
    justifyContent: "center",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 22,
  },

  emptyTitle: {
    color: colors.background,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 23,
    lineHeight: 29,
    textAlign: "center",
  },

  emptyDescription: {
    color: colors.background,
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    opacity: 0.7,
    marginTop: 8,
  },

  statusState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 30,
    paddingBottom: 8,
    paddingHorizontal: 22,
    gap: 10,
  },

  createButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.homeCream,
  },

  retryButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    minWidth: 132,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: colors.homeCream,
    paddingHorizontal: 20,
  },

  retryButtonText: {
    color: colors.background,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 14,
  },
});
