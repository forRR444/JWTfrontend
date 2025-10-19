// api.ts
import type { LoginResponse } from "./types";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";
const API_BASE = `${API_ORIGIN}/api/v1`;

// === 共通：未認証に戻す（イベント通知付き）
function hardSignOut() {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("access_token_expires");
    localStorage.removeItem("current_user");
  } finally {
    // どこからでも拾えるようにアプリ全体へ通知
    window.dispatchEvent(new Event("unauthorized"));
  }
}

// === 共通：保存トークンの取得と有効性チェック
function getStoredToken(): string | null {
  return localStorage.getItem("access_token");
}
function getStoredExp(): number {
  // exp を秒で保存している前提。未設定は 0 扱い
  const raw = localStorage.getItem("access_token_expires") || "0";
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}
function isAccessTokenExpired(): boolean {
  const expSec = getStoredExp();
  if (!expSec) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  // 多少の時計ズレに寛容に（30秒早めに期限切れ扱い）
  return nowSec >= expSec - 30;
}

// 起動時：期限切れの残骸をクリア（呼び出しはアプリ側のエントリで）
export function initAuthOnBoot() {
  if (!getStoredToken() || isAccessTokenExpired()) {
    hardSignOut();
  }
}

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
  token?: string | null; // 未指定ならストレージの有効トークンを自動採用
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
    credentials: "include", // refresh_token Cookie を送るため必須
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

// === 新規: リフレッシュAPI（Cookie の refresh_token を使用） ===
export async function refreshToken(): Promise<LoginResponse> {
  const res = await rawFetch("/auth_token/refresh", { method: "POST" });
  return res as LoginResponse; // { token, expires, user }
}

// === 401時に自動リフレッシュ → 1回だけ再試行するラッパ ===
export async function apiFetch<T>(
  path: string,
  init: ApiFetchInit = {}
): Promise<T> {
  // token 未指定なら保存済みの有効トークンを自動採用
  const token =
    init.token ?? (isAccessTokenExpired() ? null : getStoredToken());
  const { _retry, ...rest } = { ...init, token };

  try {
    return (await rawFetch(path, rest)) as T;
  } catch (e: any) {
    // 401 かつ未再試行なら refresh を試みる
    if (e instanceof ApiError && e.status === 401 && !_retry) {
      try {
        const r = await refreshToken();
        // 新アクセストークンを保存
        localStorage.setItem("access_token", r.token);
        // expires は秒数で保存している前提。API が ms なら適宜調整を ★
        localStorage.setItem("access_token_expires", String(r.expires ?? ""));
        localStorage.setItem("current_user", JSON.stringify(r.user ?? null));

        // 新トークンで 1 回だけ再試行
        return (await rawFetch(path, {
          ...rest,
          token: r.token,
          _retry: true, // 無限ループ抑止（念のため）
        })) as T;
      } catch (refreshErr) {
        // リフレッシュ失敗：認証状態をクリアして通知し、元の 401 を投げる ★
        hardSignOut();
        throw e;
      }
    }

    // 401 以外、または再試行済みの 401 はそのまま投げる
    throw e;
  }
}

// === エンドポイント関数 ===
export function login(params: { email: string; password: string }) {
  // login は未認証前提なので token 付与は不要
  return apiFetch<LoginResponse>("/auth_token", {
    method: "POST",
    body: { auth: params },
  });
}

export function fetchProjects(token?: string) {
  // token を明示しなくても保存済み有効トークンを使う
  return apiFetch<any[]>("/projects", { token });
}

// ===（任意）明示サインアウト API 呼び出し用のヘルパー ★===
export function signOutLocally() {
  hardSignOut();
}
//　新規登録
export function register(params: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}) {
  return apiFetch<LoginResponse>("/users", {
    method: "POST",
    body: { user: params },
  });
}

// Meals
export interface Meal {
  id: number;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack" | "other";
  content: string;
  calories?: number | null;
  grams?: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function listMeals() {
  return apiFetch<Meal[]>("/meals");
}

export function createMeal(
  meal: Partial<Meal> & { content: string; meal_type?: Meal["meal_type"] }
) {
  const payload = {
    meal: {
      meal_type: meal.meal_type || "other",
      content: meal.content,
      calories: meal.calories,
      grams: meal.grams,
      tags: meal.tags || [],
    },
  };
  return apiFetch<Meal>("/meals", { method: "POST", body: payload });
}

export function updateMeal(id: number, meal: Partial<Meal>) {
  const payload = {
    meal: {
      meal_type: meal.meal_type,
      content: meal.content,
      calories: meal.calories,
      grams: meal.grams,
      tags: meal.tags,
    },
  };
  return apiFetch<Meal>(`/meals/${id}`, { method: "PATCH", body: payload });
}

export function deleteMeal(id: number) {
  return apiFetch<void>(`/meals/${id}`, { method: "DELETE" });
}
