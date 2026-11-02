import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { Button, Card, Icon, ScreenContainer } from "@/src/components/ui";
import { apiFetch } from "@/src/services/api";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import type { CourseCatalogItem } from "@/src/types/course";

interface ScheduleItem {
  courseId: string;
  title: string;
  sks: number;
  dosen: string;
  time: string;
  room: string;
  day: string;
  status: "Selesai" | "Berlangsung" | "Akan Datang";
  hadir: number;
  totalMeetings: number;
  sakit: number;
  izin: number;
  alpha: number;
}

// shortcut: no real schedule API yet, uses course list as cards without hardcoded dosen/room
const SCHEDULE_METADATA: Record<string, Partial<ScheduleItem>> = {};

const DAYS = ["Semua", "Senin", "Selasa", "Kamis", "Jumat"];

const useStyles = makeStyles((colors) => ({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  topTitle: {
    fontSize: 22,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  bellDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },

  // Day Filter Chips
  chipsScroll: {
    marginBottom: spacing.xl,
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: 2,
  },
  dayChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any) : {}),
  },
  dayChipSelected: {
    backgroundColor: "#1D3256",
    borderColor: "#3B82F6",
  },
  dayChipText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.muted,
  },
  dayChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: typography.weight.bold,
  },

  // Course Schedule Card (Screenshot 2)
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
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

  // Kehadiran Section
  kehadiranWrap: {
    gap: 8,
    paddingTop: 4,
  },
  kehadiranHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kehadiranLabel: {
    color: colors.onSurfaceTertiary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  kehadiranPercent: {
    color: "#93C5FD",
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  kehadiranTrack: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    overflow: "hidden",
  },
  kehadiranFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: "#F97316", // Vibrant orange track from Screenshot 2
  },

  // 4 Status Counter Mini-Cards
  statusTilesRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 2,
  },
  statusTile: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderWidth: 1,
  },
  tileCount: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: typography.weight.medium,
  },

  // Action Buttons
  btnRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: 4,
  },
  actionBtnLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: "#1D3256",
    borderWidth: 1,
    borderColor: "#2563EB",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  actionBtnLeftText: {
    color: "#93C5FD",
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  actionBtnRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  actionBtnRightText: {
    color: colors.onSurface,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },

  // Presensi QR Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 13, 20, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: spacing.md,
    ...(Platform.OS === "web" ? ({ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" } as any) : {}),
  },
  qrBox: {
    width: 180,
    height: 180,
    borderRadius: radius.md,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  qrInputBox: {
    width: "100%",
    backgroundColor: "#1B1F2C",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#202534",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
  },
  detectedBox: {
    width: "100%",
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    gap: 6,
  },
  successBanner: {
    width: "100%",
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#22C55E",
    padding: spacing.md,
    alignItems: "center",
    gap: 4,
  },
}));

export default function CoursesScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();

  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [selectedDay, setSelectedDay] = useState("Semua");
  const [activeQrModal, setActiveQrModal] = useState<ScheduleItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userAttendances, setUserAttendances] = useState<Array<{ course_id: string }>>([]);
  const [detectedSession, setDetectedSession] = useState<any>(null);
  const [qrInput, setQrInput] = useState("");
  const [scanSubmitting, setScanSubmitting] = useState(false);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [res, attRes] = await Promise.all([
        apiFetch<{ courses: CourseCatalogItem[] }>("/courses"),
        apiFetch<{ records: Array<{ course_id: string }> }>("/attendance/history").catch(() => ({ records: [] })),
      ]);
      setCourses(res.courses ?? []);
      setUserAttendances(attRes.records ?? []);
    } catch {
      setCourses([]);
    }
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

  const openQrScannerModal = async (item: ScheduleItem) => {
    setActiveQrModal(item);
    setQrInput("");
    setScanSuccess(null);
    setDetectedSession(null);
    try {
      const sRes = await apiFetch<{ sessions: any[] }>(
        `/attendance/session/active?course_id=${item.courseId}`
      );
      if (sRes.sessions && sRes.sessions.length > 0) {
        setDetectedSession(sRes.sessions[0]);
        setQrInput(sRes.sessions[0].qr_code);
      }
    } catch {
      // fallback
    }
  };

  const handleScanSubmit = async (codeToSubmit?: string) => {
    const code = (codeToSubmit || qrInput).trim();
    if (!code) {
      Alert.alert("Perhatian", "Silakan masukkan atau scan kode QR presensi terlebih dahulu.");
      return;
    }
    setScanSubmitting(true);
    try {
      const res = await apiFetch<any>("/attendance/scan", {
        method: "POST",
        body: JSON.stringify({ qr_code: code }),
      });
      setScanSuccess(res.message || "Presensi berhasil dicatat!");
      await load();
    } catch (err: any) {
      Alert.alert("Gagal Presensi", err.message || "Kode QR tidak valid atau sudah digunakan.");
    } finally {
      setScanSubmitting(false);
    }
  };

  // Merge backend courses with schedule metadata and live attendance
  const scheduleItems: ScheduleItem[] = courses.map((c, idx) => {
    const meta = SCHEDULE_METADATA[c.id] || {};
    const dayAssign = DAYS[1 + (idx % (DAYS.length - 1))]; // distribute across days
    const attendedCount = userAttendances.filter((a) => a.course_id === c.id).length;
    return {
      courseId: c.id,
      title: c.title,
      sks: meta.sks ?? 2,
      dosen: meta.dosen ?? "-",
      time: meta.time ?? "-",
      room: meta.room ?? "-",
      day: meta.day ?? dayAssign,
      status: (c.progress > 0 ? "Selesai" : "Berlangsung") as any,
      hadir: (meta.hadir ?? 0) + attendedCount,
      totalMeetings: meta.totalMeetings ?? (c.total_modules || 6),
      sakit: meta.sakit ?? 0,
      izin: meta.izin ?? 0,
      alpha: meta.alpha ?? 0,
    };
  });

  const filteredItems = selectedDay === "Semua"
    ? scheduleItems
    : scheduleItems.filter((item) => item.day.toLowerCase() === selectedDay.toLowerCase());

  return (
    <ScreenContainer scroll testID="schedule-screen">
      {/* 1. Header with Notification Bell */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Jadwal Kuliah</Text>
        <Pressable
          style={styles.bellBtn}
          onPress={() => alert("Tidak ada pengumuman perkuliahan baru.")}
        >
          <Icon name="notifications-outline" size={20} color={colors.onSurface} />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      {/* 2. Day Filter Chips (Horizontal) */}
      <View style={styles.chipsScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {DAYS.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <Pressable
                key={day}
                style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayChipText, isSelected && styles.dayChipTextSelected]}>
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Course Cards (Matches Screenshot 2) */}
      {filteredItems.map((item) => {
        const percent = Math.round((item.hadir / item.totalMeetings) * 100);
        return (
          <View key={item.courseId} style={styles.card} testID={`schedule-card-${item.courseId}`}>
            {/* Title & SKS */}
            <View style={styles.cardHeader}>
              <Text style={styles.courseTitle}>{item.title}</Text>
              <View style={styles.sksBadge}>
                <Text style={styles.sksBadgeText}>{item.sks} SKS</Text>
              </View>
            </View>

            {/* Dosen Name */}
            <View style={styles.metaRow}>
              <Icon name="person-outline" size={15} color={colors.muted} />
              <Text style={styles.metaText}>{item.dosen}</Text>
            </View>

            {/* Time & Room */}
            <View style={styles.metaRow}>
              <Icon name="time-outline" size={15} color={colors.muted} />
              <Text style={styles.metaText}>
                {item.time} • {item.room}
              </Text>
            </View>

            {/* Status Selesai / Berlangsung */}
            <View style={styles.statusBadge}>
              <Icon name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.statusBadgeText}>{item.status}</Text>
            </View>

            {/* Kehadiran Bar */}
            <View style={styles.kehadiranWrap}>
              <View style={styles.kehadiranHeaderRow}>
                <Text style={styles.kehadiranLabel}>Kehadiran</Text>
                <Text style={styles.kehadiranPercent}>
                  Hadir {percent}% ({item.hadir}/{item.totalMeetings})
                </Text>
              </View>
              <View style={styles.kehadiranTrack}>
                <View style={[styles.kehadiranFill, { width: `${percent}%` }]} />
              </View>
            </View>

            {/* 4 Status Counter Mini-Cards */}
            <View style={styles.statusTilesRow}>
              {/* Hadir */}
              <View style={[styles.statusTile, { backgroundColor: "rgba(16, 185, 129, 0.12)", borderColor: "rgba(16, 185, 129, 0.25)" }]}>
                <Text style={[styles.tileCount, { color: "#34D399" }]}>{item.hadir}</Text>
                <Text style={[styles.tileLabel, { color: "#34D399" }]}>Hadir</Text>
              </View>

              {/* Sakit */}
              <View style={[styles.statusTile, { backgroundColor: "rgba(245, 158, 11, 0.12)", borderColor: "rgba(245, 158, 11, 0.25)" }]}>
                <Text style={[styles.tileCount, { color: "#FBBF24" }]}>{item.sakit}</Text>
                <Text style={[styles.tileLabel, { color: "#FBBF24" }]}>Sakit</Text>
              </View>

              {/* Izin */}
              <View style={[styles.statusTile, { backgroundColor: "rgba(59, 130, 246, 0.12)", borderColor: "rgba(59, 130, 246, 0.25)" }]}>
                <Text style={[styles.tileCount, { color: "#93C5FD" }]}>{item.izin}</Text>
                <Text style={[styles.tileLabel, { color: "#93C5FD" }]}>Izin</Text>
              </View>

              {/* Alpha */}
              <View style={[styles.statusTile, { backgroundColor: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.2)" }]}>
                <Text style={[styles.tileCount, { color: "#F87171" }]}>{item.alpha}</Text>
                <Text style={[styles.tileLabel, { color: "#F87171" }]}>Alpha</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              <Pressable
                style={styles.actionBtnLeft}
                onPress={() => openQrScannerModal(item)}
              >
                <Icon name="qr-code-outline" size={17} color="#93C5FD" />
                <Text style={styles.actionBtnLeftText}>Presensi QR</Text>
              </Pressable>

              <Pressable
                style={styles.actionBtnRight}
                onPress={() => router.push(`/course/${item.courseId}`)}
              >
                <Icon name="refresh-outline" size={17} color={colors.onSurface} />
                <Text style={styles.actionBtnRightText}>Riwayat</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {/* Presensi QR Modal */}
      <Modal
        visible={activeQrModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveQrModal(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setActiveQrModal(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#FFFFFF", textAlign: "center" }}>
              Scan QR Presensi Guru
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
              {activeQrModal?.title}
            </Text>

            {scanSuccess ? (
              <View style={styles.successBanner}>
                <Icon name="checkmark-circle" size={32} color="#22C55E" />
                <Text style={{ color: "#22C55E", fontWeight: "bold", fontSize: 15, textAlign: "center" }}>
                  {scanSuccess}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>
                  Kehadiranmu pada sesi ini telah berhasil dicatat.
                </Text>
              </View>
            ) : (
              <>
                {detectedSession ? (
                  <View style={styles.detectedBox}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Icon name="radio" size={14} color="#22C55E" />
                      <Text style={{ color: "#22C55E", fontSize: 12, fontWeight: "bold" }}>
                        Sesi Pertemuan Guru Terdeteksi Aktif!
                      </Text>
                    </View>
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "bold", textAlign: "center" }}>
                      {detectedSession.title}
                    </Text>
                    <Text style={{ color: "#60A5FA", fontSize: 12, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" }}>
                      {detectedSession.qr_code}
                    </Text>
                    <Button
                      label={scanSubmitting ? "Memverifikasi..." : "Presensi Sesi Ini Sekarang"}
                      variant="primary"
                      fullWidth
                      onPress={() => handleScanSubmit(detectedSession.qr_code)}
                      disabled={scanSubmitting}
                    />
                  </View>
                ) : null}

                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                  Atau ketik / tempel kode QR yang tampil di layar guru:
                </Text>

                <TextInput
                  style={styles.qrInputBox}
                  placeholder="Contoh: PRESENSI-EBP-M1-XXXX"
                  placeholderTextColor="#64748B"
                  value={qrInput}
                  onChangeText={setQrInput}
                  autoCapitalize="characters"
                />

                <Button
                  label={scanSubmitting ? "Mengirim..." : "Kirim Presensi"}
                  variant="primary"
                  fullWidth
                  onPress={() => handleScanSubmit()}
                  disabled={scanSubmitting}
                />
              </>
            )}

            <Button
              label="Tutup"
              variant="secondary"
              fullWidth
              onPress={() => setActiveQrModal(null)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}
