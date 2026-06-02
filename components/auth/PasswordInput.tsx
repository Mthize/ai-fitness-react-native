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
        inputContainerStyle={styles.inputContainer}
        inputStyle={styles.input}
        {...props}
      />

      <Pressable
        hitSlop={10}
        style={styles.toggleButton}
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
  inputContainer: {
    position: "relative",
  },
  input: {
    paddingRight: 52,
  },
  toggleButton: {
    position: "absolute",
    right: 16,
    top: 13,
    height: 30,
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 20,
    height: 20,
    opacity: 0.68,
    tintColor: "rgba(255,255,255,0.68)",
  },
});
