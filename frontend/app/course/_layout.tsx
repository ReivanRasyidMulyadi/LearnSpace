import { Redirect, Stack } from "expo-router";

import { LoadingSpinner } from "@/src/components/ui";
import { useAuth } from "@/src/hooks/useAuth";

export default function CourseLayout() {
  const { state } = useAuth();
  if (state.status === "loading") {
    return <LoadingSpinner fullScreen label="Memuat sesi..." />;
  }
  if (state.status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }
  if (state.user.role !== "STUDENT") {
    return <Redirect href="/(admin)/overview" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}