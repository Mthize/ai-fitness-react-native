import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type TextInputProps,
} from "react-native";

import { AuthInput } from "@/components/auth/AuthInput";

type PasswordInputProps = {
  label: string;
  error?: string;
} & Omit<TextInputProps, "secureTextEntry">;

export function PasswordInput({
  label,
  error,
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const toggleButtonClassName = label
    ? "absolute right-[14px] top-[38px]"
    : "absolute right-[14px] top-[11px]";

  return (
    <View className="relative w-full">
      <AuthInput
        label={label}
        error={error}
        secureTextEntry={!isVisible}
        {...props}
      />

      <Pressable
        hitSlop={10}
        className={toggleButtonClassName}
        onPress={() => setIsVisible((value) => !value)}
      >
        <Image
          source={require("@/assets/fluent_eye-20-filled.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 20,
    height: 20,
    tintColor: "rgba(255,255,255,0.45)",
  },
});
