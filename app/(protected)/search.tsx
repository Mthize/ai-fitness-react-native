import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";

export default function SearchScreen() {
  return (
    <AppScreen contentStyle={styles.screen}>
      <View style={styles.content}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Search</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  content: {
    flex: 1,
    gap: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.inputBackground,
  },
  backLabel: {
    color: colors.homeTextPrimary,
    fontFamily: "Poppins-Medium",
    fontSize: 14,
  },
  title: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 32,
  },
});
