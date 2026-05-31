import { ReactNode } from "react";
import { Pressable, PressableProps, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";

type AppScreenProps = {
  children: ReactNode;
  contentStyle?: object;
  pressable?: boolean;
} & Pick<PressableProps, "onPress">;

export function AppScreen({
  children,
  contentStyle,
  onPress,
  pressable = false,
}: AppScreenProps) {
  const Content = pressable ? Pressable : View;

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View
        pointerEvents="none"
        style={{
          ...styles.overlay,
          backgroundColor: colors.backgroundTextureDeep,
          opacity: 0.22,
        }}
      />

      <View
        pointerEvents="none"
        style={{
          ...styles.overlay,
          backgroundColor: colors.background,
          opacity: 0.88,
        }}
      />

      <Content style={[styles.content, contentStyle]} onPress={onPress}>
        {children}
      </Content>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
});
