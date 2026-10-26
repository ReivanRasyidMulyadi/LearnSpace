import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { makeStyles, typography } from "@/src/theme";

export interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const useStyles = makeStyles((colors) => ({
  base: {
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: {
    color: colors.onSurface,
    fontWeight: typography.weight.semibold,
  },
}));

export function Avatar({ name, uri, size = 48 }: AvatarProps) {
  const styles = useStyles();
  const dim = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return (
      <View style={[styles.base, dim]}>
        <Image source={{ uri }} style={{ width: size, height: size }} />
      </View>
    );
  }
  return (
    <View style={[styles.base, dim]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
        {initials(name)}
      </Text>
    </View>
  );
}
