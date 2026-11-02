import { useCallback, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { Avatar, Button, Card, Icon, ScreenContainer, type IoniconName } from "@/src/components/ui";
import { useAuth } from "@/src/hooks/useAuth";
import { apiFetch } from "@/src/services/api";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import type { StudentDashboardData } from "@/src/types/course";

interface ServiceMenuItem {
  id: string;
  label: string;
  icon: IoniconName;
  color: string;
  bgColor: string;
  action?: () => void;
  description: string;
}

const useStyles = makeStyles((colors) => ({
  container: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // 1. Top Hero Banner (Matches Screenshot 3)
  heroBanner: {
    borderRadius: radius.lg,
    backgroundColor: "#0A244E",
    borderWidth: 1,
    borderColor: "#1E3A8A",
    overflow: "hidden",
    position: "relative",
    marginTop: spacing.xs,
  },
  heroBannerGlow1: {
    position: "absolute",
    right: -20,
    top: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(37, 99, 235, 0.22)",
  },
  heroBannerGlow2: {
    position: "absolute",
    right: 60,
    bottom: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.xl,
  },
  heroLeft: {
    flex: 1,
    gap: 4,
  },
  greetingText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  nameTitle: {
    fontSize: 28,
    fontWeight: typography.weight.bold,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  nameFullSub: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    overflow: "hidden",
  },

  // 2. Academic Summary Card (Matches Screenshot 3)
  academicCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  academicTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  academicLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  academicLabel: {
    color: colors.onSurfaceTertiary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  academicValueRight: {
    color: colors.onSurface,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  academicColsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  academicCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  academicDividerVertical: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  academicColIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(37, 99, 235, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  academicStatNum: {
    fontSize: 20,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    lineHeight: 22,
  },
  academicStatLabel: {
    color: colors.muted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },

  // 3. Layanan Akademik 4x2 Grid (Matches Screenshot 3)
  sectionTitle: {
    fontSize: 18,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  servicesGridCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.lg,
  },
  serviceItem: {
    width: "25%",
    alignItems: "center",
    gap: spacing.xs,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  serviceIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  serviceLabel: {
    color: colors.onSurfaceSecondary,
    fontSize: 11,
    fontWeight: typography.weight.medium,
    textAlign: "center",
    lineHeight: 14,
  },

  // 4. Jadwal Hari Ini Section (Matches Screenshot 3)
  jadwalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  jadwalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dayBadge: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  dayBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },
  linkSemua: {
    color: "#3B82F6",
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },

  // Course Card
  courseCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any) : {}),
  },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusBadgeText: {
    color: colors.onSurfaceSecondary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  courseTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    lineHeight: 22,
  },
  sksBadge: {
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  sksBadgeText: {
    color: "#60A5FA",
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    color: colors.onSurfaceTertiary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  progressWrap: {
    gap: 8,
    paddingTop: 2,
  },
  progressHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: colors.onSurfaceTertiary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  progressPercent: {
    color: "#93C5FD",
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  progressTrack: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: "#F97316", // Orange line as shown in screenshot
  },

  // Service Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 13, 20, 0.75)",
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
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  modalDesc: {
    fontSize: 14,
    color: colors.onSurfaceTertiary,
    lineHeight: 22,
  },
}));

export default function StudentDashboard() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [activeService, setActiveService] = useState<ServiceMenuItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    apiFetch<StudentDashboardData>("/dashboard/student")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Dynamic Greeting based on current time
  const currentHour = new Date().getHours();
  const greeting =
    currentHour >= 4 && currentHour < 11
      ? "Selamat Pagi"
      : currentHour >= 11 && currentHour < 15
      ? "Selamat Siang"
      : currentHour >= 15 && currentHour < 18
      ? "Selamat Sore"
      : "Selamat Malam";

  const firstName = user?.name ? user.name.split(" ")[0] : "Mahasiswa";
  const fullName = user?.name?.toUpperCase() || "MAHASISWA";

  // Layanan Akademik / Siswa
  const SERVICES: ServiceMenuItem[] = [
    {
      id: "jadwal",
      label: "Jadwal\nBelajar",
      icon: "time-outline",
      color: "#93C5FD",
      bgColor: "rgba(59, 130, 246, 0.16)",
      action: () => router.push("/courses"),
      description: "Melihat jadwal pelajaran mingguan, modul pembelajaran, dan presensi kelas.",
    },
    {
      id: "status",
      label: "Status\nSiswa",
      icon: "id-card-outline",
      color: "#FBBF24",
      bgColor: "rgba(245, 158, 11, 0.16)",
      description: "Status Siswa: AKTIF. Terdaftar pada semester berjalan dan dapat mengakses seluruh materi pembelajaran.",
    },
    {
      id: "ujian",
      label: "Jadwal\nUjian",
      icon: "calendar-outline",
      color: "#FB7185",
      bgColor: "rgba(244, 63, 94, 0.16)",
      description: "Jadwal Pre-Test dan Ujian Pembelajaran dapat diikuti pada setiap modul kelas aktif.",
    },
    {
      id: "presensi",
      label: "Presensi\nQR",
      icon: "qr-code-outline",
      color: "#34D399",
      bgColor: "rgba(16, 185, 129, 0.16)",
      action: () => router.push("/courses"),
      description: "Scan QR Code yang diberikan oleh guru/dosen untuk mencatat kehadiran secara langsung.",
    },
  ];

  const todaySubject = data?.subjects?.[0] || {
    id: "ebp",
    title: "Evaluasi Belajar dan Pembelajaran",
    progress: 0,
    pre_test_completed: false,
  };

  const totalSKS = (data?.subjects?.length || 0) * 2;
  const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const todayDay = DAYS[new Date().getDay()];

  return (
    <ScreenContainer scroll testID="student-dashboard">
      <View style={styles.container}>
        {/* 1. Top Card Hero (Matches Screenshot 3) */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBannerGlow1} />
          <View style={styles.heroBannerGlow2} />
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <Text style={styles.greetingText}>{greeting}</Text>
              <Text style={styles.nameTitle}>{firstName}</Text>
              <Text style={styles.nameFullSub}>{fullName}</Text>
              <View style={styles.heroBadge}>
                <Icon name="school" size={13} color="#FFFFFF" />
                <Text style={styles.heroBadgeText}>Siswa</Text>
              </View>
            </View>

            {/* Circular Avatar */}
            <View style={styles.avatarWrap}>
              <Avatar name={fullName} size={60} />
            </View>
          </View>
        </View>

        {/* 2. Academic Summary Card (Matches Screenshot 3) */}
        <View style={styles.academicCard}>
          <View style={styles.academicTopRow}>
            <View style={styles.academicLeftRow}>
              <Icon name="calendar-outline" size={18} color="#3B82F6" />
              <Text style={styles.academicLabel}>Semester Aktif</Text>
            </View>
            <Text style={styles.academicValueRight}>Semester Aktif</Text>
          </View>

          <View style={styles.academicColsRow}>
            <View style={styles.academicCol}>
              <View style={styles.academicColIcon}>
                <Icon name="school-outline" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.academicStatNum}>{totalSKS}</Text>
                <Text style={styles.academicStatLabel}>Total SKS</Text>
              </View>
            </View>

            <View style={styles.academicDividerVertical} />

            <View style={styles.academicCol}>
              <View style={styles.academicColIcon}>
                <Icon name="book-outline" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.academicStatNum}>{data?.subjects?.length || 5}</Text>
                <Text style={styles.academicStatLabel}>Mata Kuliah</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Layanan Akademik (Matches Screenshot 3 4x2 Grid) */}
        <Text style={styles.sectionTitle}>Layanan Akademik</Text>
        <View style={styles.servicesGridCard}>
          <View style={styles.servicesGrid}>
            {SERVICES.map((s) => (
              <Pressable
                key={s.id}
                style={styles.serviceItem}
                onPress={() => {
                  if (s.action) {
                    s.action();
                  } else {
                    setActiveService(s);
                  }
                }}
              >
                <View style={[styles.serviceIconBox, { backgroundColor: s.bgColor }]}>
                  <Icon name={s.icon} size={22} color={s.color} />
                </View>
                <Text style={styles.serviceLabel}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 4. Jadwal Hari Ini (Matches Screenshot 3) */}
        <View style={styles.jadwalHeaderRow}>
          <View style={styles.jadwalTitleRow}>
            <Text style={styles.sectionTitle}>Jadwal Hari Ini</Text>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>{todayDay}</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push("/courses")}>
            <Text style={styles.linkSemua}>Semua</Text>
          </Pressable>
        </View>

        {/* Today's Course Card */}
        <Pressable
          style={styles.courseCard}
          onPress={() => router.push(`/course/${todaySubject.id}`)}
          testID="today-course-card"
        >
          <View style={styles.statusBadge}>
            <Icon name={todaySubject.pre_test_completed ? "checkmark-circle" : "time-outline"} size={14} color={todaySubject.pre_test_completed ? "#10B981" : "#F97316"} />
            <Text style={styles.statusBadgeText}>{todaySubject.pre_test_completed ? "Aktif" : "Perlu Pre-Test"}</Text>
          </View>

          <View style={styles.cardTitleRow}>
            <Text style={styles.courseTitle}>{todaySubject.title}</Text>
          </View>

          <View style={styles.progressWrap}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressLabel}>Progres Pertemuan</Text>
              <Text style={styles.progressPercent}>{todaySubject.progress}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${todaySubject.progress}%` }]} />
            </View>
          </View>
        </Pressable>
      </View>

      {/* Service Detail Modal */}
      <Modal
        visible={activeService !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveService(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setActiveService(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeaderRow}>
              <View style={[styles.serviceIconBox, { backgroundColor: activeService?.bgColor, width: 44, height: 44 }]}>
                {activeService ? (
                  <Icon name={activeService.icon} size={22} color={activeService.color} />
                ) : null}
              </View>
              <Text style={styles.modalTitle}>Layanan {activeService?.label.replace("\n", " ")}</Text>
            </View>
            <Text style={styles.modalDesc}>{activeService?.description}</Text>
            <Button
              label="Tutup"
              variant="primary"
              fullWidth
              onPress={() => setActiveService(null)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}
