import { Pressable, Text, View } from "react-native";

import { Card, Icon } from "@/src/components/ui";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import type { TestQuestion } from "@/src/types/test";

interface Props {
  question: TestQuestion;
  selectedIndex: number | undefined;
  onSelect: (index: number) => void;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

const useStyles = makeStyles((colors) => ({
  question: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    lineHeight: 28,
    marginBottom: spacing.lg,
  },
  option: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.sm,
  },
  optionSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandTertiary,
  },
  letter: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  letterSelected: { backgroundColor: colors.brandPrimary },
  letterText: {
    fontWeight: typography.weight.bold,
    color: colors.onSurfaceTertiary,
    fontSize: typography.size.base,
  },
  letterTextSelected: { color: colors.onBrandPrimary },
  optionText: {
    flex: 1,
    fontSize: typography.size.lg,
    color: colors.onSurface,
    fontWeight: typography.weight.medium,
  },
}));

export function QuestionCard({ question, selectedIndex, onSelect }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Card elevated testID={`question-${question.question_id}`}>
      <Text style={styles.question}>{question.text}</Text>
      {question.options.map((opt, i) => {
        const selected = selectedIndex === i;
        return (
          <Pressable
            key={i}
            onPress={() => onSelect(i)}
            style={({ pressed }) => [
              styles.option,
              selected && styles.optionSelected,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            testID={`option-${i}`}
          >
            <View style={[styles.letter, selected && styles.letterSelected]}>
              <Text style={[styles.letterText, selected && styles.letterTextSelected]}>
                {LETTERS[i]}
              </Text>
            </View>
            <Text style={styles.optionText}>{opt}</Text>
            {selected ? (
              <Icon name="checkmark-circle" size={22} color={colors.brandPrimary} />
            ) : null}
          </Pressable>
        );
      })}
    </Card>
  );
}
