import { Image, type ImageSource } from "expo-image";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Check, Dumbbell, PersonStanding, Plus } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";

import { AppScreen } from "@/components/AppScreen";
import {
  type HomeWorkoutActivity,
  useWorkoutProgress,
} from "@/components/workout/workoutData";
import { colors } from "@/constants/colors";
import { useUser } from "@/lib/clerk";

const weekDays = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];

// TODO: Replace this temporary chart series with real calorie history once Home is wired to activity data.
const weeklyCalories = [
  { day: "Mon", calories: 0 },
  { day: "Tues", calories: 0 },
  { day: "Wed", calories: 0 },
  { day: "Thurs", calories: 0 },
  { day: "Fri", calories: 0 },
  { day: "Sat", calories: 0 },
  { day: "Sun", calories: 0 },
];

const chartHeight = 132;
const chartMaxValue = 100;
const tooltipWidth = 58;
const tooltipHeight = 30;

export default function HomeScreen() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(1);
  const [isScheduleSheetOpen, setIsScheduleSheetOpen] = useState(false);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { user } = useUser();
  const selectedCalories = weeklyCalories[selectedDayIndex]?.calories ?? 0;
  const displayName =
    user?.firstName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress ??
    "Youssef";
  const initials = displayName
    .split(/[ @._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const avatarSource: ImageSource | null = user?.imageUrl
    ? { uri: user.imageUrl }
    : null;
  const chartWidth = Math.min(312, Math.max(284, screenWidth - 56));
  const chartSpacing = chartWidth / (weeklyCalories.length - 1);
  // The marker and tooltip are positioned manually because the chart library does not expose a built-in selected-point overlay.
  const markerLeft = chartSpacing * selectedDayIndex;
  const markerTop =
    chartHeight - (selectedCalories / chartMaxValue) * chartHeight;
  const { activities: todayActivities, currentWorkoutId } = useWorkoutProgress();
  const hasTodayActivities = todayActivities.length > 0;
  // Keep the sheet partially off-screen until it is opened so the modal only reveals the lower schedule panel.
  const sheetClosedOffset = Math.max(screenHeight * 0.42, 320);
  const sheetTranslateY = useRef(new Animated.Value(sheetClosedOffset)).current;
  const tooltipLeft = Math.max(
    0,
    Math.min(chartWidth - tooltipWidth, markerLeft - tooltipWidth / 2),
  );
  const tooltipTop = Math.max(0, markerTop - 44);
  const overlayOpacity = sheetTranslateY.interpolate({
    inputRange: [0, sheetClosedOffset],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Closes the local schedule sheet and waits for the exit animation before unmounting the modal.
  const closeScheduleSheet = useCallback(() => {
    Animated.timing(sheetTranslateY, {
      toValue: sheetClosedOffset,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setIsScheduleSheetOpen(false);
    });
  }, [sheetClosedOffset, sheetTranslateY]);
  const closeScheduleSheetRef = useRef(closeScheduleSheet);

  useEffect(() => {
    closeScheduleSheetRef.current = closeScheduleSheet;
  }, [closeScheduleSheet, sheetClosedOffset]);

  // Opens the Home-only schedule sheet instead of navigating away so the current chart and list stay in place.
  const openScheduleSheet = async () => {
    await Haptics.selectionAsync();
    sheetTranslateY.setValue(sheetClosedOffset);
    setIsScheduleSheetOpen(true);
    requestAnimationFrame(() => {
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        damping: 22,
        mass: 0.9,
        stiffness: 220,
        useNativeDriver: true,
      }).start();
    });
  };

  // Sends the user into the shared create-activity placeholder and tags the origin so its back action can return here.
  const openCreateActivity = async () => {
    await Haptics.selectionAsync();
    router.push({
      pathname: "/create-activity",
      params: { returnTo: "home" },
    });
  };

  const openSearch = () => {
    void Haptics.selectionAsync();
    router.push({
      pathname: "/search",
      params: { returnTo: "home" },
    });
  };

  const openProfile = () => {
    void Haptics.selectionAsync();
    router.push("/settings");
  };

  const openWorkout = (item: HomeWorkoutActivity) => {
    void Haptics.selectionAsync();
    router.push({
      pathname: item.route,
      params: {
        workoutId: item.id,
        mode: item.status === "completed" ? "history" : "active",
      },
    });
  };

  // Allows the bottom sheet to be dismissed with a downward drag while snapping back open on small gestures.
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 4 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderMove: (_, gestureState) => {
        sheetTranslateY.setValue(Math.max(gestureState.dy, 0));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.8) {
          closeScheduleSheetRef.current();
          return;
        }

        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 22,
          mass: 0.9,
          stiffness: 220,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 22,
          mass: 0.9,
          stiffness: 220,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  return (
    <AppScreen
      backgroundColor={colors.appDarkBlue}
      contentStyle={styles.screen}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hi,{"\n"}
            {displayName}
          </Text>

          <View style={styles.searchPill}>
            <Pressable
              onPress={openSearch}
              style={styles.searchCircle}
              accessibilityRole="button"
              accessibilityLabel="Open search"
            >
              <Image
                source={require("@/assets/search.svg")}
                style={styles.searchIcon}
                contentFit="contain"
              />
            </Pressable>
            <Pressable
              onPress={openProfile}
              style={styles.avatar}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              {avatarSource ? (
                <Image
                  source={avatarSource}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{initials || "Y"}</Text>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.chartArea}>
          <View style={[styles.chartCanvas, { width: chartWidth }]}>
            <View style={styles.chartPlot}>
              <LineChart
                data={weeklyCalories.map((item) => ({
                  value: item.calories,
                  label: item.day,
                }))}
                areaChart
                curved
                isAnimated
                animateOnDataChange
                animationDuration={900}
                onDataChangeAnimationDuration={450}
                adjustToWidth
                disableScroll
                hideAxesAndRules
                hideDataPoints
                thickness={2}
                height={chartHeight}
                width={chartWidth}
                maxValue={chartMaxValue}
                noOfSections={4}
                spacing={chartSpacing}
                initialSpacing={0}
                endSpacing={0}
                color={colors.homeAqua}
                startFillColor={colors.homeChartFill}
                endFillColor={colors.homeChartFill}
                startOpacity={0.14}
                endOpacity={0.02}
                yAxisLabelWidth={0}
                xAxisLabelsHeight={0}
                labelsExtraHeight={0}
                backgroundColor="transparent"
              />

              {/* Transparent tap targets make each day selectable without changing the chart library rendering. */}
              <View style={styles.chartTapTargets}>
                {weeklyCalories.map((item, index) => (
                  <Pressable
                    key={item.day}
                    accessibilityLabel={`Select ${item.day} calories`}
                    onPress={() => setSelectedDayIndex(index)}
                    style={[
                      styles.chartTapTarget,
                      {
                        left: Math.max(
                          0,
                          Math.min(chartWidth - 36, chartSpacing * index - 18),
                        ),
                      },
                    ]}
                  />
                ))}
              </View>

              {/* This overlay keeps the selected-day marker, peak dot, and tooltip aligned with the manually tracked chart state. */}
              <View pointerEvents="none" style={styles.chartOverlay}>
                <View
                  style={[
                    styles.chartMarker,
                    {
                      height: chartHeight - markerTop + 28,
                      left: markerLeft,
                      top: markerTop + 7,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.chartPeakDot,
                    {
                      left: markerLeft - 6,
                      top: markerTop - 6,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.chartTooltipWrap,
                    {
                      left: tooltipLeft,
                      top: tooltipTop,
                    },
                  ]}
                >
                  <View style={styles.chartTooltip}>
                    <Text style={styles.chartTooltipText}>
                      {selectedCalories} cal
                    </Text>
                  </View>
                  <View style={styles.chartTooltipNotch} />
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.weekRow, { width: chartWidth }]}>
            {weekDays.map((day, index) => (
              <Pressable
                key={day}
                accessibilityLabel={`Select ${day}`}
                onPress={() => setSelectedDayIndex(index)}
                style={styles.weekDayPressable}
              >
                <Text
                  style={[
                    styles.weekDay,
                    index === selectedDayIndex && styles.weekDayActive,
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.scheduleHeader}>
          <Text style={styles.sectionTitle}>Your{"\n"}Schedule</Text>
          <Pressable
            onPress={openScheduleSheet}
            style={styles.filterButton}
            accessibilityLabel="Filter schedule"
          >
            <View style={styles.filterLineWide} />
            <View style={styles.filterLineMid} />
            <View style={styles.filterLineShort} />
          </Pressable>
        </View>

        <Text style={styles.activityLabel}>Today{"'"}s Activity</Text>

        <View style={styles.scheduleList}>
          {/* Current vs upcoming rendering stays temporary here so only the active workout is startable from Home. */}
            {hasTodayActivities ? (
              todayActivities.map((item, index) => {
              const isLastItem = index === todayActivities.length - 1;
              const isCurrent = item.status === "current";
              const isUpcoming = item.status === "upcoming";
              const isCompleted = item.status === "completed";
              const isStartableCurrent =
                item.id === currentWorkoutId && item.status === "current";

              const rowContent = (
                <>
                  <View style={styles.timelineColumn}>
                    {!isLastItem && <View style={styles.timelineLine} />}
                    <View
                      style={[
                        styles.timelineDot,
                        isCurrent && styles.timelineDotActive,
                        isUpcoming && styles.timelineDotUpcoming,
                        isCompleted && styles.timelineDotCompleted,
                      ]}
                    >
                      {isCurrent && <View style={styles.timelineDotInner} />}
                      {isCompleted && (
                        <Check color="#FFFFFF" size={10} strokeWidth={3} />
                      )}
                    </View>
                  </View>

                  <View style={styles.activityTextBlock}>
                    <View style={styles.activityTitleRow}>
                      <Text
                        style={[
                          styles.activityTitle,
                          isUpcoming && styles.activityTitleInactive,
                          isCompleted && styles.activityTitleCompleted,
                        ]}
                      >
                        {item.title}
                      </Text>

                      <View
                        style={[
                          styles.activityIconBadge,
                          isUpcoming && styles.activityIconBadgeUpcoming,
                        ]}
                      >
                        {item.icon === "run" ? (
                          <PersonStanding
                            size={14}
                            color={colors.homeDark}
                            strokeWidth={2.2}
                          />
                        ) : (
                          <Dumbbell
                            size={14}
                            color={colors.homeDark}
                            strokeWidth={2.2}
                          />
                        )}
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.activityDetail,
                        isUpcoming && styles.activityDetailInactive,
                        isCompleted && styles.activityDetailCompleted,
                      ]}
                    >
                      {item.subtitle}
                    </Text>

                    {isCompleted && (
                      <Text style={styles.historyLinkText}>Completed</Text>
                    )}
                  </View>

                  {isCurrent && isStartableCurrent && (
                    <Pressable
                      style={styles.startButton}
                      onPress={() => openWorkout(item)}
                    >
                      <Text style={styles.startText}>Start</Text>
                      <View style={styles.startArrow} />
                    </Pressable>
                  )}

                  {isCompleted && (
                    <View style={styles.completedBadge}>
                      <Check color={colors.homeDark} size={16} strokeWidth={3} />
                    </View>
                  )}
                </>
              );

              if (isCompleted || isStartableCurrent) {
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => openWorkout(item)}
                    style={[
                      styles.scheduleRow,
                      isUpcoming && styles.scheduleRowUpcoming,
                    ]}
                  >
                    {rowContent}
                  </Pressable>
                );
              }

              return (
                <View
                  key={item.id}
                  style={[
                    styles.scheduleRow,
                    isUpcoming && styles.scheduleRowUpcoming,
                  ]}
                >
                  {rowContent}
                </View>
              );
            })
          ) : (
            // Home currently shows the empty state until schedule data is connected for the signed-in user.
            <View style={styles.emptyActivityRow}>
              <Text style={styles.emptyActivityText}>
                No activities scheduled for today.
              </Text>
              <Pressable
                onPress={openCreateActivity}
                style={styles.createActivityButton}
                accessibilityLabel="Create activity"
              >
                <Plus
                  size={22}
                  color={colors.homeDark}
                  strokeWidth={2.4}
                />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={isScheduleSheetOpen}
        transparent
        animationType="none"
        onRequestClose={closeScheduleSheet}
      >
        <View style={styles.sheetRoot}>
          <Animated.View
            pointerEvents="none"
            style={[styles.sheetOverlayBackdrop, { opacity: overlayOpacity }]}
          />
          <Pressable
            style={styles.sheetOverlay}
            onPress={closeScheduleSheet}
            accessibilityRole="button"
            accessibilityLabel="Close schedule sheet"
          />

          <Animated.View
            style={[
              styles.sheetCard,
              {
                maxHeight: Math.max(screenHeight * 0.42, 300),
                minHeight: 300,
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
            {...sheetPanResponder.panHandlers}
          >
            <View style={styles.sheetDragArea}>
              <View style={styles.sheetHandle} />
            </View>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Today{"'"}s Schedule</Text>
              <Pressable
                onPress={closeScheduleSheet}
                style={styles.sheetCloseButton}
                accessibilityRole="button"
                accessibilityLabel="Close schedule"
              >
                <Text style={styles.sheetCloseText}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.sheetList}>
              {hasTodayActivities ? (
                todayActivities.map((item) => (
                  <View key={`sheet-${item.id}`} style={styles.sheetItem}>
                      <View
                      style={[
                        styles.sheetIndicator,
                        item.status === "current" && styles.sheetIndicatorActive,
                      ]}
                    />
                    <View style={styles.sheetItemText}>
                      <Text style={styles.sheetItemTitle}>{item.title}</Text>
                      <Text style={styles.sheetItemDetail}>{item.subtitle}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyActivityText}>
                  No activities scheduled for today.
                </Text>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 28,
  },
  content: {
    flex: 1,
    paddingTop: 58,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  greeting: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 29,
    letterSpacing: 0,
    lineHeight: 33,
  },
  searchPill: {
    alignItems: "center",
    backgroundColor: colors.homePink,
    borderRadius: 30,
    flexDirection: "row",
    height: 60,
    marginTop: 0,
    paddingLeft: 2,
    paddingRight: 4,
    width: 130,
  },

  searchCircle: {
    alignItems: "center",
    backgroundColor: colors.homeDark,
    borderRadius: 28,
    height: 54,
    justifyContent: "center",
    width: 54,
    zIndex: 2,
  },

  searchIcon: {
    height: 24,
    width: 24,
  },

  avatar: {
    alignItems: "center",
    borderRadius: 27,
    borderWidth: 0,
    height: 54,
    justifyContent: "center",
    marginLeft: 18,
    overflow: "hidden",
    width: 54,
    zIndex: 3,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  avatarText: {
    color: colors.homeInk,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 15,
  },
  chartArea: {
    marginTop: 48,
  },
  chartCanvas: {
    alignSelf: "center",
    height: 182,
    overflow: "visible",
  },
  chartPlot: {
    height: 166,
    paddingTop: 24,
    position: "relative",
  },
  chartOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 24,
    zIndex: 3,
  },
  chartTapTargets: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 24,
    zIndex: 4,
  },
  chartTapTarget: {
    position: "absolute",
    top: 0,
    width: 36,
    bottom: 0,
  },
  chartMarker: {
    backgroundColor: "rgba(246,243,186,0.88)",
    position: "absolute",
    width: 1,
  },
  chartPeakDot: {
    backgroundColor: colors.homeCream,
    borderColor: "rgba(246,243,186,0.3)",
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    position: "absolute",
    width: 12,
  },
  chartTooltipWrap: {
    alignItems: "center",
    position: "absolute",
    width: tooltipWidth,
  },
  chartTooltip: {
    alignItems: "center",
    backgroundColor: colors.homeCream,
    borderRadius: 5,
    height: tooltipHeight,
    justifyContent: "center",
    width: tooltipWidth,
  },
  chartTooltipNotch: {
    backgroundColor: colors.homeCream,
    height: 10,
    marginTop: -5,
    transform: [{ rotate: "45deg" }],
    width: 10,
  },
  chartTooltipText: {
    color: colors.homeDark,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 10,
  },
  weekRow: {
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -4,
  },
  weekDayPressable: {
    alignItems: "center",
    minWidth: 30,
  },
  weekDay: {
    color: "rgba(255,255,255,0.28)",
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 10,
  },
  weekDayActive: {
    color: colors.journeyText,
  },
  scheduleHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 35,
  },
  sectionTitle: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 25,
    letterSpacing: 0,
    lineHeight: 28,
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: colors.homeAqua,
    borderRadius: 16,
    height: 47,
    justifyContent: "center",
    width: 47,
  },
  filterLineWide: {
    backgroundColor: colors.homeDark,
    borderRadius: 2,
    height: 2,
    width: 17,
  },
  filterLineMid: {
    backgroundColor: colors.homeDark,
    borderRadius: 2,
    height: 2,
    marginTop: 4,
    width: 11,
  },
  filterLineShort: {
    backgroundColor: colors.homeDark,
    borderRadius: 2,
    height: 2,
    marginTop: 4,
    width: 5,
  },
  activityLabel: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 12,
    marginTop: 19,
  },
  scheduleList: {
    marginTop: 14,
  },
  emptyActivityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginTop: 18,
  },
  emptyActivityText: {
    color: "rgba(255,255,255,0.42)",
    flex: 1,
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 13,
    lineHeight: 20,
  },
  createActivityButton: {
    alignItems: "center",
    backgroundColor: colors.homeAqua,
    borderRadius: 24,
    justifyContent: "center",
    height: 48,
    width: 48,
  },
  timelineColumn: {
    alignItems: "center",
    marginRight: 22,
    position: "relative",
    width: 40,
  },
  timelineLine: {
    borderColor: "rgba(255,255,255,0.18)",
    borderStyle: "dashed",
    borderWidth: 1,
    position: "absolute",
    top: 20,
    bottom: -20,
    width: 1,
  },
  scheduleRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 62,
  },
  scheduleRowUpcoming: {
    opacity: 0.58,
  },
  timelineDot: {
    alignItems: "center",
    backgroundColor: "rgba(217,217,217,0.48)",
    borderRadius: 6,
    height: 11,
    justifyContent: "center",
    width: 11,
    zIndex: 2,
  },
  timelineDotActive: {
    backgroundColor: colors.homeCream,
    borderRadius: 19,
    height: 38,
    width: 38,
  },
  timelineDotUpcoming: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  timelineDotCompleted: {
    backgroundColor: colors.homeAqua,
    borderRadius: 13,
    height: 26,
    width: 26,
  },
  timelineDotInner: {
    backgroundColor: colors.homeDark,
    borderRadius: 5,
    height: 9,
    width: 9,
  },
  activityTextBlock: {
    flex: 1,
  },
  activityTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  activityTitle: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 15,
  },
  activityTitleInactive: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 13,
  },
  activityTitleCompleted: {
    color: "rgba(255,255,255,0.36)",
  },
  activityDetail: {
    color: "rgba(255,255,255,0.52)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 11,
    marginTop: 1,
  },
  activityDetailInactive: {
    color: "rgba(255,255,255,0.32)",
    fontSize: 8,
  },
  activityDetailCompleted: {
    color: "rgba(255,255,255,0.26)",
  },
  historyLinkText: {
    marginTop: 5,
    color: colors.homeAqua,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 11,
  },
  activityIconBadge: {
    alignItems: "center",
    backgroundColor: colors.homeAqua,
    borderRadius: 10,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  activityIconBadgeUpcoming: {
    backgroundColor: "rgba(214,235,235,0.42)",
  },
  startButton: {
    alignItems: "center",
    backgroundColor: colors.homeCream,
    borderRadius: 22,
    flexDirection: "row",
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  startText: {
    color: colors.homeDark,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 12,
    marginRight: 8,
  },
  startArrow: {
    borderBottomColor: "transparent",
    borderBottomWidth: 5,
    borderLeftColor: colors.homeDark,
    borderLeftWidth: 8,
    borderTopColor: "transparent",
    borderTopWidth: 5,
    height: 0,
    marginLeft: 8,
    width: 0,
  },
  completedBadge: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.homeAqua,
  },
  sheetRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetOverlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  sheetCard: {
    backgroundColor: colors.homeDark,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 34,
    paddingHorizontal: 28,
    paddingTop: 14,
  },
  sheetDragArea: {
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 6,
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.28)",
    borderRadius: 999,
    height: 5,
    marginBottom: 12,
    width: 54,
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 24,
    lineHeight: 28,
  },
  sheetCloseButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 14,
  },
  sheetCloseText: {
    color: colors.homeCream,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 12,
  },
  sheetList: {
    marginTop: 24,
    rowGap: 14,
  },
  sheetItem: {
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  sheetIndicator: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    height: 10,
    marginRight: 14,
    width: 10,
  },
  sheetIndicatorActive: {
    backgroundColor: colors.homeCream,
    height: 12,
    width: 12,
  },
  sheetItemText: {
    flex: 1,
  },
  sheetItemTitle: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 15,
  },
  sheetItemDetail: {
    color: "rgba(255,255,255,0.56)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 11,
    marginTop: 2,
  },
});
