import { Redirect, Tabs } from "expo-router";
import { Platform, type ColorValue } from "react-native";
import { useTheme } from "@/src/theme";
import { Icon, LoadingSpinner, type IoniconName } from "@/src/components/ui";
import { useAuth } from "@/src/hooks/useAuth";

export default function AdminLayout() {
  const { colors } = useTheme();
  const { state } = useAuth();

  if (state.status === "loading") {
    return <LoadingSpinner fullScreen label="Memuat sesi..." />;
  }
  if (state.status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }
  if (state.user.role !== "ADMIN") {
    return <Redirect href="/(student)/dashboard" />;
  }

  const makeIcon = (name: IoniconName) =>
    function TabBarIcon({ color, size }: { color: ColorValue; size: number }) {
      return <Icon name={name} size={20} color={String(color)} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === "web" ? 62 : 60,
          paddingTop: 6,
          paddingBottom: Platform.OS === "web" ? 8 : 6,
          ...(Platform.OS === "web" ? ({ boxShadow: "0 -1px 2px 0 rgba(0, 0, 0, 0.02)" } as any) : {}),
        },
        tabBarLabelStyle: { fontWeight: "600", fontSize: 11 },
        tabBarItemStyle: {
          alignSelf: "center",
          ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
        },
      }}
    >
      <Tabs.Screen
        name="overview"
        options={{ title: "Overview", tabBarIcon: makeIcon("grid") }}
      />
      <Tabs.Screen
        name="users"
        options={{ title: "Users", tabBarIcon: makeIcon("people") }}
      />
      <Tabs.Screen
        name="content"
        options={{ title: "Content", tabBarIcon: makeIcon("library") }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: "Analytics", tabBarIcon: makeIcon("bar-chart") }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: "Reports", tabBarIcon: makeIcon("document-text") }}
      />
    </Tabs>
  );
}
