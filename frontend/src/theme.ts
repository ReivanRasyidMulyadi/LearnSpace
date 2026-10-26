// Design tokens from /app/design_guidelines.json — Tactile/Playful personality.
// NEVER write color literals in components. Use colors.* or useTheme().colors.

import { useMemo } from "react";
import { Appearance, Platform, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // Surfaces
  surface: "#FDFCF9",
  onSurface: "#1C1C1F",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#1C1C1F",
  surfaceTertiary: "#F2F1EC",
  onSurfaceTertiary: "#4A4A4D",
  surfaceInverse: "#1C1C1F",
  onSurfaceInverse: "#FDFCF9",
  muted: "#8A8A8E",

  // Brand
  brand: "#FF715B",
  onBrand: "#FFFFFF",
  brandPrimary: "#FF715B",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FFD166",
  onBrandSecondary: "#1C1C1F",
  brandTertiary: "#FDE6E2",
  onBrandTertiary: "#D94A38",

  // Status
  success: "#34C759",
  onSuccess: "#FFFFFF",
  warning: "#FFD166",
  onWarning: "#1C1C1F",
  error: "#FF3B30",
  onError: "#FFFFFF",
  info: "#E5E5EA",
  onInfo: "#1C1C1F",

  // Lines
  border: "#EBEBE6",
  borderStrong: "#D6D6D1",
  divider: "#F2F2ED",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const typography = {
  displayFamily: undefined as string | undefined, // system; swap for "Fredoka" when font is loaded
  textFamily: undefined as string | undefined, // system; swap for "Nunito"
  size: {
    sm: 12,
    base: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    display: 32,
  },
  weight: {
    regular: "400" as const,
    medium: "600" as const,
    bold: "700" as const,
    display: "800" as const,
  },
} as const;

export const shadows = {
  // Tier 2 — chunky tactile cards
  card: Platform.select({
    web: { boxShadow: "0 4px 12px rgba(28, 28, 31, 0.08)" },
    default: {
      shadowColor: "#1C1C1F",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
  })!,
  button: Platform.select({
    web: { boxShadow: "0 2px 6px rgba(28, 28, 31, 0.10)" },
    default: {
      shadowColor: "#1C1C1F",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
  })!,
} as const;

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system === "dark" && themes.dark ? "dark" : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

export const colors = light;
