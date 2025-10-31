import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch, refreshToken } from "./api";
import { AppHeader } from "./components/AppHeader";
import styles from "./styles/app.module.css";
import mealStyles from "./styles/meals.module.css";

type Me = { id: number | string; name: string };

export default function MePage({ onLogout }: { onLogout: () => void }) {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

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

  const handleLogoutClick = () => {
    onLogout();
    navigate("/login", { replace: true });
  };

  const handleRefreshToken = async () => {
    try {
      await refreshToken();
      alert("アクセストークンを更新しました");
    } catch {
      alert("更新に失敗。再ログインしてください");
    }
  };

  if (error) return (
    <div className={styles.pageContainer}>
      <div className={styles.error}>{error}</div>
    </div>
  );

  if (!me) return (
    <div className={styles.pageContainer}>
      <div className={styles.loading}>読み込み中...</div>
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <div className={mealStyles.contentWrapper}>
        <AppHeader
          actions={
            <>
              <button onClick={handleRefreshToken} className={`${styles.buttonSecondary} ${styles.buttonSmall}`}>
                トークン更新
              </button>
              <button onClick={handleLogoutClick} className={`${styles.buttonSecondary} ${styles.buttonSmall}`}>
                ログアウト
              </button>
            </>
          }
        />

        <nav className={styles.nav}>
          <Link to="/me" className={`${styles.navLink} ${styles.navLinkActive}`}>
            マイページ
          </Link>
          <Link to="/meals" className={styles.navLink}>
            食事管理
          </Link>
        </nav>

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
