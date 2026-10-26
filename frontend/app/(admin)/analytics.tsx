import { useCallback, useState } from "react";
import { Platform, RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import {
  Card,
  Icon,
  LoadingSpinner,
  ScreenContainer,
} from "@/src/components/ui";
import { apiFetch } from "@/src/services/api";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";

interface AnalyticsData {
  summary: {
    avg_score: number;
    total_attempts: number;
    pre_test_count: number;
    post_test_count: number;
  };
  course_stats: Array<{
    course_id: string;
    title: string;
    attempts: number;
    avg_score: number;
  }>;
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

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metricCard: {
    width: "47%",
    padding: spacing.md,
    gap: spacing.xs,
  },
  metricVal: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  metricLbl: {
    fontSize: typography.size.xs,
    color: colors.muted,
  },

  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  courseRow: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  courseInfo: {
    gap: 2,
    flex: 1,
  },
  courseName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.onSurface,
  },
  courseSub: {
    fontSize: typography.size.xs,
    color: colors.muted,
  },
  scoreBadge: {
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  scoreText: {
    color: colors.brandPrimary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
}));

export default function AdminAnalyticsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = useCallback(() => {
    apiFetch<AnalyticsData>("/dashboard/admin/analytics")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [loadAnalytics]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  if (loading) {
    return <LoadingSpinner fullScreen label="Memuat analitik..." />;
  }

  const s = data?.summary;

  return (
    <ScreenContainer
      scroll
      testID="admin-analytics"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analitik Pembelajaran</Text>
        <Text style={styles.subtitle}>Statistik pengerjaan ujian dan efektivitas kurikulum.</Text>
      </View>

      <View style={styles.grid}>
        <Card style={styles.metricCard}>
          <Text style={styles.metricVal}>{s?.avg_score ?? 0}%</Text>
          <Text style={styles.metricLbl}>Rata-Rata Nilai</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricVal}>{s?.total_attempts ?? 0}</Text>
          <Text style={styles.metricLbl}>Total Ujian Dikerjakan</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricVal}>{s?.pre_test_count ?? 0}</Text>
          <Text style={styles.metricLbl}>Pengerjaan Pre-Test</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricVal}>{s?.post_test_count ?? 0}</Text>
          <Text style={styles.metricLbl}>Pengerjaan Post-Test</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Performa Ujian Berdasarkan Mata Pelajaran</Text>

      {(data?.course_stats ?? []).map((cs) => (
        <Card key={cs.course_id} style={styles.courseRow}>
          <View style={styles.courseInfo}>
            <Text style={styles.courseName}>{cs.title}</Text>
            <Text style={styles.courseSub}>{cs.attempts} peserta telah menyelesaikan ujian</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>Rata-rata: {cs.avg_score}%</Text>
          </View>
        </Card>
      ))}
    </ScreenContainer>
  );
}
