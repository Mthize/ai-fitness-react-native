import { router } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";

export default function Index() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/splash-two");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AppScreen>
      <View style={styles.container}>
        <Image
          source={require("../assets/Group 19104.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 44,
    height: 45,
  },
});
