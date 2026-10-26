import { useState } from "react";
import {
  Platform,
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
    marginLeft: 2,
  },
  input: {
    minHeight: 46,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.size.base,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
  focused: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.surfaceSecondary,
    ...(Platform.OS === "web" ? ({ boxShadow: "0 0 0 1px #0F172A" } as any) : {}),
  },
  errorBorder: {
    borderColor: colors.error,
    ...(Platform.OS === "web" ? ({ boxShadow: "0 0 0 1px #EF4444" } as any) : {}),
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.error,
    marginLeft: 2,
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
