import { Image, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";

export function AuthBackButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      style={styles.container}
    >
      <Image
        source={require("@/assets/Vector 33.png")}
        style={styles.icon}
        resizeMode="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 10,
    height: 10,
    tintColor: "#FFFFFF",
  },
});
