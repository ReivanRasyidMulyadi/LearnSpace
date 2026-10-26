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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  text: { fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  brand: { backgroundColor: colors.brandTertiary },
  textBrand: { color: colors.onBrandTertiary },
  success: { backgroundColor: colors.success },
  textSuccess: { color: colors.onSuccess },
  warning: { backgroundColor: colors.warning },
  textWarning: { color: colors.onWarning },
  error: { backgroundColor: colors.error },
  textError: { color: colors.onError },
  neutral: { backgroundColor: colors.surfaceTertiary },
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
