import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppScreen } from "@/components/AppScreen";
import {
  markWorkoutCompleted,
  MOCK_WORKOUT,
  type WorkoutId,
} from "@/components/workout/workoutData";
import { colors } from "@/constants/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;

const SCALE_X = SCREEN_WIDTH / DESIGN_WIDTH;
const SCALE_Y = SCREEN_HEIGHT / DESIGN_HEIGHT;

const CARD_WIDTH = 248 * SCALE_X;
const CARD_HEIGHT = 326 * SCALE_Y;
const BUTTON_WIDTH = SCREEN_WIDTH - 64;

const CARD_WRAP_TOP = 190 * SCALE_Y;
const CONFETTI_TOP_OFFSET = -36 * SCALE_Y;

type SuccessState = {
  icon: "fire" | "trophy" | "arm-flex" | "lightning-bolt" | "check-decagram";
  title: string;
  iconColor: string;
};

type ConfettiPiece = {
  id: string;
  style: ViewStyle;
};

const SUCCESS_STATES: SuccessState[] = [
  {
    icon: "fire",
    title: MOCK_WORKOUT.successMessage,
    iconColor: "#FF8251",
  },
  {
    icon: "trophy",
    title: "Workout crushed!",
    iconColor: "#FF9B3E",
  },
  {
    icon: "arm-flex",
    title: "Strong finish!",
    iconColor: "#9156E2",
  },
  {
    icon: "lightning-bolt",
    title: "Energy unlocked!",
    iconColor: "#F29A19",
  },
  {
    icon: "check-decagram",
    title: "Session complete!",
    iconColor: "#5C74E6",
  },
];

const CONFETTI_PIECES: ConfettiPiece[] = [
  {
    id: "left-orange-arc-top",
    style: {
      left: 26 * SCALE_X,
      top: 274 * SCALE_Y,
      width: 28 * SCALE_X,
      height: 56 * SCALE_Y,
      borderRadius: 24 * SCALE_X,
      borderWidth: 8,
      borderColor: "#F0A14A",
      borderTopColor: "transparent",
      borderLeftColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "-42deg" }],
    },
  },
  {
    id: "left-purple-arc-top",
    style: {
      left: 118 * SCALE_X,
      top: 232 * SCALE_Y,
      width: 74 * SCALE_X,
      height: 74 * SCALE_Y,
      borderRadius: 999,
      borderWidth: 9,
      borderColor: "#7A45E6",
      borderBottomColor: "transparent",
      borderLeftColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "-22deg" }],
    },
  },
  {
    id: "left-pink-arc",
    style: {
      left: 12 * SCALE_X,
      top: 384 * SCALE_Y,
      width: 26 * SCALE_X,
      height: 54 * SCALE_Y,
      borderRadius: 22 * SCALE_X,
      borderWidth: 7,
      borderColor: "#D52E84",
      borderTopColor: "transparent",
      borderLeftColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "54deg" }],
    },
  },
  {
    id: "left-purple-bar",
    style: {
      left: 48 * SCALE_X,
      top: 486 * SCALE_Y,
      width: 10 * SCALE_X,
      height: 82 * SCALE_Y,
      borderRadius: 999,
      backgroundColor: "#6D33D7",
      transform: [{ rotate: "74deg" }],
    },
  },
  {
    id: "left-blue-arc-low",
    style: {
      left: 18 * SCALE_X,
      top: 552 * SCALE_Y,
      width: 42 * SCALE_X,
      height: 68 * SCALE_Y,
      borderRadius: 28 * SCALE_X,
      borderWidth: 8,
      borderColor: "#6C31D6",
      borderTopColor: "transparent",
      borderLeftColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "20deg" }],
    },
  },
  {
    id: "right-purple-arc-top",
    style: {
      right: 28 * SCALE_X,
      top: 222 * SCALE_Y,
      width: 42 * SCALE_X,
      height: 68 * SCALE_Y,
      borderRadius: 30 * SCALE_X,
      borderWidth: 8,
      borderColor: "#ECEBFF",
      borderTopColor: "transparent",
      borderRightColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "36deg" }],
    },
  },
  {
    id: "right-pink-bar",
    style: {
      right: 58 * SCALE_X,
      top: 346 * SCALE_Y,
      width: 10 * SCALE_X,
      height: 78 * SCALE_Y,
      borderRadius: 999,
      backgroundColor: "#D92486",
      transform: [{ rotate: "72deg" }],
    },
  },
  {
    id: "right-blue-arc-mid",
    style: {
      right: 6 * SCALE_X,
      top: 446 * SCALE_Y,
      width: 44 * SCALE_X,
      height: 70 * SCALE_Y,
      borderRadius: 32 * SCALE_X,
      borderWidth: 8,
      borderColor: "#7A45E6",
      borderTopColor: "transparent",
      borderRightColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "-18deg" }],
    },
  },
  {
    id: "right-red-arc-low",
    style: {
      right: 12 * SCALE_X,
      top: 552 * SCALE_Y,
      width: 32 * SCALE_X,
      height: 56 * SCALE_Y,
      borderRadius: 22 * SCALE_X,
      borderWidth: 7,
      borderColor: "#D12E84",
      borderTopColor: "transparent",
      borderRightColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "68deg" }],
    },
  },
  {
    id: "right-orange-arc-low",
    style: {
      right: 6 * SCALE_X,
      top: 612 * SCALE_Y,
      width: 42 * SCALE_X,
      height: 68 * SCALE_Y,
      borderRadius: 28 * SCALE_X,
      borderWidth: 8,
      borderColor: "#C57B2F",
      borderTopColor: "transparent",
      borderRightColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "48deg" }],
    },
  },
];

function AnimatedConfettiPiece({
  piece,
  index,
}: {
  piece: ConfettiPiece;
  index: number;
}) {
  const floatProgress = useSharedValue(0);

  useEffect(() => {
    floatProgress.value = withDelay(
      index * 120,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: 1300 + index * 80,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(0, {
            duration: 1300 + index * 80,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [floatProgress, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.82 + floatProgress.value * 0.18,
    transform: [{ translateY: -8 * SCALE_Y * floatProgress.value }],
  }));

  const pieceTop =
    typeof piece.style.top === "number" ? piece.style.top + CONFETTI_TOP_OFFSET : piece.style.top;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.animatedConfettiShell, animatedStyle]}
    >
      <View
        pointerEvents="none"
        style={[styles.confettiPiece, piece.style, { top: pieceTop }]}
      />
    </Animated.View>
  );
}

export default function WorkoutSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();

  const [successState] = useState(
    () => SUCCESS_STATES[Math.floor(Math.random() * SUCCESS_STATES.length)],
  );

  useEffect(() => {
    if (workoutId === "warmup-run" || workoutId === "pushups") {
      markWorkoutCompleted(workoutId as WorkoutId);
    }

    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => undefined);
  }, [workoutId]);

  const handleContinue = () => {
    router.replace("/home");
  };

  return (
    <AppScreen backgroundColor={colors.background}>
      <View style={styles.container}>
        {CONFETTI_PIECES.map((piece, index) => (
          <AnimatedConfettiPiece key={piece.id} piece={piece} index={index} />
        ))}

        <View style={styles.cardWrap}>
          <View pointerEvents="none" style={styles.rearGlassCard} />

          <BlurView
            intensity={36}
            tint="light"
            pointerEvents="none"
            style={styles.middleBlurCard}
          >
            <View style={styles.middleBlurOverlay} />
          </BlurView>

          <View style={styles.card}>
            <MaterialCommunityIcons
              name={successState.icon}
              size={64 * SCALE_X}
              color={successState.iconColor}
              style={styles.successIcon}
            />

            <Text style={styles.message}>{successState.title}</Text>
          </View>
        </View>

        <View
          style={[
            styles.footer,
            { bottom: Math.max(insets.bottom + 34, 48) },
          ]}
        >
          <Pressable
            accessibilityLabel="Continue back to home"
            onPress={handleContinue}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </View>

        {/* TODO: Persist completed workout and update Home status from backend/session store. */}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  animatedConfettiShell: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  cardWrap: {
    position: "absolute",
    top: CARD_WRAP_TOP,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  rearGlassCard: {
    position: "absolute",
    top: -118 * SCALE_Y,
    width: 204 * SCALE_X,
    height: 150 * SCALE_Y,
    borderRadius: 18 * SCALE_X,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    zIndex: 1,
  },
  middleBlurCard: {
    position: "absolute",
    top: -62 * SCALE_Y,
    width: 228 * SCALE_X,
    height: 170 * SCALE_Y,
    borderRadius: 18 * SCALE_X,
    overflow: "hidden",
    zIndex: 2,
  },
  middleBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 18 * SCALE_X,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26 * SCALE_X,
    zIndex: 3,
    elevation: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  successIcon: {
    marginBottom: 26 * SCALE_Y,
  },
  message: {
    color: "#111018",
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 15 * SCALE_X,
    lineHeight: 19 * SCALE_X,
    textAlign: "center",
    maxWidth: 180 * SCALE_X,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 8,
  },
  button: {
    width: BUTTON_WIDTH,
    height: 58 * SCALE_Y,
    borderRadius: 29 * SCALE_Y,
    backgroundColor: colors.homeAqua,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.homeDark,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 15,
    lineHeight: 19,
  },
  confettiPiece: {
    position: "absolute",
    zIndex: 2,
  },
});
