import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Card, EmptyState, Icon, ScreenContainer } from "@/src/components/ui";
import { makeStyles, radius, spacing, typography } from "@/src/theme";
import { Pressable } from "react-native";

const SUBJECTS = [
  { id: "math", title: "Matematika", lessons: 12 },
  { id: "science", title: "IPA", lessons: 10 },
  { id: "english", title: "Bahasa Inggris", lessons: 8 },
  { id: "history", title: "Sejarah", lessons: 6 },
];

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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  name: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  meta: { color: colors.muted, fontSize: typography.size.sm },
}));

export default function CoursesScreen() {
  const styles = useStyles();
  const router = useRouter();
  return (
    <ScreenContainer scroll testID="courses-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Kelas</Text>
        <Text style={styles.subtitle}>Pilih mata pelajaran untuk mulai belajar.</Text>
      </View>

      {SUBJECTS.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => router.push(`/course/${s.id}`)}
          testID={`course-card-${s.id}`}
        >
          <Card elevated style={styles.card}>
            <View style={styles.iconWrap}>
              <Icon name="book" size={24} color="#D94A38" />
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>{s.title}</Text>
              <Text style={styles.meta}>{s.lessons} modul</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#8A8A8E" />
          </Card>
        </Pressable>
      ))}
    </ScreenContainer>
  );
}
