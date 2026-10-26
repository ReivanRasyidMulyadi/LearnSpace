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

export default function AdminAnalyticsScreen() {
  const styles = useStyles();
  return (
    <ScreenContainer scroll testID="admin-analytics">
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Insight engagement dan performa belajar.</Text>
      </View>
      <Card>
        <EmptyState
          icon="bar-chart"
          title="Analytics Dashboard"
          description="Grafik aktif harian, retensi, nilai rata-rata post-test akan muncul di sini."
        />
      </Card>
    </ScreenContainer>
  );
}
