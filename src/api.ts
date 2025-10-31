import type { LoginResponse, Food, User } from "./types";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";
const API_BASE = `${API_ORIGIN}/api/v1`;

// 強制ログアウト処理
function hardSignOut() {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("access_token_expires");
    localStorage.removeItem("current_user");
  } finally {
    alert("認証が切れました。ログイン画面に戻ります。");
    window.dispatchEvent(new Event("unauthorized"));
  }
}

// 保存済みアクセストークンの取得
function getStoredToken(): string | null {
  return localStorage.getItem("access_token");
}

// 保存済みexp（秒）を取得（不正値は0）
export function getStoredExp(): number {
  // exp を秒で保存している前提。未設定は 0 扱い
  const raw = localStorage.getItem("access_token_expires") || "0";
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

// アクセストークンの期限切れ判定（30秒マージン）
export function isAccessTokenExpired(): boolean {
  const expSec = getStoredExp();
  if (!expSec) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= expSec - 30;
}

// アクセストークンの期限切れ判定（30秒マージン）
export function initAuthOnBoot() {
  if (!getStoredToken() || isAccessTokenExpired()) {
    hardSignOut();
  }
}

// 自動リフレッシュのスケジュール管理
let refreshTimerId: number | undefined = undefined;
// 有効期限の60/30秒前に自動リフレッシュを予約
export function scheduleTokenRefresh() {
  if (refreshTimerId !== undefined) {
    window.clearTimeout(refreshTimerId);
    refreshTimerId = undefined;
  }

  const expSec = getStoredExp();
  if (!expSec || !getStoredToken()) return;

  const nowSec = Math.floor(Date.now() / 1000);
  const secondsUntilExpiry = expSec - nowSec;
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
        await refreshToken(); // 成功時は次回も予約
        scheduleTokenRefresh();
      } catch (err) {
        console.error("[Token Schedule] 自動トークン更新に失敗しました:", err); // 失敗時は次のAPI呼び出しで401処理に委ねる
      }
    }, delayMs);
  } else {
    console.log(
      "[Token Schedule] トークンの有効期限が近すぎるため、自動更新をスケジュールしません"
    );
  }
}

// 自動リフレッシュの予約を解除
export function cancelTokenRefresh() {
  if (refreshTimerId !== undefined) {
    window.clearTimeout(refreshTimerId);
    refreshTimerId = undefined;
  }
}
// APIエラー
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
  token?: string | null; // 未指定時は保存トークンを使用
  _retry?: boolean;
};
// 生fetch（JSON判定・エラー整形・Cookie同送）
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
    credentials: "include", // refresh_token Cookie送信
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

// リフレッシュAPI（Cookieのrefresh_tokenで新トークン発行）
export async function refreshToken(): Promise<LoginResponse> {
  console.log(
    "[Token Refresh] リフレッシュトークンを使用してアクセストークンを更新します..."
  );
  const res = await rawFetch("/auth_token/refresh", { method: "POST" });
  const loginResponse = res as LoginResponse; // { token, expires, user }

  // 新トークンを保存・通知
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

  window.dispatchEvent(new Event("authorized"));
  return loginResponse;
}

// 401時に自動リフレッシュ → 1回だけ再試行するラッパ
export async function apiFetch<T>(
  path: string,
  init: ApiFetchInit = {}
): Promise<T> {
  const token =
    init.token ?? (isAccessTokenExpired() ? null : getStoredToken());
  const { _retry, ...rest } = { ...init, token };

  try {
    return (await rawFetch(path, rest)) as T;
  } catch (e: any) {
    if (e instanceof ApiError && e.status === 401 && !_retry) {
      try {
        const r = await refreshToken();
        return (await rawFetch(path, {
          ...rest,
          token: r.token,
          _retry: true, // 無限ループ防止
        })) as T;
      } catch (_refreshErr) {
        // リフレッシュ失敗時は破棄＆通知
        hardSignOut();
        throw e;
      }
    }
    throw e;
  }
}

// 認証系エンドポイント
export function login(params: { email: string; password: string }) {
  return apiFetch<LoginResponse>("/auth_token", {
    method: "POST",
    body: { auth: params },
  });
}

// ローカルサインアウト
export function signOutLocally() {
  hardSignOut();
}
// 新規登録
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

// Meals型・API
export interface Meal {
  id: number;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack" | "other";
  content: string;
  calories?: number | null;
  grams?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbohydrate?: number | null;
  tags: string[];
  eaten_on: string;
  created_at: string;
  updated_at: string;
}
// 食事一覧取得
export function listMeals() {
  return apiFetch<Meal[]>("/meals");
}
// 食事作成
export function createMeal(
  meal: Partial<Meal> & { content: string; meal_type?: Meal["meal_type"] }
) {
  const payload = {
    meal: {
      meal_type: meal.meal_type || "other",
      content: meal.content,
      calories: meal.calories,
      grams: meal.grams,
      protein: meal.protein,
      fat: meal.fat,
      carbohydrate: meal.carbohydrate,
      tags: meal.tags || [],
      eaten_on: meal.eaten_on,
    },
  };
  return apiFetch<Meal>("/meals", { method: "POST", body: payload });
}
// 食事更新
export function updateMeal(id: number, meal: Partial<Meal>) {
  const payload = {
    meal: {
      meal_type: meal.meal_type,
      content: meal.content,
      calories: meal.calories,
      grams: meal.grams,
      protein: meal.protein,
      fat: meal.fat,
      carbohydrate: meal.carbohydrate,
      tags: meal.tags,
      eaten_on: meal.eaten_on,
    },
  };
  return apiFetch<Meal>(`/meals/${id}`, { method: "PATCH", body: payload });
}
// 食事削除
export function deleteMeal(id: number) {
  return apiFetch<void>(`/meals/${id}`, { method: "DELETE" });
}
// サマリー・カレンダー
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
// 日付指定サマリー取得
export function getMealSummaryByDate(date: string) {
  return apiFetch<MealGroups>(
    `/meals/summary?date=${encodeURIComponent(date)}`
  );
}
// 期間指定サマリー取得
export function getMealSummaryByRange(from: string, to: string) {
  return apiFetch<MealGroups>(
    `/meals/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(
      to
    )}`
  );
}
// カレンダーデータ取得
export function getCalendarMonth(month: string) {
  // month: "YYYY-MM"
  return apiFetch<{
    month: string;
    days: Record<string, { total: number; by_type: Record<string, number> }>;
  }>(`/meals/calendar?month=${encodeURIComponent(month)}`);
}
// Foods 検索
export function searchFoods(query: string) {
  if (!query.trim()) {
    return Promise.resolve({ foods: [] });
  }
  return apiFetch<{ foods: Food[] }>(`/foods?q=${encodeURIComponent(query)}`);
}
// User 情報
export function fetchMe() {
  return apiFetch<User>("/me");
}

// User 目標栄養の更新
export interface NutritionGoals {
  target_calories?: number;
  target_protein?: number;
  target_fat?: number;
  target_carbohydrate?: number;
}

export function updateNutritionGoals(goals: NutritionGoals) {
  return apiFetch<User>("/users/goals", {
    method: "PUT",
    body: { user: goals },
  });
}
