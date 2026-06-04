import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowLeft, Search } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";
import { PRIVATE_HOME_ROUTE } from "@/lib/auth";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  const handleBack = async () => {
    await Haptics.selectionAsync();

    if (returnTo === "home") {
      router.replace(PRIVATE_HOME_ROUTE);
      return;
    }

    router.replace(PRIVATE_HOME_ROUTE);
  };

  return (
    <AppScreen contentStyle={styles.screen}>
      <View
        className="flex-1 px-6"
        style={{
          paddingTop: Math.max(insets.top + 12, 24),
          paddingBottom: Math.max(insets.bottom + 24, 24),
        }}
      >
        <Pressable
          onPress={() => void handleBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)]"
        >
          <ArrowLeft color={colors.journeyText} size={22} strokeWidth={2.4} />
        </Pressable>

        <View className="mt-7">
          <Text style={styles.title}>Search</Text>
          <Text style={styles.subtitle}>
            Search workouts, plans, or saved activity.
          </Text>
        </View>

        <View className="mt-7 min-h-[60px] flex-row items-center gap-3 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.08)] px-[18px]">
          <Search
            color="rgba(255,255,255,0.62)"
            size={18}
            strokeWidth={2.2}
          />
          <TextInput
            placeholder="Search activity"
            placeholderTextColor="rgba(255,255,255,0.4)"
            selectionColor={colors.journeyText}
            className="flex-1 py-4 text-[15px]"
            style={styles.searchInput}
          />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 32,
    lineHeight: 38,
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  searchInput: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Regular",
  },
});
