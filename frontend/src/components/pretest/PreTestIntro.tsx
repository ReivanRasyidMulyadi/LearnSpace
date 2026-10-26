import { Text, View } from "react-native";

import { Button, Card, Icon, type IoniconName } from "@/src/components/ui";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";

interface Props {
  courseTitle: string;
  totalQuestions: number;
  onStart: () => void;
}

const useStyles = makeStyles((colors) => ({
  hero: {
    backgroundColor: colors.brandSecondary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.display,
    color: colors.onBrandSecondary,
    textAlign: "center",
  },
  heroSub: {
    color: colors.onBrandSecondary,
    opacity: 0.8,
    fontSize: typography.size.base,
    textAlign: "center",
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  ruleText: { flex: 1, color: colors.onSurface, fontSize: typography.size.base },
  rulesTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  cta: { marginTop: spacing.xl },
}));

const RULES: Array<{ icon: IoniconName; text: (n: number) => string }> = [
  { icon: "list", text: (n) => `${n} soal pilihan ganda` },
  { icon: "time", text: () => "Tanpa batas waktu, kerjakan dengan tenang" },
  { icon: "repeat", text: () => "Hanya bisa dikerjakan satu kali sebagai tolok ukur awal" },
  { icon: "lock-open", text: () => "Setelah selesai, seluruh modul kelas akan terbuka" },
];

export function PreTestIntro({ courseTitle, totalQuestions, onStart }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View testID="pretest-intro">
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Icon name="clipboard" size={32} color={colors.brandPrimary} />
        </View>
        <Text style={styles.heroTitle}>Pre-Test {courseTitle}</Text>
        <Text style={styles.heroSub}>
          Ukur pengetahuan awalmu sebelum mulai belajar. Tidak ada jawaban salah yang menghukum —
          ini hanya titik awal.
        </Text>
      </View>

      <Card>
        <Text style={styles.rulesTitle}>Yang perlu kamu tahu</Text>
        {RULES.map((r) => (
          <View key={r.icon} style={styles.ruleRow}>
            <Icon name={r.icon} size={20} color={colors.onBrandTertiary} />
            <Text style={styles.ruleText}>{r.text(totalQuestions)}</Text>
          </View>
        ))}
      </Card>

      <Button
        label="Mulai Pre-Test"
        fullWidth
        style={styles.cta}
        onPress={onStart}
        testID="pretest-start"
        leftIcon={<Icon name="play" size={18} color={colors.onBrandPrimary} />}
      />
    </View>
  );
}
