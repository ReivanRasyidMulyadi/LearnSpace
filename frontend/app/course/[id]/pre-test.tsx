import { useCallback, useEffect, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { PreTestIntro } from "@/src/components/pretest/PreTestIntro";
import { PreTestResult } from "@/src/components/pretest/PreTestResult";
import { QuestionCard } from "@/src/components/pretest/QuestionCard";
import { QuizProgressBar } from "@/src/components/pretest/QuizProgressBar";
import { Button, EmptyState, Icon, LoadingSpinner, ScreenContainer } from "@/src/components/ui";
import { ApiError } from "@/src/services/api";
import { testsService } from "@/src/services/tests.service";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import type { PreTestData, TestAttempt } from "@/src/types/test";

type Phase = "intro" | "quiz" | "result";

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
  quizBody: { gap: spacing.md },
  navRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  navBtn: { flex: 1 },
  errorText: { color: colors.error, textAlign: "center", marginTop: spacing.sm, fontSize: typography.size.sm },

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
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  modalMessage: {
    fontSize: typography.size.base,
    color: colors.onSurfaceTertiary,
    lineHeight: 22,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
}));

export default function PreTestScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const courseId = id ?? "";

  const [data, setData] = useState<PreTestData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; message: string } | null>(null);

  const load = useCallback(() => {
    setLoadError(null);
    testsService
      .getPreTest(courseId)
      .then((d) => {
        setData(d);
        if (d.attempt) {
          setAttempt(d.attempt);
          setPhase("result");
        }
      })
      .catch((e: ApiError) => setLoadError(e.detail ?? "Gagal memuat pre-test"));
  }, [courseId]);

  useEffect(() => {
    if (courseId) load();
  }, [courseId, load]);

  const handleRetake = async () => {
    try {
      await testsService.resetPreTest(courseId);
    } catch {
      // ignore
    }
    setAttempt(null);
    setAnswers({});
    setIndex(0);
    setPhase("intro");
  };

  const goBackToCourse = () => router.replace(`/course/${courseId}`);

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await testsService.submitPreTest(courseId, answers);
      setAttempt(result);
      setPhase("result");
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 409) {
        load();
      } else {
        setSubmitError("Gagal mengirim jawaban. Periksa koneksi dan coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPress = () => {
    const total = data?.questions.length ?? 0;
    const unanswered = total - Object.keys(answers).length;
    if (unanswered > 0) {
      setConfirmConfig({
        title: "Masih ada soal kosong",
        message: `${unanswered} dari ${total} soal belum dijawab dan akan dianggap salah. Yakin ingin mengumpulkan sekarang?`,
      });
      return;
    }
    setConfirmConfig({
      title: "Kumpulkan jawaban?",
      message: "Pre-test hanya bisa dikerjakan satu kali untuk membuka modul berikutnya.",
    });
  };

  if (loadError) {
    return (
      <ScreenContainer testID="pretest-error">
        <EmptyState
          icon="cloud-offline-outline"
          title="Tidak bisa memuat pre-test"
          description={loadError}
          actionLabel="Coba lagi"
          onAction={load}
        />
      </ScreenContainer>
    );
  }

  if (!data) return <LoadingSpinner fullScreen label="Memuat pre-test..." />;

  const questions = data.questions;
  const total = questions.length;
  const question = questions[index];
  const answeredCount = Object.keys(answers).length;
  const isLast = index === total - 1;

  return (
    <ScreenContainer scroll testID="pretest-screen">
      <View style={styles.header}>
        <Pressable onPress={goBackToCourse} style={styles.backBtn} testID="pretest-back">
          <Icon name="arrow-back" size={18} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>{data.course_title}</Text>
          <Text style={styles.subtitle}>Pre-Test</Text>
        </View>
      </View>

      {phase === "intro" ? (
        <PreTestIntro
          courseTitle={data.course_title}
          totalQuestions={total}
          onStart={() => setPhase("quiz")}
        />
      ) : null}

      {phase === "quiz" && question ? (
        <View style={styles.quizBody}>
          <QuizProgressBar current={index + 1} total={total} answered={answeredCount} />
          <QuestionCard
            question={question}
            selectedIndex={answers[question.question_id]}
            onSelect={(i) => setAnswers((prev) => ({ ...prev, [question.question_id]: i }))}
          />
          {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
          <View style={styles.navRow}>
            <Button
              label="Sebelumnya"
              variant="outline"
              style={styles.navBtn}
              disabled={index === 0 || submitting}
              onPress={() => setIndex((i) => Math.max(0, i - 1))}
              testID="quiz-prev"
            />
            {isLast ? (
              <Button
                label="Kumpulkan"
                style={styles.navBtn}
                loading={submitting}
                onPress={handleSubmitPress}
                testID="quiz-submit"
              />
            ) : (
              <Button
                label="Berikutnya"
                style={styles.navBtn}
                onPress={() => setIndex((i) => Math.min(total - 1, i + 1))}
                testID="quiz-next"
              />
            )}
          </View>
        </View>
      ) : null}

      {phase === "result" && attempt ? (
        <PreTestResult
          attempt={attempt}
          courseTitle={data.course_title}
          onContinue={goBackToCourse}
          onRetake={handleRetake}
        />
      ) : null}

      {/* Confirmation Modal */}
      <Modal
        visible={confirmConfig !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmConfig(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setConfirmConfig(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{confirmConfig?.title}</Text>
            <Text style={styles.modalMessage}>{confirmConfig?.message}</Text>
            <View style={styles.modalBtnRow}>
              <Button
                label="Batal"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => setConfirmConfig(null)}
              />
              <Button
                label="Kumpulkan"
                variant="primary"
                style={{ flex: 1 }}
                onPress={() => {
                  setConfirmConfig(null);
                  submit();
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}
