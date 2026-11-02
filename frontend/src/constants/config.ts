// Centralized app config read from env or auto-detected host for mobile devices
import Constants from "expo-constants";

const expoExtra =
  (Constants.expoConfig?.extra as Record<string, string> | undefined) ?? {};

const resolveBackendUrl = (): string => {
  // 1. Web browser: use current hostname if accessed via LAN IP (e.g. 192.168.x.x on mobile phone)
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:8000`;
    }
  }

  // 2. React Native / Expo on Android/iOS device: auto-detect dev server IP from hostUri
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:8000`;
    }
  }

  // 3. Fallback to env or local IP
  return (
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    expoExtra.EXPO_PUBLIC_BACKEND_URL ||
    "http://127.0.0.1:8000"
  );
};

export const BACKEND_URL = resolveBackendUrl();

export const API_URL = `${BACKEND_URL}/api`;

export const STORAGE_KEYS = {
  sessionToken: "learnspace.session_token",
} as const;

export const APP_NAME = "LearnSpace";
