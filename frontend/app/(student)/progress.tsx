import { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

interface CalendarEvent {
  id: string;
  title: string;
  dateRange: string;
  category: "Kuliah" | "Ujian" | "Administrasi" | "Libur";
  status: "Berlangsung" | "Selesai" | "Akan Datang";
  desc: string;
}

const ACADEMIC_EVENTS: CalendarEvent[] = [
  {
    id: "perkuliahan-1",
    title: "Perkuliahan Semester Gasal 2026/2027",
    dateRange: "1 September 2026 - 15 Januari 2027",
    category: "Kuliah",
    status: "Berlangsung",
    desc: "16 kali pertemuan tatap muka dan daring di PTI UNESA.",
  },
  {
    id: "krs-gasal",
    title: "Pengisian & Konsultasi KRS",
    dateRange: "20 - 31 Agustus 2026",
    category: "Administrasi",
    status: "Selesai",
    desc: "Penyusunan rencana studi bersama Dosen Penasihat Akademik (DPA).",
  },
  {
    id: "uts-gasal",
    title: "Ujian Tengah Semester (UTS)",
    dateRange: "27 Oktober - 7 November 2026",
    category: "Ujian",
    status: "Selesai",
    desc: "Pelaksanaan UTS secara serentak tatap muka di lab & kelas.",
  },
  {
    id: "pasca-uts",
    title: "Perkuliahan Pasca-UTS & Modul Proyek",
    dateRange: "10 November - 20 Desember 2026",
    category: "Kuliah",
    status: "Berlangsung",
    desc: "Penyelesaian modul praktikum, kuis, dan materi interaktif.",
  },
  {
    id: "minggu-tenang",
    title: "Minggu Tenang & Persiapan UAS",
    dateRange: "21 Desember 2026 - 3 Januari 2027",
    category: "Libur",
    status: "Akan Datang",
    desc: "Masa belajar mandiri sebelum pelaksanaan ujian akhir.",
  },
  {
    id: "uas-gasal",
    title: "Ujian Akhir Semester (UAS)",
    dateRange: "5 - 16 Januari 2027",
    category: "Ujian",
    status: "Akan Datang",
    desc: "Evaluasi capaian pembelajaran mata kuliah semester ini.",
  },
  {
    id: "khs-gasal",
    title: "Yudisium & Penerbitan KHS",
    dateRange: "18 - 30 Januari 2027",
    category: "Administrasi",
    status: "Akan Datang",
    desc: "Penginputan nilai akhir oleh dosen pengampu dan cetak KHS.",
  },
];

const useStyles = makeStyles((colors) => ({
  header: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: typography.weight.bold,
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.size.sm,
  },

  // Switcher tab
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#141721",
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "#202534",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: colors.brandPrimary,
  },
  tabButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.muted,
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: typography.weight.bold,
  },

  // Semester Banner
  semesterBanner: {
    backgroundColor: "#141721",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "#202534",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: "#FFFFFF",
  },
  bannerSub: {
    fontSize: typography.size.xs,
    color: colors.muted,
    marginTop: 2,
  },

  // Event Card
  eventCard: {
    backgroundColor: "#141721",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#202534",
    gap: spacing.xs,
  },
  eventTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: "#1B1F2C",
  },
  categoryText: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
    color: "#93C5FD",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusBerlangsung: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  statusSelesai: {
    backgroundColor: "rgba(100, 116, 139, 0.2)",
  },
  statusMendatang: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
  },
  statusText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },
  statusTextBerlangsung: {
    color: "#4ADE80",
  },
  statusTextSelesai: {
    color: "#94A3B8",
  },
  statusTextMendatang: {
    color: "#60A5FA",
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: typography.weight.bold,
    color: "#FFFFFF",
    lineHeight: 20,
  },
  eventDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  eventDateText: {
    fontSize: typography.size.xs,
    color: "#CBD5E1",
    fontWeight: typography.weight.medium,
  },
  eventDescText: {
    fontSize: typography.size.xs,
    color: colors.muted,
    lineHeight: 18,
    marginTop: 4,
  },

  // Bento Metrics
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metricCard: {
    width: "47%",
    backgroundColor: "#141721",
    borderColor: "#202534",
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },

  sectionHeader: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },

  // Course Card
  courseCard: {
    backgroundColor: "#141721",
    borderRadius: radius.lg,
    borderColor: "#202534",
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
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
    fontWeight: typography.weight.semibold,
    color: "#FFFFFF",
    flex: 1,
    marginRight: spacing.sm,
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: "#1B1F2C",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: "#F97316",
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
    color: "#FFFFFF",
    fontWeight: typography.weight.bold,
    fontSize: typography.size.xs,
  },

  // Leaderboard
  leaderCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#1B1F2C",
  },
  leaderCurrent: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1B1F2C",
  },
  rankBadgeTop1: { backgroundColor: "rgba(234, 179, 8, 0.25)" },
  rankBadgeTop2: { backgroundColor: "rgba(148, 163, 184, 0.25)" },
  rankBadgeTop3: { backgroundColor: "rgba(249, 115, 22, 0.25)" },
  rankText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: "#FFFFFF",
  },
  leaderInfo: {
    flex: 1,
    gap: 2,
  },
  leaderName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: "#FFFFFF",
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
    color: "#60A5FA",
  },
  pointsLabel: {
    fontSize: 10,
    color: colors.muted,
  },

  // Badges
  badgeCard: {
    backgroundColor: "#141721",
    borderRadius: radius.lg,
    borderColor: "#202534",
    borderWidth: 1,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  badgeLocked: {
    opacity: 0.45,
  },
  badgeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: "#1B1F2C",
    borderWidth: 1,
    borderColor: "#202534",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeBody: { flex: 1, gap: 2 },
  badgeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: "#FFFFFF",
  },
  badgeDesc: {
    color: colors.muted,
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
}));

export default function CalendarProgressScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"kalender" | "progres">("kalender");
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
        apiFetch<{ leaderboard: LeaderboardUser[] }>("/dashboard/leaderboard").catch(() => ({
          leaderboard: [],
        })),
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
    return <LoadingSpinner fullScreen label="Memuat kalender & statistik..." />;
  }

  const totalCourses = courses.length;
  const completedPreTests = courses.filter((c) => c.pre_test_completed).length;
  const avgProgress =
    totalCourses > 0
      ? Math.round(courses.reduce((acc, cur) => acc + (cur.progress || 0), 0) / totalCourses)
      : 0;

  const badges: BadgeItem[] = [
    {
      id: "first_step",
      title: "Langkah Pertama",
      description: "Menyelesaikan Pre-Test pertamamu di PTI UNESA.",
      icon: "ribbon-outline",
      unlocked: completedPreTests >= 1,
    },
    {
      id: "streak_starter",
      title: "Penjelajah Ilmu",
      description: "Menyelesaikan Pre-Test pada minimal 2 mata kuliah.",
      icon: "flame-outline",
      unlocked: completedPreTests >= 2,
    },
    {
      id: "master_pretest",
      title: "Kolektor Modul",
      description: "Menyelesaikan semua Pre-Test mata kuliah aktif.",
      icon: "trophy-outline",
      unlocked: completedPreTests === totalCourses && totalCourses > 0,
    },
    {
      id: "star_student",
      title: "Bintang Akademik",
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
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.brandPrimary}
        />
      }
    >
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Kalender & Progres</Text>
        <Text style={styles.subtitle}>
          Agenda perkuliahan dan statistik belajar mahasiswa
        </Text>
      </View>

      {/* Switcher Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabButton, activeTab === "kalender" && styles.tabButtonActive]}
          onPress={() => setActiveTab("kalender")}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "kalender" && styles.tabButtonTextActive,
            ]}
          >
            Agenda Semester
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === "progres" && styles.tabButtonActive]}
          onPress={() => setActiveTab("progres")}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "progres" && styles.tabButtonTextActive,
            ]}
          >
            Progres & Prestasi
          </Text>
        </Pressable>
      </View>

      {/* Semester Context Banner */}
      <View style={styles.semesterBanner}>
        <View style={styles.bannerIconBox}>
          <Icon name="calendar" size={24} color="#60A5FA" />
        </View>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Semester Gasal 2026/2027</Text>
          <Text style={styles.bannerSub}>
            S1 Pendidikan Teknologi Informasi • UNESA
          </Text>
        </View>
      </View>

      {activeTab === "kalender" ? (
        /* KALENDER AGENDA VIEW */
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Jadwal Penting Akademik</Text>
          </View>

          {ACADEMIC_EVENTS.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventTopRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{event.category}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    event.status === "Berlangsung"
                      ? styles.statusBerlangsung
                      : event.status === "Selesai"
                      ? styles.statusSelesai
                      : styles.statusMendatang,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      event.status === "Berlangsung"
                        ? styles.statusTextBerlangsung
                        : event.status === "Selesai"
                        ? styles.statusTextSelesai
                        : styles.statusTextMendatang,
                    ]}
                  >
                    {event.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.eventTitle}>{event.title}</Text>

              <View style={styles.eventDateRow}>
                <Icon name="time-outline" size={14} color="#CBD5E1" />
                <Text style={styles.eventDateText}>{event.dateRange}</Text>
              </View>

              <Text style={styles.eventDescText}>{event.desc}</Text>
            </View>
          ))}
        </View>
      ) : (
        /* PROGRES & PRESTASI VIEW */
        <View>
          {/* Bento Grid Metrics */}
          <View style={styles.grid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Rata-rata Progres</Text>
                <Icon name="pie-chart-outline" size={16} color={colors.muted} />
              </View>
              <Text style={styles.metricValue}>{avgProgress}%</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Pre-Test Selesai</Text>
                <Icon name="checkmark-circle-outline" size={16} color={colors.muted} />
              </View>
              <Text style={styles.metricValue}>
                {completedPreTests}/{totalCourses}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Streak Harian</Text>
                <Icon name="flame-outline" size={16} color={colors.muted} />
              </View>
              <Text style={styles.metricValue}>{dashData?.streak_days ?? 0} hari</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Lencana Diraih</Text>
                <Icon name="medal-outline" size={16} color={colors.muted} />
              </View>
              <Text style={styles.metricValue}>
                {badges.filter((b) => b.unlocked).length}/{badges.length}
              </Text>
            </View>
          </View>

          {/* Course Progress Breakdown */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kemajuan Tiap Mata Kuliah</Text>
          </View>

          {courses.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/course/${c.id}`)}
              testID={`progress-course-${c.id}`}
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <View style={styles.courseCard}>
                <View style={styles.courseTopRow}>
                  <Text style={styles.courseTitle} numberOfLines={1}>
                    {c.title}
                  </Text>
                  <Badge
                    label={c.pre_test_completed ? "Aktif" : "Perlu Pre-Test"}
                    tone={c.pre_test_completed ? "success" : "neutral"}
                  />
                </View>
                <View style={styles.track}>
                  <View
                    style={[styles.fill, { width: `${Math.min(100, c.progress || 0)}%` }]}
                  />
                </View>
                <View style={styles.courseBottomRow}>
                  <Text style={styles.courseMetaText}>
                    {c.pre_test_completed
                      ? "Modul terbuka"
                      : "Selesaikan Pre-Test untuk membuka modul"}
                  </Text>
                  <Text style={styles.coursePercentText}>{c.progress || 0}%</Text>
                </View>
              </View>
            </Pressable>
          ))}

          {/* Leaderboard Section */}
          <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
            <Text style={styles.sectionTitle}>🏆 Papan Peringkat Belajar</Text>
          </View>

          <View
            style={{
              backgroundColor: "#141721",
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: "#202534",
              marginBottom: spacing.lg,
              overflow: "hidden",
            }}
          >
            {leaderboard.length === 0 ? (
              <Text
                style={{
                  textAlign: "center",
                  color: colors.muted,
                  padding: spacing.md,
                }}
              >
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
          </View>

          {/* Gamification / Badges */}
          <View style={[styles.sectionHeader, { marginTop: spacing.sm }]}>
            <Text style={styles.sectionTitle}>Lencana & Penghargaan</Text>
          </View>

          {badges.map((b) => (
            <View
              key={b.id}
              style={[
                styles.badgeCard,
                !b.unlocked ? styles.badgeLocked : null,
              ] as any}
              testID={`badge-${b.id}`}
            >
              <View style={styles.badgeIconWrap}>
                <Icon
                  name={b.icon}
                  size={22}
                  color={b.unlocked ? "#FBBF24" : colors.muted}
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
            </View>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
