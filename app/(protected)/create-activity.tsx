import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";

export default function CreateActivityScreen() {
  const insets = useSafeAreaInsets();
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
      router.replace("/");
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
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
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft color={colors.journeyText} size={22} strokeWidth={2.4} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Create Activity</Text>
          <Text style={styles.subtitle}>Create or schedule your workout.</Text>
        </View>

        <View style={styles.placeholderCard}>
          {/* Placeholder copy keeps the route usable until the real workout and scheduling form is implemented. */}
          <Text style={styles.placeholderText}>
            Workout creation form coming soon.
          </Text>
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
  placeholderCard: {
    marginTop: 28,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  placeholderText: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 16,
    lineHeight: 23,
  },
});
