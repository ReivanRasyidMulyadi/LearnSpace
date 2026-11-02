import { Redirect, Tabs } from "expo-router";
import { Platform, type ColorValue } from "react-native";
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

  const makeIcon = (name: IoniconName, activeName?: IoniconName) =>
    function TabBarIcon({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) {
      return <Icon name={focused && activeName ? activeName : name} size={22} color={String(color)} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: "#0D1017",
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === "web" ? 64 : 62,
          paddingTop: 8,
          paddingBottom: Platform.OS === "web" ? 8 : 8,
          ...(Platform.OS === "web" ? ({ boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.3)" } as any) : {}),
        },
        tabBarLabelStyle: {
          fontWeight: "600",
          fontSize: 11,
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarItemStyle: {
          alignSelf: "center",
          ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Beranda",
          tabBarIcon: makeIcon("home-outline", "home"),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: "Jadwal",
          tabBarIcon: makeIcon("time-outline", "time"),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Kalender",
          tabBarIcon: makeIcon("calendar-outline", "calendar"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: makeIcon("person-outline", "person"),
        }}
      />
    </Tabs>
  );
}
