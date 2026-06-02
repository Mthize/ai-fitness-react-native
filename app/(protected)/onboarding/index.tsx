import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppScreen } from "@/components/AppScreen";
import { OnboardingRouteGuard } from "@/components/onboarding/OnboardingRouteGuard";
import { colors } from "@/constants/colors";

const CTA_HORIZONTAL_MARGIN = 18;
const CTA_BOTTOM = 34;
const CTA_HEIGHT = 69;
const CTA_HORIZONTAL_PADDING = 8;
const CTA_KNOB_SIZE = 54;
const CTA_DRAG_TRIGGER = 0.85;

type BlurBubbleProps = {
  style: StyleProp<ViewStyle>;
  highlightStyle?: StyleProp<ViewStyle>;
};

function BlurBubble({ style, highlightStyle }: BlurBubbleProps) {
  return (
    <View style={[styles.blurBubbleWrapper, style]}>
      <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.blurBubbleTint} />
      <View style={[styles.blurBubbleHighlight, highlightStyle]} />
    </View>
  );
}

function Chevron({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.chevronShape, style]} />;
}

export default function OnboardingIntroScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const dragX = useRef(new Animated.Value(0)).current;
  const chevronOneOpacity = useRef(new Animated.Value(0.25)).current;
  const chevronTwoOpacity = useRef(new Animated.Value(0.55)).current;
  const chevronThreeOpacity = useRef(new Animated.Value(1)).current;
  const hasThresholdHapticRef = useRef(false);
  const hasNavigatedRef = useRef(false);
  const maxDragDistanceRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(chevronOneOpacity, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(chevronTwoOpacity, {
            toValue: 0.55,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(chevronThreeOpacity, {
            toValue: 0.25,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(chevronOneOpacity, {
            toValue: 0.25,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(chevronTwoOpacity, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(chevronThreeOpacity, {
            toValue: 0.55,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(chevronOneOpacity, {
            toValue: 0.25,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(chevronTwoOpacity, {
            toValue: 0.55,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(chevronThreeOpacity, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [chevronOneOpacity, chevronTwoOpacity, chevronThreeOpacity]);

  const maxDragDistance = Math.max(
    sliderWidth - CTA_KNOB_SIZE - CTA_HORIZONTAL_PADDING * 2,
    0
  );

  maxDragDistanceRef.current = maxDragDistance;

  function clampDrag(value: number) {
    return Math.min(Math.max(value, 0), maxDragDistanceRef.current);
  }

  function animateKnobBack() {
    Animated.spring(dragX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }

  function completeSlide() {
    if (hasNavigatedRef.current) {
      return;
    }

    hasNavigatedRef.current = true;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.timing(dragX, {
      toValue: maxDragDistanceRef.current,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        router.replace("/onboarding/weight");
      }
    });
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !hasNavigatedRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        !hasNavigatedRef.current && Math.abs(gestureState.dx) > 2,

      onPanResponderGrant: () => {
        setIsDragging(true);
        hasThresholdHapticRef.current = false;
        dragX.stopAnimation();

        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },

      onPanResponderMove: (_, gestureState) => {
        if (hasNavigatedRef.current) {
          return;
        }

        const nextValue = clampDrag(gestureState.dx);
        dragX.setValue(nextValue);

        const maxDistance = maxDragDistanceRef.current;
        const hasReachedTrigger =
          maxDistance > 0 && nextValue >= maxDistance * CTA_DRAG_TRIGGER;

        if (hasReachedTrigger && !hasThresholdHapticRef.current) {
          hasThresholdHapticRef.current = true;
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }

        if (!hasReachedTrigger) {
          hasThresholdHapticRef.current = false;
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);

        const releasedAt = clampDrag(gestureState.dx);

        if (releasedAt >= maxDragDistanceRef.current * CTA_DRAG_TRIGGER) {
          completeSlide();
          return;
        }

        animateKnobBack();
      },

      onPanResponderTerminate: () => {
        setIsDragging(false);

        if (!hasNavigatedRef.current) {
          animateKnobBack();
        }
      },
    })
  ).current;

  return (
    <OnboardingRouteGuard>
      <AppScreen contentStyle={styles.screen}>
        <View style={[styles.container, { minHeight: height - insets.top }]}>
          <View style={styles.heroPanel}>
            <View pointerEvents="none" style={styles.bubbleLayer}>
              <BlurBubble style={styles.bubbleTopLarge} />
              <BlurBubble style={styles.bubbleTopSmall} />
            </View>

            <View style={styles.copyBlock}>
              <Text style={styles.title}>Start your{"\n"}Fitness Journey</Text>

              <Text style={styles.description}>
                {
                  "Start your fitness journey\nwith our app's guidance and support."
                }
              </Text>
            </View>

            <Image
              source={require("@/assets/Vector 29.png")}
              style={styles.swirlArrow}
              resizeMode="contain"
            />

            <Image
              source={require("@/assets/Sporty-confidence.png")}
              style={[
                styles.athleteImage,
                {
                  width: width * 1.22,
                  height: height * 0.68,
                  right: -width * 0.24,
                  bottom: -height * 0.05,
                },
              ]}
              resizeMode="contain"
            />

            <Image
              source={require("@/assets/Rectangle 43.png")}
              style={styles.rectangle43}
              resizeMode="contain"
            />

            <Image
              source={require("@/assets/Group-39.png")}
              style={styles.ctaCircle}
              resizeMode="contain"
            />

            <Image
              source={require("@/assets/moon.png")}
              style={styles.ctaMoon}
              resizeMode="contain"
            />

            <Text style={styles.drinkLabel}>Drink</Text>
            <Text style={styles.drinkValue}>150 ml</Text>

            <View style={styles.drinkBars}>
              <View style={[styles.drinkBar, { height: 24 }]} />
              <View style={[styles.drinkBar, { height: 38 }]} />
              <View style={[styles.drinkBar, { height: 20 }]} />
              <View style={[styles.drinkBar, { height: 52 }]} />
              <View style={[styles.drinkBar, { height: 34 }]} />
              <View style={[styles.drinkBar, { height: 60 }]} />
            </View>

            <View style={styles.ctaWrapper}>
              <View
                style={styles.ctaContainer}
                onLayout={(event) =>
                  setSliderWidth(event.nativeEvent.layout.width)
                }
                {...panResponder.panHandlers}
              >
                <Animated.View
                  style={[
                    styles.ctaKnob,
                    isDragging && styles.ctaKnobDragging,
                    { transform: [{ translateX: dragX }] },
                  ]}
                >
                  <Chevron style={styles.ctaKnobChevron} />
                </Animated.View>

                <View pointerEvents="none" style={styles.ctaTextLayer}>
                  <Text style={styles.ctaText}>Lets start</Text>
                </View>

                <View pointerEvents="none" style={styles.ctaChevronLayer}>
                  <Animated.View style={{ opacity: chevronOneOpacity }}>
                    <Chevron style={styles.ctaRightChevron} />
                  </Animated.View>

                  <Animated.View style={{ opacity: chevronTwoOpacity }}>
                    <Chevron style={styles.ctaRightChevron} />
                  </Animated.View>

                  <Animated.View style={{ opacity: chevronThreeOpacity }}>
                    <Chevron style={styles.ctaRightChevron} />
                  </Animated.View>
                </View>
              </View>
            </View>

            <View pointerEvents="none" style={styles.titleBubbleLayer}>
              <BlurBubble
                style={styles.bubbleTitle}
                highlightStyle={styles.bubbleTitleHighlight}
              />
            </View>
          </View>
        </View>
      </AppScreen>
    </OnboardingRouteGuard>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  heroPanel: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },

  bubbleLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },

  titleBubbleLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },

  blurBubbleWrapper: {
    overflow: "hidden",
    backgroundColor: "rgba(179, 161, 204, 0.12)",
  },

  blurBubbleTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(179, 161, 204, 0.12)",
  },

  blurBubbleHighlight: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },

  bubbleTitle: {
    position: "absolute",
    top: 116,
    left: 70,
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  bubbleTitleHighlight: {
    top: 190,
    left: 10,
    width: 15,
    height: 15,
    borderRadius: 8,
  },

  bubbleTopLarge: {
    position: "absolute",
    top: 32,
    right: 90,
    width: 90,
    height: 90,
    borderRadius: 45,
  },

  bubbleTopSmall: {
    position: "absolute",
    top: 84,
    right: 80,
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  copyBlock: {
    position: "absolute",
    top: 92,
    left: 34,
    right: 28,
    zIndex: 4,
  },

  title: {
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 35,
    lineHeight: 50,
    letterSpacing: 1,
    color: "#FFFFFF",
  },

  description: {
    marginTop: 24,
    width: 310,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    lineHeight: 24,
    color: "rgba(255,255,255,0.72)",
  },

  swirlArrow: {
    position: "absolute",
    top: 300,
    left: 34,
    width: 120,
    height: 120,
    opacity: 0.6,
    zIndex: 3,
  },

  athleteImage: {
    position: "absolute",
    zIndex: 2,
  },

  rectangle43: {
    position: "absolute",
    left: 120,
    right: 5,
    bottom: 120,
    height: 190,
    zIndex: 4,
  },

  ctaCircle: {
    position: "absolute",
    left: 138,
    bottom: 246,
    width: 48,
    height: 48,
    zIndex: 5,
  },

  ctaMoon: {
    position: "absolute",
    left: 154,
    bottom: 262,
    width: 16,
    height: 16,
    zIndex: 6,
  },

  drinkLabel: {
    position: "absolute",
    left: 210,
    top: 585,
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 14,
    lineHeight: 18,
    color: "#17131F",
    zIndex: 7,
  },

  drinkValue: {
    position: "absolute",
    left: 200,
    top: 605,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 16,
    lineHeight: 20,
    color: "#17131F",
    zIndex: 7,
  },

  drinkBars: {
    position: "absolute",
    left: 150,
    top: 648,
    width: 104,
    height: 80,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    zIndex: 7,
  },

  drinkBar: {
    width: 14,
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },

  ctaWrapper: {
    position: "absolute",
    left: CTA_HORIZONTAL_MARGIN,
    right: CTA_HORIZONTAL_MARGIN,
    bottom: CTA_BOTTOM,
    height: CTA_HEIGHT,
    zIndex: 9,
  },

  ctaContainer: {
    width: "100%",
    height: CTA_HEIGHT,
    borderRadius: CTA_HEIGHT / 2,
    backgroundColor: "rgba(13, 10, 22, 0.9)",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: CTA_HORIZONTAL_PADDING,
  },

  ctaKnob: {
    width: CTA_KNOB_SIZE,
    height: CTA_KNOB_SIZE,
    borderRadius: CTA_KNOB_SIZE / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  ctaKnobDragging: {
    backgroundColor: "#F7F3FF",
  },

  chevronShape: {
    width: 13,
    height: 13,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },

  ctaKnobChevron: {
    width: 11,
    height: 11,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: "#17131F",
    marginLeft: -3,
  },

  ctaTextLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  ctaText: {
    fontFamily: "Poppins-Medium",
    fontSize: 16,
    color: "#FFFFFF",
  },

  ctaChevronLayer: {
    position: "absolute",
    right: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  ctaRightChevron: {
    width: 11,
    height: 11,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: "#FFFFFF",
  },
});
