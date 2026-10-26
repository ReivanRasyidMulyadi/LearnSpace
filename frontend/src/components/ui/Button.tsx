import {
  ActivityIndicator,
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
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  testID?: string;
}

const useStyles = makeStyles((colors) => ({
  base: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  primary: { backgroundColor: colors.brandPrimary, ...shadows.button },
  secondary: { backgroundColor: colors.brandSecondary, ...shadows.button },
  ghost: { backgroundColor: "transparent" },
  outline: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  labelBase: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  labelOnPrimary: { color: colors.onBrandPrimary },
  labelOnSecondary: { color: colors.onBrandSecondary },
  labelOnGhost: { color: colors.brandPrimary },
  labelOnOutline: { color: colors.onSurface },
  disabled: { opacity: 0.5 },
}));

export function Button({
  label,
  variant = "primary",
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
    variant === "primary" && styles.primary,
    variant === "secondary" && styles.secondary,
    variant === "ghost" && styles.ghost,
    variant === "outline" && styles.outline,
    fullWidth && { alignSelf: "stretch" },
    (disabled || loading) && styles.disabled,
    ...(Array.isArray(style) ? style : style ? [style] : []),
  ].filter(Boolean) as ViewStyle[];

  const labelColor =
    variant === "primary"
      ? colors.onBrandPrimary
      : variant === "secondary"
      ? colors.onBrandSecondary
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
        pressed && !disabled && !loading ? { opacity: 0.85 } : null,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <>
          {leftIcon ? <View>{leftIcon}</View> : null}
          <Text style={[styles.labelBase, { color: labelColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
