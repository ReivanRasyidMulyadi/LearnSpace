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
    icon: "notifications",
    content:
      "Notifikasi aplikasi aktif. Anda akan menerima pengingat jadwal ujian, balasan diskusi di kelas, dan informasi pembaruan materi pembelajaran.",
  },
  settings: {
    title: "Pengaturan Akun",
    icon: "settings",
    content:
      "Akun Anda terhubung dengan autentikasi aman Supabase. Untuk mengganti password atau memperbarui nama lengkap, silakan hubungi administrator sekolah.",
  },
  help: {
    title: "Pusat Bantuan",
    icon: "help-circle",
    content:
      "Butuh bantuan belajar? Anda dapat menggunakan Forum Diskusi di tiap kelas untuk bertanya kepada guru dan teman, atau mengirim email ke support@learnspace.com.",
  },
  privacy: {
    title: "Privasi & Keamanan",
    icon: "shield-checkmark",
    content:
      "Data profil dan nilai Anda terlindungi oleh enkripsi modern (bcrypt & Supabase Row Level Security). Kami tidak membagikan data Anda kepada pihak ketiga.",
  },
};

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
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
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
            onPress={() => setSelectedInfo(DETAILS_INFO[r.key] ?? null)}
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
                  <Icon name={selectedInfo.icon} size={24} color={colors.brandPrimary} />
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
