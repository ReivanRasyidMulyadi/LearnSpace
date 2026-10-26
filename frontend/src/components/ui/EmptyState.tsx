import { StyleSheet, Text, View } from "react-native";
import { makeStyles, spacing, typography } from "@/src/theme";
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brandTertiary,
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
  },
}));

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={32} color="#D94A38" />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="outline" onPress={onAction} style={{ marginTop: spacing.sm }} />
      ) : null}
    </View>
  );
}
