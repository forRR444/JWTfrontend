import type { LoginResponse } from "./types";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";
const API_BASE = `${API_ORIGIN}/api/v1`;

// === 未認証に戻す（イベント通知付き）
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

// === 保存トークンの取得と有効性チェック
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

// プロアクティブなトークン更新機能
// トークンの有効期限の1分前になったら自動的に更新を試みる
let refreshTimerId: number | undefined = undefined;

export function scheduleTokenRefresh() {
  // 既存のタイマーをクリア
  if (refreshTimerId !== undefined) {
    window.clearTimeout(refreshTimerId);
    refreshTimerId = undefined;
  }

  const expSec = getStoredExp();
  if (!expSec || !getStoredToken()) return;

  const nowSec = Math.floor(Date.now() / 1000);
  const secondsUntilExpiry = expSec - nowSec;

  // 有効期限の1分前（60秒前）に更新
  // ただし、既に1分を切っている場合は30秒前に設定
  const refreshBeforeExpiry = secondsUntilExpiry > 120 ? 60 : 30;
  const delayMs = Math.max(
    0,
    (secondsUntilExpiry - refreshBeforeExpiry) * 1000
  );

  if (delayMs > 0 && secondsUntilExpiry > refreshBeforeExpiry) {
    const refreshTime = new Date(Date.now() + delayMs);
    console.log(
      `[Token Schedule] ${Math.floor(
        delayMs / 1000
      )}秒後にトークンを自動更新します (${refreshTime.toLocaleTimeString()})`
    );

    refreshTimerId = window.setTimeout(async () => {
      try {
        console.log("[Token Schedule] 自動トークン更新を実行中...");
        await refreshToken();
        // 成功したら次の更新をスケジュール
        scheduleTokenRefresh();
      } catch (err) {
        console.error("[Token Schedule] 自動トークン更新に失敗しました:", err);
        // 失敗してもログアウトはせず、次のAPI呼び出し時に401で処理される
      }
    }, delayMs);
  } else {
    console.log(
      "[Token Schedule] トークンの有効期限が近すぎるため、自動更新をスケジュールしません"
    );
  }
}

// タイマーのクリーンアップ用
export function cancelTokenRefresh() {
  if (refreshTimerId !== undefined) {
    window.clearTimeout(refreshTimerId);
    refreshTimerId = undefined;
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
  console.log(
    "[Token Refresh] リフレッシュトークンを使用してアクセストークンを更新します..."
  );
  const res = await rawFetch("/auth_token/refresh", { method: "POST" });
  const loginResponse = res as LoginResponse; // { token, expires, user }

  // トークン更新後、localStorageを更新してイベントを発火
  localStorage.setItem("access_token", loginResponse.token);
  localStorage.setItem(
    "access_token_expires",
    String(loginResponse.expires ?? "")
  );
  localStorage.setItem(
    "current_user",
    JSON.stringify(loginResponse.user ?? null)
  );

  const expiresNum =
    typeof loginResponse.expires === "number"
      ? loginResponse.expires
      : parseInt(String(loginResponse.expires), 10);
  console.log(
    "[Token Refresh] トークン更新成功。新しい有効期限:",
    new Date(expiresNum * 1000).toLocaleString()
  );

  // アプリ全体に更新を通知
  window.dispatchEvent(new Event("authorized"));

  return loginResponse;
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
        // refreshToken() 内で既にlocalStorageとイベント発火済み

        // 新トークンで 1 回だけ再試行
        return (await rawFetch(path, {
          ...rest,
          token: r.token,
          _retry: true, // 無限ループ抑止（念のため）
        })) as T;
      } catch (refreshErr) {
        // リフレッシュ失敗：認証状態をクリアして通知し、元の 401 を投げる
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
  eaten_on: string;
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
      eaten_on: meal.eaten_on,
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
      eaten_on: meal.eaten_on,
    },
  };
  return apiFetch<Meal>(`/meals/${id}`, { method: "PATCH", body: payload });
}

export function deleteMeal(id: number) {
  return apiFetch<void>(`/meals/${id}`, { method: "DELETE" });
}

export type MealGroups = {
  range: { date?: string | null; from?: string | null; to?: string | null };
  groups: {
    breakfast: Meal[];
    lunch: Meal[];
    dinner: Meal[];
    snack: Meal[];
    other: Meal[];
  };
};

export function getMealSummaryByDate(date: string) {
  return apiFetch<MealGroups>(
    `/meals/summary?date=${encodeURIComponent(date)}`
  );
}

export function getMealSummaryByRange(from: string, to: string) {
  return apiFetch<MealGroups>(
    `/meals/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(
      to
    )}`
  );
}

export function getCalendarMonth(month: string) {
  // month: "YYYY-MM"
  return apiFetch<{
    month: string;
    days: Record<string, { total: number; by_type: Record<string, number> }>;
  }>(`/meals/calendar?month=${encodeURIComponent(month)}`);
}
