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

const MIN_WEIGHT = 40;
const MAX_WEIGHT = 160;
const TICK_SPACING = 18;
const CHEVRON_FADE_DURATION = 2000;

function clampWeight(value: number) {
  return Math.min(Math.max(value, MIN_WEIGHT), MAX_WEIGHT);
}

function getRoundedWeight(value: number) {
  return clampWeight(Math.round(value));
}

function getScrollXForWeight(value: number) {
  return (getRoundedWeight(value) - MIN_WEIGHT) * TICK_SPACING;
}

function getWeightFromScrollX(scrollX: number) {
  return getRoundedWeight(scrollX / TICK_SPACING + MIN_WEIGHT);
}

export default function WeightScreen() {
  const router = useRouter();
  const { onboarding, setWeight, setWeightUnit } = useOnboarding();
  const [weightValue, setWeightValue] = useState(String(onboarding.weight));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rulerWidth, setRulerWidth] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastHapticValueRef = useRef(getRoundedWeight(onboarding.weight));
  const roundedWeightRef = useRef(getRoundedWeight(onboarding.weight));
  const isDraggingRulerRef = useRef(false);
  const nextChevronOneOpacity = useRef(new Animated.Value(0.25)).current;
  const nextChevronTwoOpacity = useRef(new Animated.Value(0.55)).current;
  const nextChevronThreeOpacity = useRef(new Animated.Value(1)).current;

  const weightTicks = useMemo(
    () =>
      Array.from(
        { length: MAX_WEIGHT - MIN_WEIGHT + 1 },
        (_, index) => MIN_WEIGHT + index,
      ),
    [],
  );

  const rulerSidePadding = Math.max(0, rulerWidth / 2 - TICK_SPACING / 2);

  const scrollToWeight = useCallback((value: number, animated: boolean) => {
    scrollViewRef.current?.scrollTo({
      x: getScrollXForWeight(value),
      animated,
    });
  }, []);

  useEffect(() => {
    if (rulerWidth <= 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      scrollToWeight(roundedWeightRef.current, false);
    });

    return () => cancelAnimationFrame(frame);
  }, [rulerWidth, scrollToWeight]);

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

  function handleWeightChange(value: string) {
    const sanitizedValue = value.replace(/[^0-9.]/g, "");

    setWeightValue(sanitizedValue);
    setErrorMessage(null);

    const parsedWeight = Number(sanitizedValue);

    if (sanitizedValue && Number.isFinite(parsedWeight) && parsedWeight > 0) {
      const roundedWeight = getRoundedWeight(parsedWeight);

      roundedWeightRef.current = roundedWeight;
      setWeight(parsedWeight);
      scrollToWeight(roundedWeight, true);
    }
  }

  function handleNext() {
    const parsedWeight = Number(weightValue);

    if (!weightValue || !Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setErrorMessage("Please enter a valid weight.");
      return;
    }

    setWeight(parsedWeight);
    router.push("/onboarding/height");
  }

  function handleRulerScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    const nextWeight = getWeightFromScrollX(event.nativeEvent.contentOffset.x);

    if (nextWeight === roundedWeightRef.current) {
      return;
    }

    roundedWeightRef.current = nextWeight;
    setWeightValue(String(nextWeight));
    setWeight(nextWeight);
    setErrorMessage(null);

    if (
      isDraggingRulerRef.current &&
      nextWeight !== lastHapticValueRef.current
    ) {
      lastHapticValueRef.current = nextWeight;
      void Haptics.selectionAsync();
    }
  }

  return (
    <OnboardingRouteGuard>
      <AppScreen light contentStyle={styles.screen}>
        <View style={styles.content}>
          <OnboardingProgress step={1} />

          <Text style={styles.title}>What is your{"\n"}weight?</Text>

          <MeasurementUnitToggle
            options={["lb", "kg"]}
            selectedValue={onboarding.weightUnit}
            onSelect={(value) => {
              setWeightUnit(value);
              setErrorMessage(null);
            }}
          />

          <View style={styles.card}>
            <TextInput
              value={weightValue}
              onChangeText={handleWeightChange}
              keyboardType="decimal-pad"
              returnKeyType="done"
              maxLength={6}
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
                    {weightTicks.map((tick) => (
                      <Text key={tick} style={styles.scaleLabel}>
                        {tick % 10 === 0 ? tick : ""}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.ticksRow}>
                    {weightTicks.map((tick) => {
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
                {onboarding.weightUnit}
              </Text>
            </View>
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.footerRow}>
            <Pressable
              onPress={() => router.replace("/onboarding")}
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
    backgroundColor: "#F8F1A8",
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
