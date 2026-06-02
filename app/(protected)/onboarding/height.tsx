import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { MeasurementUnitToggle } from "@/components/onboarding/MeasurementUnitToggle";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OnboardingRouteGuard } from "@/components/onboarding/OnboardingRouteGuard";
import { useOnboarding } from "@/lib/auth";

const CM_MIN_HEIGHT = 150;
const CM_MAX_HEIGHT = 190;
const INCH_MIN_HEIGHT = 50;
const INCH_MAX_HEIGHT = 90;
const TICK_SPACING = 18;
const CHEVRON_FADE_DURATION = 2000;

type HeightUnit = "inches" | "cm";

function getHeightRange(unit: HeightUnit) {
  return unit === "cm"
    ? { min: CM_MIN_HEIGHT, max: CM_MAX_HEIGHT }
    : { min: INCH_MIN_HEIGHT, max: INCH_MAX_HEIGHT };
}

function clampHeight(value: number, unit: HeightUnit) {
  const { min, max } = getHeightRange(unit);

  return Math.min(Math.max(value, min), max);
}

function getRoundedHeight(value: number, unit: HeightUnit) {
  return clampHeight(Math.round(value), unit);
}

function getScrollXForHeight(value: number, unit: HeightUnit) {
  const { min } = getHeightRange(unit);

  return (getRoundedHeight(value, unit) - min) * TICK_SPACING;
}

function getHeightFromScrollX(scrollX: number, unit: HeightUnit) {
  const { min } = getHeightRange(unit);

  return getRoundedHeight(scrollX / TICK_SPACING + min, unit);
}

export default function HeightScreen() {
  const router = useRouter();
  const { onboarding, setHeight, setHeightUnit } = useOnboarding();
  const initialHeight = getRoundedHeight(
    onboarding.height,
    onboarding.heightUnit,
  );
  const [heightValue, setHeightValue] = useState(String(initialHeight));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rulerWidth, setRulerWidth] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastHapticValueRef = useRef(initialHeight);
  const roundedHeightRef = useRef(initialHeight);
  const isDraggingRulerRef = useRef(false);
  const nextChevronOneOpacity = useRef(new Animated.Value(0.25)).current;
  const nextChevronTwoOpacity = useRef(new Animated.Value(0.55)).current;
  const nextChevronThreeOpacity = useRef(new Animated.Value(1)).current;

  const heightTicks = useMemo(() => {
    const { min, max } = getHeightRange(onboarding.heightUnit);

    return Array.from({ length: max - min + 1 }, (_, index) => min + index);
  }, [onboarding.heightUnit]);

  const rulerSidePadding = Math.max(0, rulerWidth / 2 - TICK_SPACING / 2);

  const scrollToHeight = useCallback(
    (value: number, unit: HeightUnit, animated: boolean) => {
      scrollViewRef.current?.scrollTo({
        x: getScrollXForHeight(value, unit),
        animated,
      });
    },
    [],
  );

  useEffect(() => {
    if (rulerWidth <= 0) {
      return;
    }

    const roundedHeight = getRoundedHeight(
      roundedHeightRef.current,
      onboarding.heightUnit,
    );

    roundedHeightRef.current = roundedHeight;
    lastHapticValueRef.current = roundedHeight;
    setHeightValue(String(roundedHeight));

    const frame = requestAnimationFrame(() => {
      scrollToHeight(roundedHeight, onboarding.heightUnit, false);
    });

    return () => cancelAnimationFrame(frame);
  }, [onboarding.heightUnit, rulerWidth, scrollToHeight]);

  useEffect(() => {
    const chevronAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(nextChevronOneOpacity, {
            toValue: 1,
            duration: CHEVRON_FADE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(nextChevronTwoOpacity, {
            toValue: 0.55,
            duration: CHEVRON_FADE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(nextChevronThreeOpacity, {
            toValue: 0.25,
            duration: CHEVRON_FADE_DURATION,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(nextChevronOneOpacity, {
            toValue: 0.25,
            duration: CHEVRON_FADE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(nextChevronTwoOpacity, {
            toValue: 1,
            duration: CHEVRON_FADE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(nextChevronThreeOpacity, {
            toValue: 0.55,
            duration: CHEVRON_FADE_DURATION,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(nextChevronOneOpacity, {
            toValue: 0.25,
            duration: CHEVRON_FADE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(nextChevronTwoOpacity, {
            toValue: 0.55,
            duration: CHEVRON_FADE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(nextChevronThreeOpacity, {
            toValue: 1,
            duration: CHEVRON_FADE_DURATION,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    chevronAnimation.start();

    return () => chevronAnimation.stop();
  }, [
    nextChevronOneOpacity,
    nextChevronTwoOpacity,
    nextChevronThreeOpacity,
  ]);

  function handleHeightChange(value: string) {
    const sanitizedValue = value.replace(/[^0-9]/g, "");

    setHeightValue(sanitizedValue);
    setErrorMessage(null);

    const parsedHeight = Number(sanitizedValue);

    if (sanitizedValue && Number.isFinite(parsedHeight) && parsedHeight > 0) {
      const roundedHeight = getRoundedHeight(
        parsedHeight,
        onboarding.heightUnit,
      );

      roundedHeightRef.current = roundedHeight;
      lastHapticValueRef.current = roundedHeight;
      setHeightValue(String(roundedHeight));
      setHeight(roundedHeight);
      scrollToHeight(roundedHeight, onboarding.heightUnit, true);
    }
  }

  function handleNext() {
    const parsedHeight = Number(heightValue);

    if (!heightValue || !Number.isFinite(parsedHeight) || parsedHeight <= 0) {
      setErrorMessage("Please enter a valid height.");
      return;
    }

    const roundedHeight = getRoundedHeight(parsedHeight, onboarding.heightUnit);

    setHeight(roundedHeight);
    router.push("/onboarding/goal");
  }

  function handleUnitSelect(unit: HeightUnit) {
    const roundedHeight = getRoundedHeight(roundedHeightRef.current, unit);

    roundedHeightRef.current = roundedHeight;
    lastHapticValueRef.current = roundedHeight;
    setHeightUnit(unit);
    setHeightValue(String(roundedHeight));
    setHeight(roundedHeight);
    setErrorMessage(null);
    scrollToHeight(roundedHeight, unit, false);
  }

  function handleRulerScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    const nextHeight = getHeightFromScrollX(
      event.nativeEvent.contentOffset.x,
      onboarding.heightUnit,
    );

    if (nextHeight === roundedHeightRef.current) {
      return;
    }

    roundedHeightRef.current = nextHeight;
    setHeightValue(String(nextHeight));
    setHeight(nextHeight);
    setErrorMessage(null);

    if (
      isDraggingRulerRef.current &&
      nextHeight !== lastHapticValueRef.current
    ) {
      lastHapticValueRef.current = nextHeight;
      void Haptics.selectionAsync();
    }
  }

  return (
    <OnboardingRouteGuard>
      <AppScreen light contentStyle={styles.screen}>
        <View style={styles.content}>
          <OnboardingProgress step={2} />

          <Text style={styles.title}>What is your{"\n"}height?</Text>

          <MeasurementUnitToggle
            options={["inches", "cm"]}
            selectedValue={onboarding.heightUnit}
            onSelect={handleUnitSelect}
          />

          <View style={styles.card}>
            <TextInput
              value={heightValue}
              onChangeText={handleHeightChange}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={3}
              selectTextOnFocus
              style={styles.valueInput}
            />

            <View
              style={styles.rulerArea}
              onLayout={(event) => setRulerWidth(event.nativeEvent.layout.width)}
            >
              <ScrollView
                ref={scrollViewRef}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                contentContainerStyle={[
                  styles.rulerScrollContent,
                  {
                    paddingLeft: rulerSidePadding,
                    paddingRight: rulerSidePadding,
                  },
                ]}
                onScroll={handleRulerScroll}
                onScrollBeginDrag={() => {
                  isDraggingRulerRef.current = true;
                }}
                onScrollEndDrag={(event) => {
                  if (!event.nativeEvent.velocity?.x) {
                    isDraggingRulerRef.current = false;
                  }
                }}
                onMomentumScrollEnd={() => {
                  isDraggingRulerRef.current = false;
                }}
              >
                <View style={styles.rulerContent}>
                  <View style={styles.labelsRow}>
                    {heightTicks.map((tick) => (
                      <Text key={tick} style={styles.scaleLabel}>
                        {tick % 10 === 0 ? tick : ""}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.ticksRow}>
                    {heightTicks.map((tick) => {
                      const isMajor = tick % 10 === 0;

                      return (
                        <View
                          key={tick}
                          style={[
                            styles.tickWrapper,
                            isMajor ? styles.majorTick : styles.minorTick,
                          ]}
                        >
                          <View style={styles.tick} />
                        </View>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              <View pointerEvents="none" style={styles.centerMarker} />
              <Text pointerEvents="none" style={styles.unitLabel}>
                {onboarding.heightUnit}
              </Text>
            </View>
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.footerRow}>
            <Pressable
              onPress={() => router.replace("/onboarding/weight")}
              style={styles.backButton}
            >
              <View style={styles.backChevron} />
            </Pressable>

            <Pressable onPress={handleNext} style={styles.nextButton}>
              <Text style={styles.nextLabel}>Next</Text>

              <View style={styles.nextChevronLayer}>
                <Animated.View style={{ opacity: nextChevronOneOpacity }}>
                  <View style={styles.nextChevron} />
                </Animated.View>
                <Animated.View style={{ opacity: nextChevronTwoOpacity }}>
                  <View style={styles.nextChevron} />
                </Animated.View>
                <Animated.View style={{ opacity: nextChevronThreeOpacity }}>
                  <View style={styles.nextChevron} />
                </Animated.View>
              </View>
            </Pressable>
          </View>
        </View>
      </AppScreen>
    </OnboardingRouteGuard>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  title: {
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 24,
    lineHeight: 31,
    color: "#282536",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    borderRadius: 34,
    paddingHorizontal: 18,
    paddingTop: 34,
    paddingBottom: 38,
    alignItems: "center",
    marginTop: 2,
    backgroundColor: "#D5EAEB",
  },
  valueInput: {
    minWidth: 150,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 60,
    lineHeight: 68,
    color: "#07070C",
    textAlign: "center",
    paddingVertical: 0,
  },
  rulerArea: {
    width: "100%",
    alignItems: "center",
  },
  rulerScrollContent: {
    alignItems: "flex-start",
  },
  rulerContent: {
    alignItems: "flex-start",
  },
  labelsRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  scaleLabel: {
    width: TICK_SPACING,
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    lineHeight: 18,
    color: "#95959B",
    textAlign: "center",
  },
  ticksRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },
  tickWrapper: {
    width: TICK_SPACING,
    alignItems: "center",
  },
  tick: {
    width: 1,
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#A7A6AA",
  },
  minorTick: {
    height: 11,
    opacity: 0.75,
  },
  majorTick: {
    height: 18,
  },
  centerMarker: {
    position: "absolute",
    top: 32,
    width: 1.5,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#22212B",
  },
  unitLabel: {
    marginTop: 2,
    fontFamily: "Poppins-Medium",
    fontSize: 15,
    lineHeight: 20,
    color: "#111017",
    textTransform: "lowercase",
  },
  errorText: {
    marginTop: 14,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    lineHeight: 18,
    color: "#B3261E",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginTop: "auto",
    paddingBottom: 18,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E1E8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  backChevron: {
    width: 14,
    height: 14,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: "#2A2038",
    transform: [{ rotate: "45deg" }],
  },
  nextButton: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#2B2339",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 34,
  },
  nextLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    lineHeight: 22,
    color: "#FFFFFF",
  },
  nextChevronLayer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  nextChevron: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },
});
