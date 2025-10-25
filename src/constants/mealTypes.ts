import type { Meal } from "../api";

// 食事タイプ(朝食/昼食/夕食/間食/その他)
export const MEAL_TYPES: Meal["meal_type"][] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "other",
];

export const MEAL_TYPE_LABELS: Record<Meal["meal_type"], string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
  other: "その他",
};

export const MEAL_TYPES_ORDER = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "other",
] as const;
