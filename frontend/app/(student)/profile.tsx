import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

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
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";

const DETAILS_INFO: Record<string, { title: string; icon: IoniconName; content: string }> = {
  notifications: {
    title: "Notifikasi",
    icon: "notifications-outline",
    content:
      "Notifikasi aplikasi aktif. Anda akan menerima pengingat jadwal ujian, balasan diskusi di kelas, dan informasi pembaruan materi pembelajaran.",
  },
  settings: {
    title: "Pengaturan Akun",
    icon: "settings-outline",
    content:
      "Akun Anda terhubung dengan autentikasi aman Supabase. Untuk mengganti password atau memperbarui nama lengkap, silakan hubungi administrator sekolah.",
  },
  help: {
    title: "Pusat Bantuan",
    icon: "help-circle-outline",
    content:
      "Butuh bantuan belajar? Anda dapat menggunakan Forum Diskusi di tiap kelas untuk bertanya kepada guru dan teman, atau mengirim email ke support@learnspace.com.",
  },
  privacy: {
    title: "Privasi & Keamanan",
    icon: "shield-checkmark-outline",
    content:
      "Data profil dan nilai Anda terlindungi oleh enkripsi modern (bcrypt & Supabase Row Level Security). Kami tidak membagikan data Anda kepada pihak ketiga.",
  },
};

const ROWS: { icon: IoniconName; label: string; key: string }[] = [
  { icon: "notifications-outline", label: "Notifikasi", key: "notifications" },
  { icon: "settings-outline", label: "Pengaturan Akun", key: "settings" },
  { icon: "help-circle-outline", label: "Pusat Bantuan", key: "help" },
  { icon: "shield-checkmark-outline", label: "Privasi & Keamanan", key: "privacy" },
];

const useStyles = makeStyles((colors) => ({
  header: {
    alignItems: "center",
    paddingTop: spacing.xl,
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  email: {
    color: colors.muted,
    fontSize: typography.size.sm,
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    marginTop: spacing.sm,
    letterSpacing: -0.3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "background-color 0.15s ease" } as any) : {}),
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.onSurface,
  },
  logout: {
    marginTop: spacing.xl,
    borderColor: colors.border,
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
    ...(Platform.OS === "web" ? ({ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" } as any) : {}),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  modalContent: {
    fontSize: typography.size.base,
    color: colors.onSurfaceTertiary,
    lineHeight: 22,
  },
}));

export default function ProfileScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { user, logout, operation } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<{
    title: string;
    icon: IoniconName;
    content: string;
  } | null>(null);

  if (!user) return null;

  return (
    <ScreenContainer scroll testID="profile-screen">
      <View style={styles.header}>
        <Avatar name={user.name} uri={user.picture ?? null} size={80} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Badge label={user.role === "ADMIN" ? "Admin" : "Siswa"} tone="neutral" />
      </View>

      <Card padded={false}>
        {ROWS.map((r, i) => (
          <Pressable
            key={r.key}
            style={({ pressed }) => [
              styles.row,
              { paddingHorizontal: spacing.lg },
              i === ROWS.length - 1 && styles.rowLast,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setSelectedInfo(DETAILS_INFO[r.key] ?? null)}
            testID={`profile-row-${r.key}`}
          >
            <View style={styles.rowIcon}>
              <Icon name={r.icon} size={18} color={colors.onSurface} />
            </View>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Icon name="chevron-forward" size={18} color={colors.muted} />
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

      {/* Info Modal */}
      <Modal
        visible={selectedInfo !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedInfo(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedInfo(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {selectedInfo ? (
              <>
                <View style={styles.modalHeader}>
                  <Icon name={selectedInfo.icon} size={22} color={colors.onSurface} />
                  <Text style={styles.modalTitle}>{selectedInfo.title}</Text>
                </View>
                <Text style={styles.modalContent}>{selectedInfo.content}</Text>
                <Button
                  label="Mengerti"
                  variant="primary"
                  fullWidth
                  onPress={() => setSelectedInfo(null)}
                />
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <LogoutConfirmDialog
        visible={showLogout}
        loading={operation === "logout"}
        onCancel={() => setShowLogout(false)}
        onConfirm={logout}
      />
    </ScreenContainer>
  );
}
