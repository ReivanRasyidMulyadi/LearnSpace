import { useCallback, useState } from "react";
import { Platform, Pressable, RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Icon,
  Input,
  LoadingSpinner,
  ScreenContainer,
} from "@/src/components/ui";
import { apiFetch } from "@/src/services/api";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import { formatRelative } from "@/src/utils/datetime";

interface AdminUser {
  user_id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  created_at?: string;
}

const useStyles = makeStyles((colors) => ({
  header: { paddingTop: spacing.md, marginBottom: spacing.md, gap: 2 },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  subtitle: { color: colors.muted, fontSize: typography.size.base },

  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.muted,
  },

  searchBar: {
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  userCard: {
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  userBody: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.onSurface,
  },
  userEmail: {
    fontSize: typography.size.xs,
    color: colors.muted,
  },
  userMeta: {
    fontSize: typography.size.xs,
    color: colors.muted,
    marginTop: 2,
  },
}));

export default function AdminUsersScreen() {
  const styles = useStyles();
  const { colors } = useTheme();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | "STUDENT" | "ADMIN">("ALL");

  const loadUsers = useCallback(() => {
    apiFetch<{ users: AdminUser[] }>("/dashboard/admin/users")
      .then((res) => setUsers(res.users || []))
      .catch(() => setUsers([]))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const totalStudents = users.filter((u) => u.role === "STUDENT").length;
  const totalAdmins = users.filter((u) => u.role === "ADMIN").length;

  if (loading) {
    return <LoadingSpinner fullScreen label="Memuat pengguna..." />;
  }

  return (
    <ScreenContainer
      scroll
      testID="admin-users"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Manajemen Pengguna</Text>
        <Text style={styles.subtitle}>Daftar seluruh akun siswa dan pengajar terdaftar.</Text>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Akun</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{totalStudents}</Text>
          <Text style={styles.statLabel}>Siswa Aktif</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{totalAdmins}</Text>
          <Text style={styles.statLabel}>Administrator</Text>
        </Card>
      </View>

      <Input
        placeholder="Cari berdasarkan nama atau email..."
        value={search}
        onChangeText={setSearch}
        containerStyle={styles.searchBar}
      />

      <View style={styles.filterRow}>
        <Chip
          label="Semua"
          selected={filterRole === "ALL"}
          onPress={() => setFilterRole("ALL")}
        />
        <Chip
          label={`Siswa (${totalStudents})`}
          selected={filterRole === "STUDENT"}
          onPress={() => setFilterRole("STUDENT")}
        />
        <Chip
          label={`Admin (${totalAdmins})`}
          selected={filterRole === "ADMIN"}
          onPress={() => setFilterRole("ADMIN")}
        />
      </View>

      {filteredUsers.map((u) => (
        <Card key={u.user_id} style={styles.userCard}>
          <Avatar name={u.name} size={40} />
          <View style={styles.userBody}>
            <Text style={styles.userName}>{u.name}</Text>
            <Text style={styles.userEmail}>{u.email}</Text>
            {u.created_at ? (
              <Text style={styles.userMeta}>Terdaftar {formatRelative(u.created_at)}</Text>
            ) : null}
          </View>
          <Badge
            label={u.role === "ADMIN" ? "Admin" : "Siswa"}
            tone={u.role === "ADMIN" ? "brand" : "neutral"}
          />
        </Card>
      ))}

      {filteredUsers.length === 0 ? (
        <Card style={{ padding: spacing.xl, alignItems: "center" }}>
          <Text style={{ color: colors.muted, fontSize: typography.size.sm }}>
            Tidak ada pengguna yang cocok dengan pencarian.
          </Text>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}
