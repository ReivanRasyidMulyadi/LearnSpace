import { StyleSheet, Text, View } from "react-native";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import { Button } from "./Button";
import { Icon, type IoniconName } from "./Icon";

export interface EmptyStateProps {
  icon: IoniconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const useStyles = makeStyles((colors) => ({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    textAlign: "center",
  },
  description: {
    fontSize: typography.size.base,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 360,
    lineHeight: 22,
  },
}));

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={28} color={colors.onSurfaceTertiary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="outline" onPress={onAction} style={{ marginTop: spacing.sm }} />
      ) : null}
    </View>
  );
}
