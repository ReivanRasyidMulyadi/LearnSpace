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
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  heroSub: {
    color: colors.muted,
    fontSize: typography.size.base,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 420,
    marginTop: spacing.xs,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  ruleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  ruleText: { flex: 1, color: colors.onSurface, fontSize: typography.size.sm, lineHeight: 20 },
  rulesTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  cta: { marginTop: spacing.xl },
}));

const RULES: Array<{ icon: IoniconName; text: (n: number) => string }> = [
  { icon: "list-outline", text: (n) => `${n} soal pilihan ganda` },
  { icon: "time-outline", text: () => "Tanpa batas waktu, kerjakan dengan tenang" },
  { icon: "repeat-outline", text: () => "Hanya bisa dikerjakan satu kali sebagai tolok ukur awal" },
  { icon: "lock-open-outline", text: () => "Setelah selesai, seluruh modul kelas akan terbuka" },
];

export function PreTestIntro({ courseTitle, totalQuestions, onStart }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View testID="pretest-intro">
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Icon name="clipboard-outline" size={26} color={colors.onSurface} />
        </View>
        <Text style={styles.heroTitle}>Pre-Test {courseTitle}</Text>
        <Text style={styles.heroSub}>
          Ukur pemahaman awal sebelum memulai kelas. Hasil pre-test tidak memengaruhi nilai akhirmu.
        </Text>
      </View>

      <Card>
        <Text style={styles.rulesTitle}>Petunjuk Pengerjaan</Text>
        {RULES.map((r) => (
          <View key={r.icon} style={styles.ruleRow}>
            <View style={styles.ruleIconWrap}>
              <Icon name={r.icon} size={16} color={colors.muted} />
            </View>
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
        leftIcon={<Icon name="play" size={16} color={colors.onBrandPrimary} />}
      />
    </View>
  );
}
