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
  ebp: { icon: "clipboard-outline", color: "#0F172A", bg: "#F1F5F9" },
  imk: { icon: "phone-portrait-outline", color: "#0F172A", bg: "#F1F5F9" },
  pmo: { icon: "hardware-chip-outline", color: "#0F172A", bg: "#F1F5F9" },
  pvi: { icon: "desktop-outline", color: "#0F172A", bg: "#F1F5F9" },
  std: { icon: "git-network-outline", color: "#0F172A", bg: "#F1F5F9" },
};

const DEFAULT_CONFIG = { icon: "book-outline" as IoniconName, color: "#0F172A", bg: "#F1F5F9" };

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
  card: {
    marginBottom: spacing.md,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  cardPressable: {
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any) : {}),
  },
  cardMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  name: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.onSurface,
  },
  meta: {
    color: colors.muted,
    fontSize: typography.size.sm,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  track: {
    flex: 1,
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
  progressText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.muted,
    minWidth: 32,
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
          icon="alert-circle-outline"
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
            style={({ pressed }) => [styles.cardPressable, pressed && { opacity: 0.85 }]}
            testID={`course-card-${s.id}`}
          >
            <Card style={styles.card}>
              <View style={styles.cardMainRow}>
                <View style={[styles.iconWrap, { backgroundColor: conf.bg }]}>
                  <Icon name={conf.icon} size={22} color={conf.color} />
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
                <Icon name="chevron-forward" size={18} color={colors.muted} />
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
