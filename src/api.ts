import type { LoginResponse, Project } from "./types";

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
};

export async function apiFetch<T>(
  path: string,
  init: ApiFetchInit = {}
): Promise<T> {
  const { method = "GET", body, token } = init;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Rails側 ApplicationController#xhr_request? 対策（必須）
    "X-Requested-With": "XMLHttpRequest",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include", // refresh token Cookie 用
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : ({} as unknown);

  if (!res.ok) {
    const msg =
      (isJson && (data as any)?.error) ||
      (isJson && (data as any)?.message) ||
      `HTTP ${res.status} ${res.statusText}`;
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}

// 認証系
export function login(params: { email: string; password: string }) {
  // Rails 側は {"auth": { email, password }} を要求
  return apiFetch<LoginResponse>("/auth_token", {
    method: "POST",
    body: { auth: params },
  });
}

// 例: 認証が必要なAPI
export function fetchProjects(token: string) {
  return apiFetch<Project[]>("/projects", { token });
}
