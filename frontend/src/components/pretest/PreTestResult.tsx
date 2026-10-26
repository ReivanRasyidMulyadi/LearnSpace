import { Text, View } from "react-native";

import { Badge, Button, Card, Icon } from "@/src/components/ui";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import type { TestAttempt } from "@/src/types/test";

interface Props {
  attempt: TestAttempt;
  courseTitle: string;
  onContinue: () => void;
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
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    letterSpacing: 1,
  },
  score: {
    color: colors.onBrandPrimary,
    fontSize: 56,
    fontWeight: typography.weight.display,
    lineHeight: 64,
  },
  heroSub: { color: colors.onBrandPrimary, fontSize: typography.size.lg, fontWeight: typography.weight.bold },
  heroMsg: {
    color: colors.onBrandPrimary,
    opacity: 0.9,
    textAlign: "center",
    marginTop: spacing.sm,
    fontSize: typography.size.base,
  },
  unlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  unlockText: { flex: 1, color: colors.onSurface, fontSize: typography.size.base, fontWeight: typography.weight.medium },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  reviewCard: { marginBottom: spacing.md, gap: spacing.sm },
  reviewHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  reviewQ: { flex: 1, color: colors.onSurface, fontWeight: typography.weight.bold, fontSize: typography.size.base },
  answerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  answerLabel: { color: colors.muted, fontSize: typography.size.sm, width: 84 },
  answerText: { flex: 1, color: colors.onSurface, fontSize: typography.size.base },
  answerCorrect: { color: colors.success, fontWeight: typography.weight.bold },
  answerWrong: { color: colors.error, fontWeight: typography.weight.bold },
  cta: { marginTop: spacing.md, marginBottom: spacing.xl },
}));

function feedback(pct: number): string {
  if (pct >= 80) return "Luar biasa! Pengetahuan awalmu sudah kuat. Materi akan membantumu menyempurnakannya.";
  if (pct >= 50) return "Bagus! Kamu sudah punya dasar yang cukup. Yuk perdalam lewat materi dan video.";
  return "Tidak masalah — ini baru titik awal. Materi berikutnya dirancang untuk membantumu naik level.";
}

export function PreTestResult({ attempt, courseTitle, onContinue }: Props) {
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
          {attempt.score} dari {attempt.total} benar
        </Text>
        <Text style={styles.heroMsg}>{feedback(attempt.percentage)}</Text>
      </View>

      <Card tone="brandTertiary" style={styles.unlock}>
        <Icon name="lock-open" size={24} color={colors.onBrandTertiary} />
        <Text style={styles.unlockText}>
          Semua modul {courseTitle} kini terbuka. Lanjutkan ke Materi!
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Pembahasan</Text>
      {attempt.review.map((r) => (
        <Card key={r.question_id} style={styles.reviewCard} testID={`review-${r.question_id}`}>
          <View style={styles.reviewHead}>
            <Text style={styles.reviewQ}>
              {r.order}. {r.text}
            </Text>
            <Badge label={r.is_correct ? "Benar" : "Salah"} tone={r.is_correct ? "success" : "error"} />
          </View>
          <View style={styles.answerRow}>
            <Text style={styles.answerLabel}>Jawabanmu</Text>
            <Text style={[styles.answerText, r.is_correct ? styles.answerCorrect : styles.answerWrong]}>
              {fmt(r.selected_index, r.options)}
            </Text>
          </View>
          {!r.is_correct ? (
            <View style={styles.answerRow}>
              <Text style={styles.answerLabel}>Kunci</Text>
              <Text style={[styles.answerText, styles.answerCorrect]}>
                {fmt(r.correct_index, r.options)}
              </Text>
            </View>
          ) : null}
        </Card>
      ))}

      <Button
        label="Lanjut ke Materi"
        fullWidth
        style={styles.cta}
        onPress={onContinue}
        testID="pretest-continue"
        leftIcon={<Icon name="arrow-forward" size={18} color={colors.onBrandPrimary} />}
      />
    </View>
  );
}
