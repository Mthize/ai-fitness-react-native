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
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 12, 24),
            paddingBottom: Math.max(insets.bottom + 24, 24),
          },
        ]}
      >
        <Pressable
          onPress={() => void handleBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <ArrowLeft color={colors.journeyText} size={22} strokeWidth={2.4} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
          <Text style={styles.subtitle}>
            Search workouts, plans, or saved activity.
          </Text>
        </View>

        <View style={styles.searchField}>
          <Search
            color="rgba(255,255,255,0.62)"
            size={18}
            strokeWidth={2.2}
          />
          <TextInput
            placeholder="Search activity"
            placeholderTextColor="rgba(255,255,255,0.4)"
            selectionColor={colors.journeyText}
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  header: {
    marginTop: 28,
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
  searchField: {
    marginTop: 28,
    minHeight: 60,
    borderRadius: 22,
    paddingHorizontal: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 15,
    paddingVertical: 16,
  },
});
