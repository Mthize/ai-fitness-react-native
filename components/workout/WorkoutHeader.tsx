import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";

import { colors } from "@/constants/colors";

type WorkoutHeaderProps = {
  title: string;
  subtitle: string;
  action: ReactNode;
  onBackPress: () => void;
};

export function WorkoutHeader({
  title,
  subtitle,
  action,
  onBackPress,
}: WorkoutHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel="Go back"
        onPress={onBackPress}
        style={styles.backButton}
      >
        <ArrowLeft color={colors.journeyText} size={22} strokeWidth={2.3} />
      </Pressable>

      <View style={styles.infoPill}>
        <View style={styles.textWrap}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>

        <View style={styles.actionWrap}>{action}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: "rgba(16, 13, 24, 0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoPill: {
    flex: 1,
    minHeight: 58,
    borderRadius: 19,
    backgroundColor: "rgba(16, 13, 24, 0.94)",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 18,
  },
  subtitle: {
    color: "rgba(255,255,255,0.62)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 11,
  },
  actionWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.journeyText,
    alignItems: "center",
    justifyContent: "center",
  },
});
