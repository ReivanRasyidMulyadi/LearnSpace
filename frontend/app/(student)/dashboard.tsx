import { useCallback, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import {
  Badge,
  Card,
  Icon,
  ScreenContainer,
} from "@/src/components/ui";
import { useAuth } from "@/src/hooks/useAuth";
import { apiFetch } from "@/src/services/api";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import type { StudentDashboardData } from "@/src/types/course";

const useStyles = makeStyles((colors) => ({
  greeting: {
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
    gap: 2,
  },
  hello: {
    color: colors.muted,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  name: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.4,
  },

  hero: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    ...shadows.cardElevated,
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "transform 0.15s ease, opacity 0.15s ease" } as any) : {}),
  },
  heroBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  heroLabel: {
    color: colors.onBrandPrimary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: colors.onBrandPrimary,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    lineHeight: 26,
    marginTop: spacing.xs,
  },
  heroCta: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  heroCtaText: {
    color: colors.onBrandPrimary,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    opacity: 0.95,
  },

  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "flex-start",
    gap: spacing.xs,
    padding: spacing.lg,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  statLabel: {
    color: colors.muted,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },

  subjectCard: {
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any) : {}),
  },
  subjectIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  subjectBody: {
    flex: 1,
    gap: 3,
  },
  subjectTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.onSurface,
  },
  subjectMeta: {
    color: colors.muted,
    fontSize: typography.size.sm,
  },
}));

export default function StudentDashboard() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<StudentDashboardData | null>(null);

  useFocusEffect(
    useCallback(() => {
      apiFetch<StudentDashboardData>("/dashboard/student")
        .then(setData)
        .catch(() => setData(null));
    }, []),
  );

  const firstName = user?.name?.split(" ")[0] ?? "Siswa";
  const cl = data?.continue_learning;
  const heroCourse = cl?.course_id ?? "math";
  const heroTitle = cl
    ? cl.next_module === "pre_test"
      ? `Mulai dengan Pre-Test ${cl.title}`
      : `Lanjut ke ${cl.next_module_title} ${cl.title}`
    : "Mulai dengan Pre-Test Matematika";
  const heroCta = cl && cl.next_module !== "pre_test" ? "Lanjutkan modul" : "Buka modul pertama";

  return (
    <ScreenContainer scroll testID="student-dashboard">
      <View style={styles.greeting}>
        <Text style={styles.hello}>Selamat datang kembali,</Text>
        <Text style={styles.name}>{firstName}</Text>
      </View>

      <Pressable
        onPress={() => router.push(`/course/${heroCourse}`)}
        testID="continue-learning-card"
        style={({ pressed }) => [pressed && { opacity: 0.95 }]}
      >
        <View style={styles.hero}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroLabel}>LANJUTKAN BELAJAR</Text>
            </View>
            <Icon name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          <View style={styles.heroCta}>
            <Icon name="play" size={16} color={colors.onBrandPrimary} />
            <Text style={styles.heroCtaText}>{heroCta}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <View style={styles.statIconWrap}>
            <Icon name="flame" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>{data?.streak_days ?? 0}</Text>
          <Text style={styles.statLabel}>Streak harian</Text>
        </Card>
        <Card style={styles.statCard}>
          <View style={styles.statIconWrap}>
            <Icon name="trophy" size={20} color="#2563EB" />
          </View>
          <Text style={styles.statValue}>{data?.badges_earned ?? 0}</Text>
          <Text style={styles.statLabel}>Badge diraih</Text>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mata Pelajaran</Text>
        <Badge label="Katalog" tone="neutral" />
      </View>

      {(data?.subjects ?? []).map((s) => (
        <Pressable
          key={s.id}
          onPress={() => router.push(`/course/${s.id}`)}
          testID={`subject-card-${s.id}`}
          style={({ pressed }) => [pressed && { opacity: 0.85 }]}
        >
          <Card style={styles.subjectCard}>
            <View style={styles.subjectIcon}>
              <Icon name="book-outline" size={20} color={colors.onSurface} />
            </View>
            <View style={styles.subjectBody}>
              <Text style={styles.subjectTitle}>{s.title}</Text>
              <Text style={styles.subjectMeta}>
                {s.pre_test_completed ? `Progres: ${s.progress}%` : "Pre-Test belum dikerjakan"}
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.muted} />
          </Card>
        </Pressable>
      ))}
    </ScreenContainer>
  );
}
