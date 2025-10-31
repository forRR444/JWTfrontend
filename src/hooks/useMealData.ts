import { useState, useEffect } from "react";
import {
  getMealSummaryByDate,
  getMealSummaryByRange,
  type MealGroups,
  type Meal,
} from "../api";
import type { ViewMode } from "../utils/dateUtils";
import { getWeekRange, getMonthRange } from "../utils/dateUtils";

// 食事データを日付順にソート
const sortMealsByDate = (meals: Meal[]): Meal[] => {
  return meals.sort((a, b) => {
    const dateA = a.eaten_on || "";
    const dateB = b.eaten_on || "";
    return dateA.localeCompare(dateB);
  });
};

/**
 * 食事データを取得・管理するカスタムフック
 * ビューモード（日/週/月）に応じてデータを取得し、状態を管理
 */
export const useMealData = (viewMode: ViewMode, selectedDate: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<MealGroups["groups"] | null>(null);
  const [allMealsInRange, setAllMealsInRange] = useState<Meal[]>([]);

  /**
   * ビューモードと日付に応じて食事データを読み込む
   */
  const loadData = async (mode: ViewMode, dateStr: string) => {
    setLoading(true);

    try {
      if (mode === "day") {
        // 日ビュー: 指定日のデータを取得
        const res = await getMealSummaryByDate(dateStr);
        setGroups(res.groups);
        const allMeals = Object.values(res.groups).flat();
        setAllMealsInRange(allMeals);
      } else {
        // 週・月ビュー: 期間のデータを取得
        const range =
          mode === "week" ? getWeekRange(dateStr) : getMonthRange(dateStr);
        const res = await getMealSummaryByRange(range.from, range.to);
        setGroups(res.groups);

        // 全食事を日付順にソート
        const allMeals = Object.values(res.groups).flat();
        const sortedMeals = sortMealsByDate(allMeals);
        setAllMealsInRange(sortedMeals);
      }

      setError(null);
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e && typeof e.message === "string"
          ? e.message
          : "取得に失敗しました";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ビューモードまたは日付が変更されたらデータを再取得
  useEffect(() => {
    loadData(viewMode, selectedDate);
  }, [viewMode, selectedDate]);

  // データを手動で再取得する関数
  const refetch = () => loadData(viewMode, selectedDate);

  return { loading, error, groups, allMealsInRange, refetch };
};
