import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import {
  ArrowUpRight,
  Droplets,
  Footprints,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";

const PERIOD_OPTIONS = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
] as const;

export default function StatisticsScreen() {
  // This currently only switches the highlighted chip because the underlying charts are still visual placeholders.
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month">(
    "day",
  );
  const insets = useSafeAreaInsets();
  const currentDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  })
    .format(new Date())
    .toUpperCase();

  // TODO: Replace these temporary visual stats with real user activity and health data once the statistics feed is ready.
  const calorieValue = "1234 cal";

  return (
    <SafeAreaView style={styles.root} edges={["left", "right", "bottom"]}>
      {/* Extends the dark panel color behind the safe area so the rounded card sits on a continuous background. */}
      <View pointerEvents="none" style={styles.bottomDarkFill} />

      <View style={styles.headerSection}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.dateText}>{currentDate}</Text>
            <Text style={styles.title}>Your{"\n"}Statistics</Text>
          </View>

          <View style={styles.weeklySummaryRow}>
            <View style={styles.weeklyTextBlock}>
              <Text style={styles.weeklyLabel}>Weekly Average</Text>
              <Text style={styles.weeklyValue}>102 CAL</Text>
            </View>

            <Pressable
              accessibilityLabel="Statistics overview action"
              style={styles.weeklyArrowButton}
            >
              <ArrowUpRight color={colors.background} size={30} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        <View style={styles.periodSelector}>
          {PERIOD_OPTIONS.map((option) => {
            const isSelected = selectedPeriod === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => setSelectedPeriod(option.value)}
                style={[
                  styles.periodOption,
                  isSelected && styles.periodOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    isSelected
                      ? styles.periodTextActive
                      : styles.periodTextInactive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={[
          styles.statsPanel,
          {
            paddingBottom: Math.max(insets.bottom + 88, 122),
          },
        ]}
      >
        <View style={styles.panelHandle} />

        <View style={styles.widgetsGroup}>
          <View style={styles.calorieCard}>
            <Text style={styles.calorieTitle}>Calories</Text>
            <Text style={styles.calorieValue}>{calorieValue}</Text>

            {/* The chart area is intentionally empty for now so the card keeps its final size before real chart rendering lands. */}
            <View style={styles.calorieChartPlaceholder} />
          </View>

          {/* These widgets are visual placeholders that keep the dashboard composition stable until live metrics are connected. */}
          <View style={styles.metricCardsRow}>
            <View style={[styles.metricCard, styles.walkCard]}>
              <View style={styles.metricIconCircle}>
                <Footprints
                  color={colors.background}
                  size={18}
                  strokeWidth={2.1}
                />
              </View>

              <Text style={styles.metricLabel}>Walk</Text>
              <Text style={styles.metricValue}>2 miles</Text>
            </View>

            <View style={[styles.metricCard, styles.drinkCard]}>
              <View style={styles.metricIconCircle}>
                <Droplets
                  color={colors.background}
                  size={18}
                  strokeWidth={2.1}
                />
              </View>

              <Text style={styles.metricLabel}>Drink</Text>
              <Text style={styles.metricValue}>150 ml</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  bottomDarkFill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
    backgroundColor: colors.background,
  },
  headerSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTitleBlock: {
    flexShrink: 1,
    paddingRight: 16,
  },
  dateText: {
    color: "rgba(43, 35, 57, 0.58)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 12,
    letterSpacing: 1.6,
    marginTop: -2,
  },
  title: {
    color: colors.background,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 32,
    lineHeight: 38,
    marginTop: 12,
  },
  weeklySummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  weeklyTextBlock: {
    alignItems: "flex-start",
  },
  weeklyLabel: {
    color: "rgba(43, 35, 57, 0.58)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  weeklyValue: {
    color: colors.background,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 18,
    lineHeight: 24,
    marginTop: 2,
  },
  weeklyArrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.statisticsPink,
    alignItems: "center",
    justifyContent: "center",
  },
  periodSelector: {
    flexDirection: "row",
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.statisticsSurface,
    padding: 4,
    marginTop: 16,
  },
  periodOption: {
    flex: 1,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  periodOptionActive: {
    backgroundColor: colors.background,
  },
  periodText: {
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 16,
  },
  periodTextActive: {
    color: colors.white,
    fontFamily: "MontserratAlternates-SemiBold",
  },
  periodTextInactive: {
    color: "rgba(43, 35, 57, 0.55)",
  },
  statsPanel: {
    flex: 1,
    width: "100%",
    marginTop: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 150,
    overflow: "hidden",
  },
  panelHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    marginBottom: 8,
  },
  widgetsGroup: {
    width: "100%",
    alignItems: "center",
    paddingTop: 0,
  },
  calorieCard: {
    width: 354,
    height: 284,
    borderRadius: 30,
    backgroundColor: colors.statisticsCream,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    alignSelf: "center",
  },
  calorieTitle: {
    color: colors.background,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 16,
    marginBottom: 4,
  },
  calorieValue: {
    color: colors.background,
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 14,
  },
  calorieChartPlaceholder: {
    height: 196,
    marginTop: 10,
  },
  metricCardsRow: {
    width: 354,
    flexDirection: "row",
    gap: 14,
    marginTop: 16,
    alignSelf: "center",
  },
  metricCard: {
    width: 165,
    height: 204,
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  walkCard: {
    backgroundColor: colors.homeAquaSoft,
  },
  drinkCard: {
    backgroundColor: colors.statisticsNeutralCard,
  },
  metricIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    color: "rgba(43, 35, 57, 0.72)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 13,
    marginTop: 14,
    marginBottom: 3,
  },
  metricValue: {
    color: colors.background,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 18,
    marginTop: 2,
  },
});
