import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";
import { makeStyles, radius, spacing, typography } from "@/src/theme";

export interface ChipProps extends Omit<PressableProps, "children"> {
  label: string;
  selected?: boolean;
  testID?: string;
}

const useStyles = makeStyles((colors) => ({
  base: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  selected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  label: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.onSurfaceTertiary,
  },
  labelSelected: { color: colors.onBrandPrimary, fontWeight: typography.weight.bold },
}));

export function Chip({ label, selected, testID, ...rest }: ChipProps) {
  const styles = useStyles();
  return (
    <Pressable
      {...rest}
      testID={testID}
      style={[styles.base, selected && styles.selected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}
