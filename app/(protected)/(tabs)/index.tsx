import { Link } from "expo-router";
import { Text, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";
import { useUser } from "@/lib/clerk";

export default function HomeScreen() {
  const { user } = useUser();

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
          Private home
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.78)",
            fontFamily: "Poppins-Regular",
            fontSize: 13,
          }}
        >
          Signed in as {user?.primaryEmailAddress?.emailAddress ?? user?.id}.
        </Text>
        <Link href="/workout" asChild>
          <Text
            style={{
              color: colors.fitnessText,
              fontFamily: "Poppins-SemiBold",
              fontSize: 13,
            }}
          >
            Open protected workout route
          </Text>
        </Link>
      </View>
    </AppScreen>
  );
}
