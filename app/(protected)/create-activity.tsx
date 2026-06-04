import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";
import { PRIVATE_HOME_ROUTE } from "@/lib/auth";

export default function CreateActivityScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

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
        </View>
      </View>
    </AppScreen>
  );
}
