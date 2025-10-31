import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createMeal, deleteMeal, updateMeal, refreshToken, fetchMe } from "./api";
import { clearAuth } from "./auth";
import type { User } from "./types";
import type { ViewMode } from "./utils/dateUtils";
import {
  getTodayString,
  getViewRangeLabel,
  isShowingToday,
  getPreviousDate,
  getNextDate,
} from "./utils/dateUtils";
import { useMealData } from "./hooks/useMealData";
import { ViewModeSelector } from "./components/meals/ViewModeSelector";
import { DateNavigator } from "./components/meals/DateNavigator";
import { MealForm } from "./components/meals/MealForm";
import { MealListView } from "./components/meals/MealListView";
import { NutritionSummary } from "./components/NutritionSummary";
import { NutritionGoalModal } from "./components/NutritionGoalModal";
import { AppHeader } from "./components/AppHeader";
import { HeaderActions } from "./components/HeaderActions";
import { AppNavigation } from "./components/AppNavigation";
import styles from "./styles/app.module.css";
import mealStyles from "./styles/meals.module.css";

export default function MealsPage() {
  const navigate = useNavigate();

  // ビュー状態
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  // ユーザー状態
  const [user, setUser] = useState<User | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // 食事データの取得
  const { loading, error, groups, allMealsInRange, refetch } = useMealData(
    viewMode,
    selectedDate
  );

  // ユーザー情報を取得
  useEffect(() => {
    fetchMe()
      .then((userData) => setUser(userData))
      .catch((err) => console.error("Failed to fetch user:", err));
  }, []);

  // ログアウト処理
  const handleLogoutClick = () => {
    clearAuth();
    window.dispatchEvent(new Event("unauthorized"));
    navigate("/login", { replace: true });
  };

  // トークン更新処理
  const handleRefreshToken = async () => {
    try {
      await refreshToken();
      alert("アクセストークンを更新しました");
    } catch (e: any) {
      alert(e?.message || "更新に失敗。再ログインしてください");
    }
  };

  // 食事追加処理
  const handleMealSubmit = async (mealData: any) => {
    await createMeal(mealData);
    refetch();
  };

  // 食事削除処理
  const handleMealDelete = async (id: number) => {
    if (!confirm("削除しますか？")) return;

    try {
      await deleteMeal(id);
      refetch();
    } catch (e: any) {
      alert(e?.message || "削除に失敗しました");
    }
  };

  // 食事更新処理
  const handleMealUpdate = async (id: number, data: any) => {
    try {
      await updateMeal(id, data);
      refetch();
    } catch (e: any) {
      alert(e?.message || "更新に失敗しました");
    }
  };

  // ユーザー情報更新処理
  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={mealStyles.contentWrapper}>
        {/* ヘッダー */}
        <AppHeader
          actions={
            <HeaderActions
              onRefreshToken={handleRefreshToken}
              onLogout={handleLogoutClick}
            />
          }
        />

        {/* ナビゲーション */}
        <AppNavigation currentPage="dashboard" />

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

        {/* 栄養サマリー（日次表示のみ） */}
        {viewMode === "day" && user && (
          <NutritionSummary
            meals={allMealsInRange}
            user={user}
            onOpenGoalModal={() => setIsGoalModalOpen(true)}
          />
        )}

        {/* 食事フォーム（日次表示のみ） */}
        {viewMode === "day" && (
          <MealForm selectedDate={selectedDate} onSubmit={handleMealSubmit} />
        )}

        {/* データ表示 */}
        {loading ? (
          <p>読み込み中...</p>
        ) : error ? (
          <p style={{ color: "crimson" }}>{error}</p>
        ) : (
          <MealListView
            viewMode={viewMode}
            groups={groups}
            allMealsInRange={allMealsInRange}
            onDelete={handleMealDelete}
            onUpdate={handleMealUpdate}
          />
        )}
      </div>

      {/* 目標設定モーダル */}
      {user && (
        <NutritionGoalModal
          user={user}
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
}
