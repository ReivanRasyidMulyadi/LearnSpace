import { Modal, Pressable, Text, View } from "react-native";

import { Button, Icon } from "@/src/components/ui";
import { makeStyles, radius, spacing, typography } from "@/src/theme";

interface LogoutConfirmDialogProps {
  visible: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const useStyles = makeStyles((colors) => ({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(28, 28, 31, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { gap: spacing.sm },
  title: {
    color: colors.onSurface,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  description: {
    color: colors.muted,
    fontSize: typography.size.lg,
    lineHeight: 24,
  },
  actions: { gap: spacing.sm },
}));

export function LogoutConfirmDialog({
  visible,
  loading,
  onCancel,
  onConfirm,
}: LogoutConfirmDialogProps) {
  const styles = useStyles();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        style={styles.backdrop}
        onPress={loading ? undefined : onCancel}
        testID="logout-confirm-backdrop"
      >
        <Pressable
          style={styles.card}
          onPress={(event) => event.stopPropagation()}
          testID="logout-confirm-dialog"
        >
          <View style={styles.icon}>
            <Icon name="log-out-outline" size={26} color="#D94A38" />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title} testID="logout-confirm-title">
              Keluar dari LearnSpace?
            </Text>
            <Text style={styles.description} testID="logout-confirm-message">
              Sesi di perangkat ini akan diakhiri. Progres belajar tetap tersimpan.
            </Text>
          </View>
          <View style={styles.actions}>
            <Button
              label="Ya, keluar"
              onPress={onConfirm}
              loading={loading}
              fullWidth
              testID="logout-confirm-button"
            />
            <Button
              label="Batal"
              variant="ghost"
              onPress={onCancel}
              disabled={loading}
              fullWidth
              testID="logout-cancel-button"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}