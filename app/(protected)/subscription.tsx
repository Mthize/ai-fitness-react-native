import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";

export default function SubscriptionScreen() {
  const handleBackPress = () => {
    router.replace("/settings");
  };

  return (
    <AppScreen backgroundColor={colors.appDarkBlue} contentStyle={styles.screen}>
      <View style={styles.content}>
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

        <View style={styles.header}>
          <Text style={styles.title}>Subscription</Text>
          <Text style={styles.subtitle}>
            Manage billing and entitlement settings here when subscription flows
            are connected.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Subscription management coming soon.</Text>
          <Text style={styles.cardBody}>
            TODO: Connect to real billing/subscription provider later.
          </Text>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
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
  header: {
    marginTop: 22,
  },
  title: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 30,
    lineHeight: 34,
  },
  subtitle: {
    marginTop: 8,
    color: "rgba(255,255,255,0.58)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    marginTop: 24,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "rgba(89, 78, 110, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  cardTitle: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 15,
    lineHeight: 20,
  },
  cardBody: {
    marginTop: 8,
    color: "rgba(255,255,255,0.58)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 12,
    lineHeight: 18,
  },
});
