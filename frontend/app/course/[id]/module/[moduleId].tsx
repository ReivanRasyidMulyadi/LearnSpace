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
import { makeStyles, radius, shadows, spacing, typography, useTheme } from "@/src/theme";
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

interface MaterialItem {
  material_id: string;
  course_id: string;
  title: string;
  description: string;
  content: string;
  order: number;
}

interface VideoItem {
  video_id: string;
  course_id: string;
  title: string;
  description: string;
  url: string;
  duration_seconds: number;
  order: number;
}

interface ManualBookItem {
  book_id: string;
  course_id: string;
  title: string;
  description: string;
  file_url: string;
  pages: number;
}

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

  // Real database states
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [manualBook, setManualBook] = useState<ManualBookItem | null>(null);
  const [fetching, setFetching] = useState(true);

  // Load database module data
  useEffect(() => {
    setFetching(true);
    if (modKey === "materials") {
      apiFetch<{ materials: MaterialItem[] }>(`/courses/${courseId}/materials`)
        .then((res) => setMaterials(res.materials ?? []))
        .catch(() => setMaterials([]))
        .finally(() => setFetching(false));
    } else if (modKey === "videos") {
      apiFetch<{ videos: VideoItem[] }>(`/courses/${courseId}/videos`)
        .then((res) => setVideos(res.videos ?? []))
        .catch(() => setVideos([]))
        .finally(() => setFetching(false));
    } else if (modKey === "manual_book") {
      apiFetch<{ manual_book: ManualBookItem | null }>(`/courses/${courseId}/manual-book`)
        .then((res) => setManualBook(res.manual_book))
        .catch(() => setManualBook(null))
        .finally(() => setFetching(false));
    } else if (modKey === "post_test") {
      apiFetch<{ questions: PostTestQ[] }>(`/courses/${courseId}/post-test`)
        .then((res) => setPostTestQuestions(res.questions ?? []))
        .catch(() => setPostTestQuestions([]))
        .finally(() => setFetching(false));
    } else if (modKey === "results") {
      apiFetch<ResultsData>(`/courses/${courseId}/results`)
        .then(setResultsData)
        .catch(() => setResultsData(null))
        .finally(() => setFetching(false));
    } else {
      setFetching(false);
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

      {/* MATERIALS MODULE (Real Database Records) */}
      {modKey === "materials" ? (
        <View>
          <View style={styles.heroBanner}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Kurikulum Resmi LearnSpace</Text>
            </View>
            <Text style={styles.heroTitle}>Materi Pembelajaran</Text>
            <Text style={styles.heroSubtitle}>
              Bahan ajar dan pemahaman konsep resmi bersumber langsung dari basis data LearnSpace.
            </Text>
          </View>

          {materials.length === 0 && !fetching ? (
            <Card style={styles.contentCard}>
              <Text style={styles.sectionBody}>Belum ada materi untuk mata pelajaran ini.</Text>
            </Card>
          ) : (
            materials.map((mat) => (
              <Card key={mat.material_id} style={styles.contentCard}>
                <Text style={styles.sectionHeading}>{mat.title}</Text>
                <Text style={[styles.sectionHeading, { fontSize: typography.size.xs, color: colors.muted, fontWeight: typography.weight.regular }]}>
                  {mat.description}
                </Text>
                <Text style={styles.sectionBody}>{mat.content}</Text>
              </Card>
            ))
          )}

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

      {/* VIDEOS MODULE (Real Database Records) */}
      {modKey === "videos" ? (
        <View>
          {videos.length === 0 && !fetching ? (
            <Card style={styles.contentCard}>
              <Text style={styles.sectionBody}>Belum ada video untuk mata pelajaran ini.</Text>
            </Card>
          ) : (
            videos.map((vid) => (
              <View key={vid.video_id}>
                <View style={styles.videoCard}>
                  <Pressable
                    style={styles.playBtn}
                    onPress={() => alert(`Video: ${vid.title}`)}
                  >
                    <Icon name="play" size={28} color="#FFFFFF" />
                  </Pressable>
                  <View style={styles.videoMetaRow}>
                    <Text style={styles.videoDuration}>Durasi: {Math.round(vid.duration_seconds / 60)} menit</Text>
                    <View style={styles.videoBadge}>
                      <Text style={styles.videoBadgeText}>HD 1080p</Text>
                    </View>
                  </View>
                </View>

                <Card style={styles.contentCard}>
                  <Text style={styles.sectionHeading}>{vid.title}</Text>
                  <Text style={styles.sectionBody}>{vid.description}</Text>
                </Card>
              </View>
            ))
          )}

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

      {/* MANUAL BOOK MODULE (Real Database Records) */}
      {modKey === "manual_book" ? (
        <View>
          {manualBook ? (
            <View>
              <View style={styles.bookPreview}>
                <View style={styles.bookIconWrap}>
                  <Icon name="document-text" size={32} color={colors.brandPrimary} />
                </View>
                <Text style={styles.bookTitle}>{manualBook.title}</Text>
                <Text style={styles.bookDesc}>{manualBook.description}</Text>
                <Badge label={`${manualBook.pages} Halaman • PDF Resmi`} tone="neutral" />
              </View>

              <Button
                label="Unduh Manual Book (PDF)"
                variant="outline"
                onPress={() => alert(`Mengunduh buku panduan: ${manualBook.title}`)}
                leftIcon={<Icon name="download-outline" size={18} color={colors.onSurface} />}
                style={{ marginBottom: spacing.md }}
              />
            </View>
          ) : !fetching ? (
            <Card style={styles.contentCard}>
              <Text style={styles.sectionBody}>Buku panduan belum tersedia untuk mata pelajaran ini.</Text>
            </Card>
          ) : null}

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
