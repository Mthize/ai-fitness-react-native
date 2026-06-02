import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { colors } from "@/constants/colors";

export function AuthBackButton() {
  return (
    <Pressable onPress={() => router.back()} style={styles.button}>
      <Ionicons
        name="chevron-back"
        size={18}
        color={colors.journeyText}
        style={styles.icon}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginLeft: -1,
  },
});
