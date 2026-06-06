import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
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
import { MOCK_WORKOUT } from "@/components/workout/workoutData";
import {
  colors,
  CONFETTI_LAVENDER,
  CONFETTI_ORANGE_DARK,
  CONFETTI_ORANGE_LIGHT,
  CONFETTI_PINK,
  CONFETTI_PINK_BRIGHT,
  CONFETTI_PINK_DEEP,
  CONFETTI_PURPLE,
  CONFETTI_PURPLE_DARK,
  CONFETTI_VIOLET,
  SUCCESS_CHECK,
  SUCCESS_FIRE,
  SUCCESS_LIGHTNING,
  SUCCESS_STRENGTH,
  SUCCESS_TROPHY,
} from "@/constants/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;

const SCALE_X = SCREEN_WIDTH / DESIGN_WIDTH;
const SCALE_Y = SCREEN_HEIGHT / DESIGN_HEIGHT;
const SCALE = Math.min(SCALE_X, SCALE_Y);

const CARD_WIDTH = Math.min(SCREEN_WIDTH - 72, 268 * SCALE);
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.38, 318 * SCALE);
const CARD_STACK_HEIGHT = CARD_HEIGHT + 128 * SCALE;
const BUTTON_WIDTH = Math.min(SCREEN_WIDTH - 48, 342 * SCALE_X);
const CONFETTI_SCALE = Math.min(SCALE, 1) * 0.68;

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
    iconColor: SUCCESS_FIRE,
  },
  {
    icon: "trophy",
    title: "Workout crushed!",
    iconColor: SUCCESS_TROPHY,
  },
  {
    icon: "arm-flex",
    title: "Strong finish!",
    iconColor: SUCCESS_STRENGTH,
  },
  {
    icon: "lightning-bolt",
    title: "Energy unlocked!",
    iconColor: SUCCESS_LIGHTNING,
  },
  {
    icon: "check-decagram",
    title: "Session complete!",
    iconColor: SUCCESS_CHECK,
  },
];

const CONFETTI_PIECES: ConfettiPiece[] = [
  {
    id: "left-orange-arc-top",
    style: {
      left: 24 * SCALE_X,
      top: 170 * SCALE_Y,
      width: 28 * SCALE_X * CONFETTI_SCALE,
      height: 56 * SCALE_Y * CONFETTI_SCALE,
      borderRadius: 24 * SCALE_X * CONFETTI_SCALE,
      borderWidth: 6,
      borderColor: CONFETTI_ORANGE_LIGHT,
      borderTopColor: "transparent",
      borderLeftColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "-42deg" }],
    },
  },
  {
    id: "left-purple-arc-top",
    style: {
      left: 92 * SCALE_X,
      top: 142 * SCALE_Y,
      width: 74 * SCALE_X * CONFETTI_SCALE,
      height: 74 * SCALE_Y * CONFETTI_SCALE,
      borderRadius: 999,
      borderWidth: 7,
      borderColor: CONFETTI_PURPLE,
      borderBottomColor: "transparent",
      borderLeftColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "-22deg" }],
    },
  },
  {
    id: "left-pink-arc",
    style: {
      left: 14 * SCALE_X,
      top: 340 * SCALE_Y,
      width: 26 * SCALE_X * CONFETTI_SCALE,
      height: 54 * SCALE_Y * CONFETTI_SCALE,
      borderRadius: 22 * SCALE_X * CONFETTI_SCALE,
      borderWidth: 6,
      borderColor: CONFETTI_PINK,
      borderTopColor: "transparent",
      borderLeftColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "54deg" }],
    },
  },
  {
    id: "left-purple-bar",
    style: {
      left: 42 * SCALE_X,
      top: 462 * SCALE_Y,
      width: 10 * SCALE_X * CONFETTI_SCALE,
      height: 82 * SCALE_Y * CONFETTI_SCALE,
      borderRadius: 999,
      backgroundColor: CONFETTI_PURPLE_DARK,
      transform: [{ rotate: "74deg" }],
    },
  },
  {
    id: "left-violet-arc-low",
    style: {
      left: 20 * SCALE_X,
      top: 570 * SCALE_Y,
      width: 42 * SCALE_X * CONFETTI_SCALE,
      height: 68 * SCALE_Y * CONFETTI_SCALE,
      borderRadius: 28 * SCALE_X * CONFETTI_SCALE,
      borderWidth: 6,
      borderColor: CONFETTI_VIOLET,
      borderTopColor: "transparent",
      borderLeftColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "20deg" }],
    },
  },
  {
    id: "right-lavender-arc-top",
    style: {
      right: 26 * SCALE_X,
      top: 150 * SCALE_Y,
      width: 42 * SCALE_X * CONFETTI_SCALE,
      height: 68 * SCALE_Y * CONFETTI_SCALE,
      borderRadius: 30 * SCALE_X * CONFETTI_SCALE,
      borderWidth: 6,
      borderColor: CONFETTI_LAVENDER,
      borderTopColor: "transparent",
      borderRightColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "36deg" }],
    },
  },
  {
    id: "right-pink-bar",
    style: {
      right: 48 * SCALE_X,
      top: 296 * SCALE_Y,
      width: 10 * SCALE_X * CONFETTI_SCALE,
      height: 78 * SCALE_Y * CONFETTI_SCALE,
      borderRadius: 999,
      backgroundColor: CONFETTI_PINK_BRIGHT,
      transform: [{ rotate: "72deg" }],
    },
  },
  {
    id: "right-purple-arc-mid",
    style: {
      right: 8 * SCALE_X,
      top: 410 * SCALE_Y,
      width: 44 * SCALE_X * CONFETTI_SCALE,
      height: 70 * SCALE_Y * CONFETTI_SCALE,
      borderRadius: 32 * SCALE_X * CONFETTI_SCALE,
      borderWidth: 6,
      borderColor: CONFETTI_PURPLE,
      borderTopColor: "transparent",
      borderRightColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "-18deg" }],
    },
  },
  {
    id: "right-pink-arc-low",
    style: {
      right: 16 * SCALE_X,
      top: 536 * SCALE_Y,
      width: 32 * SCALE_X * CONFETTI_SCALE,
      height: 56 * SCALE_Y * CONFETTI_SCALE,
      borderRadius: 22 * SCALE_X * CONFETTI_SCALE,
      borderWidth: 5,
      borderColor: CONFETTI_PINK_DEEP,
      borderTopColor: "transparent",
      borderRightColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "68deg" }],
    },
  },
  {
    id: "right-orange-arc-low",
    style: {
      right: 10 * SCALE_X,
      top: 628 * SCALE_Y,
      width: 42 * SCALE_X * CONFETTI_SCALE,
      height: 68 * SCALE_Y * CONFETTI_SCALE,
      borderRadius: 28 * SCALE_X * CONFETTI_SCALE,
      borderWidth: 6,
      borderColor: CONFETTI_ORANGE_DARK,
      borderTopColor: "transparent",
      borderRightColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "48deg" }],
    },
  },
];

function getRandomSuccessState() {
  return (
    SUCCESS_STATES[Math.floor(Math.random() * SUCCESS_STATES.length)] ??
    SUCCESS_STATES[0]!
  );
}

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
      index * 110,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: 1400 + index * 70,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(0, {
            duration: 1400 + index * 70,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [floatProgress, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.26 + floatProgress.value * 0.16,
    transform: [{ translateY: -7 * SCALE_Y * floatProgress.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.animatedConfettiShell, animatedStyle]}
    >
      <View pointerEvents="none" style={[styles.confettiPiece, piece.style]} />
    </Animated.View>
  );
}

export default function WorkoutSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [successState] = useState(getRandomSuccessState);

  useEffect(() => {
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => undefined);
  }, []);

  const handleContinue = () => {
    router.replace("/home");
  };

  return (
    <AppScreen backgroundColor={colors.background}>
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.confettiLayer}>
          {CONFETTI_PIECES.map((piece, index) => (
            <AnimatedConfettiPiece key={piece.id} piece={piece} index={index} />
          ))}
        </View>

        <View
          style={[
            styles.cardContent,
            {
              paddingTop: Math.max(insets.top + 18, 34),
              paddingBottom: Math.max(insets.bottom + 108, 132),
            },
          ]}
        >
          <View
            style={[
              styles.cardStack,
              {
                width: CARD_WIDTH,
                height: CARD_STACK_HEIGHT,
              },
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.backCard,
                {
                  width: CARD_WIDTH * 0.74,
                  height: CARD_HEIGHT * 0.34,
                  top: 0,
                  left: CARD_WIDTH * 0.13,
                  borderRadius: 20 * SCALE,
                },
              ]}
            />

            <BlurView
              intensity={34}
              tint="light"
              pointerEvents="none"
              style={[
                styles.blurCard,
                {
                  width: CARD_WIDTH * 0.88,
                  height: CARD_HEIGHT * 0.4,
                  top: 48 * SCALE,
                  left: CARD_WIDTH * 0.06,
                  borderRadius: 22 * SCALE,
                },
              ]}
            >
              <View style={styles.blurOverlay} />
            </BlurView>

            <View
              style={[
                styles.mainCard,
                {
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  top: 104 * SCALE,
                  borderRadius: 24 * SCALE,
                  paddingHorizontal: 24 * SCALE,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={successState.icon}
                size={62 * SCALE}
                color={successState.iconColor}
                style={{ marginBottom: 22 * SCALE }}
              />

              <Text
                style={[
                  styles.successTitle,
                  {
                    fontSize: 18 * SCALE,
                    lineHeight: 24 * SCALE,
                    maxWidth: CARD_WIDTH * 0.76,
                  },
                ]}
              >
                {successState.title}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.footer,
            {
              bottom: Math.max(insets.bottom + 28, 42),
            },
          ]}
        >
          <Pressable
            accessibilityLabel="Continue back to home"
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueButton,
              {
                width: BUTTON_WIDTH,
              },
              pressed && styles.continueButtonPressed,
            ]}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>
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
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  animatedConfettiShell: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  confettiPiece: {
    position: "absolute",
    zIndex: 0,
  },
  cardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 2,
  },
  cardStack: {
    position: "relative",
    alignItems: "center",
  },
  backCard: {
    position: "absolute",
    zIndex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  blurCard: {
    position: "absolute",
    zIndex: 2,
    overflow: "hidden",
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  mainCard: {
    position: "absolute",
    zIndex: 3,
    elevation: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
  },
  successTitle: {
    color: "#111018",
    fontFamily: "MontserratAlternates-Bold",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 5,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  continueButton: {
    minHeight: 58,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D6EBEB",
  },
  continueButtonPressed: {
    opacity: 0.9,
  },
  continueButtonText: {
    color: "#262135",
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
});
