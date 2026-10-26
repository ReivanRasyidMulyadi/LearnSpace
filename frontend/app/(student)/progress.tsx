import { useCallback, useState } from "react";
import { Platform, Pressable, RefreshControl, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import {
  Badge,
  Card,
  Icon,
  LoadingSpinner,
  ScreenContainer,
  type IoniconName,
} from "@/src/components/ui";
import { apiFetch } from "@/src/services/api";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import type { CourseCatalogItem, StudentDashboardData } from "@/src/types/course";

interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: IoniconName;
  unlocked: boolean;
}

const useStyles = makeStyles((colors) => ({
  header: { paddingTop: spacing.md, marginBottom: spacing.lg },
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
  metricCard: {
    width: "47%",
    gap: spacing.xs,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricValue: {
    fontSize: typography.size.display,
    fontWeight: typography.weight.display,
    color: colors.onSurface,
  },
  metricLabel: { color: colors.muted, fontSize: typography.size.sm },

  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },

  courseCard: {
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  courseTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  courseTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
  },
  courseBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  courseMetaText: {
    color: colors.muted,
    fontSize: typography.size.sm,
  },
  coursePercentText: {
    color: colors.brandPrimary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },

  badgeCard: {
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  badgeLocked: {
    opacity: 0.6,
  },
  badgeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeBody: { flex: 1, gap: 2 },
  badgeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  badgeTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  badgeDesc: {
    color: colors.muted,
    fontSize: typography.size.sm,
  },
}));

export default function ProgressScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [dashData, setDashData] = useState<StudentDashboardData | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [cRes, dRes] = await Promise.all([
        apiFetch<{ courses: CourseCatalogItem[] }>("/courses"),
        apiFetch<StudentDashboardData>("/dashboard/student"),
      ]);
      setCourses(cRes.courses ?? []);
      setDashData(dRes);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return <LoadingSpinner fullScreen label="Memuat progres..." />;
  }

  // Calculate statistics
  const totalCourses = courses.length;
  const completedPreTests = courses.filter((c) => c.pre_test_completed).length;
  const avgProgress =
    totalCourses > 0
      ? Math.round(courses.reduce((acc, cur) => acc + (cur.progress || 0), 0) / totalCourses)
      : 0;

  // Badges system
  const badges: BadgeItem[] = [
    {
      id: "first_step",
      title: "Langkah Pertama",
      description: "Menyelesaikan Pre-Test pertamamu di LearnSpace.",
      icon: "ribbon",
      unlocked: completedPreTests >= 1,
    },
    {
      id: "streak_starter",
      title: "Penjelajah Ilmu",
      description: "Menyelesaikan Pre-Test pada minimal 2 mata pelajaran.",
      icon: "flame",
      unlocked: completedPreTests >= 2,
    },
    {
      id: "master_pretest",
      title: "Kolektor Modul",
      description: "Menyelesaikan semua Pre-Test mata pelajaran.",
      icon: "trophy",
      unlocked: completedPreTests === totalCourses && totalCourses > 0,
    },
    {
      id: "star_student",
      title: "Bintang Belajar",
      description: "Mencapai progres rata-rata di atas 50%.",
      icon: "star",
      unlocked: avgProgress >= 50,
    },
  ];

  return (
    <ScreenContainer
      scroll
      testID="progress-screen"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Statistik Belajar</Text>
        <Text style={styles.subtitle}>Pantau kemajuan dan pencapaian belajarmu.</Text>
      </View>

      {/* Bento Grid Metrics */}
      <View style={styles.grid}>
        <Card tone="tertiary" style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Rata-rata Progres</Text>
            <Icon name="pie-chart" size={18} color="#FF715B" />
          </View>
          <Text style={styles.metricValue}>{avgProgress}%</Text>
        </Card>

        <Card tone="tertiary" style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Pre-Test Selesai</Text>
            <Icon name="checkmark-done-circle" size={18} color="#34C759" />
          </View>
          <Text style={styles.metricValue}>
            {completedPreTests}/{totalCourses}
          </Text>
        </Card>

        <Card tone="tertiary" style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Streak Harian</Text>
            <Icon name="flame" size={18} color="#FF9500" />
          </View>
          <Text style={styles.metricValue}>{dashData?.streak_days ?? 0} hari</Text>
        </Card>

        <Card tone="tertiary" style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Lencana Diraih</Text>
            <Icon name="medal" size={18} color="#AF52DE" />
          </View>
          <Text style={styles.metricValue}>
            {badges.filter((b) => b.unlocked).length}/{badges.length}
          </Text>
        </Card>
      </View>

      {/* Course Progress Breakdown */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Kemajuan Tiap Kelas</Text>
      </View>

      {courses.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => router.push(`/course/${c.id}`)}
          testID={`progress-course-${c.id}`}
        >
          <Card elevated style={styles.courseCard}>
            <View style={styles.courseTopRow}>
              <Text style={styles.courseTitle}>{c.title}</Text>
              <Badge
                label={c.pre_test_completed ? "Aktif" : "Perlu Pre-Test"}
                tone={c.pre_test_completed ? "success" : "neutral"}
              />
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min(100, c.progress || 0)}%` }]} />
            </View>
            <View style={styles.courseBottomRow}>
              <Text style={styles.courseMetaText}>
                {c.pre_test_completed ? "Modul terbuka" : "Selesaikan Pre-Test untuk membuka modul"}
              </Text>
              <Text style={styles.coursePercentText}>{c.progress || 0}%</Text>
            </View>
          </Card>
        </Pressable>
      ))}

      {/* Gamification / Badges */}
      <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
        <Text style={styles.sectionTitle}>Lencana & Penghargaan</Text>
      </View>

      {badges.map((b) => (
        <Card
          key={b.id}
          elevated
          style={[styles.badgeCard, !b.unlocked ? styles.badgeLocked : null] as any}
          testID={`badge-${b.id}`}
        >
          <View
            style={[
              styles.badgeIconWrap,
              { backgroundColor: b.unlocked ? colors.brandTertiary : colors.surfaceTertiary },
            ]}
          >
            <Icon
              name={b.icon}
              size={24}
              color={b.unlocked ? colors.brandPrimary : colors.muted}
            />
          </View>
          <View style={styles.badgeBody}>
            <View style={styles.badgeTitleRow}>
              <Text style={styles.badgeTitle}>{b.title}</Text>
              <Badge
                label={b.unlocked ? "Tercapai" : "Terkunci"}
                tone={b.unlocked ? "brand" : "neutral"}
              />
            </View>
            <Text style={styles.badgeDesc}>{b.description}</Text>
          </View>
        </Card>
      ))}
    </ScreenContainer>
  );
}
