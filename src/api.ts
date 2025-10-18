import type { LoginResponse } from "./types";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";
const API_BASE = `${API_ORIGIN}/api/v1`;

export class ApiError extends Error {
  status?: number;
  data?: unknown;
  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type ApiFetchInit = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  // 内部用：リフレッシュ後の再試行フラグ
  _retry?: boolean;
};

async function rawFetch(
  path: string,
  { method = "GET", body, token }: ApiFetchInit = {}
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : ({} as unknown);

  if (!res.ok) {
    const msg =
      (isJson && (data as any)?.error) ||
      (isJson && (data as any)?.message) ||
      `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }
  return data;
}

// === 新規: リフレッシュAPI ===
export async function refreshToken(): Promise<LoginResponse> {
  // Cookie の refresh_token を使うので body は不要
  const res = await rawFetch("/auth_token/refresh", { method: "POST" });
  // 返り値は { token, expires, user }
  return res as LoginResponse;
}

// === 401時に自動リフレッシュ → 1回だけ再試行するラッパ ===
export async function apiFetch<T>(
  path: string,
  init: ApiFetchInit = {}
): Promise<T> {
  const { _retry, ...rest } = init;
  try {
    return (await rawFetch(path, rest)) as T;
  } catch (e: any) {
    if (e instanceof ApiError && e.status === 401 && !_retry) {
      // リフレッシュを試みる
      try {
        const r = await refreshToken();
        // 新アクセストークンを保存
        localStorage.setItem("access_token", r.token);
        localStorage.setItem("access_token_expires", String(r.expires ?? ""));
        localStorage.setItem("current_user", JSON.stringify(r.user ?? null));
        // 新トークンで1回だけ再試行
        return (await rawFetch(path, { ...rest, token: r.token })) as T;
      } catch {
        // リフレッシュ失敗 → そのまま401を投げる
        throw e;
      }
    }
    throw e;
  }
}

// 既存
export function login(params: { email: string; password: string }) {
  return apiFetch<LoginResponse>("/auth_token", {
    method: "POST",
    body: { auth: params },
  });
}
export function fetchProjects(token: string) {
  return apiFetch<any[]>("/projects", { token });
}
