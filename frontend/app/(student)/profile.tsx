import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  Avatar,
  Badge,
  Button,
  Card,
  Icon,
  ScreenContainer,
  type IoniconName,
} from "@/src/components/ui";
import { useAuth } from "@/src/hooks/useAuth";
import { LogoutConfirmDialog } from "@/src/components/auth/LogoutConfirmDialog";
import { makeStyles, radius, spacing, typography } from "@/src/theme";

const ROWS: { icon: IoniconName; label: string; key: string }[] = [
  { icon: "notifications", label: "Notifikasi", key: "notifications" },
  { icon: "settings", label: "Pengaturan Akun", key: "settings" },
  { icon: "help-circle", label: "Pusat Bantuan", key: "help" },
  { icon: "shield-checkmark", label: "Privasi & Keamanan", key: "privacy" },
];

const useStyles = makeStyles((colors) => ({
  header: {
    alignItems: "center",
    paddingTop: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  email: { color: colors.muted, fontSize: typography.size.base },
  name: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.display,
    color: colors.onSurface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: typography.size.lg, color: colors.onSurface },
  logout: { marginTop: spacing.xl },
}));

export default function ProfileScreen() {
  const styles = useStyles();
  const { user, logout, operation } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  if (!user) return null;
  return (
    <ScreenContainer scroll testID="profile-screen">
      <View style={styles.header}>
        <Avatar name={user.name} uri={user.picture ?? null} size={88} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Badge label={user.role === "ADMIN" ? "Admin" : "Siswa"} tone="brand" />
      </View>

      <Card padded={false}>
        {ROWS.map((r, i) => (
          <Pressable
            key={r.key}
            style={[styles.row, { paddingHorizontal: spacing.lg }]}
            testID={`profile-row-${r.key}`}
          >
            <View style={styles.rowIcon}>
              <Icon name={r.icon} size={20} color="#D94A38" />
            </View>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Icon name="chevron-forward" size={20} color="#8A8A8E" />
          </Pressable>
        ))}
      </Card>

      <Button
        label="Keluar"
        variant="outline"
        onPress={() => setShowLogout(true)}
        fullWidth
        style={styles.logout}
        testID="logout-button"
      />
      <LogoutConfirmDialog
        visible={showLogout}
        loading={operation === "logout"}
        onCancel={() => setShowLogout(false)}
        onConfirm={logout}
      />
    </ScreenContainer>
  );
}
