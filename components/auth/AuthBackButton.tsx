import { router } from "expo-router";
import { Image, Pressable } from "react-native";

import { colors } from "@/constants/colors";

export function AuthBackButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      className="h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-white/15 bg-transparent"
    >
      <Image
        source={require("@/assets/Vector 33.png")}
        className="h-[10px] w-[10px]"
        style={{ tintColor: colors.journeyText }}
        resizeMode="contain"
      />
    </Pressable>
  );
}
