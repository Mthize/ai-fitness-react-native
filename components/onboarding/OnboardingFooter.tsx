import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type OnboardingFooterProps = {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  disabled?: boolean;
  showNextArrows?: boolean;
};

export function OnboardingFooter({
  onBack,
  onNext,
  nextLabel,
  disabled = false,
  showNextArrows = true,
}: OnboardingFooterProps) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <View style={styles.backChevron} />
      </Pressable>

      <Pressable
        onPress={onNext}
        disabled={disabled}
        style={[styles.nextButton, disabled && styles.disabledButton]}
      >
        <Text style={styles.nextLabel}>{nextLabel}</Text>

        {showNextArrows ? (
          <View style={styles.arrowRow}>
            <Image
              source={require("@/assets/Vector 30.png")}
              style={styles.arrow}
              resizeMode="contain"
            />
            <Image
              source={require("@/assets/Vector 31.png")}
              style={styles.arrow}
              resizeMode="contain"
            />
            <Image
              source={require("@/assets/Vector 32.png")}
              style={styles.arrow}
              resizeMode="contain"
            />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
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
    gap: 14,
  },
  disabledButton: {
    opacity: 0.72,
  },
  nextLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    lineHeight: 22,
    color: "#FFFFFF",
  },
  arrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  arrow: {
    width: 7,
    height: 12,
  },
});
