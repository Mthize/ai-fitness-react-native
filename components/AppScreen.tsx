import { ReactNode } from "react";
import { Pressable, PressableProps, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";

type AppScreenProps = {
  children: ReactNode;
  contentStyle?: object;
  pressable?: boolean;
  light?: boolean;
  backgroundColor?: string;
} & Pick<PressableProps, "onPress">;

export function AppScreen({
  children,
  contentStyle,
  onPress,
  pressable = false,
  light = false,
  backgroundColor,
}: AppScreenProps) {
  const Content = pressable ? Pressable : View;
  const darkBackgroundColor = backgroundColor ?? colors.background;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: light ? "white" : darkBackgroundColor },
      ]}
    >
      {/* Most protected screens use the shared dark background layers; `light` opts out for white-backed layouts. */}
      {!light && !backgroundColor && (
        <>
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
        </>
      )}

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
