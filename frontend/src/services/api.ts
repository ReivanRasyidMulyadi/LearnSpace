// Thin fetch wrapper. Reads bearer token from storage, keeps an in-memory copy
// so hot calls don't hit storage. Always set/clear via setToken().
import { API_URL, STORAGE_KEYS } from "@/src/constants/config";
import { storage } from "@/src/utils/storage";

let memoryToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export async function loadToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  const stored = await storage.secureGet<string>(STORAGE_KEYS.sessionToken, "");
  memoryToken = stored && stored.length > 0 ? stored : null;
  return memoryToken;
}

export async function setToken(token: string | null): Promise<void> {
  memoryToken = token;
  const persisted = token
    ? await storage.secureSet(STORAGE_KEYS.sessionToken, token)
    : await storage.secureRemove(STORAGE_KEYS.sessionToken);
  if (!persisted) throw new Error("session_storage_failed");
}

export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await loadToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || res.statusText;
    if (res.status === 401 && token) {
      await setToken(null).catch(() => undefined);
      unauthorizedHandler?.();
    }
    throw new ApiError(res.status, String(detail));
  }
  return data as T;
}
