import { useCallback, useState } from "react";
import { Platform, Pressable, RefreshControl, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import {
  Avatar,
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

interface LeaderboardUser {
  user_id: string;
  name: string;
  picture?: string | null;
  total_points: number;
  avg_score: number;
  tests_completed: number;
  is_current_user: boolean;
  rank: number;
}

interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: IoniconName;
  unlocked: boolean;
}

const useStyles = makeStyles((colors) => ({
  header: {
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
    gap: 2,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.size.base,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metricCard: {
    width: "47%",
    gap: spacing.xs,
    padding: spacing.md,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },

  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },

  courseCard: {
    marginBottom: spacing.md,
    gap: spacing.sm,
    padding: spacing.lg,
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any) : {}),
  },
  courseTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  courseTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.onSurface,
  },
  track: {
    height: 4,
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
    fontSize: typography.size.xs,
  },
  coursePercentText: {
    color: colors.onSurface,
    fontWeight: typography.weight.medium,
    fontSize: typography.size.xs,
  },

  // Leaderboard styles
  leaderCard: {
    marginBottom: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  leaderCurrent: {
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandTertiary,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  rankBadgeTop1: { backgroundColor: "#FEF3C7" },
  rankBadgeTop2: { backgroundColor: "#E2E8F0" },
  rankBadgeTop3: { backgroundColor: "#FFEDD5" },
  rankText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  leaderInfo: {
    flex: 1,
    gap: 2,
  },
  leaderName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.onSurface,
  },
  leaderMeta: {
    fontSize: typography.size.xs,
    color: colors.muted,
  },
  pointsBadge: {
    alignItems: "flex-end",
  },
  pointsText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.brandPrimary,
  },
  pointsLabel: {
    fontSize: 10,
    color: colors.muted,
  },

  badgeCard: {
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  badgeLocked: {
    opacity: 0.55,
  },
  badgeIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontWeight: typography.weight.semibold,
    color: colors.onSurface,
  },
  badgeDesc: {
    color: colors.muted,
    fontSize: typography.size.xs,
    lineHeight: 18,
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [cRes, dRes, lRes] = await Promise.all([
        apiFetch<{ courses: CourseCatalogItem[] }>("/courses"),
        apiFetch<StudentDashboardData>("/dashboard/student"),
        apiFetch<{ leaderboard: LeaderboardUser[] }>("/dashboard/leaderboard").catch(() => ({ leaderboard: [] })),
      ]);
      setCourses(cRes.courses ?? []);
      setDashData(dRes);
      setLeaderboard(lRes.leaderboard ?? []);
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
      icon: "ribbon-outline",
      unlocked: completedPreTests >= 1,
    },
    {
      id: "streak_starter",
      title: "Penjelajah Ilmu",
      description: "Menyelesaikan Pre-Test pada minimal 2 mata pelajaran.",
      icon: "flame-outline",
      unlocked: completedPreTests >= 2,
    },
    {
      id: "master_pretest",
      title: "Kolektor Modul",
      description: "Menyelesaikan semua Pre-Test mata pelajaran.",
      icon: "trophy-outline",
      unlocked: completedPreTests === totalCourses && totalCourses > 0,
    },
    {
      id: "star_student",
      title: "Bintang Belajar",
      description: "Mencapai progres rata-rata di atas 50%.",
      icon: "star-outline",
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
        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Rata-rata Progres</Text>
            <Icon name="pie-chart-outline" size={16} color={colors.muted} />
          </View>
          <Text style={styles.metricValue}>{avgProgress}%</Text>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Pre-Test Selesai</Text>
            <Icon name="checkmark-circle-outline" size={16} color={colors.muted} />
          </View>
          <Text style={styles.metricValue}>
            {completedPreTests}/{totalCourses}
          </Text>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Streak Harian</Text>
            <Icon name="flame-outline" size={16} color={colors.muted} />
          </View>
          <Text style={styles.metricValue}>{dashData?.streak_days ?? 0} hari</Text>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Lencana Diraih</Text>
            <Icon name="medal-outline" size={16} color={colors.muted} />
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
          style={({ pressed }) => [pressed && { opacity: 0.85 }]}
        >
          <Card style={styles.courseCard}>
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

      {/* Leaderboard Section */}
      <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
        <Text style={styles.sectionTitle}>🏆 Papan Peringkat Belajar</Text>
      </View>

      <Card style={{ padding: spacing.xs, marginBottom: spacing.lg }}>
        {leaderboard.length === 0 ? (
          <Text style={{ textAlign: "center", color: colors.muted, padding: spacing.md }}>
            Belum ada data peringkat. Selesaikan ujian untuk masuk peringkat!
          </Text>
        ) : (
          leaderboard.slice(0, 5).map((u) => (
            <View
              key={u.user_id}
              style={[
                styles.leaderCard,
                u.is_current_user && styles.leaderCurrent,
              ]}
            >
              <View
                style={[
                  styles.rankBadge,
                  u.rank === 1 && styles.rankBadgeTop1,
                  u.rank === 2 && styles.rankBadgeTop2,
                  u.rank === 3 && styles.rankBadgeTop3,
                ]}
              >
                <Text style={styles.rankText}>
                  {u.rank === 1 ? "🥇" : u.rank === 2 ? "🥈" : u.rank === 3 ? "🥉" : u.rank}
                </Text>
              </View>

              <Avatar name={u.name} uri={u.picture} size={36} />

              <View style={styles.leaderInfo}>
                <Text style={styles.leaderName}>
                  {u.name} {u.is_current_user ? "(Kamu)" : ""}
                </Text>
                <Text style={styles.leaderMeta}>
                  {u.tests_completed} ujian selesai • Rata-rata: {u.avg_score}%
                </Text>
              </View>

              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>{u.total_points}</Text>
                <Text style={styles.pointsLabel}>Poin</Text>
              </View>
            </View>
          ))
        )}
      </Card>

      {/* Gamification / Badges */}
      <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
        <Text style={styles.sectionTitle}>Lencana & Penghargaan</Text>
      </View>

      {badges.map((b) => (
        <Card
          key={b.id}
          style={[styles.badgeCard, !b.unlocked ? styles.badgeLocked : null] as any}
          testID={`badge-${b.id}`}
        >
          <View
            style={[
              styles.badgeIconWrap,
              { backgroundColor: b.unlocked ? colors.surfaceTertiary : colors.surfaceSecondary },
            ]}
          >
            <Icon
              name={b.icon}
              size={20}
              color={b.unlocked ? colors.onSurface : colors.muted}
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
