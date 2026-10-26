import { Text, View } from "react-native";
import { makeStyles, radius, spacing, typography } from "@/src/theme";

interface Props {
  current: number; // 1-based
  total: number;
  answered: number;
}

const useStyles = makeStyles((colors) => ({
  wrap: { gap: spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: {
    color: colors.muted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  track: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
  },
}));

export function QuizProgressBar({ current, total, answered }: Props) {
  const styles = useStyles();
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <View style={styles.wrap} testID="quiz-progress">
      <View style={styles.row}>
        <Text style={styles.label}>
          Soal {current} dari {total}
        </Text>
        <Text style={styles.label}>{answered} terjawab</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}
