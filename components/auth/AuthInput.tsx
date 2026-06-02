import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  type TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { colors } from "@/constants/colors";

type AuthInputProps = {
  label: string;
  error?: string;
  inputContainerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
} & TextInputProps;

export function AuthInput({
  label,
  error,
  inputContainerStyle,
  inputStyle,
  ...props
}: AuthInputProps) {
  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}

      <View style={[styles.inputContainer, inputContainerStyle]}>
        <TextInput
          autoCapitalize="none"
          placeholderTextColor="rgba(255,255,255,0.4)"
          style={[styles.input, inputStyle]}
          {...props}
        />
      </View>

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
  inputContainer: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: colors.loginButton,
    justifyContent: "center",
    position: "relative",
  },
  input: {
    width: "100%",
    paddingHorizontal: 16,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    lineHeight: 20,
    color: colors.journeyText,
  },
  error: {
    color: "#FCA5A5",
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    lineHeight: 18,
  },
});
