import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";

import {
  Button,
  Icon,
  Input,
  ScreenContainer,
} from "@/src/components/ui";
import { useAuth } from "@/src/hooks/useAuth";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import {
  type AuthFieldErrors,
  validateRegistration,
} from "@/src/services/auth.validation";

const useStyles = makeStyles((colors) => ({
  container: {
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    paddingVertical: spacing.xl,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  subtitle: { fontSize: typography.size.base, color: colors.muted },
  form: { gap: spacing.md },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountInfoText: { flex: 1, color: colors.onSurfaceTertiary, fontSize: typography.size.xs, lineHeight: 18 },
  errorText: { color: colors.error, fontSize: typography.size.sm, textAlign: "center" },
  footer: {
    marginTop: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
  footerText: { color: colors.muted, fontSize: typography.size.sm },
  footerLink: {
    color: colors.onSurface,
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.sm,
    textDecorationLine: "underline",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
}));

export default function RegisterScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { register, operation, error, clearError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const onSubmit = async () => {
    clearError();
    const errors = validateRegistration(name, email, password, confirmPassword);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      await register({ email: email.trim(), password, name: name.trim() });
    } catch {
      // Error state is owned by AuthProvider.
    }
  };

  return (
    <ScreenContainer scroll keyboardAvoiding testID="register-screen">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Buat Akun Baru</Text>
          <Text style={styles.subtitle}>
            Mulai perjalanan belajarmu di LearnSpace.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nama Lengkap"
            placeholder="Nama kamu"
            value={name}
            onChangeText={(value) => {
              setName(value);
              setFieldErrors((current) => ({ ...current, name: undefined }));
              clearError();
            }}
            error={fieldErrors.name}
            testID="register-name-input"
          />
          <Input
            label="Email"
            placeholder="nama@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setFieldErrors((current) => ({ ...current, email: undefined }));
              clearError();
            }}
            error={fieldErrors.email}
            testID="register-email-input"
          />
          <Input
            label="Password"
            placeholder="Minimal 8 karakter"
            secureTextEntry
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setFieldErrors((current) => ({ ...current, password: undefined }));
              clearError();
            }}
            error={fieldErrors.password}
            testID="register-password-input"
          />
          <Input
            label="Konfirmasi Password"
            placeholder="Ulangi password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
              clearError();
            }}
            error={fieldErrors.confirmPassword}
            testID="register-confirm-password-input"
          />

          <View style={styles.accountInfo}>
            <Icon name="information-circle-outline" size={20} color={colors.muted} />
            <Text style={styles.accountInfoText}>
              Akun baru otomatis didaftarkan sebagai Siswa. Akses admin diatur secara terpisah oleh pengelola.
            </Text>
          </View>

          {error ? (
            <Text style={styles.errorText} testID="register-auth-error">
              {error}
            </Text>
          ) : null}

          <Button
            label="Daftar"
            onPress={onSubmit}
            loading={operation === "register"}
            disabled={operation !== null && operation !== "register"}
            fullWidth
            testID="register-submit-button"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sudah punya akun?</Text>
          <Link href="/(auth)/login" asChild>
            <Pressable testID="go-to-login-link">
              <Text style={styles.footerLink}>Masuk di sini</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </ScreenContainer>
  );
}
