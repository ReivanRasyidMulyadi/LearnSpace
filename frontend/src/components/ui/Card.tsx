import { Platform, View, type ViewProps, type ViewStyle } from "react-native";
import { makeStyles, radius, shadows, spacing } from "@/src/theme";

export interface CardProps extends ViewProps {
  padded?: boolean;
  tone?: "surface" | "tertiary" | "brandTertiary" | "inverse";
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
  tertiary: {
    backgroundColor: colors.surfaceTertiary,
    borderColor: colors.border,
  },
  brandTertiary: {
    backgroundColor: colors.brandTertiary,
    borderColor: "#DBEAFE",
  },
  inverse: {
    backgroundColor: colors.surfaceInverse,
    borderColor: colors.surfaceInverse,
  },
  elevated: {
    ...shadows.cardElevated,
  },
  cardShadow: {
    ...shadows.card,
  },
}));

export function Card({
  padded = true,
  tone = "surface",
  elevated = false,
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
        styles.cardShadow,
        padded && styles.padded,
        tone === "tertiary" && styles.tertiary,
        tone === "brandTertiary" && styles.brandTertiary,
        tone === "inverse" && styles.inverse,
        elevated && styles.elevated,
        ...(Array.isArray(style) ? style : style ? [style] : []),
      ]}
    >
      {children}
    </View>
  );
}
