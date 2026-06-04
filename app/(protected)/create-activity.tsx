import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, Switch, Text, View } from "react-native";
import { useState } from "react";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";
import { PRIVATE_HOME_ROUTE } from "@/lib/auth";

const REMINDER_OPTIONS = [
  "At workout time",
  "5 min before",
  "10 min before",
  "15 min before",
  "30 min before",
  "1 hour before",
] as const;

export default function CreateActivityScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [selectedReminderOption, setSelectedReminderOption] =
    useState<(typeof REMINDER_OPTIONS)[number]>("10 min before");

  // This screen is a placeholder for the future workout creation flow, so back behavior preserves the caller when possible.
  const handleBack = async () => {
    await Haptics.selectionAsync();

    // Named return targets keep the user in the same tab flow even when this screen was opened from a replace-only path.
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

  return (
    <AppScreen backgroundColor={colors.background}>
      <View className="flex-1 px-6 pt-6 pb-6">
        <Pressable
          onPress={() => void handleBack()}
          className="h-12 w-12 items-center justify-center rounded-full bg-white/10"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft color={colors.journeyText} size={22} strokeWidth={2.4} />
        </Pressable>

        <View className="mt-7">
          <Text className="font-[MontserratAlternates-Bold] text-[32px] leading-[38px] text-white">
            Create Activity
          </Text>
          <Text className="mt-[10px] font-[MontserratAlternates-Regular] text-[15px] leading-[22px] text-white/70">
            Create or schedule your workout.
          </Text>
        </View>

        <View className="mt-7 rounded-[28px] border border-white/10 bg-white/10 px-[22px] py-6">
          {/* Placeholder copy keeps the route usable until the real workout and scheduling form is implemented. */}
          <Text className="font-[MontserratAlternates-SemiBold] text-base leading-[23px] text-white">
            Workout creation form coming soon.
          </Text>
          <Text className="mt-2 font-[MontserratAlternates-Regular] text-[13px] leading-[19px] text-white/65">
            Reminder preferences belong to the workout creation flow, so they are
            configured here per workout.
          </Text>
        </View>

        <View className="mt-5 rounded-[28px] border border-white/10 bg-white/10 px-[22px] py-6">
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1">
              <Text className="font-[MontserratAlternates-SemiBold] text-base leading-[23px] text-white">
                Reminder
              </Text>
              <Text className="mt-2 font-[MontserratAlternates-Regular] text-[13px] leading-[19px] text-white/65">
                Choose whether this scheduled workout should send a reminder.
              </Text>
            </View>

            <Switch
              trackColor={{
                false: "rgba(255,255,255,0.14)",
                true: "rgba(246,243,186,0.48)",
              }}
              thumbColor={
                reminderEnabled ? colors.homeCream : "rgba(255,255,255,0.92)"
              }
              ios_backgroundColor="rgba(255,255,255,0.14)"
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
            />
          </View>

          <View className="mt-5 border-t border-white/10 pt-5">
            <Text className="font-[MontserratAlternates-SemiBold] text-[12px] uppercase tracking-[0.6px] text-[#F6F3BA]">
              Reminder timing
            </Text>

            <View className="mt-3 flex-row flex-wrap gap-2">
              {REMINDER_OPTIONS.map((option) => {
                const selected = option === selectedReminderOption;

                return (
                  <Pressable
                    key={option}
                    onPress={() => setSelectedReminderOption(option)}
                    accessibilityRole="button"
                    className={`rounded-full border px-[14px] py-[10px] ${
                      selected
                        ? "border-[#F6F3BA] bg-[#F6F3BA]"
                        : "border-white/10 bg-white/10"
                    }`}
                  >
                    <Text
                      className={`font-[MontserratAlternates-SemiBold] text-[12px] ${
                        selected ? "text-[#262135]" : "text-white"
                      }`}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                accessibilityRole="button"
                className="rounded-full border border-white/10 bg-white/10 px-[14px] py-[10px]"
              >
                <Text className="font-[MontserratAlternates-SemiBold] text-[12px] text-white">
                  Custom later
                </Text>
              </Pressable>
            </View>

            <Text className="mt-4 font-[MontserratAlternates-Regular] text-[12px] leading-[18px] text-white/60">
              TODO: Save reminder preference with the workout schedule.
            </Text>
            <Text className="mt-2 font-[MontserratAlternates-Regular] text-[12px] leading-[18px] text-white/60">
              TODO: Schedule local notification from workout date/time and
              selected reminder offset.
            </Text>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}
