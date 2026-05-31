import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { colors } from "@/constants/colors";

type AuthInputProps = {
  label: string;
  error?: string;
} & TextInputProps;

export function AuthInput({ label, error, ...props }: AuthInputProps) {
  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}

      <TextInput
        autoCapitalize="none"
        placeholderTextColor="rgba(255,255,255,0.4)"
        style={styles.input}
        {...props}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 6,
  },
  label: {
    color: colors.journeyText,
    fontFamily: "Poppins-Medium",
    fontSize: 13,
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: colors.loginButton,
    paddingHorizontal: 16,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: colors.journeyText,
  },
  error: {
    color: "#FCA5A5",
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    lineHeight: 18,
  },
});
