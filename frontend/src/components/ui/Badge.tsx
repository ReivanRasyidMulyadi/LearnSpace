import { Text, View, type ViewStyle } from "react-native";
import { makeStyles, radius, spacing, typography } from "@/src/theme";

export type BadgeTone = "brand" | "success" | "warning" | "error" | "neutral";

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
}

const useStyles = makeStyles((colors) => ({
  base: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    letterSpacing: 0.2,
  },
  brand: {
    backgroundColor: "#EFF6FF",
    borderColor: "#DBEAFE",
  },
  textBrand: { color: "#1D4ED8" },
  success: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  textSuccess: { color: "#047857" },
  warning: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  textWarning: { color: "#B45309" },
  error: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  textError: { color: "#B91C1C" },
  neutral: {
    backgroundColor: colors.surfaceTertiary,
    borderColor: colors.border,
  },
  textNeutral: { color: colors.onSurfaceTertiary },
}));

export function Badge({ label, tone = "brand", style }: BadgeProps) {
  const styles = useStyles();
  const containerKey = tone;
  const textKey = `text${tone.charAt(0).toUpperCase()}${tone.slice(1)}` as
    | "textBrand"
    | "textSuccess"
    | "textWarning"
    | "textError"
    | "textNeutral";

  return (
    <View style={[styles.base, styles[containerKey], style]}>
      <Text style={[styles.text, styles[textKey]]}>{label}</Text>
    </View>
  );
}
