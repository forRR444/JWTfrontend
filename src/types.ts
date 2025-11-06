export type ISODateString = string;
/**
 * ユーザー情報
 * - 認証APIやプロフィール取得APIなどで共通使用
 * - 目標値は未設定時 null となる
 */
export interface User {
  id: number | string;
  name: string;
  email: string;
  target_calories?: number | null;
  target_protein?: number | null;
  target_fat?: number | null;
  target_carbohydrate?: number | null;
  // 将来的に拡張予定
  [key: string]: unknown;
}

/**
 * ログイン・サインアップAPIのレスポンス形式
 * - トークンと有効期限、ユーザー情報を返す
 * - expires は日時文字列またはUNIX秒が返る場合があるため両方許容
 * - refresh_token はlocalStorage保存用（本番環境）
 */
export interface LoginResponse {
  token: string;
  expires: ISODateString | number;
  refresh_token?: string;
  user: User;
}
/**
 * プロジェクト情報
 * - 一覧表示や更新管理などに利用
 */
export interface Project {
  id: number | string;
  name: string;
  updatedAt: ISODateString | string | number;
}

/**
 * 食品データ
 * - 栄養素情報を含む
 * - 数値が存在しない場合は null
 */
export interface Food {
  id: number;
  name: string;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbohydrate: number | null;
}
