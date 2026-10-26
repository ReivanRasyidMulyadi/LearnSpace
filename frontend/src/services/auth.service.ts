import { apiFetch } from "@/src/services/api";
import type { AuthResponse, User } from "@/src/types/user";

export const authService = {
  register: (payload: {
    email: string;
    password: string;
    name: string;
  }) =>
    apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  exchangeGoogleSession: (session_id: string) =>
    apiFetch<AuthResponse>("/auth/session", {
      method: "POST",
      body: JSON.stringify({ session_id }),
    }),

  me: () => apiFetch<User>("/auth/me"),

  logout: () => apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" }),
};
