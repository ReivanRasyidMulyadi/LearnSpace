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
import {
  type AuthFieldErrors,
  validateLogin,
} from "@/src/services/auth.validation";
import { makeStyles, radius, spacing, typography } from "@/src/theme";

const useStyles = makeStyles((colors) => ({
  hero: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  logoBubble: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: typography.size.display,
    fontWeight: typography.weight.display,
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.muted,
  },
  form: { gap: spacing.md, marginTop: spacing.lg },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.muted, fontSize: typography.size.sm },
  errorText: {
    color: colors.error,
    fontSize: typography.size.sm,
    textAlign: "center",
  },
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

export default function LoginScreen() {
  const styles = useStyles();
  const {
    loginWithPassword,
    loginWithGoogle,
    operation,
    error,
    clearError,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const onSubmit = async () => {
    clearError();
    const errors = validateLogin(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      await loginWithPassword(email.trim(), password);
    } catch {
      // Error state is owned by AuthProvider.
    }
  };

  const onGoogle = async () => {
    clearError();
    try {
      await loginWithGoogle();
    } catch {
      // Error state is owned by AuthProvider.
    }
  };

  return (
    <ScreenContainer scroll keyboardAvoiding testID="login-screen">
      <View style={styles.hero}>
        <View style={styles.logoBubble}>
          <Icon name="school" size={44} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>LearnSpace</Text>
        <Text style={styles.subtitle}>Belajar jadi menyenangkan.</Text>
      </View>

      <View style={styles.form}>
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
          testID="login-email-input"
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
          testID="login-password-input"
        />
        {error ? (
          <Text style={styles.errorText} testID="login-auth-error">
            {error}
          </Text>
        ) : null}
        <Button
          label="Masuk"
          onPress={onSubmit}
          loading={operation === "login"}
          disabled={operation !== null && operation !== "login"}
          fullWidth
          testID="login-submit-button"
        />
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>atau</Text>
        <View style={styles.dividerLine} />
      </View>

      <Button
        label="Lanjutkan dengan Google"
        variant="outline"
        onPress={onGoogle}
        loading={operation === "google"}
        disabled={operation !== null && operation !== "google"}
        fullWidth
        leftIcon={<Icon name="logo-google" size={18} color="#1C1C1F" />}
        testID="login-google-button"
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Belum punya akun?</Text>
        <Link href="/(auth)/register" asChild>
          <Pressable testID="go-to-register-link">
            <Text style={styles.footerLink}>Daftar sekarang</Text>
          </Pressable>
        </Link>
      </View>
    </ScreenContainer>
  );
}
