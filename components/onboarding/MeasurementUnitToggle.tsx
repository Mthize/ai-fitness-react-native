import { Pressable, StyleSheet, Text, View } from "react-native";

type MeasurementUnitToggleProps<T extends string> = {
  options: readonly T[];
  selectedValue: T;
  onSelect: (value: T) => void;
};

export function MeasurementUnitToggle<T extends string>({
  options,
  selectedValue,
  onSelect,
}: MeasurementUnitToggleProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = option === selectedValue;

        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={[styles.option, isSelected && styles.selectedOption]}
          >
            <Text
              style={[
                styles.optionLabel,
                isSelected ? styles.selectedLabel : styles.unselectedLabel,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9D6DE",
    borderRadius: 999,
    padding: 3,
    marginBottom: 30,
  },
  option: {
    minWidth: 78,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  selectedOption: {
    backgroundColor: "#2B2339",
  },
  optionLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    lineHeight: 20,
    textTransform: "lowercase",
  },
  selectedLabel: {
    color: "#FFFFFF",
  },
  unselectedLabel: {
    color: "#C9C6CC",
  },
});
