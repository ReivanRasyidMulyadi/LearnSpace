import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  containerStyle?: ViewStyle;
}

const useStyles = makeStyles((colors) => ({
  container: { gap: spacing.xs },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.onSurfaceTertiary,
    marginLeft: spacing.md,
  },
  input: {
    minHeight: 52,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    fontSize: typography.size.lg,
    color: colors.onSurface,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  focused: { borderColor: colors.brandPrimary, backgroundColor: colors.surfaceSecondary },
  errorBorder: { borderColor: colors.error },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.error,
    marginLeft: spacing.md,
  },
}));

export function Input({
  label,
  error,
  containerStyle,
  style,
  testID,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label} testID={testID ? `${testID}-label` : undefined}>
          {label}
        </Text>
      ) : null}
      <TextInput
        {...rest}
        testID={testID}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          focused && styles.focused,
          error ? styles.errorBorder : null,
          style,
        ]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
      />
      {error ? (
        <Text
          style={styles.errorText}
          testID={testID ? `${testID}-error` : undefined}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
