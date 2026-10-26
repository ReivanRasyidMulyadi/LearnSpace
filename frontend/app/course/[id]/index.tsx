import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import {
  Badge,
  Card,
  EmptyState,
  Icon,
  LoadingSpinner,
  ScreenContainer,
  type IoniconName,
} from "@/src/components/ui";
import { testsService } from "@/src/services/tests.service";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import type { CourseModuleState, CourseProgress } from "@/src/types/test";

const useStyles = makeStyles((colors) => ({
  header: {
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.display,
    color: colors.onSurface,
  },
  subtitle: { color: colors.muted, fontSize: typography.size.base },

  progressCard: { marginBottom: spacing.lg, gap: spacing.sm },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { color: colors.onSurface, fontWeight: typography.weight.bold, fontSize: typography.size.base },
  progressValue: { color: colors.onBrandTertiary, fontWeight: typography.weight.display, fontSize: typography.size.lg },
  track: { height: 10, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.brandPrimary },
  gateHint: { color: colors.onSurfaceTertiary, fontSize: typography.size.sm },

  moduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  iconLocked: { backgroundColor: colors.surfaceTertiary },
  iconDone: { backgroundColor: colors.success },
  moduleBody: { flex: 1, gap: 2 },
  moduleTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  moduleTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  moduleDescription: { color: colors.muted, fontSize: typography.size.sm },
  locked: { opacity: 0.55 },
  hint: { color: colors.muted, fontSize: typography.size.sm, textAlign: "center", marginVertical: spacing.md },
}));

export default function CourseDetail() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const courseId = id ?? "";

  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    testsService
      .getCourseProgress(courseId)
      .then(setProgress)
      .catch(() => setError("Kelas tidak ditemukan atau gagal dimuat."));
  }, [courseId]);

  // Refetch whenever we return from the pre-test so unlock state is fresh.
  useFocusEffect(
    useCallback(() => {
      if (courseId) load();
    }, [courseId, load]),
  );

  const openModule = (m: CourseModuleState) => {
    if (m.locked) {
      setHint("Selesaikan Pre-Test terlebih dahulu untuk membuka modul ini.");
      return;
    }
    if (m.key === "pre_test") {
      router.push(`/course/${courseId}/pre-test`);
      return;
    }
    if (m.key === "discussion") {
      router.push(`/course/${courseId}/discussion`);
      return;
    }
    setHint(`Modul ${m.title} segera hadir.`);
  };

  if (error) {
    return (
      <ScreenContainer testID="course-detail">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="course-back">
            <Icon name="arrow-back" size={20} color={colors.onSurface} />
          </Pressable>
        </View>
        <EmptyState icon="alert-circle" title="Ups" description={error} actionLabel="Coba lagi" onAction={load} />
      </ScreenContainer>
    );
  }

  if (!progress) return <LoadingSpinner fullScreen label="Memuat kelas..." />;

  return (
    <ScreenContainer scroll testID="course-detail">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="course-back">
          <Icon name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>{progress.title}</Text>
          <Text style={styles.subtitle}>Alur belajar lengkap</Text>
        </View>
      </View>

      <Card tone="brandTertiary" style={styles.progressCard} testID="course-progress-card">
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>
            {progress.completed_count} dari {progress.total_modules} modul selesai
          </Text>
          <Text style={styles.progressValue}>{progress.progress_percent}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress.progress_percent}%` }]} />
        </View>
        {!progress.pre_test_completed ? (
          <Text style={styles.gateHint}>Kerjakan Pre-Test untuk membuka semua modul.</Text>
        ) : null}
      </Card>

      {progress.modules.map((m) => (
        <Pressable key={m.key} onPress={() => openModule(m)} testID={`module-${m.key}`}>
          <Card elevated style={[styles.moduleRow, m.locked && styles.locked] as any}>
            <View style={[styles.iconWrap, m.locked && styles.iconLocked, m.completed && styles.iconDone]}>
              <Icon
                name={m.locked ? "lock-closed" : m.completed ? "checkmark" : (m.icon as IoniconName)}
                size={22}
                color={m.locked ? colors.muted : m.completed ? colors.onSuccess : colors.onBrandTertiary}
              />
            </View>
            <View style={styles.moduleBody}>
              <View style={styles.moduleTitleRow}>
                <Text style={styles.moduleTitle}>{m.title}</Text>
                {m.completed ? <Badge label="Selesai" tone="success" /> : null}
                {!m.locked && !m.completed && m.key === progress.next_module ? (
                  <Badge label="Lanjutkan" tone="brand" />
                ) : null}
              </View>
              <Text style={styles.moduleDescription}>{m.description}</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.muted} />
          </Card>
        </Pressable>
      ))}

      {hint ? (
        <Text style={styles.hint} testID="module-hint">
          {hint}
        </Text>
      ) : null}
    </ScreenContainer>
  );
}
