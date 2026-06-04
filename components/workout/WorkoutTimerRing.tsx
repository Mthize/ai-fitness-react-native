import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type WorkoutTimerRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
  progressColor?: string;
  trackColor?: string;
  useGradient?: boolean;
};

export function WorkoutTimerRing({
  progress,
  size = 214,
  strokeWidth = 10,
  progressColor = "#DDEDEC",
  trackColor = "rgba(255,255,255,0.16)",
  useGradient = false,
}: WorkoutTimerRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const progressValue = useSharedValue(clampedProgress);

  useEffect(() => {
    progressValue.value = withTiming(clampedProgress, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
  }, [clampedProgress, progressValue]);

  // The progress ring is rendered with SVG so the stroke offset can animate cleanly around the timer.
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progressValue.value),
  }));

  return (
    <View style={styles.container}>
      <Svg height={size} width={size}>
        <Defs>
          <LinearGradient
            id="timerRingGradient"
            x1="0"
            y1="0"
            x2={size}
            y2={size}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#DCEEEE" stopOpacity="1" />
            <Stop offset="0.48" stopColor="#E8E8E8" stopOpacity="1" />
            <Stop offset="1" stopColor="#F5F2A6" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          animatedProps={animatedProps}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
          stroke={useGradient ? "url(#timerRingGradient)" : progressColor}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
