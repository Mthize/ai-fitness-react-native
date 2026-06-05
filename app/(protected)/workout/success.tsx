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
import { useUser } from "@/lib/clerk";

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
    id: "left-confetti-orange-light-arc-top",
    style: {
      left: 26 * SCALE_X,
      top: 274 * SCALE_Y,
      width: 28 * SCALE_X,
      height: 56 * SCALE_Y,
      borderRadius: 24 * SCALE_X,
      borderWidth: 8,
      borderColor: CONFETTI_ORANGE_LIGHT,
      borderTopColor: "transparent",
      borderLeftColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "-42deg" }],
    },
  },
  {
    id: "left-confetti-purple-arc-top",
    style: {
      left: 118 * SCALE_X,
      top: 232 * SCALE_Y,
      width: 74 * SCALE_X,
      height: 74 * SCALE_Y,
      borderRadius: 999,
      borderWidth: 9,
      borderColor: CONFETTI_PURPLE,
      borderBottomColor: "transparent",
      borderLeftColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "-22deg" }],
    },
  },
  {
    id: "left-confetti-pink-arc",
    style: {
      left: 12 * SCALE_X,
      top: 384 * SCALE_Y,
      width: 26 * SCALE_X,
      height: 54 * SCALE_Y,
      borderRadius: 22 * SCALE_X,
      borderWidth: 7,
      borderColor: CONFETTI_PINK,
      borderTopColor: "transparent",
      borderLeftColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "54deg" }],
    },
  },
  {
    id: "left-confetti-purple-dark-bar",
    style: {
      left: 48 * SCALE_X,
      top: 486 * SCALE_Y,
      width: 10 * SCALE_X,
      height: 82 * SCALE_Y,
      borderRadius: 999,
      backgroundColor: CONFETTI_PURPLE_DARK,
      transform: [{ rotate: "74deg" }],
    },
  },
  {
    id: "left-confetti-violet-arc-low",
    style: {
      left: 18 * SCALE_X,
      top: 552 * SCALE_Y,
      width: 42 * SCALE_X,
      height: 68 * SCALE_Y,
      borderRadius: 28 * SCALE_X,
      borderWidth: 8,
      borderColor: CONFETTI_VIOLET,
      borderTopColor: "transparent",
      borderLeftColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "20deg" }],
    },
  },
  {
    id: "right-confetti-lavender-arc-top",
    style: {
      right: 28 * SCALE_X,
      top: 222 * SCALE_Y,
      width: 42 * SCALE_X,
      height: 68 * SCALE_Y,
      borderRadius: 30 * SCALE_X,
      borderWidth: 8,
      borderColor: CONFETTI_LAVENDER,
      borderTopColor: "transparent",
      borderRightColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "36deg" }],
    },
  },
  {
    id: "right-confetti-pink-bright-bar",
    style: {
      right: 58 * SCALE_X,
      top: 346 * SCALE_Y,
      width: 10 * SCALE_X,
      height: 78 * SCALE_Y,
      borderRadius: 999,
      backgroundColor: CONFETTI_PINK_BRIGHT,
      transform: [{ rotate: "72deg" }],
    },
  },
  {
    id: "right-confetti-purple-arc-mid",
    style: {
      right: 6 * SCALE_X,
      top: 446 * SCALE_Y,
      width: 44 * SCALE_X,
      height: 70 * SCALE_Y,
      borderRadius: 32 * SCALE_X,
      borderWidth: 8,
      borderColor: CONFETTI_PURPLE,
      borderTopColor: "transparent",
      borderRightColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "-18deg" }],
    },
  },
  {
    id: "right-confetti-pink-deep-arc-low",
    style: {
      right: 12 * SCALE_X,
      top: 552 * SCALE_Y,
      width: 32 * SCALE_X,
      height: 56 * SCALE_Y,
      borderRadius: 22 * SCALE_X,
      borderWidth: 7,
      borderColor: CONFETTI_PINK_DEEP,
      borderTopColor: "transparent",
      borderRightColor: "transparent",
      backgroundColor: "transparent",
      transform: [{ rotate: "68deg" }],
    },
  },
  {
    id: "right-confetti-orange-dark-arc-low",
    style: {
      right: 6 * SCALE_X,
      top: 612 * SCALE_Y,
      width: 42 * SCALE_X,
      height: 68 * SCALE_Y,
      borderRadius: 28 * SCALE_X,
      borderWidth: 8,
      borderColor: CONFETTI_ORANGE_DARK,
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
  const { user } = useUser();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();

  const [successState] = useState(
    () => SUCCESS_STATES[Math.floor(Math.random() * SUCCESS_STATES.length)],
  );

  useEffect(() => {
    if (workoutId === "warmup-run" || workoutId === "pushups") {
      markWorkoutCompleted(user?.id, workoutId as WorkoutId);
    }

    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => undefined);
  }, [user?.id, workoutId]);

  const handleContinue = () => {
    router.replace("/home");
  };

  return (
    <AppScreen backgroundColor={colors.background}>
      <View className="flex-1">
        {CONFETTI_PIECES.map((piece, index) => (
          <AnimatedConfettiPiece key={piece.id} piece={piece} index={index} />
        ))}

        <View
          className="absolute inset-x-0 items-center z-[5]"
          style={{ top: CARD_WRAP_TOP }}
        >
          <View
            pointerEvents="none"
            className="absolute z-[1] border border-white/[0.12] bg-white/10"
            style={{
              top: -118 * SCALE_Y,
              width: 204 * SCALE_X,
              height: 150 * SCALE_Y,
              borderRadius: 18 * SCALE_X,
            }}
          />

          <BlurView
            intensity={36}
            tint="light"
            pointerEvents="none"
            className="absolute overflow-hidden z-[2]"
            style={{
              top: -62 * SCALE_Y,
              width: 228 * SCALE_X,
              height: 170 * SCALE_Y,
              borderRadius: 18 * SCALE_X,
            }}
          >
            <View className="absolute inset-0 border border-white/[0.16] bg-white/[0.20]" />
          </BlurView>

          <View
            className="z-[3] items-center justify-center bg-white shadow-lg"
            style={{
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              borderRadius: 18 * SCALE_X,
              paddingHorizontal: 26 * SCALE_X,
            }}
          >
            <MaterialCommunityIcons
              name={successState.icon}
              size={64 * SCALE_X}
              color={successState.iconColor}
              style={{ marginBottom: 26 * SCALE_Y }}
            />

            <Text
              className="text-center font-[MontserratAlternates-Bold] text-[#111018]"
              style={{
                fontSize: 15 * SCALE_X,
                lineHeight: 19 * SCALE_X,
                maxWidth: 180 * SCALE_X,
              }}
            >
              {successState.title}
            </Text>
          </View>
        </View>

        <View
          className="absolute inset-x-0 items-center z-[8]"
          style={{ bottom: Math.max(insets.bottom + 34, 48) }}
        >
          <Pressable
            accessibilityLabel="Continue back to home"
            onPress={handleContinue}
            className="items-center justify-center bg-[#D6EBEB]"
            style={{
              width: BUTTON_WIDTH,
              height: 58 * SCALE_Y,
              borderRadius: 29 * SCALE_Y,
            }}
          >
            <Text className="font-[MontserratAlternates-SemiBold] text-[15px] leading-[19px] text-[#262135]">
              Continue
            </Text>
          </Pressable>
        </View>

        {/* TODO: Persist completed workout and update Home status from backend/session store. */}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  animatedConfettiShell: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  confettiPiece: {
    position: "absolute",
    zIndex: 2,
  },
});
