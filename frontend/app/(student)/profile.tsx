import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { LogoutConfirmDialog } from "@/src/components/auth/LogoutConfirmDialog";
import { Button, Card, Icon, ScreenContainer, type IoniconName } from "@/src/components/ui";
import { useAuth } from "@/src/hooks/useAuth";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";

const useStyles = makeStyles((colors) => ({
  pageTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    textAlign: "center",
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
  },

  // Student Identity Banner Card (Screenshot 1)
  idCard: {
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "#1E3A8A",
    backgroundColor: "#0A254D",
    position: "relative",
  },
  idCardOverlay: {
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: "rgba(10, 37, 77, 0.92)",
  },
  idCardDecoCircle1: {
    position: "absolute",
    right: -40,
    top: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(37, 99, 235, 0.18)",
  },
  idCardDecoCircle2: {
    position: "absolute",
    right: 20,
    bottom: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(59, 130, 246, 0.12)",
  },
  idCardName: {
    fontSize: 20,
    fontWeight: typography.weight.bold,
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  idCardBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563EB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  roleBadgeText: {
    color: "#FFFFFF",
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  nimBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  nimBadgeText: {
    color: "#FFFFFF",
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    letterSpacing: 0.5,
  },
  idCardProdiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  idCardProdiText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Section Headers
  sectionHeader: {
    color: colors.muted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    paddingHorizontal: spacing.xs,
  },

  // Grouped Menu List Card
  groupCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
    ...(Platform.OS === "web" ? ({ transition: "background-color 0.15s ease" } as any) : {}),
  },
  itemRowLast: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: {
    color: colors.onSurfaceTertiary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    flex: 1,
  },
  itemValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    maxWidth: "55%",
  },
  itemValue: {
    color: colors.onSurface,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    textAlign: "right",
  },

  // Logout Card Button
  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    gap: spacing.md,
    marginBottom: spacing.xxl,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  logoutIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    flex: 1,
    color: "#EF4444",
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },

  // Toast / Copy Feedback
  toastWrap: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toastText: {
    color: colors.onSurface,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
}));

export default function ProfileScreen() {
  const styles = useStyles();
  const { colors, scheme, toggleTheme } = useTheme();
  const { user, logout, operation } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!user) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const copyToClipboard = (text: string, label: string) => {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`${label} disalin ke clipboard!`);
    } else {
      Alert.alert("Tersalin", `${label}: ${text}`);
    }
  };

  const studentName = user.name || "Reivan Rasyid Mulyadi";
  const nim = "25050974182";
  const prodi = "S1 Pendidikan Teknologi Informasi";
  const email = user.email.includes("@mhs.unesa.ac.id")
    ? user.email
    : "25050974182@mhs.unesa.ac.id";

  return (
    <ScreenContainer scroll testID="profile-screen">
      <Text style={styles.pageTitle}>Profil</Text>

      {/* 1. Student Identity Banner (Matches Screenshot 1) */}
      <View style={styles.idCard} testID="student-id-banner">
        <View style={styles.idCardDecoCircle1} />
        <View style={styles.idCardDecoCircle2} />
        <View style={styles.idCardOverlay}>
          <Text style={styles.idCardName}>{studentName}</Text>
          <View style={styles.idCardBadgesRow}>
            <View style={styles.roleBadge}>
              <Icon name="school" size={14} color="#FFFFFF" />
              <Text style={styles.roleBadgeText}>
                {user.role === "ADMIN" ? "Dosen / Staff" : "Mahasiswa"}
              </Text>
            </View>
            <View style={styles.nimBadge}>
              <Text style={styles.nimBadgeText}>{nim}</Text>
            </View>
          </View>
          <View style={styles.idCardProdiRow}>
            <Icon name="business-outline" size={16} color="rgba(255, 255, 255, 0.85)" />
            <Text style={styles.idCardProdiText}>{prodi}</Text>
          </View>
        </View>
      </View>

      {/* 2. DATA AKADEMIK (Matches Screenshot 1) */}
      <Text style={styles.sectionHeader}>DATA AKADEMIK</Text>
      <View style={styles.groupCard}>
        <Pressable
          style={styles.itemRow}
          onPress={() => copyToClipboard(nim, "NIM")}
        >
          <View style={[styles.iconBox, { backgroundColor: "rgba(37, 99, 235, 0.15)" }]}>
            <Icon name="id-card-outline" size={18} color="#3B82F6" />
          </View>
          <Text style={styles.itemLabel}>NIM / NIPD</Text>
          <View style={styles.itemValueWrap}>
            <Text style={styles.itemValue}>{nim}</Text>
            <Icon name="copy-outline" size={16} color={colors.muted} />
          </View>
        </Pressable>

        <View style={styles.itemRow}>
          <View style={[styles.iconBox, { backgroundColor: "rgba(168, 85, 247, 0.15)" }]}>
            <Icon name="school-outline" size={18} color="#A855F7" />
          </View>
          <Text style={styles.itemLabel}>Program Studi</Text>
          <View style={styles.itemValueWrap}>
            <Text style={styles.itemValue} numberOfLines={2}>
              {prodi}
            </Text>
          </View>
        </View>

        <View style={[styles.itemRow, styles.itemRowLast]}>
          <View style={[styles.iconBox, { backgroundColor: "rgba(6, 182, 212, 0.15)" }]}>
            <Icon name="briefcase-outline" size={18} color="#06B6D4" />
          </View>
          <Text style={styles.itemLabel}>Peran Pengguna</Text>
          <View style={styles.itemValueWrap}>
            <Text style={styles.itemValue}>
              {user.role === "ADMIN" ? "Administrator" : "Mahasiswa"}
            </Text>
          </View>
        </View>
      </View>

      {/* 3. INFORMASI PRIBADI (Matches Screenshot 1) */}
      <Text style={styles.sectionHeader}>INFORMASI PRIBADI</Text>
      <View style={styles.groupCard}>
        <View style={styles.itemRow}>
          <View style={[styles.iconBox, { backgroundColor: "rgba(37, 99, 235, 0.15)" }]}>
            <Icon name="person-outline" size={18} color="#3B82F6" />
          </View>
          <Text style={styles.itemLabel}>Jenis Kelamin</Text>
          <View style={styles.itemValueWrap}>
            <Text style={styles.itemValue}>Laki - Laki</Text>
          </View>
        </View>

        <View style={styles.itemRow}>
          <View style={[styles.iconBox, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
            <Icon name="location-outline" size={18} color="#F59E0B" />
          </View>
          <Text style={styles.itemLabel}>Tempat Lahir</Text>
          <View style={styles.itemValueWrap}>
            <Text style={styles.itemValue}>Padang</Text>
          </View>
        </View>

        <View style={[styles.itemRow, styles.itemRowLast]}>
          <View style={[styles.iconBox, { backgroundColor: "rgba(244, 63, 94, 0.15)" }]}>
            <Icon name="calendar-outline" size={18} color="#F43F5E" />
          </View>
          <Text style={styles.itemLabel}>Tanggal Lahir</Text>
          <View style={styles.itemValueWrap}>
            <Text style={styles.itemValue}>2007-03-26</Text>
          </View>
        </View>
      </View>

      {/* 4. KONTAK & AKUN (Matches Screenshot 1) */}
      <Text style={styles.sectionHeader}>KONTAK & AKUN</Text>
      <View style={styles.groupCard}>
        <Pressable
          style={styles.itemRow}
          onPress={() => copyToClipboard(email, "Email")}
        >
          <View style={[styles.iconBox, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
            <Icon name="mail-outline" size={18} color="#10B981" />
          </View>
          <Text style={styles.itemLabel}>Email</Text>
          <View style={styles.itemValueWrap}>
            <Text style={styles.itemValue} numberOfLines={1}>
              {email}
            </Text>
            <Icon name="copy-outline" size={16} color={colors.muted} />
          </View>
        </Pressable>

        <Pressable style={[styles.itemRow, styles.itemRowLast]} onPress={toggleTheme}>
          <View style={[styles.iconBox, { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
            <Icon
              name={scheme === "dark" ? "moon" : "sunny-outline"}
              size={18}
              color={scheme === "dark" ? "#F59E0B" : colors.onSurface}
            />
          </View>
          <Text style={styles.itemLabel}>Tema Tampilan</Text>
          <View style={styles.itemValueWrap}>
            <Text style={styles.itemValue}>
              {scheme === "dark" ? "Mode Gelap" : "Mode Terang"}
            </Text>
            <Icon name="swap-horizontal-outline" size={16} color={colors.muted} />
          </View>
        </Pressable>
      </View>

      {/* 5. SESI (Matches Screenshot 1) */}
      <Text style={styles.sectionHeader}>SESI</Text>
      <Pressable
        style={styles.logoutCard}
        onPress={() => setShowLogout(true)}
        testID="logout-button"
      >
        <View style={styles.logoutIconBox}>
          <Icon name="log-out-outline" size={18} color="#EF4444" />
        </View>
        <Text style={styles.logoutText}>Keluar</Text>
        <Icon name="chevron-forward" size={18} color="#EF4444" />
      </Pressable>

      {/* Toast Notification */}
      {toastMessage ? (
        <View style={styles.toastWrap}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      <LogoutConfirmDialog
        visible={showLogout}
        loading={operation === "logout"}
        onCancel={() => setShowLogout(false)}
        onConfirm={logout}
      />
    </ScreenContainer>
  );
}
