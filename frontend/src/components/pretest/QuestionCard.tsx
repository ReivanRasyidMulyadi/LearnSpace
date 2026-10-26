import { Platform, Pressable, Text, View } from "react-native";

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
  card: {
    padding: spacing.xl,
  },
  question: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    lineHeight: 26,
    marginBottom: spacing.lg,
    letterSpacing: -0.2,
  },
  option: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.sm,
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any) : {}),
  },
  optionSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.surfaceTertiary,
    ...(Platform.OS === "web" ? ({ boxShadow: "0 0 0 1px #0F172A" } as any) : {}),
  },
  letter: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  letterSelected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  letterText: {
    fontWeight: typography.weight.semibold,
    color: colors.onSurface,
    fontSize: typography.size.xs,
  },
  letterTextSelected: {
    color: colors.onBrandPrimary,
  },
  optionText: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.onSurface,
    fontWeight: typography.weight.regular,
    lineHeight: 22,
  },
}));

export function QuestionCard({ question, selectedIndex, onSelect }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <Card style={styles.card} testID={`question-${question.question_id}`}>
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
              <Icon name="checkmark-circle" size={20} color={colors.brandPrimary} />
            ) : null}
          </Pressable>
        );
      })}
    </Card>
  );
}
