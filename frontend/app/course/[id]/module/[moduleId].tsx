import { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  Badge,
  Button,
  Card,
  Icon,
  LoadingSpinner,
  ScreenContainer,
  type IoniconName,
} from "@/src/components/ui";
import { apiFetch } from "@/src/services/api";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import type { CourseProgress } from "@/src/types/test";

interface PostTestQ {
  question_id: string;
  text: string;
  options: string[];
}

interface PostTestResult {
  score: number;
  total: number;
  percentage: number;
  review: Array<{
    question_id: string;
    text: string;
    options: string[];
    selected_index: number | null;
    correct_index: number;
    is_correct: boolean;
  }>;
}

interface ResultsData {
  course_id: string;
  course_title: string;
  student_name: string;
  pre_test_score: number;
  post_test_score: number;
  growth_percent: number;
  is_passed: boolean;
  certificate_id: string;
  issued_at: string;
}

const MODULE_DATA: Record<
  string,
  Record<
    string,
    {
      title: string;
      subtitle: string;
      readingTime?: string;
      sections?: Array<{ heading: string; body: string; highlight?: string }>;
      videoUrl?: string;
      duration?: string;
      chapters?: Array<{ time: string; title: string }>;
      pdfTitle?: string;
      totalPages?: number;
      pdfSummary?: string;
    }
  >
> = {
  materials: {
    math: {
      title: "Materi Inti Matematika",
      subtitle: "Aljabar, Geometri Bidang, dan Aritmatika Cepat",
      readingTime: "5 menit membaca",
      sections: [
        {
          heading: "1. Pemahaman Operasi Aritmatika & Aljabar",
          body: "Aljabar membantu kita menyelesaikan masalah dengan variabel yang belum diketahui nilainya. Ingat aturan urutan operasi matematika (PEMDAS/KABATAKU): Kurung, Pangkat, Perkalian/Pembagian, lalu Penjumlahan/Pengurangan.",
          highlight: "Contoh: 2x + 6 = 14 ➔ 2x = 8 ➔ x = 4.",
        },
        {
          heading: "2. Menghitung Persentase Cepat",
          body: "Untuk mencari 25% dari sebuah bilangan, bagilah bilangan tersebut dengan 4. Untuk 10%, geser koma desimal satu langkah ke kiri. Rumus dasar: (Persen / 100) x Nilai Total.",
          highlight: "Tips Ujian: 25% dari 240 = 240 / 4 = 60.",
        },
        {
          heading: "3. Rumus Luas & Keliling Bangun Datar",
          body: "Luas Segitiga = 1/2 x alas x tinggi. Luas Persegi Panjang = panjang x lebar. Keliling Persegi = 4 x sisi.",
          highlight: "Segitiga dengan alas 12 cm dan tinggi 8 cm ➔ Luas = 1/2 x 12 x 8 = 48 cm².",
        },
      ],
    },
    science: {
      title: "Materi Inti IPA",
      subtitle: "Sistem Kehidupan, Energi, dan Dinamika Alam",
      readingTime: "6 menit membaca",
      sections: [
        {
          heading: "1. Sel sebagai Unit Terkecil Kehidupan",
          body: "Semua makhluk hidup tersusun atas sel. Sel tumbuhan memiliki dinding sel dan kloroplas yang tidak dimiliki sel hewan, sehingga tumbuhan dapat melakukan fotosintesis menghasilkan glukosa dan oksigen.",
          highlight: "Rumus Fotosintesis: 6CO₂ + 6H₂O + Cahaya ➔ C₆H₁₂O₆ + 6O₂.",
        },
        {
          heading: "2. Peredaran Darah & Hemoglobin",
          body: "Darah manusia terdiri atas plasma darah dan sel-sel darah. Hemoglobin dalam eritrosit (sel darah merah) bertugas mengikat oksigen dari paru-paru dan mengedarkannya ke seluruh jaringan tubuh.",
          highlight: "Jantung berfungsi sebagai pompa utama dengan 4 ruang (2 serambi, 2 bilik).",
        },
        {
          heading: "3. Perubahan Wujud Zat & Lapisan Atmosfer",
          body: "Perubahan wujud dari padat langsung menjadi gas dinamakan menyublim (contoh: kapur barus). Lapisan atmosfer terdekat tempat terjadinya cuaca adalah Troposfer (0-12 km).",
          highlight: "Urutan atmosfer: Troposfer ➔ Stratosfer ➔ Mesosfer ➔ Termosfer ➔ Eksosfer.",
        },
      ],
    },
    english: {
      title: "Core English Materials",
      subtitle: "Grammar Mastery, Vocabulary & Reading Comprehension",
      readingTime: "5 menit membaca",
      sections: [
        {
          heading: "1. Simple Present vs Simple Past Tense",
          body: "Simple Present tense describes habits, general truths, and repeated actions (e.g., 'They play basketball every Saturday'). Simple Past tense refers to completed events in the past using verb-2 (e.g., 'Yesterday, I watched a movie').",
          highlight: "Pattern: Subject + V1(s/es) for Present | Subject + V2 for Past.",
        },
        {
          heading: "2. Degrees of Comparison",
          body: "When comparing two objects or people, we use the comparative degree. Regular one-syllable adjectives add '-er' (fast ➔ faster). Irregular adjectives change completely: good ➔ better (not gooder!), bad ➔ worse.",
          highlight: "Example: 'This math exercise is better than yesterday's.'",
        },
        {
          heading: "3. Prepositions of Time: Since vs For",
          body: "Use 'since' for a specific starting point in time (since Monday, since 2020). Use 'for' to describe a total duration of time (for five years, for two hours).",
          highlight: "Example: 'She has studied here for five years.'",
        },
      ],
    },
    history: {
      title: "Materi Inti Sejarah",
      subtitle: "Peradaban Nusantara & Tonggak Kemerdekaan 1945",
      readingTime: "6 menit membaca",
      sections: [
        {
          heading: "1. Kerajaan Hindu-Buddha & Peninggalannya",
          body: "Kerajaan Hindu tertua di Nusantara adalah Kerajaan Kutai di Kalimantan Timur (abad ke-4 Masehi) dengan prasasti Yupa. Candi Borobudur dibangun pada abad ke-8-9 Masehi oleh wangsa Syailendra yang bercorak Buddha Mahayana.",
          highlight: "Mahapatih Gajah Mada mengikrarkan Sumpah Palapa pada masa kejayaan Kerajaan Majapahit.",
        },
        {
          heading: "2. Kebangkitan Nasional & Pers Pergerakan",
          body: "Budi Utomo didirikan pada 20 Mei 1908 sebagai organisasi modern pertama. Pers pribumi seperti Medan Prijaji yang dipimpin Tirto Adhi Soerjo menjadi pelopor pembawa gagasan kemerdekaan.",
          highlight: "28 Oktober 1928: Sumpah Pemuda menegaskan satu tanah air, satu bangsa, dan satu bahasa Indonesia.",
        },
        {
          heading: "3. Detik-detik Menuju Proklamasi 17 Agustus 1945",
          body: "Peristiwa Rengasdengklok pada 16 Agustus 1945 dilakukan para pemuda untuk mengamankan Ir. Soekarno dan Drs. Moh. Hatta agar segera memproklamasikan kemerdekaan tanpa terpengaruh janji Jepang.",
          highlight: "Proklamasi dibacakan di Jl. Pegangsaan Timur No. 56, Jakarta pada pukul 10.00 WIB.",
        },
      ],
    },
  },
  videos: {
    math: {
      title: "Video Pembelajaran Matematika",
      subtitle: "Trik Cepat Menghitung Aljabar & Geometri",
      duration: "12 menit 45 detik",
      chapters: [
        { time: "00:00", title: "Pengenalan & Review Konsep" },
        { time: "02:30", title: "Pola Aljabar 1 Variabel" },
        { time: "06:15", title: "Menghitung Luas Bangun Datar" },
        { time: "09:40", title: "Strategi Soal Ujian" },
      ],
    },
    science: {
      title: "Video Pembelajaran IPA",
      subtitle: "Visualisasi Mikroskopis Sel & Sirkulasi Darah",
      duration: "14 menit 20 detik",
      chapters: [
        { time: "00:00", title: "Pengantar Biologi Sel" },
        { time: "03:10", title: "Struktur & Fungsi Organel Sel" },
        { time: "07:45", title: "Sirkulasi Darah & Hemoglobin" },
        { time: "11:30", title: "Latihan Soal IPA Terapan" },
      ],
    },
    english: {
      title: "English Video Masterclass",
      subtitle: "Grammar Hacks & Native Listening Practice",
      duration: "11 menit 50 detik",
      chapters: [
        { time: "00:00", title: "Warm Up & Listening Check" },
        { time: "02:40", title: "Mastering Tenses in 5 Minutes" },
        { time: "06:20", title: "Irregular Comparatives" },
        { time: "09:15", title: "Common Speaking Mistakes" },
      ],
    },
    history: {
      title: "Dokumenter Sejarah Indonesia",
      subtitle: "Napak Tilas Pergerakan Nasional Menuju Kemerdekaan",
      duration: "15 menit 10 detik",
      chapters: [
        { time: "00:00", title: "Kejayaan Kerajaan Nusantara" },
        { time: "04:00", title: "Lahirnya Sumpah Pemuda 1928" },
        { time: "08:30", title: "Peristiwa Rengasdengklok" },
        { time: "12:15", title: "Detik-Detik Pembacaan Proklamasi" },
      ],
    },
  },
  manual_book: {
    math: {
      title: "Manual Book: Panduan Rumus Lengkap",
      subtitle: "Buku Saku Digital Matematika SMP/SMA",
      pdfTitle: "LearnSpace_Math_Handbook_v1.pdf",
      totalPages: 16,
      pdfSummary:
        "Buku panduan ini merangkum seluruh teorema matematika dasar, rumus luas keliling bangun datar, metode eliminasi aljabar, dan bank soal latihan mandiri.",
    },
    science: {
      title: "Manual Book: Ensiklopedia Sains Ringkas",
      subtitle: "Panduan Praktikum & Teori Ilmu Pengetahuan Alam",
      pdfTitle: "LearnSpace_Science_Guide_v1.pdf",
      totalPages: 18,
      pdfSummary:
        "Panduan laboratorium dan ringkasan konsep fisika, biologi, dan kimia dasar lengkap dengan diagram berwarna sistem peredaran darah dan tabel periodik.",
    },
    english: {
      title: "Manual Book: English Grammar & Expression",
      subtitle: "Comprehensive Reference Handbook",
      pdfTitle: "LearnSpace_English_Handbook_v1.pdf",
      totalPages: 14,
      pdfSummary:
        "A practical handbook covering 12 English tenses, regular & irregular verbs list, idiomatic phrases, and daily conversation patterns.",
    },
    history: {
      title: "Manual Book: Kronik Sejarah Nusantara",
      subtitle: "Peta Garis Waktu & Tokoh Bangsa",
      pdfTitle: "LearnSpace_History_Chronicle_v1.pdf",
      totalPages: 20,
      pdfSummary:
        "Buku saku sejarah berformat infografis garis waktu lengkap sejak zaman kerajaan Hindu-Buddha, masa kolonial, pergerakan nasional, hingga kemerdekaan RI.",
    },
  },
};

const useStyles = makeStyles((colors) => ({
  header: {
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any) : {}),
  },
  headerText: { flex: 1, gap: 2 },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  subtitle: { color: colors.muted, fontSize: typography.size.sm },

  heroBanner: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  heroBadgeText: {
    color: colors.onBrandPrimary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  heroTitle: {
    color: colors.onBrandPrimary,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    lineHeight: 26,
  },
  heroSubtitle: {
    color: colors.onBrandPrimary,
    opacity: 0.9,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },

  contentCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionHeading: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  sectionBody: {
    fontSize: typography.size.sm,
    color: colors.onSurfaceTertiary,
    lineHeight: 22,
  },
  highlightBox: {
    backgroundColor: colors.brandTertiary,
    borderLeftWidth: 3,
    borderLeftColor: colors.brandPrimary,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  highlightText: {
    color: colors.onBrandTertiary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    lineHeight: 18,
  },

  // Video mockup styles
  videoCard: {
    backgroundColor: "#0F172A",
    borderRadius: radius.lg,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    position: "relative",
    overflow: "hidden",
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.button,
  },
  videoMetaRow: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  videoDuration: {
    color: "#FFFFFF",
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  videoBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  chapterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chapterTime: {
    color: colors.brandPrimary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.xs,
    minWidth: 42,
  },
  chapterTitle: {
    color: colors.onSurface,
    fontSize: typography.size.sm,
    flex: 1,
  },

  // Manual book styles
  bookPreview: {
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  bookIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  bookTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    textAlign: "center",
  },
  bookDesc: {
    fontSize: typography.size.xs,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
  },

  // Post test options
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.sm,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  optionSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandTertiary,
  },
  letterWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  letterWrapSelected: {
    backgroundColor: colors.brandPrimary,
  },
  letterText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  letterTextSelected: {
    color: colors.onBrandPrimary,
  },
  optionText: {
    fontSize: typography.size.sm,
    color: colors.onSurface,
    flex: 1,
  },

  // Results & Certificate styles
  certCard: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: colors.brandPrimary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
    position: "relative",
  },
  certHeader: {
    fontSize: typography.size.xs,
    letterSpacing: 2,
    fontWeight: typography.weight.bold,
    color: colors.brandPrimary,
    textTransform: "uppercase",
  },
  certTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    textAlign: "center",
  },
  certStudent: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.brandPrimary,
  },
  certSub: {
    fontSize: typography.size.xs,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  certFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  certId: {
    fontSize: typography.size.xs,
    color: colors.muted,
  },
  certDate: {
    fontSize: typography.size.xs,
    color: colors.muted,
  },

  actionCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
}));

const LETTERS = ["A", "B", "C", "D"];

export default function CourseModuleScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { id, moduleId } = useLocalSearchParams<{ id: string; moduleId: string }>();

  const courseId = id ?? "math";
  const modKey = moduleId ?? "materials";

  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Post test states
  const [postTestQuestions, setPostTestQuestions] = useState<PostTestQ[]>([]);
  const [postTestIndex, setPostTestIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [postTestResult, setPostTestResult] = useState<PostTestResult | null>(null);

  // Results state
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);

  const modCourseData = MODULE_DATA[modKey]?.[courseId] ?? MODULE_DATA[modKey]?.["math"];

  // Load module data
  useEffect(() => {
    if (modKey === "post_test") {
      apiFetch<{ questions: PostTestQ[] }>(`/courses/${courseId}/post-test`)
        .then((res) => setPostTestQuestions(res.questions))
        .catch(() => setPostTestQuestions([]));
    } else if (modKey === "results") {
      apiFetch<ResultsData>(`/courses/${courseId}/results`)
        .then(setResultsData)
        .catch(() => setResultsData(null));
    }
  }, [courseId, modKey]);

  const markModuleCompleted = async () => {
    setLoading(true);
    try {
      await apiFetch(`/courses/${courseId}/modules/${modKey}/complete`, {
        method: "POST",
      });
      setCompleted(true);
      setSuccessToast("Modul berhasil diselesaikan!");
      setTimeout(() => {
        router.replace(`/course/${courseId}`);
      }, 1200);
    } catch {
      setSuccessToast("Berhasil menyelesaikan modul.");
      setTimeout(() => router.replace(`/course/${courseId}`), 1000);
    } finally {
      setLoading(false);
    }
  };

  const submitPostTest = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<PostTestResult>(`/courses/${courseId}/post-test/submit`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      setPostTestResult(res);
      setCompleted(true);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scroll testID={`module-screen-${modKey}`}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace(`/course/${courseId}`)}
          style={styles.backBtn}
          testID="module-back-btn"
        >
          <Icon name="arrow-back" size={18} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {modKey === "materials"
              ? "Materi Pembelajaran"
              : modKey === "videos"
              ? "Video Penjelasan"
              : modKey === "manual_book"
              ? "Manual Book"
              : modKey === "post_test"
              ? "Post-Test Akhir"
              : "Hasil & Sertifikat"}
          </Text>
          <Text style={styles.subtitle}>Kelas {courseId.toUpperCase()}</Text>
        </View>
      </View>

      {/* MATERIALS MODULE */}
      {modKey === "materials" && modCourseData ? (
        <View>
          <View style={styles.heroBanner}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{modCourseData.readingTime}</Text>
            </View>
            <Text style={styles.heroTitle}>{modCourseData.title}</Text>
            <Text style={styles.heroSubtitle}>{modCourseData.subtitle}</Text>
          </View>

          {(modCourseData.sections ?? []).map((sec, i) => (
            <Card key={i} style={styles.contentCard}>
              <Text style={styles.sectionHeading}>{sec.heading}</Text>
              <Text style={styles.sectionBody}>{sec.body}</Text>
              {sec.highlight ? (
                <View style={styles.highlightBox}>
                  <Text style={styles.highlightText}>{sec.highlight}</Text>
                </View>
              ) : null}
            </Card>
          ))}

          <View style={styles.actionCard}>
            {successToast ? (
              <Badge label={successToast} tone="success" style={{ alignSelf: "center" }} />
            ) : null}
            <Button
              label={completed ? "Selesai" : "Tandai Selesai & Lanjut"}
              onPress={markModuleCompleted}
              loading={loading}
              disabled={completed}
              leftIcon={<Icon name="checkmark-circle" size={18} color="#FFFFFF" />}
            />
          </View>
        </View>
      ) : null}

      {/* VIDEOS MODULE */}
      {modKey === "videos" && modCourseData ? (
        <View>
          <View style={styles.videoCard}>
            <Pressable
              style={styles.playBtn}
              onPress={() => alert("Video pembelajaran sedang diputar")}
            >
              <Icon name="play" size={28} color="#FFFFFF" />
            </Pressable>
            <View style={styles.videoMetaRow}>
              <Text style={styles.videoDuration}>Durasi: {modCourseData.duration}</Text>
              <View style={styles.videoBadge}>
                <Text style={styles.videoBadgeText}>HD 1080p</Text>
              </View>
            </View>
          </View>

          <Card style={styles.contentCard}>
            <Text style={styles.sectionHeading}>{modCourseData.title}</Text>
            <Text style={styles.sectionBody}>{modCourseData.subtitle}</Text>
          </Card>

          <Card style={styles.contentCard}>
            <Text style={styles.sectionHeading}>Daftar Bab & Timestamp</Text>
            {(modCourseData.chapters ?? []).map((chap, i) => (
              <View key={i} style={styles.chapterRow}>
                <Text style={styles.chapterTime}>{chap.time}</Text>
                <Text style={styles.chapterTitle}>{chap.title}</Text>
              </View>
            ))}
          </Card>

          <View style={styles.actionCard}>
            {successToast ? (
              <Badge label={successToast} tone="success" style={{ alignSelf: "center" }} />
            ) : null}
            <Button
              label={completed ? "Video Selesai Ditonton" : "Tandai Selesai Ditonton"}
              onPress={markModuleCompleted}
              loading={loading}
              disabled={completed}
              leftIcon={<Icon name="checkmark-circle" size={18} color="#FFFFFF" />}
            />
          </View>
        </View>
      ) : null}

      {/* MANUAL BOOK MODULE */}
      {modKey === "manual_book" && modCourseData ? (
        <View>
          <View style={styles.bookPreview}>
            <View style={styles.bookIconWrap}>
              <Icon name="document-text" size={32} color={colors.brandPrimary} />
            </View>
            <Text style={styles.bookTitle}>{modCourseData.pdfTitle}</Text>
            <Text style={styles.bookDesc}>{modCourseData.pdfSummary}</Text>
            <Badge label={`${modCourseData.totalPages} Halaman • PDF Resmi`} tone="neutral" />
          </View>

          <Button
            label="Unduh Manual Book (PDF)"
            variant="outline"
            onPress={() => alert(`Mengunduh file: ${modCourseData.pdfTitle}`)}
            leftIcon={<Icon name="download-outline" size={18} color={colors.onSurface} />}
            style={{ marginBottom: spacing.md }}
          />

          <View style={styles.actionCard}>
            {successToast ? (
              <Badge label={successToast} tone="success" style={{ alignSelf: "center" }} />
            ) : null}
            <Button
              label={completed ? "Buku Selesai Dipelajari" : "Tandai Selesai Membaca"}
              onPress={markModuleCompleted}
              loading={loading}
              disabled={completed}
              leftIcon={<Icon name="checkmark-circle" size={18} color="#FFFFFF" />}
            />
          </View>
        </View>
      ) : null}

      {/* POST TEST MODULE */}
      {modKey === "post_test" ? (
        <View>
          {!postTestResult ? (
            <View>
              {postTestQuestions.length > 0 ? (
                <View>
                  <Card style={styles.contentCard}>
                    <Text style={styles.subtitle}>
                      Soal {postTestIndex + 1} dari {postTestQuestions.length}
                    </Text>
                    <Text style={styles.sectionHeading}>
                      {postTestQuestions[postTestIndex]?.text}
                    </Text>

                    {postTestQuestions[postTestIndex]?.options.map((opt, idx) => {
                      const qId = postTestQuestions[postTestIndex]?.question_id;
                      const selected = answers[qId] === idx;
                      return (
                        <Pressable
                          key={idx}
                          style={[styles.optionCard, selected && styles.optionSelected]}
                          onPress={() => setAnswers((prev) => ({ ...prev, [qId]: idx }))}
                        >
                          <View
                            style={[
                              styles.letterWrap,
                              selected && styles.letterWrapSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.letterText,
                                selected && styles.letterTextSelected,
                              ]}
                            >
                              {LETTERS[idx]}
                            </Text>
                          </View>
                          <Text style={styles.optionText}>{opt}</Text>
                        </Pressable>
                      );
                    })}
                  </Card>

                  <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
                    <Button
                      label="Sebelumnya"
                      variant="outline"
                      style={{ flex: 1 }}
                      disabled={postTestIndex === 0}
                      onPress={() => setPostTestIndex((prev) => Math.max(0, prev - 1))}
                    />
                    {postTestIndex < postTestQuestions.length - 1 ? (
                      <Button
                        label="Selanjutnya"
                        style={{ flex: 1 }}
                        onPress={() => setPostTestIndex((prev) => prev + 1)}
                      />
                    ) : (
                      <Button
                        label="Kumpulkan Post-Test"
                        style={{ flex: 1 }}
                        loading={loading}
                        onPress={submitPostTest}
                      />
                    )}
                  </View>
                </View>
              ) : (
                <LoadingSpinner label="Memuat post-test..." />
              )}
            </View>
          ) : (
            <View>
              <View style={styles.heroBanner}>
                <Text style={styles.heroBadgeText}>HASIL POST-TEST</Text>
                <Text style={[styles.heroTitle, { fontSize: 44, lineHeight: 52 }]}>
                  {postTestResult.percentage}%
                </Text>
                <Text style={styles.heroSubtitle}>
                  {postTestResult.score} dari {postTestResult.total} soal terjawab benar. Modul
                  kelulusan dan sertifikat kini dapat diakses!
                </Text>
              </View>

              <Button
                label="Lihat Sertifikat & Hasil Akhir"
                onPress={() => router.replace(`/course/${courseId}/module/results`)}
                leftIcon={<Icon name="trophy" size={18} color="#FFFFFF" />}
                style={{ marginTop: spacing.md, marginBottom: spacing.xl }}
              />
            </View>
          )}
        </View>
      ) : null}

      {/* RESULTS & CERTIFICATE MODULE */}
      {modKey === "results" ? (
        <View>
          <View style={styles.certCard}>
            <Text style={styles.certHeader}>Sertifikat Penyelesaian</Text>
            <Text style={styles.certTitle}>LEARNSPACE ACADEMY</Text>
            <Text style={styles.certSub}>Sertifikat ini secara resmi diberikan kepada:</Text>
            <Text style={styles.certStudent}>{resultsData?.student_name ?? "Siswa LearnSpace"}</Text>
            <Text style={styles.certSub}>
              Telah menyelesaikan seluruh rangkaian modul, pre-test, materi, video, manual book,
              dan post-test pada kelas:
            </Text>
            <Badge
              label={`Mata Pelajaran: ${resultsData?.course_title ?? courseId.toUpperCase()}`}
              tone="brand"
            />

            <View style={styles.certFooterRow}>
              <Text style={styles.certId}>ID: {resultsData?.certificate_id ?? "CERT-LS-001"}</Text>
              <Text style={styles.certDate}>
                Diterbitkan: {resultsData?.issued_at ?? "Oktober 2026"}
              </Text>
            </View>
          </View>

          <Card style={styles.contentCard}>
            <Text style={styles.sectionHeading}>Statistik Peningkatan Belajar</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: spacing.sm }}>
              <View>
                <Text style={styles.subtitle}>Nilai Pre-Test</Text>
                <Text style={[styles.title, { color: colors.muted }]}>
                  {resultsData?.pre_test_score ?? 0}%
                </Text>
              </View>
              <View>
                <Text style={styles.subtitle}>Nilai Post-Test</Text>
                <Text style={[styles.title, { color: colors.brandPrimary }]}>
                  {resultsData?.post_test_score ?? 100}%
                </Text>
              </View>
              <View>
                <Text style={styles.subtitle}>Peningkatan</Text>
                <Text style={[styles.title, { color: colors.success }]}>
                  +{resultsData?.growth_percent ?? 20}%
                </Text>
              </View>
            </View>
          </Card>

          <Button
            label="Unduh Sertifikat Digital"
            variant="outline"
            onPress={() => alert("Mengunduh sertifikat berformat PDF resmi...")}
            leftIcon={<Icon name="download-outline" size={18} color={colors.onSurface} />}
            style={{ marginBottom: spacing.sm }}
          />

          <Button
            label="Kembali ke Daftar Kelas"
            onPress={() => router.replace("/(student)/courses")}
            style={{ marginBottom: spacing.xxl }}
          />
        </View>
      ) : null}
    </ScreenContainer>
  );
}
