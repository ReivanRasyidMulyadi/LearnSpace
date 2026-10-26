import { Text, View } from "react-native";
import { Card, EmptyState, ScreenContainer } from "@/src/components/ui";
import { makeStyles, spacing, typography } from "@/src/theme";

const useStyles = makeStyles((colors) => ({
  header: { paddingTop: spacing.md, marginBottom: spacing.lg },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.display,
    color: colors.onSurface,
  },
  subtitle: { color: colors.muted, fontSize: typography.size.base },
}));

export default function AdminReportsScreen() {
  const styles = useStyles();
  return (
    <ScreenContainer scroll testID="admin-reports">
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Ekspor laporan dan statistik mingguan.</Text>
      </View>
      <Card>
        <EmptyState
          icon="document-text"
          title="Laporan"
          description="Download laporan progres siswa dan hasil tes dalam format CSV atau PDF."
        />
      </Card>
    </ScreenContainer>
  );
}
