/**
 * Thin fetch wrapper — every API call in the app goes through `apiFetch`.
 * Centralizing this is what makes auth-header injection, error shaping,
 * and base-URL configuration a one-file concern instead of being repeated
 * in every service function.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

let authTokenGetter: (() => Promise<string | null>) | null = null;

/** Called once from main.tsx / ClerkAuthBridge so apiFetch can attach bearer tokens. */
export function registerAuthTokenGetter(getter: () => Promise<string | null>) {
  authTokenGetter = getter;
}

/** Exposed for callers (like the SSE stream client) that build their own fetch headers. */
export async function getCurrentAuthToken(): Promise<string | null> {
  if (!authTokenGetter) return null;
  return authTokenGetter();
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (authTokenGetter) {
    const token = await authTokenGetter();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    const message =
      (details as { message?: string; detail?: string })?.message ||
      (details as { message?: string; detail?: string })?.detail ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, details);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}
