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

export default function AdminUsersScreen() {
  const styles = useStyles();
  return (
    <ScreenContainer scroll testID="admin-users">
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>Daftar siswa, admin, dan pengelolaan akses.</Text>
      </View>
      <Card>
        <EmptyState
          icon="people"
          title="Manajemen Pengguna"
          description="Tabel pengguna, filter peran, undangan, dan non-aktifkan akun akan muncul di sini."
        />
      </Card>
    </ScreenContainer>
  );
}
