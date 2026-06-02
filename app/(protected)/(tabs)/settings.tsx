import { router } from "expo-router";
import { Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";
import { useAuth, useUser } from "@/lib/clerk";

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  return (
    <AppScreen contentStyle={{ paddingHorizontal: 28, paddingVertical: 24 }}>
      <View className="flex-1 justify-center gap-4">
        <Text
          style={{
            color: colors.journeyText,
            fontFamily: "MontserratAlternates-Bold",
            fontSize: 28,
          }}
        >
          Settings
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.78)",
            fontFamily: "Poppins-Regular",
            fontSize: 13,
          }}
        >
          User session: {user?.primaryEmailAddress?.emailAddress ?? user?.id}
        </Text>
        <AppButton label="Sign out" variant="login" onPress={handleSignOut} />
      </View>
    </AppScreen>
  );
}
