// 食事タグの定数定義
export const AVAILABLE_TAGS = [
  "外食",
  "自炊",
  "和食",
  "洋食",
  "中華",
  "韓国料理",
  "イタリアン",
] as const;

export type MealTag = (typeof AVAILABLE_TAGS)[number];
