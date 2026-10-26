import { Text, View } from "react-native";
import { Card, EmptyState, ScreenContainer } from "@/src/components/ui";
import { makeStyles, spacing, typography } from "@/src/theme";

const useStyles = makeStyles((colors) => ({
  header: { paddingTop: spacing.md, marginBottom: spacing.lg },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.display,
    color: colors.onSurface,
  },
  subtitle: { color: colors.muted, fontSize: typography.size.base },
}));

export default function AdminContentScreen() {
  const styles = useStyles();
  return (
    <ScreenContainer scroll testID="admin-content">
      <View style={styles.header}>
        <Text style={styles.title}>Content Management</Text>
        <Text style={styles.subtitle}>Kelola kelas, modul, video, dan manual book.</Text>
      </View>
      <Card>
        <EmptyState
          icon="library"
          title="Konten Pembelajaran"
          description="CRUD kelas, upload PDF, video, serta pengaturan Pre/Post-Test akan muncul di sini."
        />
      </Card>
    </ScreenContainer>
  );
}
