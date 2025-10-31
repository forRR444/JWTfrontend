import { useState, useEffect } from "react";
import { getMealSummaryByDate, getMealSummaryByRange, type MealGroups, type Meal } from "../api";
import type { ViewMode } from "../utils/dateUtils";
import { getWeekRange, getMonthRange } from "../utils/dateUtils";

export const useMealData = (viewMode: ViewMode, selectedDate: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<MealGroups["groups"] | null>(null);
  const [allMealsInRange, setAllMealsInRange] = useState<Meal[]>([]);

  const loadData = async (mode: ViewMode, dateStr: string) => {
    setLoading(true);
    try {
      if (mode === "day") {
        const res = await getMealSummaryByDate(dateStr);
        setGroups(res.groups);
        setAllMealsInRange([]);
      } else if (mode === "week") {
        const range = getWeekRange(dateStr);
        const res = await getMealSummaryByRange(range.from, range.to);
        setGroups(res.groups);
        const allMeals = Object.values(res.groups).flat();
        allMeals.sort((a, b) => {
          const dateA = a.eaten_on || "";
          const dateB = b.eaten_on || "";
          return dateA.localeCompare(dateB);
        });
        setAllMealsInRange(allMeals);
      } else if (mode === "month") {
        const range = getMonthRange(dateStr);
        const res = await getMealSummaryByRange(range.from, range.to);
        setGroups(res.groups);
        const allMeals = Object.values(res.groups).flat();
        allMeals.sort((a, b) => {
          const dateA = a.eaten_on || "";
          const dateB = b.eaten_on || "";
          return dateA.localeCompare(dateB);
        });
        setAllMealsInRange(allMeals);
      }
      setError(null);
    } catch (e: any) {
      setError(e?.message || "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(viewMode, selectedDate);
  }, [viewMode, selectedDate]);

  const refetch = () => loadData(viewMode, selectedDate);

  return { loading, error, groups, allMealsInRange, refetch };
};
