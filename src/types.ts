export type ISODateString = string;

export interface User {
  id: number | string;
  name: string;
  email: string;
  target_calories?: number | null;
  target_protein?: number | null;
  target_fat?: number | null;
  target_carbohydrate?: number | null;
  // 必要に応じて拡張
  [key: string]: unknown;
}

export interface LoginResponse {
  token: string;
  expires: ISODateString | number; // Rails側は日時 or epoch を返す可能性があるため許容
  user: User;
}

export interface Project {
  id: number | string;
  name: string;
  updatedAt: ISODateString | string | number;
}

export interface Food {
  id: number;
  name: string;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbohydrate: number | null;
}
