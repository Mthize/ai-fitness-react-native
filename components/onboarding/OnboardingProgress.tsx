import { StyleSheet, View } from "react-native";

type OnboardingProgressProps = {
  step: 1 | 2 | 3;
};

export function OnboardingProgress({ step }: OnboardingProgressProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3].map((segment) => {
        const isCurrent = segment === step;
        const isComplete = segment < step;

        return (
          <View
            key={segment}
            style={[
              styles.segment,
              isCurrent
                ? styles.currentSegment
                : isComplete
                  ? styles.completeSegment
                  : styles.upcomingSegment,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
    marginBottom: 28,
  },
  segment: {
    width: 40,
    height: 4,
    borderRadius: 999,
  },
  currentSegment: {
    backgroundColor: "#23202F",
  },
  completeSegment: {
    backgroundColor: "#D7EEF0",
  },
  upcomingSegment: {
    backgroundColor: "#D4D5D8",
  },
});
