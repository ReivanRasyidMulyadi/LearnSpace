import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { LogBox, Platform, Image } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { LoadingSpinner } from "@/src/components/ui";
import { AuthProvider, useAuth } from "@/src/hooks/useAuth";
import { queryClient } from "@/src/query-client";

LogBox.ignoreAllLogs(true);

// Prewarm asset so Expo Go on Android resolves the icon reliably.
try {
  const asset = require("../assets/images/icon.png");
  if (asset && Platform.OS !== "web") {
    Image.prefetch?.(Image.resolveAssetSource(asset)?.uri ?? "");
  }
} catch {
  /* noop */
}

function RouterGate() {
  const { state } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (state.status === "loading") return;
    const inAuth = segments[0] === "(auth)";
    const inStudent = segments[0] === "(student)";
    const inAdmin = segments[0] === "(admin)";

    if (state.status === "unauthenticated" && !inAuth) {
      router.replace("/(auth)/login");
      return;
    }
    if (state.status === "authenticated") {
      const role = state.user.role;
      if (role === "ADMIN" && !inAdmin) {
        router.replace("/(admin)/overview");
      } else if (role === "STUDENT" && !inStudent && segments[0] !== "course") {
        router.replace("/(student)/dashboard");
      }
    }
  }, [state, segments, router]);

  if (state.status === "loading") {
    return <LoadingSpinner fullScreen label="Memuat LearnSpace..." />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <KeyboardProvider>
              <AuthProvider>
                <RouterGate />
              </AuthProvider>
            </KeyboardProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
