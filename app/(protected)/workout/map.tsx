import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { AppScreen } from "@/components/AppScreen";
import { MOCK_STATS, MOCK_WORKOUT } from "@/components/workout/workoutData";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;

const SCALE_X = SCREEN_WIDTH / DESIGN_WIDTH;
const SCALE_Y = SCREEN_HEIGHT / DESIGN_HEIGHT;

/**
 * Figma stats panel dimensions:
 * X -13, Y 447, W 415, H 397, radius 27.
 *
 * The panel is intentionally wider than the screen and shifted left.
 * That creates the reference look where the top feels narrower,
 * while the lower part grows wider and fills the screen edges.
 */
const PANEL_LEFT = -18 * SCALE_X;
const PANEL_TOP = 447 * SCALE_Y;
const PANEL_WIDTH = 426 * SCALE_X;
const PANEL_HEIGHT = 397 * SCALE_Y;
const PANEL_RADIUS = 27 * SCALE_X;

const PAUSE_BUTTON_SIZE = 96 * SCALE_X;
const PAUSE_BUTTON_RADIUS = PAUSE_BUTTON_SIZE / 2;

const MAP_PRIMARY_ROADS = [
  { id: "r1", d: "M2 52 L96 68 L168 74 L244 34 L360 28", width: 1.6 },
  { id: "r2", d: "M18 4 L52 118 L34 262 L20 458 L12 776", width: 1.45 },
  { id: "r3", d: "M82 6 L124 136 L152 274 L170 438 L212 620 L246 792", width: 1.38 },
  { id: "r4", d: "M360 142 L296 176 L236 204 L182 228 L136 286 L116 344", width: 1.44 },
  { id: "r5", d: "M162 360 L250 352 L360 370", width: 1.25 },
  { id: "r6", d: "M220 520 L280 486 L360 446", width: 1.28 },
  { id: "r7", d: "M0 764 L108 730 L236 694 L360 664", width: 1.52 },
];

const MAP_SECONDARY_ROADS = [
  { id: "s1", d: "M26 110 L88 124 L138 118 L214 88 L290 62" },
  { id: "s2", d: "M108 30 L96 118 L82 196 L88 270" },
  { id: "s3", d: "M170 142 L218 150 L276 170 L334 200" },
  { id: "s4", d: "M54 198 L112 212 L176 206" },
  { id: "s5", d: "M244 224 L286 244 L332 274" },
  { id: "s6", d: "M118 280 L164 294 L208 294" },
  { id: "s7", d: "M62 352 L116 344 L156 350" },
  { id: "s8", d: "M210 382 L250 404 L302 438" },
  { id: "s9", d: "M142 442 L192 438 L238 444" },
  { id: "s10", d: "M62 522 L106 498 L152 478" },
  { id: "s11", d: "M236 566 L284 596 L344 632" },
  { id: "s12", d: "M112 622 L168 612 L218 606" },
  { id: "s13", d: "M58 702 L110 682 L154 666" },
  { id: "s14", d: "M232 702 L282 688 L342 662" },
  { id: "s15", d: "M128 716 L136 646 L136 576" },
];

const MAP_BLOCKS = [
  { id: "b1", d: "M10 152 L52 154 L48 212 L4 204 Z" },
  { id: "b2", d: "M232 176 L322 204 L314 286 L226 254 Z" },
  { id: "b3", d: "M18 652 L84 628 L88 712 L16 734 Z" },
  { id: "b4", d: "M292 648 L338 630 L346 686 L304 716 Z" },
];

const MARKER_CENTER = { x: 184, y: 214 };

const LABEL_POSITION = {
  top: MARKER_CENTER.y - 78,
  // Nudged right so the callout sits closer to the route marker without changing the map artwork.
  left: MARKER_CENTER.x - 2,
};

function FallbackMap() {
  return (
    <View style={styles.mapFallbackBackground}>
      {/* Temporary dark map mock used until MapView/GPS is enabled in a native development build. */}
      <Svg
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill}
        viewBox="0 0 360 792"
        width="100%"
      >
        {MAP_BLOCKS.map((block) => (
          <Path key={block.id} d={block.d} fill="rgba(0,0,0,0.13)" />
        ))}

        {MAP_PRIMARY_ROADS.map((road) => (
          <Path
            key={road.id}
            d={road.d}
            fill="none"
            stroke="rgba(255,255,255,0.075)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={road.width}
          />
        ))}

        {MAP_SECONDARY_ROADS.map((road) => (
          <Path
            key={road.id}
            d={road.d}
            fill="none"
            stroke="rgba(255,255,255,0.028)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={0.88}
          />
        ))}
      </Svg>

      <Image
        source={require("@/assets/Vector 6.svg")}
        style={styles.warmupTrailAsset}
        contentFit="contain"
      />

      <Image
        source={require("@/assets/Rectangle 312.svg")}
        style={styles.warmupMarkerRingAsset}
        contentFit="contain"
      />

      <Image
        source={require("@/assets/Ellipse 51.svg")}
        style={styles.warmupMarkerCoreAsset}
        contentFit="contain"
      />

      <View style={styles.routeLabel}>
        <View style={styles.routeLabelDot} />
        <View>
          <Text style={styles.routeLabelTitle}>2972 Westheimer</Text>
          <Text style={styles.routeLabelSubtitle}>34 Santa Ana, Illinois</Text>
          <Text style={styles.routeLabelMeta}>34546</Text>
        </View>
      </View>

      <View style={styles.mapShade} />
    </View>
  );
}

function StatsPanelShape() {
  const w = PANEL_WIDTH;
  const h = PANEL_HEIGHT;
  const r = PANEL_RADIUS;
  const topLeftX = 38 * SCALE_X;
  const topRightX = w - 38 * SCALE_X;

  /**
   * Custom panel path:
   * - top corners behave like a rounded rectangle
   * - side flare starts below the top corner area
   * - bottom fills the full oversized panel width
   */
  const d = `
    M ${topLeftX + r} 0
    H ${topRightX - r}
    Q ${topRightX} 0 ${topRightX} ${r}
    C ${topRightX + 6 * SCALE_X} ${h * 0.38} ${w - 2 * SCALE_X} ${h * 0.72} ${w} ${h}
    H 0
    C ${2 * SCALE_X} ${h * 0.72} ${topLeftX - 6 * SCALE_X} ${h * 0.38} ${topLeftX} ${r}
    Q ${topLeftX} 0 ${topLeftX + r} 0
    Z
  `;

  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={StyleSheet.absoluteFill}
    >
      <Path d={d} fill="#FFFFFF" />
    </Svg>
  );
}

export default function MapWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, title } = useLocalSearchParams<{
    mode?: string;
    title?: string;
  }>();
  const [isPaused, setIsPaused] = useState(false);
  const isHistoryMode = mode === "history";
  const workoutTitle = title?.trim() || MOCK_WORKOUT.mapTitle;

  // TODO: Replace history mode mock details with persisted completed workout session data.
  // TODO: When WarmUp has a real finish action, persist it with completeWorkoutSession() instead of faking completion here.

  // Keeps the fallback safe because this screen can be opened directly during testing.
  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/schedule");
  };

  const handlePausePress = () => {
    if (isHistoryMode) {
      return;
    }

    setIsPaused((currentValue) => !currentValue);
  };

  return (
    <AppScreen backgroundColor="#202125">
      <View style={styles.container}>
        <FallbackMap />

        <View style={[styles.header, { top: Math.max(8 - insets.top, - 3) }]}>
          <Pressable
            accessibilityLabel="Go back"
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              color="#FFFFFF"
              name="chevron-left"
              size={28}
            />
          </Pressable>

          <View style={styles.workoutHeaderCard}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.workoutTitle}>{workoutTitle}</Text>
              <Text style={styles.workoutSubtitle}>{MOCK_WORKOUT.mapSubtitle}</Text>
            </View>

            <View style={styles.activityIconCircle}>
              <MaterialCommunityIcons
                color="#181422"
                name="run-fast"
                size={22}
              />
            </View>
          </View>
        </View>

        <View style={styles.statsPanel}>
          <StatsPanelShape />

          <Pressable
            accessibilityLabel={
              isHistoryMode
                ? "Completed workout"
                : isPaused
                  ? "Resume workout"
                  : "Pause workout"
            }
            onPress={handlePausePress}
            style={styles.pauseButton}
          >
            <MaterialCommunityIcons
              color="#16121D"
              name={isHistoryMode ? "check" : isPaused ? "play" : "pause"}
              size={30}
            />
          </Pressable>

          <View style={styles.statsPanelContent}>
            {/* TODO: Replace mock workout tracking data with real workout session data. */}
            <Text style={styles.distanceValue}>{MOCK_WORKOUT.distanceKm}</Text>
            <Text style={styles.distanceUnit}>Km</Text>

            <View style={styles.statsRow}>
              {MOCK_STATS.map((item) => (
                <View key={item.label} style={styles.statColumn}>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#202125",
  },
  mapFallbackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#202125",
  },
  mapShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
  warmupTrailAsset: {
    position: "absolute",
    top: 200,
    left: 180,
    width: 154,
    height: 516,
    zIndex: 3,
  },
  warmupMarkerRingAsset: {
    position: "absolute",
    top: MARKER_CENTER.y - 62,
    left: MARKER_CENTER.x - 38,
    width: 54,
    height: 54,
    zIndex: 4,
  },
  warmupMarkerCoreAsset: {
    position: "absolute",
    top: MARKER_CENTER.y - 43,
    left: MARKER_CENTER.x - 18,
    width: 17,
    height: 17,
    zIndex: 5,
  },
  routeLabel: {
    position: "absolute",
    top: LABEL_POSITION.top,
    left: LABEL_POSITION.left,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    paddingVertical: 7,
    paddingLeft: 8,
    paddingRight: 10,
    zIndex: 6,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  routeLabelDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginTop: 3,
    backgroundColor: "#F8D9E8",
    borderWidth: 2,
    borderColor: "#FFF3F8",
  },
  routeLabelTitle: {
    color: "#31293F",
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 8,
  },
  routeLabelSubtitle: {
    marginTop: 1,
    color: "rgba(49,41,63,0.52)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 5.6,
  },
  routeLabelMeta: {
    marginTop: 2,
    color: "rgba(49,41,63,0.32)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 5.2,
  },

  header: {
    position: "absolute",
    left: 18,
    right: 18,
    zIndex: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "rgba(8, 7, 16, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  workoutHeaderCard: {
    flex: 1,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(8, 7, 16, 0.9)",
    paddingLeft: 18,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  workoutTitle: {
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  workoutSubtitle: {
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
    marginTop: 4,
  },
  activityIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  statsPanel: {
    position: "absolute",
    left: PANEL_LEFT,
    top: PANEL_TOP,
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    alignItems: "center",
    overflow: "visible",
    zIndex: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -8 },
    shadowRadius: 18,
    elevation: 10,
  },
  pauseButton: {
    position: "absolute",
    top: -PAUSE_BUTTON_RADIUS,
    left: SCREEN_WIDTH / 2 - PANEL_LEFT - PAUSE_BUTTON_RADIUS,
    width: PAUSE_BUTTON_SIZE,
    height: PAUSE_BUTTON_SIZE,
    borderRadius: PAUSE_BUTTON_RADIUS,
    backgroundColor: "#F5F2A6",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 14,
    elevation: 8,
  },
  statsPanelContent: {
    width: SCREEN_WIDTH,
    marginLeft: -PANEL_LEFT,
    alignItems: "center",
    paddingTop: 98 * SCALE_Y,
    zIndex: 12,
  },
  distanceValue: {
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 82 * SCALE_X,
    lineHeight: 88 * SCALE_X,
    color: "#2B2339",
    textAlign: "center",
  },
  distanceUnit: {
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 12 * SCALE_X,
    lineHeight: 15 * SCALE_X,
    color: "rgba(43,35,57,0.28)",
    marginTop: -4,
    textAlign: "center",
  },
  statsRow: {
    width: SCREEN_WIDTH - 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 58 * SCALE_Y,
  },
  statColumn: {
    alignItems: "center",
    minWidth: 86 * SCALE_X,
  },
  statValue: {
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 28 * SCALE_X,
    lineHeight: 34 * SCALE_X,
    color: "#2B2339",
  },
  statLabel: {
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 10 * SCALE_X,
    lineHeight: 13 * SCALE_X,
    color: "rgba(43,35,57,0.3)",
    marginTop: 5,
  },
});
