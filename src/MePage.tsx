import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, refreshToken } from "./api";
import { AppHeader } from "./components/AppHeader";
import { HeaderActions } from "./components/HeaderActions";
import { AppNavigation } from "./components/AppNavigation";
import styles from "./styles/app.module.css";
import mealStyles from "./styles/meals.module.css";

type Me = { id: number | string; name: string };

/**
 * マイページ
 * - /me API からログイン中ユーザー情報を取得して表示
 * - 認証切れ時はエラー表示 → /login へ誘導
 */
export default function MePage({ onLogout }: { onLogout: () => void }) {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
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
        const data = await apiFetch<Me>("/me", { token });
        setMe(data);
      } catch (e: any) {
        setError(
          e?.message ?? "認証が切れています。ログインし直してください。"
        );
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
          </div>
        </div>
      </div>
    </div>
  );
}
