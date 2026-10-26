import { View, type ViewProps, type ViewStyle } from "react-native";
import { makeStyles, radius, shadows, spacing } from "@/src/theme";

export interface CardProps extends ViewProps {
  padded?: boolean;
  tone?: "surface" | "tertiary" | "brandTertiary";
  elevated?: boolean;
  style?: ViewStyle | ViewStyle[];
}

const useStyles = makeStyles((colors) => ({
  base: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  padded: { padding: spacing.lg },
  tertiary: { backgroundColor: colors.surfaceTertiary, borderColor: colors.border },
  brandTertiary: { backgroundColor: colors.brandTertiary, borderColor: colors.brandTertiary },
  elevated: { ...shadows.card },
}));

export function Card({
  padded = true,
  tone = "surface",
  elevated,
  style,
  children,
  ...rest
}: CardProps) {
  const styles = useStyles();
  return (
    <View
      {...rest}
      style={[
        styles.base,
        padded && styles.padded,
        tone === "tertiary" && styles.tertiary,
        tone === "brandTertiary" && styles.brandTertiary,
        elevated && styles.elevated,
        ...(Array.isArray(style) ? style : style ? [style] : []),
      ]}
    >
      {children}
    </View>
  );
}
