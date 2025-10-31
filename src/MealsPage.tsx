import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMeal, deleteMeal, refreshToken } from "./api";
import { clearAuth } from "./auth";
import type { ViewMode } from "./utils/dateUtils";
import {
  getTodayString,
  getViewRangeLabel,
  isShowingToday,
  getPreviousDate,
  getNextDate,
} from "./utils/dateUtils";
import { MEAL_TYPES_ORDER } from "./constants/mealTypes";
import { useMealData } from "./hooks/useMealData";
import { ViewModeSelector } from "./components/meals/ViewModeSelector";
import { DateNavigator } from "./components/meals/DateNavigator";
import { MealForm } from "./components/meals/MealForm";
import { TotalCalories } from "./components/meals/TotalCalories";
import { MealListView } from "./components/meals/MealListView";

export default function MealsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const { loading, error, groups, allMealsInRange, refetch } = useMealData(
    viewMode,
    selectedDate
  );

  // ログアウト
  const handleLogoutClick = () => {
    clearAuth();
    window.dispatchEvent(new Event("unauthorized"));
    navigate("/login", { replace: true });
  };

  // トークン更新
  const handleRefreshToken = async () => {
    try {
      const r = await refreshToken();
      localStorage.setItem("access_token", r.token);
      localStorage.setItem("access_token_expires", String(r.expires ?? ""));
      localStorage.setItem("current_user", JSON.stringify(r.user ?? null));
      window.dispatchEvent(new Event("authorized"));
      alert("アクセストークンを更新しました");
    } catch (e: any) {
      alert(e?.message || "更新に失敗。再ログインしてください");
    }
  };

  // 食事追加
  const handleMealSubmit = async (mealData: any) => {
    await createMeal(mealData);
    refetch();
  };

  // 食事削除
  const handleMealDelete = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    try {
      await deleteMeal(id);
      refetch();
    } catch (e: any) {
      alert(e?.message || "削除に失敗しました");
    }
  };

  // 総カロリー計算
  const getTotalCalories = () => {
    if (!groups) return 0;
    const allMeals = MEAL_TYPES_ORDER.flatMap((type) => groups[type] || []);
    return allMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
  };

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", padding: 16 }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ margin: 0, flex: 1 }}>食事管理</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleRefreshToken}>トークン更新</button>
          <button onClick={handleLogoutClick}>ログアウト</button>
        </div>
      </div>

      {/* ビュー切替 */}
      <ViewModeSelector viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* 日付ナビゲーション */}
      <DateNavigator
        selectedDate={selectedDate}
        viewMode={viewMode}
        viewRangeLabel={getViewRangeLabel(viewMode, selectedDate)}
        isShowingToday={isShowingToday(viewMode, selectedDate)}
        onDateChange={setSelectedDate}
        onPrevious={() => setSelectedDate(getPreviousDate(viewMode, selectedDate))}
        onToday={() => setSelectedDate(getTodayString())}
        onNext={() => setSelectedDate(getNextDate(viewMode, selectedDate))}
      />

      {/* 食事フォーム */}
      <MealForm selectedDate={selectedDate} onSubmit={handleMealSubmit} />

      {/* データ表示 */}
      {loading ? (
        <p>読み込み中...</p>
      ) : error ? (
        <p style={{ color: "crimson" }}>{error}</p>
      ) : (
        <>
          <TotalCalories
            totalCalories={getTotalCalories()}
            rangeLabel={getViewRangeLabel(viewMode, selectedDate)}
          />
          <MealListView
            viewMode={viewMode}
            groups={groups}
            allMealsInRange={allMealsInRange}
            onDelete={handleMealDelete}
          />
        </>
      )}
    </div>
  );
}
