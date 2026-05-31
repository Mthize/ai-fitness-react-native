import { Text, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";

export default function WorkoutScreen() {
  return (
    <AppScreen contentStyle={{ paddingHorizontal: 28, paddingVertical: 24 }}>
      <View className="flex-1 justify-center gap-3">
        <Text
          style={{
            color: colors.journeyText,
            fontFamily: "MontserratAlternates-Bold",
            fontSize: 28,
          }}
        >
          Workout
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.72)",
            fontFamily: "Poppins-Regular",
            fontSize: 13,
          }}
        >
          Protected workout content will be added here later.
        </Text>
      </View>
    </AppScreen>
  );
}
