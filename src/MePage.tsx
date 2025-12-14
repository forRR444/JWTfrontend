import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe, refreshToken } from "./api";
import type { User } from "./types";
import { AppHeader } from "./components/AppHeader";
import { HeaderActions } from "./components/HeaderActions";
import { AppNavigation } from "./components/AppNavigation";
import { NutritionGoalModal } from "./components/NutritionGoalModal";
import styles from "./styles/app.module.css";
import mealStyles from "./styles/meals.module.css";

/**
 * マイページ
 * - /me API からログイン中ユーザー情報を取得して表示
 * - 認証切れ時はエラー表示 → /login へ誘導
 */
export default function MePage({ onLogout }: { onLogout: () => void }) {
  const [me, setMe] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  // 初期表示：未ログインなら /login、ログイン済みなら /me を取得
  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    (async () => {
      try {
        const data = await fetchMe();
        setMe(data);
      } catch (e: unknown) {
        const message =
          e && typeof e === "object" && "message" in e && typeof e.message === "string"
            ? e.message
            : "認証が切れています。ログインし直してください。";
        setError(message);
      }
    })();
  }, [token, navigate]);
  // 明示的ログアウト
  const handleLogoutClick = () => {
    onLogout();
    navigate("/login", { replace: true });
  };
  // アクセストークン手動更新
  const handleRefreshToken = async () => {
    try {
      await refreshToken();
      alert("アクセストークンを更新しました");
    } catch {
      alert("更新に失敗。再ログインしてください");
    }
  };

  // ユーザー情報更新処理
  const handleUserUpdate = (updatedUser: User) => {
    setMe(updatedUser);
  };

  if (error)
    return (
      <div className={styles.pageContainer}>
        <div className={styles.error}>{error}</div>
      </div>
    );

  if (!me)
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );

  return (
    <div className={styles.pageContainer}>
      <div className={mealStyles.contentWrapper}>
        <AppHeader
          actions={
            <HeaderActions
              onRefreshToken={handleRefreshToken}
              onLogout={handleLogoutClick}
            />
          }
        />
        {/* 現在ページを強調表示 */}
        <AppNavigation currentPage="me" />

        <div className={mealStyles.formCard}>
          <h2 className={mealStyles.formTitle}>ユーザー情報</h2>
          <div className={styles.cardContent}>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>名前</div>
              <div className={styles.infoValue}>{me.name}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>メールアドレス</div>
              <div className={styles.infoValue}>{me.email}</div>
            </div>
          </div>
        </div>

        <div className={mealStyles.formCard}>
          <div className={mealStyles.nutritionHeader}>
            <h2 className={mealStyles.formTitle}>目標栄養素</h2>
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className={mealStyles.nutritionButton}
            >
              目標を設定
            </button>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>目標カロリー</div>
              <div className={styles.infoValue}>
                {me.target_calories != null ? `${me.target_calories} kcal` : "-"}
              </div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>目標たんぱく質</div>
              <div className={styles.infoValue}>
                {me.target_protein != null ? `${me.target_protein} g` : "-"}
              </div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>目標脂質</div>
              <div className={styles.infoValue}>
                {me.target_fat != null ? `${me.target_fat} g` : "-"}
              </div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>目標炭水化物</div>
              <div className={styles.infoValue}>
                {me.target_carbohydrate != null ? `${me.target_carbohydrate} g` : "-"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 目標設定モーダル */}
      <NutritionGoalModal
        user={me}
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onUpdate={handleUserUpdate}
      />
    </div>
  );
}
