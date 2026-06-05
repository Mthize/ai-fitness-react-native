import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useState } from "react";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";

const NEUTRAL_SWITCH_TRACK = "rgba(255,255,255,0.16)";
const NEUTRAL_SWITCH_THUMB = "#F4F4F4";

type NotificationRowProps = {
  title: string;
  description?: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  isLast: boolean;
};

export default function NotificationsScreen() {
  const [workoutRemindersEnabled, setWorkoutRemindersEnabled] = useState(true);
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);
  const [weeklyInsightsEnabled, setWeeklyInsightsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleBackPress = () => {
    router.replace("/settings");
  };

  const handleNotificationsToggle =
    (setter: (value: boolean) => void, scheduler?: () => Promise<unknown>) =>
    (enabled: boolean) => {
      setter(enabled);

      if (!enabled || !scheduler) {
        return;
      }

      void requestNotificationPermission().then((granted) => {
        if (!granted) {
          return;
        }

        void scheduler();
      });
    };

  return (
    <AppScreen backgroundColor={colors.appDarkBlue} contentStyle={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBackPress}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <ChevronLeft size={20} color={colors.journeyText} strokeWidth={2.4} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              Manage notification categories and device behavior.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>

          <View style={styles.sectionCard}>
            <NotificationRow
              title="Workout reminders"
              description="Allow reminders for scheduled workouts."
              enabled={workoutRemindersEnabled}
              onToggle={handleNotificationsToggle(
                setWorkoutRemindersEnabled,
                scheduleWorkoutReminderPreference,
              )}
              isLast={false}
            />
            <NotificationRow
              title="AI suggestions"
              description="Receive AI tips based on your workout progress."
              enabled={aiSuggestionsEnabled}
              onToggle={handleNotificationsToggle(
                setAiSuggestionsEnabled,
                scheduleAiSuggestionNotification,
              )}
              isLast={false}
            />
            <NotificationRow
              title="Weekly insights"
              description="Get weekly Statistics summaries."
              enabled={weeklyInsightsEnabled}
              onToggle={handleNotificationsToggle(
                setWeeklyInsightsEnabled,
                scheduleWeeklyInsightsReminder,
              )}
              isLast={false}
            />
            <NotificationRow
              title="Sound"
              enabled={soundEnabled}
              onToggle={setSoundEnabled}
              isLast={false}
            />
            <NotificationRow
              title="Vibration"
              enabled={vibrationEnabled}
              onToggle={setVibrationEnabled}
              isLast
            />
          </View>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Workout reminder time is configured when creating or scheduling each
            workout.
          </Text>
          <Text style={styles.noteMuted}>
            TODO: Reminder timing is configured per workout in Create Activity.
          </Text>
          <Text style={styles.noteMuted}>
            TODO: Persist notification preferences securely in backend user
            settings.
          </Text>
          <Text style={styles.noteMuted}>
            TODO: Integrate expo-notifications for real scheduled notifications
            later.
          </Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function NotificationRow({
  title,
  description,
  enabled,
  onToggle,
  isLast,
}: NotificationRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowContent}>
        <View style={styles.rowTextColumn}>
          <Text style={styles.rowLabel}>{title}</Text>
          {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
        </View>

        <Switch
          trackColor={{
            false: NEUTRAL_SWITCH_TRACK,
            true: NEUTRAL_SWITCH_TRACK,
          }}
          thumbColor={NEUTRAL_SWITCH_THUMB}
          ios_backgroundColor={NEUTRAL_SWITCH_TRACK}
          value={enabled}
          onValueChange={onToggle}
        />
      </View>

      {!isLast ? <View style={styles.divider} /> : null}
    </View>
  );
}

async function ensureNotificationChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("general-notifications", {
    name: "General notifications",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function requestNotificationPermission() {
  try {
    await ensureNotificationChannel();

    const existingStatus = await Notifications.getPermissionsAsync();
    if (
      existingStatus.granted ||
      existingStatus.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }

    const requestedStatus = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    return (
      requestedStatus.granted ||
      requestedStatus.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

async function scheduleWorkoutReminderPreference() {
  // TODO: Integrate expo-notifications for real scheduled notifications later.
  return Promise.resolve({ notificationType: "workout-reminders" });
}

async function scheduleWeeklyInsightsReminder() {
  // TODO: Integrate expo-notifications for real scheduled notifications later.
  return Promise.resolve({ notificationType: "weekly-insights" });
}

async function scheduleAiSuggestionNotification() {
  // TODO: Integrate AI-driven notification triggers when backend insights are ready.
  return Promise.resolve({ notificationType: "ai-suggestions" });
}

// TODO: Encrypt sensitive user data at rest and use secure transport when backend is added.
// TODO: Authentication passwords must be handled by the auth provider using secure hashing.
// TODO: Do not store plaintext passwords.

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 132,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    color: "rgba(255,255,255,0.58)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 2,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionCard: {
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "rgba(89, 78, 110, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowContent: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowTextColumn: {
    flex: 1,
    paddingRight: 12,
  },
  rowLabel: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 14,
  },
  rowDescription: {
    marginTop: 5,
    color: "rgba(255,255,255,0.58)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  noteCard: {
    marginTop: 20,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  noteText: {
    color: colors.homeCream,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 13,
    lineHeight: 18,
  },
  noteMuted: {
    marginTop: 8,
    color: "rgba(255,255,255,0.56)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 11,
    lineHeight: 16,
  },
});
