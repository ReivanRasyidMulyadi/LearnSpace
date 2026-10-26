import { Redirect, Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { useTheme } from "@/src/theme";
import { Icon, LoadingSpinner, type IoniconName } from "@/src/components/ui";
import { useAuth } from "@/src/hooks/useAuth";

export default function StudentLayout() {
  const { colors } = useTheme();
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

  const makeIcon = (name: IoniconName) =>
    function TabBarIcon({ color, size }: { color: ColorValue; size: number }) {
      return <Icon name={name} size={size} color={String(color)} />;
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
        },
        tabBarLabelStyle: { fontWeight: "600", fontSize: 12 },
        tabBarItemStyle: { alignSelf: "center" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Beranda",
          tabBarIcon: makeIcon("home"),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: "Kelas",
          tabBarIcon: makeIcon("book"),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progres",
          tabBarIcon: makeIcon("stats-chart"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: makeIcon("person"),
        }}
      />
    </Tabs>
  );
}
