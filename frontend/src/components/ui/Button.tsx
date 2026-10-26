import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import { makeStyles, radius, shadows, spacing, typography, useTheme } from "@/src/theme";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";

export interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: ButtonVariant;
  pill?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  testID?: string;
}

const useStyles = makeStyles((colors) => ({
  base: {
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  pill: {
    borderRadius: radius.pill,
  },
  primary: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
    ...shadows.button,
  },
  secondary: {
    backgroundColor: colors.surfaceTertiary,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  outline: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    ...shadows.button,
  },
  labelBase: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  labelOnPrimary: { color: colors.onBrandPrimary },
  labelOnSecondary: { color: colors.onSurface },
  labelOnGhost: { color: colors.onSurface },
  labelOnOutline: { color: colors.onSurface },
  disabled: { opacity: 0.45 },
}));

export function Button({
  label,
  variant = "primary",
  pill = false,
  loading,
  fullWidth,
  leftIcon,
  disabled,
  style,
  testID,
  onPress,
  ...rest
}: ButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  const containerStyle: ViewStyle[] = [
    styles.base,
    pill && styles.pill,
    variant === "primary" && styles.primary,
    variant === "secondary" && styles.secondary,
    variant === "ghost" && styles.ghost,
    variant === "outline" && styles.outline,
    fullWidth && { alignSelf: "stretch" },
    (disabled || loading) && styles.disabled,
    Platform.OS === "web" && !disabled && !loading ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any) : null,
    ...(Array.isArray(style) ? style : style ? [style] : []),
  ].filter(Boolean) as ViewStyle[];

  const labelColor =
    variant === "primary"
      ? colors.onBrandPrimary
      : variant === "secondary"
      ? colors.onSurface
      : variant === "ghost"
      ? colors.brandPrimary
      : colors.onSurface;

  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        ...containerStyle,
        pressed && !disabled && !loading ? { opacity: 0.85, transform: [{ scale: 0.99 }] } : null,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <>
          {leftIcon ? <View>{leftIcon}</View> : null}
          <Text style={[styles.labelBase, { color: labelColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
