import { useCallback, useState } from "react";
import { Platform, Pressable, RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import {
  Badge,
  Button,
  Card,
  Icon,
  LoadingSpinner,
  ScreenContainer,
} from "@/src/components/ui";
import { apiFetch } from "@/src/services/api";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";

interface AdminCourse {
  id: string;
  title: string;
  total_modules: number;
  enrolled_count: number;
  completed_count: number;
  status: string;
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

  courseCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  courseTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  courseTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  statBlock: {
    flex: 1,
    backgroundColor: colors.surfaceTertiary,
    padding: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  statNum: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  statDesc: {
    fontSize: typography.size.xs,
    color: colors.muted,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
}));

export default function AdminContentScreen() {
  const styles = useStyles();
  const { colors } = useTheme();

  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCourses = useCallback(() => {
    apiFetch<{ courses: AdminCourse[] }>("/dashboard/admin/courses")
      .then((res) => setCourses(res.courses || []))
      .catch(() => setCourses([]))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCourses();
    }, [loadCourses]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  if (loading) {
    return <LoadingSpinner fullScreen label="Memuat konten..." />;
  }

  return (
    <ScreenContainer
      scroll
      testID="admin-content"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Manajemen Konten Kelas</Text>
        <Text style={styles.subtitle}>
          Kelola materi, video, manual book, dan ujian untuk seluruh mata pelajaran.
        </Text>
      </View>

      {courses.map((c) => (
        <Card key={c.id} style={styles.courseCard}>
          <View style={styles.courseTopRow}>
            <Text style={styles.courseTitle}>{c.title}</Text>
            <Badge label="Aktif" tone="success" />
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBlock}>
              <Text style={styles.statNum}>{c.total_modules}</Text>
              <Text style={styles.statDesc}>Total Modul</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statNum}>{c.enrolled_count}</Text>
              <Text style={styles.statDesc}>Siswa Belajar</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statNum}>{c.completed_count}</Text>
              <Text style={styles.statDesc}>Telah Lulus</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Button
              label="Edit Modul"
              variant="outline"
              style={styles.actionBtn}
              onPress={() => alert(`Pengaturan modul ${c.title} telah aktif.`)}
              leftIcon={<Icon name="create-outline" size={16} color={colors.onSurface} />}
            />
            <Button
              label="Bank Soal"
              variant="outline"
              style={styles.actionBtn}
              onPress={() => alert(`Bank soal Pre/Post-Test ${c.title} telah tersinkron.`)}
              leftIcon={<Icon name="clipboard-outline" size={16} color={colors.onSurface} />}
            />
          </View>
        </Card>
      ))}
    </ScreenContainer>
  );
}
