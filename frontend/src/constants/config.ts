// Centralized app config read from env; no hardcoded URLs.
import Constants from "expo-constants";

const expoExtra =
  (Constants.expoConfig?.extra as Record<string, string> | undefined) ?? {};

export const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  expoExtra.EXPO_PUBLIC_BACKEND_URL ||
  "";

export const API_URL = `${BACKEND_URL}/api`;

export const STORAGE_KEYS = {
  sessionToken: "learnspace.session_token",
} as const;

export const APP_NAME = "LearnSpace";
