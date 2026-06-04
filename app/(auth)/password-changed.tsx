import { router } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";

export default function PasswordChangedScreen() {
  return (
    <AppScreen contentStyle={styles.screen}>
      <View style={styles.content}>
        <Image
          source={require("../../assets/Successmark.png")}
          style={styles.icon}
          resizeMode="contain"
        />

        <Text style={styles.heading}>Password Changed!</Text>
        <Text style={styles.helperText}>
          Your password has been changed successfully.
        </Text>

        <View style={styles.buttonWrap}>
          <AppButton
            label="Back to Login"
            variant="register"
            onPress={() => router.replace("/login")}
          />
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
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 112,
    height: 112,
    marginBottom: 28,
  },
  heading: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 25,
    lineHeight: 32,
    textAlign: "center",
    marginBottom: 10,
  },
  helperText: {
    color: "rgba(255, 255, 255, 0.66)",
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 240,
  },
  buttonWrap: {
    width: "100%",
    marginTop: 28,
  },
});
