import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/colors";

type AuthSocialButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  iconName: "logo-google" | "logo-apple";
};

export function AuthSocialButton({
  label,
  onPress,
  disabled = false,
  iconName,
}: AuthSocialButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled ? styles.buttonDisabled : null]}
    >
      <View style={styles.content}>
        <Ionicons
          name={iconName}
          size={16}
          color={colors.journeyText}
          style={styles.icon}
        />
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  label: {
    color: colors.journeyText,
    fontFamily: "Poppins-Medium",
    fontSize: 13,
    lineHeight: 18,
  },
});
