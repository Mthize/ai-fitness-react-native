import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/constants/colors";

type AppButtonProps = {
  label: string;
  variant: "login" | "register";
  onPress?: () => void;
  disabled?: boolean;
};

export function AppButton({
  label,
  variant,
  onPress,
  disabled = false,
}: AppButtonProps) {
  const isLogin = variant === "login";

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        ...styles.button,
        backgroundColor: isLogin ? colors.loginButton : colors.registerButton,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text
        style={{
          ...styles.label,
          fontFamily: "Poppins-SemiBold",
          color: isLogin ? colors.loginText : colors.registerText,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 47,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
  },
});
