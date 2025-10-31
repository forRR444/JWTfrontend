import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createMeal, deleteMeal, refreshToken, fetchMe } from "./api";
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
import styles from "./styles/app.module.css";
import mealStyles from "./styles/meals.module.css";

export default function MealsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [user, setUser] = useState<User | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

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
      await refreshToken();
      // refreshToken() 内で既にlocalStorageとイベント発火、
      // scheduleTokenRefresh() も実行済み
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

  // ユーザー情報を取得
  useEffect(() => {
    fetchMe()
      .then((userData) => setUser(userData))
      .catch((err) => console.error("Failed to fetch user:", err));
  }, []);

  // ユーザー情報更新後の処理
  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={mealStyles.contentWrapper}>
        {/* ヘッダー */}
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>食事管理</h1>
          <div className={styles.headerActions}>
            <button onClick={handleRefreshToken} className={`${styles.buttonSecondary} ${styles.buttonSmall}`}>
              トークン更新
            </button>
            <button onClick={handleLogoutClick} className={`${styles.buttonSecondary} ${styles.buttonSmall}`}>
              ログアウト
            </button>
          </div>
        </header>

        {/* ナビゲーション */}
        <nav className={styles.nav}>
          <Link to="/me" className={styles.navLink}>
            マイページ
          </Link>
          <Link to="/meals" className={`${styles.navLink} ${styles.navLinkActive}`}>
            食事管理
          </Link>
        </nav>

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

        {/* 栄養サマリー（日次表示のみ） */}
        {viewMode === "day" && user && (
          <NutritionSummary
            meals={allMealsInRange}
            user={user}
            onOpenGoalModal={() => setIsGoalModalOpen(true)}
          />
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
