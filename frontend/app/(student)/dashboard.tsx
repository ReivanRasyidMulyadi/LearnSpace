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
import { makeStyles, radius, spacing, typography } from "@/src/theme";
import type { StudentDashboardData } from "@/src/types/course";

const useStyles = makeStyles((colors) => ({
  greeting: { marginTop: spacing.md, marginBottom: spacing.lg },
  hello: { color: colors.muted, fontSize: typography.size.base },
  name: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.display,
    color: colors.onSurface,
  },
  hero: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  heroLabel: {
    color: colors.onBrandPrimary,
    opacity: 0.9,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  heroTitle: {
    color: colors.onBrandPrimary,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.display,
  },
  heroCta: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  heroCtaText: { color: colors.onBrandPrimary, fontWeight: typography.weight.bold },
  statsRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl },
  statCard: { flex: 1, alignItems: "flex-start", gap: spacing.xs },
  statValue: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.display,
    color: colors.onSurface,
  },
  statLabel: { color: colors.muted, fontSize: typography.size.sm },
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
  },
  subjectCard: {
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  subjectBody: { flex: 1 },
  subjectTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  subjectMeta: { color: colors.muted, fontSize: typography.size.sm },
}));

export default function StudentDashboard() {
  const styles = useStyles();
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
        <Text style={styles.hello}>Halo,</Text>
        <Text style={styles.name}>{firstName} 👋</Text>
      </View>

      <Pressable
        onPress={() => router.push(`/course/${heroCourse}`)}
        testID="continue-learning-card"
      >
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>LANJUTKAN BELAJAR</Text>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          <View style={styles.heroCta}>
            <Icon name="play-circle" size={20} color="#FFFFFF" />
            <Text style={styles.heroCtaText}>{heroCta}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.statsRow}>
        <Card tone="tertiary" style={styles.statCard}>
          <Icon name="flame" size={22} color="#FF715B" />
          <Text style={styles.statValue}>{data?.streak_days ?? 0}</Text>
          <Text style={styles.statLabel}>Streak harian</Text>
        </Card>
        <Card tone="tertiary" style={styles.statCard}>
          <Icon name="trophy" size={22} color="#FF715B" />
          <Text style={styles.statValue}>{data?.badges_earned ?? 0}</Text>
          <Text style={styles.statLabel}>Badge diraih</Text>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mata Pelajaran</Text>
        <Badge label="Baru" tone="brand" />
      </View>

      {(data?.subjects ?? []).map((s) => (
        <Pressable
          key={s.id}
          onPress={() => router.push(`/course/${s.id}`)}
          testID={`subject-card-${s.id}`}
        >
          <Card style={styles.subjectCard} elevated>
            <View style={styles.subjectIcon}>
              <Icon name="library" size={22} color="#D94A38" />
            </View>
            <View style={styles.subjectBody}>
              <Text style={styles.subjectTitle}>{s.title}</Text>
              <Text style={styles.subjectMeta}>
                {s.pre_test_completed ? `Progres: ${s.progress}%` : "Pre-Test belum dikerjakan"}
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#8A8A8E" />
          </Card>
        </Pressable>
      ))}
    </ScreenContainer>
  );
}
