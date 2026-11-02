import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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
import type { CourseCatalogItem } from "@/src/types/course";

interface ActiveSession {
  session_id: string;
  course_id: string;
  meeting_number: number;
  title: string;
  qr_code: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  total_attended: number;
}

interface AttendanceRecord {
  attendance_id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  course_id: string;
  meeting_number: number;
  scanned_at: string;
  status: string;
}

const useStyles = makeStyles((colors) => ({
  header: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: typography.weight.bold,
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.size.sm,
  },

  // QR Active Card
  activeCard: {
    backgroundColor: "#141721",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#2563EB",
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  activeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  activeTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: "#FFFFFF",
    textAlign: "center",
  },
  qrImageWrap: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  tokenBox: {
    backgroundColor: "#1B1F2C",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#202534",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  tokenText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 14,
    fontWeight: typography.weight.bold,
    color: "#60A5FA",
    letterSpacing: 1,
  },

  // Form Section
  formCard: {
    backgroundColor: "#141721",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#202534",
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  formTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: "#FFFFFF",
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  courseChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  courseChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: "#1B1F2C",
    borderWidth: 1,
    borderColor: "#202534",
  },
  courseChipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  courseChipText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.muted,
  },
  courseChipTextActive: {
    color: "#FFFFFF",
    fontWeight: typography.weight.bold,
  },
  meetingRow: {
    flexDirection: "row",
    gap: 8,
  },
  meetingChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: "#1B1F2C",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#202534",
  },
  meetingChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  meetingChipText: {
    fontSize: 12,
    fontWeight: typography.weight.semibold,
    color: colors.muted,
  },
  meetingChipTextActive: {
    color: "#FFFFFF",
    fontWeight: typography.weight.bold,
  },

  // Attendees list
  attendeeCard: {
    backgroundColor: "#141721",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#202534",
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1B1F2C",
  },
  studentName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: "#FFFFFF",
  },
  scanTime: {
    fontSize: 11,
    color: colors.muted,
  },
}));

export default function GuruPresensiScreen() {
  const styles = useStyles();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("ebp");
  const [meetingNumber, setMeetingNumber] = useState<number>(1);
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        apiFetch<{ courses: CourseCatalogItem[] }>("/courses"),
        apiFetch<{ sessions: ActiveSession[] }>("/attendance/session/active"),
      ]);
      setCourses(cRes.courses ?? []);
      if (sRes.sessions && sRes.sessions.length > 0) {
        const current = sRes.sessions[0];
        setActiveSession(current);
        // fetch attendees
        const attRes = await apiFetch<{ records: AttendanceRecord[] }>(
          `/attendance/records?session_id=${current.session_id}`
        );
        setAttendees(attRes.records ?? []);
      } else {
        setActiveSession(null);
        setAttendees([]);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      loadData();
    }, 10000); // Poll every 10s for new scans
    return () => clearInterval(timer);
  }, [loadData]);

  const handleCreateSession = async () => {
    setSubmitting(true);
    try {
      const res = await apiFetch<ActiveSession>("/attendance/session", {
        method: "POST",
        body: JSON.stringify({
          course_id: selectedCourse,
          meeting_number: meetingNumber,
          valid_minutes: durationMinutes,
        }),
      });
      setActiveSession(res);
      setAttendees([]);
      Alert.alert(
        "Sesi Presensi Aktif",
        `Kode QR untuk Pertemuan ${res.meeting_number} berhasil dibuat!`
      );
    } catch (err: any) {
      Alert.alert("Gagal", err.message || "Gagal membuka sesi presensi");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToken = (token: string) => {
    if (Platform.OS === "web") {
      navigator.clipboard?.writeText(token);
      Alert.alert("Tersalin", `Kode ${token} telah disalin!`);
    } else {
      Alert.alert("Kode Presensi", token);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen label="Memuat modul presensi guru..." />;
  }

  const qrImageUrl = activeSession
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
        activeSession.qr_code
      )}`
    : "";

  return (
    <ScreenContainer
      scroll
      testID="teacher-attendance-screen"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
          tintColor={colors.brandPrimary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Program Guru / Dosen: Presensi</Text>
        <Text style={styles.subtitle}>
          Buka sesi absensi tatap muka dan tampilkan kode QR ke siswa
        </Text>
      </View>

      {/* ACTIVE QR CODE CARD */}
      {activeSession ? (
        <View style={styles.activeCard}>
          <View style={styles.activeHeader}>
            <Icon name="radio" size={18} color="#22C55E" />
            <Text style={{ color: "#22C55E", fontWeight: "bold", fontSize: 13 }}>
              SESI PRESENSI SEDANG AKTIF
            </Text>
          </View>

          <Text style={styles.activeTitle}>{activeSession.title}</Text>

          {/* QR Code Graphic */}
          <View style={styles.qrImageWrap}>
            <Image
              source={{ uri: qrImageUrl }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>

          {/* QR Token with copy */}
          <Pressable
            style={styles.tokenBox}
            onPress={() => copyToken(activeSession.qr_code)}
          >
            <Icon name="qr-code-outline" size={16} color="#60A5FA" />
            <Text style={styles.tokenText}>{activeSession.qr_code}</Text>
            <Icon name="copy-outline" size={14} color="#60A5FA" />
          </Pressable>

          <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>
            Minta siswa untuk scan kode di atas atau masukkan kode manual.
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginTop: spacing.xs,
            }}
          >
            <Badge
              label={`${attendees.length} Siswa Telah Hadir`}
              tone="success"
            />
          </View>
        </View>
      ) : null}

      {/* CREATE NEW SESSION FORM */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>
          {activeSession ? "Perbarui / Ganti Sesi Presensi" : "Buka Sesi Presensi Baru"}
        </Text>

        <Text style={styles.label}>Pilih Mata Pelajaran</Text>
        <View style={styles.courseChipsWrap}>
          {courses.map((c) => (
            <Pressable
              key={c.id}
              style={[
                styles.courseChip,
                selectedCourse === c.id && styles.courseChipActive,
              ]}
              onPress={() => setSelectedCourse(c.id)}
            >
              <Text
                style={[
                  styles.courseChipText,
                  selectedCourse === c.id && styles.courseChipTextActive,
                ]}
              >
                {c.title}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Pertemuan Ke-</Text>
        <View style={styles.meetingRow}>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <Pressable
              key={num}
              style={[
                styles.meetingChip,
                meetingNumber === num && styles.meetingChipActive,
              ]}
              onPress={() => setMeetingNumber(num)}
            >
              <Text
                style={[
                  styles.meetingChipText,
                  meetingNumber === num && styles.meetingChipTextActive,
                ]}
              >
                P-{num}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button
          label={submitting ? "Membuat QR Code..." : "Aktifkan Sesi & Tampilkan QR"}
          variant="primary"
          fullWidth
          onPress={handleCreateSession}
          disabled={submitting}
        />
      </View>

      {/* LIVE ATTENDEES TABLE */}
      {activeSession ? (
        <View style={styles.attendeeCard}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.formTitle}>Daftar Siswa yang Hadir</Text>
            <Badge label={`${attendees.length} Hadir`} tone="brand" />
          </View>

          {attendees.length === 0 ? (
            <Text
              style={{
                textAlign: "center",
                color: colors.muted,
                paddingVertical: spacing.md,
                fontSize: typography.size.sm,
              }}
            >
              Belum ada siswa yang melakukan scan presensi.
            </Text>
          ) : (
            attendees.map((att) => (
              <View key={att.attendance_id} style={styles.attendeeRow}>
                <View style={{ gap: 2 }}>
                  <Text style={styles.studentName}>{att.student_name}</Text>
                  <Text style={styles.scanTime}>
                    Waktu:{" "}
                    {att.scanned_at
                      ? new Date(att.scanned_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "-"}
                  </Text>
                </View>
                <Badge label="HADIR" tone="success" />
              </View>
            ))
          )}
        </View>
      ) : null}
    </ScreenContainer>
  );
}
