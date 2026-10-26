import { Platform, Pressable, StyleSheet, Text, type PressableProps } from "react-native";
import { makeStyles, radius, spacing, typography } from "@/src/theme";

export interface ChipProps extends Omit<PressableProps, "children"> {
  label: string;
  selected?: boolean;
  testID?: string;
}

const useStyles = makeStyles((colors) => ({
  base: {
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any) : {}),
  },
  selected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.onSurfaceTertiary,
  },
  labelSelected: {
    color: colors.onBrandPrimary,
    fontWeight: typography.weight.semibold,
  },
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
