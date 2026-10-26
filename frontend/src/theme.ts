// Design tokens — Oceanic Royal Blue EdTech personality (Light & Dark Mode).
// Crisp typography, trusted vibrant royal blue primary, soft air washes, ultra-soft shadows, razor-sharp borders.
// NEVER write hardcoded color literals in components. Use colors.* or useTheme().colors.

import { useEffect, useMemo, useState } from "react";
import { Appearance, Platform, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // Surfaces - Clean Modern Oceanic Canvas
  surface: "#F8FAFC", // Crisp clean off-white
  onSurface: "#0F172A", // Deep slate text for optimal readability
  surfaceSecondary: "#FFFFFF", // Pure white cards & panels
  onSurfaceSecondary: "#0F172A",
  surfaceTertiary: "#F1F5F9", // Slate-100 for inputs & subtle fills
  onSurfaceTertiary: "#475569", // Slate-600 for secondary text
  surfaceInverse: "#0F172A", // Deep slate for dark contrast banners
  onSurfaceInverse: "#FFFFFF",
  muted: "#64748B", // Slate-500 for captions & metadata

  // Brand - Oceanic Royal Blue (Vibrant, friendly, trusted modern education)
  brand: "#2563EB", // Oceanic Royal Blue
  onBrand: "#FFFFFF",
  brandPrimary: "#2563EB", // Royal Blue for buttons and key actions
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#3B82F6", // Bright blue accent
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#EFF6FF", // Soft blue pastel wash
  onBrandTertiary: "#1D4ED8", // Deep royal blue text

  // Status
  success: "#10B981", // Emerald green
  onSuccess: "#FFFFFF",
  warning: "#F59E0B", // Amber
  onWarning: "#FFFFFF",
  error: "#EF4444", // Crimson red
  onError: "#FFFFFF",
  info: "#EFF6FF",
  onInfo: "#1D4ED8",

  // Lines
  border: "#E2E8F0", // Clean 1px hairline border
  borderStrong: "#CBD5E1",
  divider: "#F1F5F9",
};

const dark: ThemeColors = {
  // Surfaces - Deep Midnight Navy (OLED friendly)
  surface: "#0B1120",
  onSurface: "#F8FAFC",
  surfaceSecondary: "#1E293B",
  onSurfaceSecondary: "#F8FAFC",
  surfaceTertiary: "#0F172A",
  onSurfaceTertiary: "#94A3B8",
  surfaceInverse: "#F8FAFC",
  onSurfaceInverse: "#0B1120",
  muted: "#64748B",

  // Brand - Glowing Royal Blue
  brand: "#3B82F6",
  onBrand: "#FFFFFF",
  brandPrimary: "#3B82F6",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#60A5FA",
  onBrandSecondary: "#0B1120",
  brandTertiary: "#1E3A8A",
  onBrandTertiary: "#93C5FD",

  // Status
  success: "#10B981",
  onSuccess: "#FFFFFF",
  warning: "#F59E0B",
  onWarning: "#FFFFFF",
  error: "#EF4444",
  onError: "#FFFFFF",
  info: "#1E3A8A",
  onInfo: "#93C5FD",

  // Lines
  border: "#334155",
  borderStrong: "#475569",
  divider: "#1E293B",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark: ThemeColors } = { light, dark };

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
      boxShadow: "0 4px 12px -2px rgba(37, 99, 235, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.04)",
    },
    default: {
      shadowColor: "#2563EB",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
  })!,
  button: Platform.select({
    web: {
      boxShadow: "0 2px 4px 0 rgba(37, 99, 235, 0.2)",
    },
    default: {
      shadowColor: "#2563EB",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 3,
      elevation: 2,
    },
  })!,
} as const;

let currentScheme: ColorScheme = defaultScheme;
const listeners = new Set<(scheme: ColorScheme) => void>();

export function setColorScheme(scheme: ColorScheme | null) {
  currentScheme = scheme ?? "light";
  Appearance.setColorScheme?.(scheme ?? "unspecified");
  listeners.forEach((fn) => fn(currentScheme));
}

export function useTheme(): {
  scheme: ColorScheme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setScheme: (scheme: ColorScheme) => void;
} {
  const [scheme, setSchemeState] = useState<ColorScheme>(currentScheme);

  useEffect(() => {
    listeners.add(setSchemeState);
    return () => {
      listeners.delete(setSchemeState);
    };
  }, []);

  const toggleTheme = () => {
    setColorScheme(scheme === "dark" ? "light" : "dark");
  };

  return {
    scheme,
    colors: themes[scheme] ?? themes.light,
    toggleTheme,
    setScheme: setColorScheme,
  };
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
