import { useCallback, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import {
  Badge,
  Button,
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
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any) : {}),
  },
  headerText: { flex: 1, gap: 2 },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  subtitle: { color: colors.muted, fontSize: typography.size.sm },

  progressCard: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    color: colors.onSurface,
    fontWeight: typography.weight.medium,
    fontSize: typography.size.sm,
  },
  progressValue: {
    color: colors.onSurface,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.base,
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
  gateHint: {
    color: colors.muted,
    fontSize: typography.size.xs,
  },

  moduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any) : {}),
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconLocked: {
    backgroundColor: colors.surfaceTertiary,
    borderColor: colors.border,
  },
  iconDone: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  moduleBody: { flex: 1, gap: 2 },
  moduleTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  moduleTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.onSurface,
  },
  moduleDescription: { color: colors.muted, fontSize: typography.size.xs },
  locked: { opacity: 0.5 },
  hint: {
    color: colors.muted,
    fontSize: typography.size.sm,
    textAlign: "center",
    marginVertical: spacing.md,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" } as any)
      : {}),
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  modalMessage: {
    fontSize: typography.size.base,
    color: colors.onSurfaceTertiary,
    lineHeight: 22,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
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
  const [lockedModalModule, setLockedModalModule] = useState<CourseModuleState | null>(null);

  const load = useCallback(() => {
    setError(null);
    testsService
      .getCourseProgress(courseId)
      .then(setProgress)
      .catch(() => setError("Kelas tidak ditemukan atau gagal dimuat."));
  }, [courseId]);

  useFocusEffect(
    useCallback(() => {
      if (courseId) load();
    }, [courseId, load]),
  );

  const openModule = (m: CourseModuleState) => {
    if (m.key === "pre_test") {
      router.push(`/course/${courseId}/pre-test`);
      return;
    }
    if (m.locked) {
      setLockedModalModule(m);
      return;
    }
    if (m.key === "discussion") {
      router.push(`/course/${courseId}/discussion`);
      return;
    }
    router.push(`/course/${courseId}/module/${m.key}`);
  };

  if (error) {
    return (
      <ScreenContainer testID="course-detail">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="course-back">
            <Icon name="arrow-back" size={18} color={colors.onSurface} />
          </Pressable>
        </View>
        <EmptyState icon="alert-circle-outline" title="Ups" description={error} actionLabel="Coba lagi" onAction={load} />
      </ScreenContainer>
    );
  }

  if (!progress) return <LoadingSpinner fullScreen label="Memuat kelas..." />;

  return (
    <ScreenContainer scroll testID="course-detail">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="course-back">
          <Icon name="arrow-back" size={18} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>{progress.title}</Text>
          <Text style={styles.subtitle}>Alur belajar lengkap</Text>
        </View>
      </View>

      <Card style={styles.progressCard} testID="course-progress-card">
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
        <Pressable
          key={m.key}
          onPress={() => openModule(m)}
          testID={`module-${m.key}`}
          style={({ pressed }) => [pressed && { opacity: 0.85 }]}
        >
          <Card style={[styles.moduleRow, m.locked && styles.locked] as any}>
            <View style={[styles.iconWrap, m.locked && styles.iconLocked, m.completed && styles.iconDone]}>
              <Icon
                name={m.locked ? "lock-closed-outline" : m.completed ? "checkmark" : "book-outline"}
                size={20}
                color={m.locked ? colors.muted : m.completed ? "#047857" : colors.onSurface}
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
            <Icon name="chevron-forward" size={18} color={colors.muted} />
          </Card>
        </Pressable>
      ))}

      {hint ? (
        <Text style={styles.hint} testID="module-hint">
          {hint}
        </Text>
      ) : null}

      {/* Locked Module Modal */}
      <Modal
        visible={lockedModalModule !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLockedModalModule(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLockedModalModule(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Icon name="lock-closed" size={22} color={colors.brandPrimary} />
              <Text style={styles.modalTitle}>
                Modul {lockedModalModule?.title}
              </Text>
            </View>
            <Text style={styles.modalMessage}>
              Alur pembelajaran merekomendasikan menyelesaikan Pre-Test terlebih dahulu. Anda juga dapat langsung membuka modul ini untuk mempelajari materi dan mencoba fitur.
            </Text>
            <View style={styles.modalBtnRow}>
              <Button
                label="Langsung Buka"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => {
                  const target = lockedModalModule;
                  setLockedModalModule(null);
                  if (target) {
                    if (target.key === "discussion") {
                      router.push(`/course/${courseId}/discussion`);
                    } else {
                      router.push(`/course/${courseId}/module/${target.key}`);
                    }
                  }
                }}
              />
              <Button
                label="Mulai Pre-Test"
                variant="primary"
                style={{ flex: 1 }}
                onPress={() => {
                  setLockedModalModule(null);
                  router.push(`/course/${courseId}/pre-test`);
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}
