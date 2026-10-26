import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { makeStyles, spacing, typography, useTheme } from "@/src/theme";

export interface LoadingSpinnerProps {
  label?: string;
  fullScreen?: boolean;
}

const useStyles = makeStyles((colors) => ({
  container: { alignItems: "center", justifyContent: "center", gap: spacing.md },
  fullScreen: { flex: 1, backgroundColor: colors.surface },
  label: { color: colors.muted, fontSize: typography.size.base },
}));

export function LoadingSpinner({ label, fullScreen }: LoadingSpinnerProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={colors.brandPrimary} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}
