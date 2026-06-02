import { Text, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";

export function RouteStatusScreen({ title }: { title: string }) {
  return (
    <AppScreen>
      <View className="flex-1 items-center justify-center px-6">
        <Text
          style={{
            color: colors.white,
            fontFamily: "Poppins-Medium",
            fontSize: 16,
            textAlign: "center",
          }}
        >
          {title}
        </Text>
      </View>
    </AppScreen>
  );
}
