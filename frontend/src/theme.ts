// Design tokens — Clean Minimalist (Apple / Notion) personality.
// Crisp typography, refined monochrome with subtle accents, ultra-soft shadows, razor-sharp borders.
// NEVER write hardcoded color literals in components. Use colors.* or useTheme().colors.

import { useMemo } from "react";
import { Appearance, Platform, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // Surfaces - Clean Minimalist (Apple / Notion)
  surface: "#F8FAFC", // Crisp off-white canvas
  onSurface: "#0F172A", // Deep slate text
  surfaceSecondary: "#FFFFFF", // Pure white cards & modals
  onSurfaceSecondary: "#0F172A",
  surfaceTertiary: "#F1F5F9", // Slate-100 for subtle fills / inputs
  onSurfaceTertiary: "#475569", // Slate-600 for secondary text
  surfaceInverse: "#0F172A", // Slate-900 for dark contrasting elements
  onSurfaceInverse: "#FFFFFF",
  muted: "#64748B", // Slate-500 for captions & metadata

  // Brand - Apple / Notion deep slate primary with electric knowledge blue accent
  brand: "#0F172A",
  onBrand: "#FFFFFF",
  brandPrimary: "#0F172A",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#2563EB", // Electric knowledge blue accent
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#EFF6FF", // Soft blue wash
  onBrandTertiary: "#1D4ED8", // Refined blue text

  // Status
  success: "#10B981", // Emerald green
  onSuccess: "#FFFFFF",
  warning: "#F59E0B", // Amber
  onWarning: "#FFFFFF",
  error: "#EF4444", // Crimson red
  onError: "#FFFFFF",
  info: "#F1F5F9",
  onInfo: "#0F172A",

  // Lines
  border: "#E2E8F0", // Clean 1px hairline border
  borderStrong: "#CBD5E1",
  divider: "#F1F5F9",
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
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

export const typography = {
  displayFamily: Platform.select({
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    default: undefined,
  }),
  textFamily: Platform.select({
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    default: undefined,
  }),
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 30,
  },
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "600" as const,
    display: "700" as const,
  },
} as const;

export const shadows = {
  card: Platform.select({
    web: {
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
    },
    default: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
  })!,
  cardElevated: Platform.select({
    web: {
      boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -2px rgba(0, 0, 0, 0.04)",
    },
    default: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
  })!,
  button: Platform.select({
    web: {
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    },
    default: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
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
