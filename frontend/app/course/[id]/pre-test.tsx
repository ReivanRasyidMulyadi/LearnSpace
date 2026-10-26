import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";
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
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.display,
    color: colors.onSurface,
  },
  subtitle: { color: colors.muted, fontSize: typography.size.sm },
  quizBody: { gap: spacing.lg },
  navRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm, marginBottom: spacing.xl },
  navBtn: { flex: 1 },
  errorText: { color: colors.error, textAlign: "center", marginTop: spacing.sm },
}));

function confirm(title: string, message: string, onOk: () => void) {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    if (window.confirm(`${title}\n\n${message}`)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: "Batal", style: "cancel" },
    { text: "Ya, kumpulkan", onPress: onOk },
  ]);
}

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
        // Already attempted elsewhere; show the stored result.
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
      confirm(
        "Masih ada soal kosong",
        `${unanswered} soal belum dijawab dan akan dianggap salah. Kumpulkan sekarang?`,
        submit,
      );
      return;
    }
    confirm("Kumpulkan jawaban?", "Pre-test hanya bisa dikerjakan satu kali.", submit);
  };

  if (loadError) {
    return (
      <ScreenContainer testID="pretest-error">
        <EmptyState
          icon="cloud-offline"
          title="Tidak bisa memuat pre-test"
          description={loadError}
          actionLabel="Coba lagi"
          onAction={load}
        />
      </ScreenContainer>
    );
  }

  if (!data) return <LoadingSpinner fullScreen label="Menyiapkan soal..." />;

  const question = data.questions[index];
  const total = data.questions.length;
  const isLast = index === total - 1;
  const answeredCount = Object.keys(answers).length;

  return (
    <ScreenContainer scroll testID="pretest-screen">
      <View style={styles.header}>
        <Pressable onPress={goBackToCourse} style={styles.backBtn} testID="pretest-back">
          <Icon name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Pre-Test</Text>
          <Text style={styles.subtitle}>{data.course_title}</Text>
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
        <PreTestResult attempt={attempt} courseTitle={data.course_title} onContinue={goBackToCourse} />
      ) : null}
    </ScreenContainer>
  );
}
