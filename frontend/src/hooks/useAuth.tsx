// AuthContext: single source of truth for auth state.
// Three states: loading | user (authenticated) | null (unauthenticated).
// Root layout owns navigation based on these states (see app/_layout.tsx).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { authService } from "@/src/services/auth.service";
import {
  loadToken,
  setToken,
  setUnauthorizedHandler,
} from "@/src/services/api";
import { authErrorMessage } from "@/src/services/auth.validation";
import type { User } from "@/src/types/user";

// Required on mobile so the auth session completes correctly after redirect.
WebBrowser.maybeCompleteAuthSession();

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: User };

interface AuthContextValue {
  state: AuthState;
  user: User | null;
  loading: boolean;
  operation: "login" | "register" | "google" | "logout" | null;
  error: string | null;
  clearError: () => void;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    name: string;
  }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function getRedirectUrl(): string {
  if (Platform.OS === "web") {
    return window.location.origin + "/";
  }
  return Linking.createURL("");
}

function extractSessionId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/[?#&]session_id=([^&#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const [operation, setOperation] = useState<AuthContextValue["operation"]>(null);
  const [error, setError] = useState<string | null>(null);
  const processedSessionIds = useRef(new Set<string>());

  const applySession = useCallback(async (token: string, user: User) => {
    await setToken(token);
    setState({ status: "authenticated", user });
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      // 1. On web, check URL for session_id FIRST (Google callback).
      if (Platform.OS === "web" && typeof window !== "undefined") {
        const fullUrl = window.location.href;
        const sessionId = extractSessionId(fullUrl);
        if (sessionId && !processedSessionIds.current.has(sessionId)) {
          processedSessionIds.current.add(sessionId);
          try {
            const resp = await authService.exchangeGoogleSession(sessionId);
            await applySession(resp.session_token, resp.user);
            // Clean URL after success.
            const clean = window.location.origin + window.location.pathname;
            window.history.replaceState(window.history.state, "", clean);
            return;
          } catch (e) {
            console.warn("[auth] exchange failed", e);
          }
        }
      }

      // 2. Mobile cold-start: check initial URL.
      if (Platform.OS !== "web") {
        const initialUrl = await Linking.getInitialURL();
        const sessionId = extractSessionId(initialUrl);
        if (sessionId && !processedSessionIds.current.has(sessionId)) {
          processedSessionIds.current.add(sessionId);
          try {
            const resp = await authService.exchangeGoogleSession(sessionId);
            await applySession(resp.session_token, resp.user);
            return;
          } catch (e) {
            console.warn("[auth] exchange failed", e);
          }
        }
      }

      // 3. Fall back to existing stored token.
      const token = await loadToken();
      if (!token) {
        setState({ status: "unauthenticated" });
        return;
      }
      const user = await authService.me();
      setState({ status: "authenticated", user });
    } catch {
      await setToken(null);
      setState({ status: "unauthenticated" });
    }
  }, [applySession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setState({ status: "unauthenticated" });
      setError("Sesi berakhir. Silakan masuk kembali");
    });
    bootstrap();

    if (Platform.OS !== "web") {
      const sub = Linking.addEventListener("url", async ({ url }) => {
        const sessionId = extractSessionId(url);
        if (!sessionId || processedSessionIds.current.has(sessionId)) return;
        processedSessionIds.current.add(sessionId);
        try {
          const resp = await authService.exchangeGoogleSession(sessionId);
          await applySession(resp.session_token, resp.user);
        } catch (e) {
          console.warn("[auth] exchange failed", e);
        }
      });
      return () => {
        sub.remove();
        setUnauthorizedHandler(null);
      };
    }
    return () => setUnauthorizedHandler(null);
  }, [bootstrap, applySession]);

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setOperation("login");
      try {
        const resp = await authService.login({
          email: email.trim().toLowerCase(),
          password,
        });
        await applySession(resp.session_token, resp.user);
      } catch (requestError) {
        setError(authErrorMessage(requestError));
        throw requestError;
      } finally {
        setOperation(null);
      }
    },
    [applySession],
  );

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      name: string;
    }) => {
      setError(null);
      setOperation("register");
      try {
        const resp = await authService.register({
          ...payload,
          email: payload.email.trim().toLowerCase(),
          name: payload.name.trim(),
        });
        await applySession(resp.session_token, resp.user);
      } catch (requestError) {
        setError(authErrorMessage(requestError));
        throw requestError;
      } finally {
        setOperation(null);
      }
    },
    [applySession],
  );

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    setOperation("google");
    const redirectUrl = getRedirectUrl();
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;

    if (Platform.OS === "web") {
      window.location.href = authUrl;
      return;
    }
    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      const url =
        (result.type === "success" && (result as any).url) ||
        (await Linking.getInitialURL());
      const sessionId = extractSessionId(url);
      if (sessionId && !processedSessionIds.current.has(sessionId)) {
        processedSessionIds.current.add(sessionId);
        const resp = await authService.exchangeGoogleSession(sessionId);
        await applySession(resp.session_token, resp.user);
      }
    } catch (requestError) {
      setError(authErrorMessage(requestError));
      throw requestError;
    } finally {
      setOperation(null);
    }
  }, [applySession]);

  const logout = useCallback(async () => {
    setOperation("logout");
    try {
      try {
        await authService.logout();
      } catch {
        // Network failures must never trap the user in a local session.
      }
      await setToken(null).catch(() => undefined);
      setState({ status: "unauthenticated" });
      setError(null);
    } finally {
      setOperation(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      user: state.status === "authenticated" ? state.user : null,
      loading: state.status === "loading",
      operation,
      error,
      clearError,
      loginWithPassword,
      register,
      loginWithGoogle,
      logout,
    }),
    [
      state,
      operation,
      error,
      clearError,
      loginWithPassword,
      register,
      loginWithGoogle,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
