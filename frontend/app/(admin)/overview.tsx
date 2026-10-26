import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import {
  Button,
  Card,
  EmptyState,
  Icon,
  ScreenContainer,
} from "@/src/components/ui";
import { useAuth } from "@/src/hooks/useAuth";
import { LogoutConfirmDialog } from "@/src/components/auth/LogoutConfirmDialog";
import { apiFetch } from "@/src/services/api";
import { makeStyles, spacing, typography } from "@/src/theme";
import type { AdminOverview } from "@/src/types/course";

const useStyles = makeStyles((colors) => ({
  header: { paddingTop: spacing.md, marginBottom: spacing.lg, gap: spacing.xs },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.display,
    color: colors.onSurface,
  },
  subtitle: { color: colors.muted, fontSize: typography.size.base },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metric: { width: "47%", gap: spacing.sm },
  metricLabel: { color: colors.muted, fontSize: typography.size.sm },
  metricValue: {
    fontSize: typography.size.display,
    fontWeight: typography.weight.display,
    color: colors.onSurface,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  logout: { marginTop: spacing.xl },
}));

export default function AdminOverviewScreen() {
  const styles = useStyles();
  const { user, logout, operation } = useAuth();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    apiFetch<AdminOverview>("/dashboard/admin/overview")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const m = data?.metrics;

  return (
    <ScreenContainer scroll testID="admin-overview">
      <View style={styles.header}>
        <Text style={styles.title}>Overview</Text>
        <Text style={styles.subtitle}>Halo {user?.name ?? "Admin"}, berikut ringkasan platform.</Text>
      </View>

      <View style={styles.grid}>
        <Card tone="tertiary" style={styles.metric} testID="metric-total-students">
          <Icon name="people" size={20} color="#D94A38" />
          <Text style={styles.metricValue}>{m?.total_students ?? 0}</Text>
          <Text style={styles.metricLabel}>Total Siswa</Text>
        </Card>
        <Card tone="tertiary" style={styles.metric} testID="metric-active-courses">
          <Icon name="library" size={20} color="#D94A38" />
          <Text style={styles.metricValue}>{m?.active_courses ?? 0}</Text>
          <Text style={styles.metricLabel}>Kelas Aktif</Text>
        </Card>
        <Card tone="tertiary" style={styles.metric} testID="metric-completion">
          <Icon name="checkmark-circle" size={20} color="#D94A38" />
          <Text style={styles.metricValue}>{m?.completion_rate ?? 0}%</Text>
          <Text style={styles.metricLabel}>Tingkat Selesai</Text>
        </Card>
        <Card tone="tertiary" style={styles.metric} testID="metric-reviews">
          <Icon name="hourglass" size={20} color="#D94A38" />
          <Text style={styles.metricValue}>{m?.pending_reviews ?? 0}</Text>
          <Text style={styles.metricLabel}>Review Pending</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Aktivitas Terbaru</Text>
      <Card>
        <EmptyState
          icon="pulse"
          title="Belum ada aktivitas"
          description="Aktivitas pengguna, pendaftaran, dan tiket akan muncul di sini."
        />
      </Card>

      <Button
        label="Keluar"
        variant="outline"
        onPress={() => setShowLogout(true)}
        fullWidth
        style={styles.logout}
        testID="admin-logout-button"
      />
      <LogoutConfirmDialog
        visible={showLogout}
        loading={operation === "logout"}
        onCancel={() => setShowLogout(false)}
        onConfirm={logout}
      />
    </ScreenContainer>
  );
}
