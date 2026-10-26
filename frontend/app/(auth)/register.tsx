import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";

import {
  Button,
  Icon,
  Input,
  ScreenContainer,
} from "@/src/components/ui";
import { useAuth } from "@/src/hooks/useAuth";
import { makeStyles, radius, spacing, typography } from "@/src/theme";
import {
  type AuthFieldErrors,
  validateRegistration,
} from "@/src/services/auth.validation";

const useStyles = makeStyles((colors) => ({
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.display,
    color: colors.onSurface,
  },
  subtitle: { fontSize: typography.size.base, color: colors.muted },
  form: { gap: spacing.md },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
  },
  accountInfoText: { flex: 1, color: colors.onBrandTertiary },
  errorText: { color: colors.error, fontSize: typography.size.sm, textAlign: "center" },
  footer: {
    marginTop: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
  footerText: { color: colors.muted, fontSize: typography.size.base },
  footerLink: {
    color: colors.brandPrimary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.base,
  },
}));

export default function RegisterScreen() {
  const styles = useStyles();
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
            setFieldErrors((current) => ({
              ...current,
              confirmPassword: undefined,
            }));
            clearError();
          }}
          error={fieldErrors.confirmPassword}
          testID="register-confirm-password-input"
        />

        <View style={styles.accountInfo} testID="register-student-role-info">
          <Icon name="school-outline" size={22} color="#D94A38" />
          <Text style={styles.accountInfoText}>
            Akun baru otomatis dibuat sebagai Siswa. Akun Admin dikelola secara aman oleh sistem.
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
            <Text style={styles.footerLink}>Masuk</Text>
          </Pressable>
        </Link>
      </View>
    </ScreenContainer>
  );
}
