import { StyleSheet, Text, TextInput, View } from "react-native";

type MeasurementCardProps = {
  value: string;
  onChangeText: (value: string) => void;
  unitLabel: string;
  backgroundColor: string;
  labels: readonly number[];
};

export function MeasurementCard({
  value,
  onChangeText,
  unitLabel,
  backgroundColor,
  labels,
}: MeasurementCardProps) {
  const totalTicks = 25;
  const centerTick = Math.floor(totalTicks / 2);

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        returnKeyType="done"
        maxLength={6}
        selectTextOnFocus
        style={styles.valueInput}
      />

      <View style={styles.labelsRow}>
        {labels.map((label) => (
          <Text key={label} style={styles.scaleLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.ticksRow}>
        {Array.from({ length: totalTicks }).map((_, index) => {
          const isCenter = index === centerTick;
          const isMajor = index % 5 === 0;

          return (
            <View
              key={index}
              style={[
                styles.tick,
                isCenter
                  ? styles.centerTick
                  : isMajor
                    ? styles.majorTick
                    : styles.minorTick,
              ]}
            />
          );
        })}
      </View>

      <Text style={styles.unitLabel}>{unitLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 34,
    paddingHorizontal: 18,
    paddingTop: 34,
    paddingBottom: 38,
    alignItems: "center",
    marginTop: 2,
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
  labelsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingHorizontal: 4,
  },
  scaleLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    lineHeight: 18,
    color: "#95959B",
  },
  ticksRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 8,
    paddingHorizontal: 2,
  },
  tick: {
    width: 1,
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
  centerTick: {
    height: 34,
    width: 1.5,
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
});
