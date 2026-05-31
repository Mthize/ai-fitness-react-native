import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";

export default function SplashThree() {
  return (
    <AppScreen contentStyle={styles.screen}>
      <View style={styles.content}>
        <View style={styles.bottomContent}>
          <View style={styles.mainGroup}>
            <Image
              source={require("../assets/Group 19104.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.titleGroup}>
              <Text style={styles.titleText}>Start your</Text>
              <Text style={styles.titleText}>
                <Text style={{ color: colors.fitnessText }}>Fitness</Text>
                <Text style={{ color: colors.journeyText }}> Journey</Text>
              </Text>
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <AppButton
              label="Login"
              variant="login"
              onPress={() => router.push("/(auth)/login")}
            />

            <View style={styles.buttonGap} />

            <AppButton
              label="Register"
              variant="register"
              onPress={() => router.push("/(auth)/register")}
            />

            <Pressable onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.guestText}>Continue as a guest</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 28,
  },
  content: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    paddingBottom: 34,
  },
  bottomContent: {
    width: "100%",
    alignItems: "center",
  },
  mainGroup: {
    width: "100%",
    alignItems: "center",
    marginBottom: 72,
  },
  logo: {
    width: 52,
    height: 53,
  },
  titleGroup: {
    marginTop: 22,
    alignItems: "center",
  },
  titleText: {
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 33,
    lineHeight: 39,
    textAlign: "center",
    color: colors.journeyText,
  },
  buttonGroup: {
    width: "100%",
  },
  buttonGap: {
    height: 10,
  },
  guestText: {
    marginTop: 8,
    textAlign: "center",
    color: colors.guestText,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Poppins-SemiBold",
    textDecorationLine: "underline",
  },
});
