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
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import type { AdminOverview } from "@/src/types/course";
import { formatRelative } from "@/src/utils/datetime";

const useStyles = makeStyles((colors) => ({
  header: { paddingTop: spacing.md, marginBottom: spacing.lg, gap: spacing.xs },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  subtitle: { color: colors.muted, fontSize: typography.size.base },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metric: {
    width: "47%",
    gap: spacing.xs,
    padding: spacing.md,
  },
  metricLabel: { color: colors.muted, fontSize: typography.size.xs },
  metricValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  activityBody: {
    flex: 1,
  },
  activityLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.onSurface,
  },
  activityTime: {
    fontSize: typography.size.xs,
    color: colors.muted,
  },
  logout: { marginTop: spacing.xl },
}));

export default function AdminOverviewScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { user, logout, operation } = useAuth();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    apiFetch<AdminOverview>("/dashboard/admin/overview")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const m = data?.metrics;
  const recent = data?.recent_activity ?? [];

  return (
    <ScreenContainer scroll testID="admin-overview">
      <View style={styles.header}>
        <Text style={styles.title}>Overview Platform</Text>
        <Text style={styles.subtitle}>Halo {user?.name ?? "Admin"}, berikut ringkasan statistik platform.</Text>
      </View>

      <View style={styles.grid}>
        <Card style={styles.metric} testID="metric-total-students">
          <Icon name="people-outline" size={20} color={colors.brandPrimary} />
          <Text style={styles.metricValue}>{m?.total_students ?? 0}</Text>
          <Text style={styles.metricLabel}>Total Siswa Terdaftar</Text>
        </Card>
        <Card style={styles.metric} testID="metric-active-courses">
          <Icon name="library-outline" size={20} color={colors.brandPrimary} />
          <Text style={styles.metricValue}>{m?.active_courses ?? 0}</Text>
          <Text style={styles.metricLabel}>Kelas Aktif</Text>
        </Card>
        <Card style={styles.metric} testID="metric-completion">
          <Icon name="checkmark-circle-outline" size={20} color={colors.brandPrimary} />
          <Text style={styles.metricValue}>{m?.completion_rate ?? 0}%</Text>
          <Text style={styles.metricLabel}>Rata-Rata Kelulusan</Text>
        </Card>
        <Card style={styles.metric} testID="metric-reviews">
          <Icon name="chatbubbles-outline" size={20} color={colors.brandPrimary} />
          <Text style={styles.metricValue}>{m?.pending_reviews ?? 0}</Text>
          <Text style={styles.metricLabel}>Topik Diskusi</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Aktivitas Terbaru</Text>
      <Card style={{ padding: spacing.md }}>
        {recent.length === 0 ? (
          <EmptyState
            icon="pulse-outline"
            title="Belum ada aktivitas"
            description="Aktivitas siswa dan hasil ujian akan otomatis tercatat di sini."
          />
        ) : (
          recent.map((a, i) => (
            <View
              key={a.id || i}
              style={[
                styles.activityRow,
                i === recent.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.activityIcon}>
                <Icon name="checkmark-outline" size={16} color={colors.brandPrimary} />
              </View>
              <View style={styles.activityBody}>
                <Text style={styles.activityLabel}>{a.label}</Text>
                <Text style={styles.activityTime}>{formatRelative(a.at)}</Text>
              </View>
            </View>
          ))
        )}
      </Card>

      <Button
        label="Keluar dari Admin"
        variant="outline"
        onPress={() => setShowLogout(true)}
        fullWidth
        style={styles.logout}
        testID="logout-button"
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
