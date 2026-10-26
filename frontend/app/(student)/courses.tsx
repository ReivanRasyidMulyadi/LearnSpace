import { useCallback, useState } from "react";
import { Platform, Pressable, RefreshControl, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import {
  Badge,
  Card,
  EmptyState,
  Icon,
  LoadingSpinner,
  ScreenContainer,
  type IoniconName,
} from "@/src/components/ui";
import { apiFetch } from "@/src/services/api";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import type { CourseCatalogItem } from "@/src/types/course";

const SUBJECT_CONFIG: Record<string, { icon: IoniconName; color: string; bg: string }> = {
  math: { icon: "calculator", color: "#FF715B", bg: "#FDE6E2" },
  science: { icon: "flask", color: "#34C759", bg: "#E8F8EE" },
  english: { icon: "globe", color: "#007AFF", bg: "#E5F2FF" },
  history: { icon: "time", color: "#AF52DE", bg: "#F5E8FC" },
};

const DEFAULT_CONFIG = { icon: "book" as IoniconName, color: "#FF715B", bg: "#FDE6E2" };

const useStyles = makeStyles((colors) => ({
  header: { paddingTop: spacing.md, marginBottom: spacing.lg },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.display,
    color: colors.onSurface,
  },
  subtitle: { color: colors.muted, fontSize: typography.size.base },
  card: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardPressable: {
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  cardMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  name: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  meta: { color: colors.muted, fontSize: typography.size.sm },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
  },
  progressText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.muted,
    minWidth: 36,
    textAlign: "right",
  },
}));

export default function CoursesScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();

  const [courses, setCourses] = useState<CourseCatalogItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourses = useCallback(() => {
    setError(null);
    apiFetch<{ courses: CourseCatalogItem[] }>("/courses")
      .then((res) => setCourses(res.courses))
      .catch(() => setError("Gagal memuat daftar kelas. Pastikan terhubung ke internet."));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCourses();
    }, [fetchCourses]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    apiFetch<{ courses: CourseCatalogItem[] }>("/courses")
      .then((res) => setCourses(res.courses))
      .catch(() => undefined)
      .finally(() => setRefreshing(false));
  }, []);

  if (error) {
    return (
      <ScreenContainer testID="courses-screen">
        <View style={styles.header}>
          <Text style={styles.title}>Kelas</Text>
        </View>
        <EmptyState
          icon="alert-circle"
          title="Terjadi Kesalahan"
          description={error}
          actionLabel="Muat Ulang"
          onAction={fetchCourses}
        />
      </ScreenContainer>
    );
  }

  if (!courses) {
    return <LoadingSpinner fullScreen label="Memuat kelas..." />;
  }

  return (
    <ScreenContainer
      scroll
      testID="courses-screen"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Kelas</Text>
        <Text style={styles.subtitle}>Pilih mata pelajaran untuk mulai belajar.</Text>
      </View>

      {courses.map((s) => {
        const conf = SUBJECT_CONFIG[s.id] ?? DEFAULT_CONFIG;
        return (
          <Pressable
            key={s.id}
            onPress={() => router.push(`/course/${s.id}`)}
            style={styles.cardPressable}
            testID={`course-card-${s.id}`}
          >
            <Card elevated style={styles.card}>
              <View style={styles.cardMainRow}>
                <View style={[styles.iconWrap, { backgroundColor: conf.bg }]}>
                  <Icon name={conf.icon} size={24} color={conf.color} />
                </View>
                <View style={styles.body}>
                  <View style={styles.titleRow}>
                    <Text style={styles.name}>{s.title}</Text>
                    {s.pre_test_completed ? (
                      <Badge label="Pre-Test Selesai" tone="success" />
                    ) : (
                      <Badge label="Mulai Pre-Test" tone="brand" />
                    )}
                  </View>
                  <Text style={styles.meta}>{s.total_modules} modul pembelajaran</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.muted} />
              </View>

              {s.progress > 0 ? (
                <View style={styles.progressRow}>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.min(100, s.progress)}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{s.progress}%</Text>
                </View>
              ) : null}
            </Card>
          </Pressable>
        );
      })}
    </ScreenContainer>
  );
}
