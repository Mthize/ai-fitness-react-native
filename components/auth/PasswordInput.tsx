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

  return (
    <View style={styles.container}>
      <AuthInput
        label={label}
        error={error}
        secureTextEntry={!isVisible}
        {...props}
      />

      <Pressable
        hitSlop={10}
        style={[styles.toggleButton, label ? styles.toggleButtonWithLabel : null]}
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
  container: {
    width: "100%",
    position: "relative",
  },
  toggleButton: {
    position: "absolute",
    right: 14,
    top: 11,
  },
  toggleButtonWithLabel: {
    top: 38,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: "rgba(255,255,255,0.45)",
  },
});
