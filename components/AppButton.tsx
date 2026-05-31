import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/constants/colors";

type AppButtonProps = {
  label: string;
  variant: "login" | "register";
  onPress?: () => void;
};

export function AppButton({ label, variant, onPress }: AppButtonProps) {
  const isLogin = variant === "login";

  return (
    <Pressable
      onPress={onPress}
      style={{
        ...styles.button,
        backgroundColor: isLogin ? colors.loginButton : colors.registerButton,
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
    fontSize: 13,
    lineHeight: 18,
  },
});
