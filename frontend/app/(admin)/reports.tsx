import { useCallback, useState } from "react";
import { Platform, Pressable, RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import {
  Badge,
  Button,
  Card,
  Icon,
  LoadingSpinner,
  ScreenContainer,
} from "@/src/components/ui";
import { apiFetch } from "@/src/services/api";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import { formatRelative } from "@/src/utils/datetime";

interface TestReport {
  id: string;
  user_name: string;
  user_email: string;
  course_title: string;
  test_type: string;
  score: number;
  total: number;
  percentage: number;
  completed_at: string;
}

const useStyles = makeStyles((colors) => ({
  header: { paddingTop: spacing.md, marginBottom: spacing.lg, gap: 2 },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  subtitle: { color: colors.muted, fontSize: typography.size.base },

  exportCard: {
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  exportTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.onSurface,
  },
  exportSub: {
    fontSize: typography.size.xs,
    color: colors.muted,
  },

  reportCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  studentName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.onSurface,
  },
  courseLabel: {
    fontSize: typography.size.sm,
    color: colors.onSurfaceTertiary,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaText: {
    fontSize: typography.size.xs,
    color: colors.muted,
  },
  scoreText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.brandPrimary,
  },
}));

export default function AdminReportsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();

  const [reports, setReports] = useState<TestReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(() => {
    apiFetch<{ reports: TestReport[] }>("/dashboard/admin/reports")
      .then((res) => setReports(res.reports || []))
      .catch(() => setReports([]))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  if (loading) {
    return <LoadingSpinner fullScreen label="Memuat laporan..." />;
  }

  return (
    <ScreenContainer
      scroll
      testID="admin-reports"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Laporan Evaluasi</Text>
        <Text style={styles.subtitle}>Rekapitulasi nilai dan histori penyelesaian ujian siswa.</Text>
      </View>

      <Card style={styles.exportCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exportTitle}>Export Data Laporan</Text>
          <Text style={styles.exportSub}>Unduh riwayat nilai siswa dalam format CSV</Text>
        </View>
        <Button
          label="Download CSV"
          variant="outline"
          onPress={() => alert("Mengunduh laporan rekapitulasi nilai siswa (CSV)...")}
          leftIcon={<Icon name="download-outline" size={16} color={colors.onSurface} />}
        />
      </Card>

      {reports.map((r) => (
        <Card key={r.id} style={styles.reportCard}>
          <View style={styles.topRow}>
            <Text style={styles.studentName}>{r.user_name}</Text>
            <Badge
              label={r.test_type === "post_test" ? "Post-Test" : "Pre-Test"}
              tone={r.test_type === "post_test" ? "brand" : "neutral"}
            />
          </View>
          <Text style={styles.courseLabel}>{r.course_title}</Text>
          <View style={styles.bottomRow}>
            <Text style={styles.metaText}>
              {r.score} dari {r.total} benar ({r.percentage}%) • {formatRelative(r.completed_at)}
            </Text>
            <Text style={styles.scoreText}>Nilai: {r.percentage}</Text>
          </View>
        </Card>
      ))}

      {reports.length === 0 ? (
        <Card style={{ padding: spacing.xl, alignItems: "center" }}>
          <Text style={{ color: colors.muted, fontSize: typography.size.sm }}>
            Belum ada riwayat pengerjaan ujian yang tersimpan.
          </Text>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}
