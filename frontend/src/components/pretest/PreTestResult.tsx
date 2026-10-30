import { Text, View } from "react-native";

import { Badge, Button, Card, Icon } from "@/src/components/ui";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import type { TestAttempt } from "@/src/types/test";

interface Props {
  attempt: TestAttempt;
  courseTitle: string;
  onContinue: () => void;
  onRetake?: () => void;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

const useStyles = makeStyles((colors) => ({
  hero: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  heroLabel: {
    color: colors.onBrandPrimary,
    opacity: 0.9,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: 0.8,
  },
  score: {
    color: colors.onBrandPrimary,
    fontSize: 52,
    fontWeight: typography.weight.display,
    lineHeight: 60,
    letterSpacing: -1.5,
  },
  heroSub: {
    color: colors.onBrandPrimary,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  heroMsg: {
    color: colors.onBrandPrimary,
    opacity: 0.9,
    textAlign: "center",
    marginTop: spacing.xs,
    fontSize: typography.size.sm,
    lineHeight: 20,
    maxWidth: 380,
  },
  unlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  unlockIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  unlockText: {
    flex: 1,
    color: "#065F46",
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  reviewCard: {
    marginBottom: spacing.md,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  reviewHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  reviewQ: {
    flex: 1,
    color: colors.onSurface,
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.base,
    lineHeight: 22,
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: 2,
  },
  answerLabel: {
    color: colors.muted,
    fontSize: typography.size.xs,
    width: 76,
  },
  answerText: {
    flex: 1,
    color: colors.onSurface,
    fontSize: typography.size.sm,
  },
  answerCorrect: {
    color: "#047857",
    fontWeight: typography.weight.medium,
  },
  answerWrong: {
    color: "#B91C1C",
    fontWeight: typography.weight.medium,
  },
  cta: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
}));

function feedback(pct: number): string {
  if (pct >= 80) return "Luar biasa! Pengetahuan awalmu sudah sangat kuat. Silakan lanjut ke materi.";
  if (pct >= 50) return "Bagus! Kamu sudah memiliki dasar yang cukup. Lanjutkan modul untuk memperdalam.";
  return "Titik awal yang baik! Seluruh modul kini terbuka agar kamu dapat belajar bertahap.";
}

export function PreTestResult({ attempt, courseTitle, onContinue, onRetake }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const fmt = (i: number | null, opts: string[]) =>
    i === null || i === undefined ? "Tidak dijawab" : `${LETTERS[i]}. ${opts[i]}`;

  return (
    <View testID="pretest-result">
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>HASIL PRE-TEST {courseTitle.toUpperCase()}</Text>
        <Text style={styles.score} testID="pretest-score">{attempt.percentage}%</Text>
        <Text style={styles.heroSub}>
          {attempt.score} dari {attempt.total} soal benar
        </Text>
        <Text style={styles.heroMsg}>{feedback(attempt.percentage)}</Text>
      </View>

      <Card style={styles.unlock}>
        <View style={styles.unlockIconWrap}>
          <Icon name="lock-open-outline" size={20} color="#047857" />
        </View>
        <Text style={styles.unlockText}>
          Semua modul {courseTitle} kini terbuka. Lanjutkan ke materi pembelajaran!
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Pembahasan Soal</Text>
      {attempt.review.map((r) => (
        <Card key={r.question_id} style={styles.reviewCard}>
          <View style={styles.reviewHead}>
            <Text style={styles.reviewQ}>{r.text}</Text>
            <Badge
              label={r.is_correct ? "Benar" : "Salah"}
              tone={r.is_correct ? "success" : "error"}
            />
          </View>
          <View style={styles.answerRow}>
            <Text style={styles.answerLabel}>Jawabanmu:</Text>
            <Text style={[styles.answerText, r.is_correct ? styles.answerCorrect : styles.answerWrong]}>
              {fmt(r.selected_index, r.options)}
            </Text>
          </View>
          {!r.is_correct ? (
            <View style={styles.answerRow}>
              <Text style={styles.answerLabel}>Kunci:</Text>
              <Text style={[styles.answerText, styles.answerCorrect]}>
                {fmt(r.correct_index, r.options)}
              </Text>
            </View>
          ) : null}
        </Card>
      ))}

      <View style={{ gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xl }}>
        <Button
          label="Lanjut ke Materi Kelas"
          fullWidth
          onPress={onContinue}
          testID="pretest-continue"
          leftIcon={<Icon name="arrow-forward" size={16} color={colors.onBrandPrimary} />}
        />
        {onRetake ? (
          <Button
            label="Ulangi Pengerjaan Pre-Test"
            variant="outline"
            fullWidth
            onPress={onRetake}
            testID="pretest-retake"
            leftIcon={<Icon name="refresh-outline" size={16} color={colors.onSurface} />}
          />
        ) : null}
      </View>
    </View>
  );
}
