import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react-native";
import type { ComponentProps } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";
import { PRIVATE_HOME_ROUTE } from "@/lib/auth";
import {
  createWorkoutPlan,
  updateScheduledWorkout,
} from "@/lib/backend/workouts";
import { useUser } from "@/lib/clerk";

const REPEAT_OPTIONS = [
  "Never",
  "Daily",
  "Weekdays",
  "Weekends",
  "Weekly",
  "Biweekly",
  "Monthly",
  "Every 3 Months",
  "Every 6 Months",
  "Yearly",
] as const;

const MONTH_OPTIONS = [
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
] as const;

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DEFAULT_REMINDER_MINUTES = 15;
const USER_SAVE_ERROR_MESSAGE =
  "We couldn't save your workout plan right now. Please try again.";

const NEUTRAL_SWITCH_TRACK = "rgba(255,255,255,0.14)";
const NEUTRAL_SWITCH_THUMB = "#F4F4F4";

const HAPTIC_THROTTLE_MS = 350;
const MONTH_YEAR_ITEM_HEIGHT = 38;
const MONTH_YEAR_VISIBLE_ROWS = 3;
const MONTH_YEAR_WHEEL_HEIGHT =
  MONTH_YEAR_ITEM_HEIGHT * MONTH_YEAR_VISIBLE_ROWS;
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from(
  { length: 101 },
  (_, index) => CURRENT_YEAR - 50 + index,
);

export default function CreateActivityScreen() {
  const router = useRouter();
  const { user } = useUser();
  const {
    returnTo,
    mode,
    scheduledWorkoutId,
    workoutPlanId,
    title: initialTitleParam,
    description: initialDescriptionParam,
    scheduledFor: initialScheduledForParam,
    reminderEnabled: initialReminderEnabledParam,
    reminderMinutesBefore: initialReminderMinutesBeforeParam,
  } = useLocalSearchParams<{
    returnTo?: string;
    mode?: string;
    scheduledWorkoutId?: string;
    workoutPlanId?: string;
    title?: string;
    description?: string;
    scheduledFor?: string;
    reminderEnabled?: string;
    reminderMinutesBefore?: string;
  }>();

  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");

  const [isDateEnabled, setIsDateEnabled] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [isMonthYearPickerVisible, setIsMonthYearPickerVisible] =
    useState(false);

  const [isTimeEnabled, setIsTimeEnabled] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [selectedTimeDate, setSelectedTimeDate] = useState<Date | null>(null);

  const [reminderEnabled, setReminderEnabled] = useState(false);

  const [repeatValue, setRepeatValue] =
    useState<(typeof REPEAT_OPTIONS)[number]>("Never");
  const [isRepeatModalVisible, setIsRepeatModalVisible] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const lastTimeHapticAt = useRef(0);
  const hydratedEditKeyRef = useRef<string | null>(null);

  const isEditMode =
    mode === "edit" &&
    typeof scheduledWorkoutId === "string" &&
    scheduledWorkoutId.length > 0 &&
    typeof workoutPlanId === "string" &&
    workoutPlanId.length > 0;
  const reminderMinutesBefore = useMemo(() => {
    const parsedValue =
      typeof initialReminderMinutesBeforeParam === "string"
        ? Number(initialReminderMinutesBeforeParam)
        : Number.NaN;

    return Number.isFinite(parsedValue)
      ? Math.max(Math.round(parsedValue), 0)
      : DEFAULT_REMINDER_MINUTES;
  }, [initialReminderMinutesBeforeParam]);

  const calendarRows = useMemo(
    () => buildCalendarRows(visibleMonth),
    [visibleMonth],
  );

  const dateSummary = isDateEnabled ? formatCollapsedDate(selectedDate) : "";
  const timeSummary = isTimeEnabled ? formatCollapsedTime(selectedTimeDate) : "";

  const isReminderAvailable = isDateEnabled && isTimeEnabled;

  useEffect(() => {
    if (!isEditMode) {
      hydratedEditKeyRef.current = null;
      return;
    }

    const hydrationKey = `${scheduledWorkoutId}:${workoutPlanId}:${initialScheduledForParam ?? ""}`;
    if (hydratedEditKeyRef.current === hydrationKey) {
      return;
    }

    hydratedEditKeyRef.current = hydrationKey;

    const initialScheduledForDate =
      typeof initialScheduledForParam === "string"
        ? new Date(initialScheduledForParam)
        : null;
    const hasValidScheduledFor =
      initialScheduledForDate != null &&
      !Number.isNaN(initialScheduledForDate.getTime());
    const reminderEnabledFromParams = initialReminderEnabledParam === "true";

    setTitleInput(
      typeof initialTitleParam === "string" ? initialTitleParam : "",
    );
    setDescriptionInput(
      typeof initialDescriptionParam === "string" ? initialDescriptionParam : "",
    );
    setIsDateEnabled(hasValidScheduledFor);
    setIsTimeEnabled(hasValidScheduledFor);
    setSelectedDate(
      hasValidScheduledFor && initialScheduledForDate
        ? stripTime(initialScheduledForDate)
        : null,
    );
    setVisibleMonth(
      hasValidScheduledFor && initialScheduledForDate
        ? startOfMonth(initialScheduledForDate)
        : startOfMonth(new Date()),
    );
    setSelectedTimeDate(hasValidScheduledFor ? initialScheduledForDate : null);
    setReminderEnabled(hasValidScheduledFor ? reminderEnabledFromParams : false);
    setIsDatePickerOpen(false);
    setIsMonthYearPickerVisible(false);
    setIsTimePickerOpen(false);
    setSaveFeedback(null);
  }, [
    initialDescriptionParam,
    initialReminderEnabledParam,
    initialScheduledForParam,
    initialTitleParam,
    isEditMode,
    reminderMinutesBefore,
    scheduledWorkoutId,
    workoutPlanId,
  ]);

  const handleBack = async () => {
    await Haptics.selectionAsync();

    if (returnTo === "schedule") {
      router.replace("/schedule");
      return;
    }

    if (returnTo === "home") {
      router.replace(PRIVATE_HOME_ROUTE);
      return;
    }

    router.replace("/schedule");
  };

  const handleDateToggle = (value: boolean) => {
    setIsDateEnabled(value);

    if (!value) {
      setReminderEnabled(false);
      setIsDatePickerOpen(false);
      setIsMonthYearPickerVisible(false);
      return;
    }

    const nextDate = selectedDate ?? stripTime(new Date());

    setSelectedDate(nextDate);
    setVisibleMonth(startOfMonth(nextDate));

    // Date always opens the normal calendar grid first.
    // The month/year wheel only opens from the month title.
    setIsMonthYearPickerVisible(false);
    setIsDatePickerOpen(true);
    setIsTimePickerOpen(false);
  };

  const handleDateRowPress = async () => {
    if (!isDateEnabled) {
      return;
    }

    await Haptics.selectionAsync();
    setIsTimePickerOpen(false);

    setIsDatePickerOpen((current) => {
      const nextOpen = !current;

      // Tapping the Date row should never open the month/year wheel directly.
      setIsMonthYearPickerVisible(false);

      return nextOpen;
    });
  };

  const handleMonthYearToggle = async () => {
    await Haptics.selectionAsync();

    setIsDatePickerOpen(true);
    setIsMonthYearPickerVisible((current) => !current);
  };

  const handleVisibleMonthChange = async (nextMonth: Date) => {
    await Haptics.selectionAsync();

    setVisibleMonth(nextMonth);
    setIsMonthYearPickerVisible(false);
  };

  const handleMonthYearSelect = (nextMonth: Date) => {
    setVisibleMonth(nextMonth);
    setIsDatePickerOpen(true);
    setIsMonthYearPickerVisible(true);
  };

  const handleTimeToggle = (value: boolean) => {
    setIsTimeEnabled(value);

    if (!value) {
      setReminderEnabled(false);
      setIsTimePickerOpen(false);
      return;
    }

    if (!selectedTimeDate) {
      setSelectedTimeDate(getDefaultScheduleTimeDate());
    }

    setIsDatePickerOpen(false);
    setIsMonthYearPickerVisible(false);
    setIsTimePickerOpen(true);
  };

  const handleTimeRowPress = async () => {
    if (!isTimeEnabled) {
      return;
    }

    await Haptics.selectionAsync();

    if (!selectedTimeDate) {
      setSelectedTimeDate(getDefaultScheduleTimeDate());
    }

    setIsDatePickerOpen(false);
    setIsMonthYearPickerVisible(false);
    setIsTimePickerOpen((current) => !current);
  };

  const handleNativeTimeChange = (
    event: DateTimePickerEvent,
    nextDate?: Date,
  ) => {
    if (event.type === "dismissed") {
      if (Platform.OS !== "ios") {
        setIsTimePickerOpen(false);
      }

      return;
    }

    if (!nextDate) {
      return;
    }

    setSelectedTimeDate(nextDate);
    triggerTimeHaptic(lastTimeHapticAt);

    if (Platform.OS !== "ios") {
      setIsTimePickerOpen(false);
    }
  };

  const handleReminderToggle = (value: boolean) => {
    if (value && !isReminderAvailable) {
      Alert.alert(
        "Reminder unavailable",
        "Choose a date and time before enabling a reminder.",
      );
      return;
    }

    setReminderEnabled(value);
  };

  const handleSaveWorkout = async () => {
    const trimmedTitle = titleInput.trim();
    const trimmedDescription = descriptionInput.trim();

    if (!trimmedTitle) {
      Alert.alert("Title required", "Enter a workout title before saving.");
      return;
    }

    if (!user?.id) {
      Alert.alert(
        "Unavailable",
        "Workout saving is not available until your signed-in profile is ready.",
      );
      return;
    }

    const scheduledForResult = buildScheduledFor({
      isDateEnabled,
      isTimeEnabled,
      selectedDate,
      selectedTimeDate,
    });

    if (scheduledForResult.error) {
      Alert.alert("Incomplete schedule", scheduledForResult.error);
      return;
    }

    if (isEditMode && !scheduledForResult.value) {
      Alert.alert(
        "Incomplete schedule",
        "Choose a date and time before updating this scheduled workout.",
      );
      return;
    }

    const workoutPlanPayload = {
      clerkUserId: user.id,
      title: trimmedTitle,
      description: trimmedDescription || null,
      scheduledFor: scheduledForResult.value,
      reminderEnabled: scheduledForResult.value ? reminderEnabled : false,
      reminderMinutesBefore: DEFAULT_REMINDER_MINUTES,
    };

    setIsSaving(true);
    setSaveFeedback(null);

    try {
      if (isEditMode) {
        await updateScheduledWorkout({
          clerkUserId: user.id,
          scheduledWorkoutId,
          workoutPlanId,
          title: trimmedTitle,
          description: trimmedDescription || null,
          scheduledFor: scheduledForResult.value!,
          reminderEnabled,
          reminderMinutesBefore,
        });
      } else {
        const result = await createWorkoutPlan(workoutPlanPayload);

        if (result.error) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setSaveFeedback({
            tone: "error",
            message: USER_SAVE_ERROR_MESSAGE,
          });
          return;
        }
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaveFeedback({
        tone: "success",
        message: isEditMode
          ? "Scheduled workout updated."
          : scheduledForResult.value
            ? "Workout saved and added to your schedule."
            : "Workout plan saved successfully.",
      });

      if (isEditMode) {
        if (returnTo === "home") {
          router.replace(PRIVATE_HOME_ROUTE);
          return;
        }

        router.replace("/schedule");
        return;
      }

      resetForm();
    } catch (error) {
      if (__DEV__) {
        console.warn("[CreateActivity] Unexpected save error", {
          error,
          profileClerkUserId: user.id,
          computedScheduledFor: scheduledForResult.value,
        });
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setSaveFeedback({
        tone: "error",
        message: USER_SAVE_ERROR_MESSAGE,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setTitleInput("");
    setDescriptionInput("");

    setIsDateEnabled(false);
    setIsDatePickerOpen(false);
    setSelectedDate(null);
    setVisibleMonth(startOfMonth(new Date()));
    setIsMonthYearPickerVisible(false);

    setIsTimeEnabled(false);
    setIsTimePickerOpen(false);
    setSelectedTimeDate(null);

    setReminderEnabled(false);
    setRepeatValue("Never");
    setIsRepeatModalVisible(false);
  };

  return (
    <AppScreen backgroundColor={colors.appDarkBlue} contentStyle={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => void handleBack()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft color={colors.journeyText} size={22} strokeWidth={2.4} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              {isEditMode ? "Edit Activity" : "Create Activity"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEditMode
                ? "Update this scheduled workout."
                : "Create or schedule your workout."}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Workout Details</Text>

          <View style={styles.sectionCard}>
            <InputField
              label="Title"
              value={titleInput}
              onChangeText={setTitleInput}
              placeholder="Workout title"
            />

            <InputField
              label="Description"
              value={descriptionInput}
              onChangeText={setDescriptionInput}
              placeholder="Add a short note or focus for this workout"
              multiline
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Schedule</Text>

          <View style={styles.scheduleCard}>
            <ScheduleToggleRow
              icon="calendar-month-outline"
              label="Date"
              value={dateSummary}
              enabled={isDateEnabled}
              onValueChange={handleDateToggle}
              onPress={() => void handleDateRowPress()}
            />

            {isDateEnabled && isDatePickerOpen ? (
              <View style={styles.expandedSection}>
                <View style={styles.calendarHeader}>
                  <Pressable
                    onPress={() => void handleMonthYearToggle()}
                    style={({ pressed }) => [
                      styles.monthLabelButton,
                      pressed && styles.rowPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Open month and year picker"
                  >
                    <Text style={styles.calendarMonthLabel}>
                      {formatMonthYear(visibleMonth)}
                    </Text>

                    {isMonthYearPickerVisible ? (
                      <ChevronUp
                        color="rgba(255,255,255,0.76)"
                        size={15}
                        strokeWidth={2.4}
                      />
                    ) : (
                      <ChevronDown
                        color="rgba(255,255,255,0.76)"
                        size={15}
                        strokeWidth={2.4}
                      />
                    )}
                  </Pressable>

                  <View style={styles.calendarArrowRow}>
                    <Pressable
                      onPress={() =>
                        void handleVisibleMonthChange(
                          addMonths(visibleMonth, -1),
                        )
                      }
                      style={({ pressed }) => [
                        styles.calendarArrowButton,
                        pressed && styles.rowPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Show previous month"
                    >
                      <ChevronLeft
                        color="rgba(255,255,255,0.7)"
                        size={24}
                        strokeWidth={2.5}
                      />
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        void handleVisibleMonthChange(
                          addMonths(visibleMonth, 1),
                        )
                      }
                      style={({ pressed }) => [
                        styles.calendarArrowButton,
                        pressed && styles.rowPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Show next month"
                    >
                      <ChevronRight
                        color="rgba(255,255,255,0.92)"
                        size={24}
                        strokeWidth={2.5}
                      />
                    </Pressable>
                  </View>
                </View>

                {isMonthYearPickerVisible ? (
                  <View style={styles.monthYearPickerShell}>
                    <View
                      style={styles.wheelHighlightCompact}
                      pointerEvents="none"
                    />

                    <CenteredWheelColumn
                      options={[...MONTH_OPTIONS]}
                      selectedValue={MONTH_OPTIONS[visibleMonth.getMonth()]}
                      onSelect={(value) => {
                        handleMonthYearSelect(
                          new Date(
                            visibleMonth.getFullYear(),
                            MONTH_OPTIONS.indexOf(
                              value as (typeof MONTH_OPTIONS)[number],
                            ),
                            1,
                          ),
                        );
                      }}
                      formatter={(value) => value}
                    />

                    <CenteredWheelColumn
                      options={YEAR_OPTIONS}
                      selectedValue={visibleMonth.getFullYear()}
                      onSelect={(value) => {
                        handleMonthYearSelect(
                          new Date(value as number, visibleMonth.getMonth(), 1),
                        );
                      }}
                      formatter={(value) => String(value)}
                    />
                  </View>
                ) : (
                  <>
                    <View style={styles.weekdayRow}>
                      {WEEKDAY_LABELS.map((label) => (
                        <Text key={label} style={styles.weekdayText}>
                          {label}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.calendarGrid}>
                      {calendarRows.map((week, weekIndex) => (
                        <View
                          key={`week-${weekIndex}`}
                          style={styles.calendarWeekRow}
                        >
                          {week.map((day, dayIndex) => {
                            if (!day) {
                              return (
                                <View
                                  key={`blank-${dayIndex}`}
                                  style={styles.dayCell}
                                />
                              );
                            }

                            const cleanDay = stripTime(day);
                            const isSelected =
                              selectedDate != null &&
                              isSameCalendarDay(selectedDate, cleanDay);
                            const isToday = isSameCalendarDay(
                              stripTime(new Date()),
                              cleanDay,
                            );

                            return (
                              <Pressable
                                key={cleanDay.toISOString()}
                                onPress={() => {
                                  setSelectedDate(cleanDay);
                                  setVisibleMonth(startOfMonth(cleanDay));
                                  setIsDatePickerOpen(false);
                                  setIsMonthYearPickerVisible(false);
                                }}
                                style={({ pressed }) => [
                                  styles.dayCell,
                                  pressed && styles.rowPressed,
                                ]}
                              >
                                <View
                                  style={[
                                    styles.dayCircle,
                                    isToday && styles.dayCircleToday,
                                    isSelected && styles.dayCircleSelected,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.dayNumber,
                                      isToday && styles.dayNumberToday,
                                      isSelected && styles.dayNumberSelected,
                                    ]}
                                  >
                                    {cleanDay.getDate()}
                                  </Text>
                                </View>
                              </Pressable>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            ) : null}

            <View style={styles.divider} />

            <ScheduleToggleRow
              icon="clock-outline"
              label="Time"
              value={timeSummary}
              enabled={isTimeEnabled}
              onValueChange={handleTimeToggle}
              onPress={() => void handleTimeRowPress()}
            />

            {isTimeEnabled && isTimePickerOpen && selectedTimeDate ? (
              <View style={styles.nativeTimePickerWrap}>
                <DateTimePicker
                  value={selectedTimeDate}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  is24Hour={false}
                  locale="en_US"
                  onChange={handleNativeTimeChange}
                  textColor={colors.journeyText}
                  style={styles.nativeTimePicker}
                />
              </View>
            ) : null}

            <View style={styles.divider} />

            <SelectionRow
              icon="repeat"
              label="Repeat"
              value={repeatValue}
              valuePosition="right"
              onPress={() => setIsRepeatModalVisible(true)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Reminder</Text>

          <View style={styles.scheduleCard}>
            <ScheduleToggleRow
              icon="bell-outline"
              label="Reminder"
              enabled={reminderEnabled}
              onValueChange={handleReminderToggle}
            />
          </View>
        </View>

        {saveFeedback ? (
          <View
            style={[
              styles.feedbackCard,
              saveFeedback.tone === "success"
                ? styles.feedbackSuccess
                : styles.feedbackError,
            ]}
          >
            <Text
              style={[
                styles.feedbackText,
                saveFeedback.tone === "success"
                  ? styles.feedbackTextSuccess
                  : styles.feedbackTextError,
              ]}
            >
              {saveFeedback.message}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => void handleSaveWorkout()}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Save workout plan"
          style={({ pressed }) => [
            styles.saveButton,
            isSaving && styles.saveButtonDisabled,
            pressed && !isSaving && styles.saveButtonPressed,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditMode ? "Update Workout" : "Save Workout Plan"}
            </Text>
          )}
        </Pressable>
      </ScrollView>

      <SelectionModal
        visible={isRepeatModalVisible}
        title="Repeat"
        options={REPEAT_OPTIONS.map((option) => ({
          label: option,
          value: option,
        }))}
        selectedValue={repeatValue}
        onClose={() => setIsRepeatModalVisible(false)}
        onSelect={(value) => {
          setRepeatValue(value as (typeof REPEAT_OPTIONS)[number]);
          setIsRepeatModalVisible(false);
        }}
      />
    </AppScreen>
  );
}

function InputField({
  label,
  multiline = false,
  ...props
}: ComponentProps<typeof TextInput> & {
  label: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor="rgba(255,255,255,0.35)"
        selectionColor={colors.homeCream}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

function ScheduleToggleRow({
  icon,
  label,
  value,
  enabled,
  onValueChange,
  onPress,
  disabled = false,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value?: string;
  enabled: boolean;
  onValueChange: (value: boolean) => void;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const accessibilityLabel = value ? `${label}: ${value}` : label;

  return (
    <View style={styles.rowShell}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [
          styles.rowTapArea,
          pressed && onPress && styles.rowPressed,
        ]}
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={accessibilityLabel}
      >
        <View style={styles.rowContentGroup}>
          <View style={styles.rowIconWrap}>
            <MaterialCommunityIcons
              name={icon}
              size={18}
              color="rgba(255,255,255,0.82)"
            />
          </View>

          <View style={styles.rowTextColumn}>
            <Text style={styles.rowLabel}>{label}</Text>
            {value ? <Text style={styles.rowValue}>{value}</Text> : null}
          </View>
        </View>
      </Pressable>

      <Switch
        style={styles.switch}
        trackColor={{
          false: NEUTRAL_SWITCH_TRACK,
          true: NEUTRAL_SWITCH_TRACK,
        }}
        thumbColor={NEUTRAL_SWITCH_THUMB}
        ios_backgroundColor={NEUTRAL_SWITCH_TRACK}
        value={enabled}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </View>
  );
}

function SelectionRow({
  icon,
  label,
  value,
  valuePosition = "below-label",
  onPress,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value: string;
  valuePosition?: "below-label" | "right";
  onPress: () => void;
}) {
  const showRightValue = valuePosition === "right";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.selectionRow, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={styles.rowContentGroup}>
        <View style={styles.rowIconWrap}>
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color="rgba(255,255,255,0.82)"
          />
        </View>

        {showRightValue ? (
          <Text style={styles.rowLabel}>{label}</Text>
        ) : (
          <View style={styles.rowTextColumn}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
          </View>
        )}
      </View>

      {showRightValue ? (
        <View style={styles.selectionRightGroup}>
          <Text style={styles.selectionRightValue}>{value}</Text>

          <View style={styles.selectionArrowStack}>
            <ChevronUp
              color="rgba(255,255,255,0.78)"
              size={13}
              strokeWidth={2.2}
            />
            <ChevronDown
              color="rgba(255,255,255,0.78)"
              size={13}
              strokeWidth={2.2}
            />
          </View>
        </View>
      ) : (
        <ChevronDown
          color="rgba(255,255,255,0.78)"
          size={18}
          strokeWidth={2.2}
        />
      )}
    </Pressable>
  );
}

function CenteredWheelColumn<T extends string | number>({
  options,
  selectedValue,
  onSelect,
  formatter,
}: {
  options: T[];
  selectedValue: T;
  onSelect: (value: T) => void;
  formatter: (value: T) => string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = Math.max(
    options.findIndex((option) => option === selectedValue),
    0,
  );

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * MONTH_YEAR_ITEM_HEIGHT,
        animated: false,
      });
    });
  }, [selectedIndex]);

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const nextIndex = clamp(
      Math.round(offsetY / MONTH_YEAR_ITEM_HEIGHT),
      0,
      options.length - 1,
    );
    const nextValue = options[nextIndex];

    if (nextValue !== selectedValue) {
      onSelect(nextValue);
      void Haptics.selectionAsync().catch(() => undefined);
    }

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: nextIndex * MONTH_YEAR_ITEM_HEIGHT,
        animated: true,
      });
    });
  };

  return (
    <ScrollView
      ref={scrollRef}
      nestedScrollEnabled
      bounces={false}
      showsVerticalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={MONTH_YEAR_ITEM_HEIGHT}
      snapToAlignment="start"
      contentContainerStyle={styles.monthYearWheelContent}
      style={styles.monthYearWheelColumn}
      onMomentumScrollEnd={handleScrollEnd}
      onScrollEndDrag={(event) => {
        if (!event.nativeEvent.velocity?.y) {
          handleScrollEnd(event);
        }
      }}
      scrollEventThrottle={16}
    >
      {options.map((option) => {
        const isSelected = option === selectedValue;

        return (
          <View key={String(option)} style={styles.wheelRow}>
            <Text
              style={[
                styles.wheelText,
                isSelected ? styles.wheelTextSelected : styles.wheelTextMuted,
              ]}
            >
              {formatter(option)}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function SelectionModal({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: { label: string; value: string }[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={styles.modalCard}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={styles.modalTitle}>{title}</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalOptions}
          >
            {options.map((option) => {
              const selected = option.value === selectedValue;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  style={({ pressed }) => [
                    styles.modalOption,
                    selected && styles.modalOptionSelected,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selected && styles.modalOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function buildScheduledFor({
  isDateEnabled,
  isTimeEnabled,
  selectedDate,
  selectedTimeDate,
}: {
  isDateEnabled: boolean;
  isTimeEnabled: boolean;
  selectedDate: Date | null;
  selectedTimeDate: Date | null;
}) {
  if (isDateEnabled && !isTimeEnabled) {
    return {
      value: null,
      error: "Please choose a time for this scheduled workout.",
    };
  }

  if (!isDateEnabled && isTimeEnabled) {
    return {
      value: null,
      error: "Please choose a date for this scheduled workout.",
    };
  }

  if (!isDateEnabled && !isTimeEnabled) {
    return { value: null, error: null };
  }

  if (!selectedDate) {
    return {
      value: null,
      error: "Please choose a date for this scheduled workout.",
    };
  }

  if (!selectedTimeDate) {
    return {
      value: null,
      error: "Please choose a time for this scheduled workout.",
    };
  }

  return {
    value: buildScheduledForIso(selectedDate, selectedTimeDate),
    error: null,
  };
}

function buildScheduledForIso(date: Date, timeDate: Date) {
  const scheduled = new Date(date);

  scheduled.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);

  return scheduled.toISOString();
}

function buildCalendarRows(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = firstDay.getDay();
  const cells: (Date | null)[] = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return chunkIntoWeeks(cells);
}

function chunkIntoWeeks<T>(items: T[]) {
  const weeks: T[][] = [];

  for (let index = 0; index < items.length; index += 7) {
    weeks.push(items.slice(index, index + 7));
  }

  return weeks;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatCollapsedDate(date: Date | null) {
  if (!date) {
    return "";
  }

  if (isSameCalendarDay(date, new Date())) {
    return "Today";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCollapsedTime(date: Date | null) {
  if (!date) {
    return "";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getDefaultScheduleTimeDate() {
  const now = new Date();
  const nextHour = new Date(now);

  nextHour.setHours(now.getHours() + 1, 0, 0, 0);

  return nextHour;
}

function triggerTimeHaptic(lastTimeHapticAt: { current: number }) {
  const now = Date.now();

  if (now - lastTimeHapticAt.current < HAPTIC_THROTTLE_MS) {
    return;
  }

  lastTimeHapticAt.current = now;
  void Haptics.selectionAsync().catch(() => undefined);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 48,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  backButtonPressed: {
    opacity: 0.84,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 30,
    lineHeight: 34,
  },
  headerSubtitle: {
    marginTop: 6,
    color: "rgba(255,255,255,0.62)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    marginBottom: 10,
    marginLeft: 2,
    color: "rgba(255,255,255,0.82)",
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  sectionCard: {
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  scheduleCard: {
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  fieldBlock: {
    marginTop: 10,
  },
  fieldLabel: {
    marginBottom: 8,
    color: "rgba(255,255,255,0.82)",
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  input: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 14,
  },
  inputMultiline: {
    minHeight: 108,
    textAlignVertical: "top",
  },
  rowShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowTapArea: {
    flex: 1,
  },
  selectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowPressed: {
    opacity: 0.86,
  },
  rowContentGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  rowTextColumn: {
    flex: 1,
    gap: 3,
  },
  rowLabel: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 15,
    lineHeight: 20,
  },
  rowValue: {
    color: "rgba(255,255,255,0.68)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  selectionRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectionRightValue: {
    color: "rgba(255,255,255,0.68)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  selectionArrowStack: {
    alignItems: "center",
    justifyContent: "center",
    gap: -3,
  },
  switch: {
    transform: [{ scaleX: 0.92 }, { scaleY: 0.92 }],
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  expandedSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  monthLabelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  calendarMonthLabel: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 18,
    lineHeight: 24,
  },
  calendarArrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarArrowButton: {
    width: 34,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  monthYearPickerShell: {
    position: "relative",
    flexDirection: "row",
    alignSelf: "center",
    width: "86%",
    height: MONTH_YEAR_WHEEL_HEIGHT,
    gap: 12,
    overflow: "hidden",
    marginTop: 2,
    marginBottom: 8,
  },
  wheelHighlightCompact: {
    position: "absolute",
    left: 0,
    right: 0,
    top: MONTH_YEAR_ITEM_HEIGHT,
    height: MONTH_YEAR_ITEM_HEIGHT,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
    marginBottom: 8,
  },
  weekdayText: {
    width: 40,
    textAlign: "center",
    color: "rgba(255,255,255,0.72)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 12,
  },
  calendarGrid: {
    gap: 6,
  },
  calendarWeekRow: {
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
  dayCircleToday: {
    borderColor: colors.homeCream,
    backgroundColor: "rgba(246,243,186,0.08)",
  },
  dayCircleSelected: {
    borderColor: colors.homeCream,
    backgroundColor: colors.homeCream,
  },
  dayNumber: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 13,
  },
  dayNumberToday: {
    color: colors.homeCream,
    fontFamily: "MontserratAlternates-SemiBold",
  },
  dayNumberSelected: {
    color: colors.background,
    fontFamily: "MontserratAlternates-SemiBold",
  },
  nativeTimePickerWrap: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  nativeTimePicker: {
    width: "100%",
    height: 176,
  },
  monthYearWheelColumn: {
    flex: 1,
    height: MONTH_YEAR_WHEEL_HEIGHT,
  },
  monthYearWheelContent: {
    paddingVertical: MONTH_YEAR_ITEM_HEIGHT,
  },
  wheelRow: {
    height: MONTH_YEAR_ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelText: {
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },
  wheelTextSelected: {
    color: colors.journeyText,
  },
  wheelTextMuted: {
    color: "rgba(255,255,255,0.32)",
  },
  feedbackCard: {
    marginTop: 24,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: "rgba(246,243,186,0.12)",
    borderColor: "rgba(246,243,186,0.28)",
  },
  feedbackError: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderColor: "rgba(255,255,255,0.09)",
  },
  feedbackText: {
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 13,
    lineHeight: 19,
  },
  feedbackTextSuccess: {
    color: colors.homeCream,
  },
  feedbackTextError: {
    color: colors.journeyText,
  },
  saveButton: {
    minHeight: 56,
    marginTop: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.homeCream,
    paddingHorizontal: 20,
  },
  saveButtonDisabled: {
    opacity: 0.68,
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonText: {
    color: colors.background,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7,9,14,0.7)",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  modalCard: {
    maxHeight: "72%",
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#221C31",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 20,
    lineHeight: 26,
  },
  modalOptions: {
    paddingTop: 14,
    gap: 10,
  },
  modalOption: {
    minHeight: 46,
    borderRadius: 16,
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  modalOptionSelected: {
    backgroundColor: colors.homeCream,
    borderColor: colors.homeCream,
  },
  modalOptionText: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 13,
  },
  modalOptionTextSelected: {
    color: colors.background,
  },
});
