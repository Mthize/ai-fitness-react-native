import { Text, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";

export default function RegisterScreen() {
  return (
    <AppScreen>
      <View className="flex-1 items-center justify-center">
        <Text
          className="text-[18px]"
          style={{
            color: colors.journeyText,
            fontFamily: "Poppins-SemiBold",
          }}
        >
          Register
        </Text>
      </View>
    </AppScreen>
  );
}
