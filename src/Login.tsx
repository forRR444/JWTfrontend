import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login, scheduleTokenRefresh } from "./api";
import type { LoginResponse } from "./types";
import { Link } from "react-router-dom";
import { AppHeader } from "./components/AppHeader";
import { AppIntroSection } from "./components/AppIntroSection";
import styles from "./styles/auth.module.css";

/**
 * ログイン画面コンポーネント
 * - 成功時にアクセストークン等を保存し、トークン自動更新をスケジュール
 * - 失敗時はユーザー向けエラーメッセージを表示
 */
export default function Login({
  onSuccess,
}: {
  onSuccess?: (r: LoginResponse) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  /**
   * 認証処理本体
   * - APIへログイン要求 → 成功なら認証情報を保存し、ダッシュボードへ遷移
   * - 以降の期限切れを防ぐため scheduleTokenRefresh を起動
   */
  const handleLogin = async (loginEmail: string, loginPassword: string) => {
    setErrMsg("");
    setLoading(true);
    try {
      const res = await login({ email: loginEmail, password: loginPassword });
      // 認証情報はlocalStorageに集約保持（別タブ同期のため）
      localStorage.setItem("access_token", res.token);
      localStorage.setItem("access_token_expires", String(res.expires ?? ""));
      localStorage.setItem("current_user", JSON.stringify(res.user ?? null));

      scheduleTokenRefresh();

      onSuccess?.(res);
      // Cookieの保存完了を待ってから遷移（ブラウザのCookie保存は非同期）
      await new Promise((resolve) => setTimeout(resolve, 50));
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      // エラーメッセージを取得（APIエラーからメッセージを抽出）
      let errorMessage = "ログインに失敗しました。";

      if (err && typeof err === "object") {
        const error = err as { message?: string; status?: number };
        if (error.message) {
          errorMessage = error.message;
        } else if (error.status === 404) {
          errorMessage = "メールアドレスまたはパスワードが正しくありません。";
        } else if (error.status === 401) {
          errorMessage = "認証に失敗しました。再度お試しください。";
        } else if (error.status && error.status >= 500) {
          errorMessage = "サーバーエラーが発生しました。しばらくしてから再度お試しください。";
        }
      }

      setErrMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // フォーム送信ハンドラ（ページ遷移を抑止して認証処理へ）
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleLogin(email, password);
  };

  // テストアカウントでログイン
  const handleTestLogin = async () => {
    await handleLogin("test@example.com", "password");
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <AppHeader
          actions={
            <button
              type="button"
              onClick={handleTestLogin}
              disabled={loading}
              className={styles.testLoginButton}
            >
              テストログイン
            </button>
          }
        />

        {/* アプリ紹介セクション */}
        <AppIntroSection />

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>ログイン</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
                placeholder="8文字以上"
                disabled={loading}
              />
            </div>

            {errMsg && <div className={styles.error}>{errMsg}</div>}

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? "送信中..." : "ログイン"}
            </button>
          </form>

          <div className={styles.footer}>
            アカウントをお持ちでないですか？{" "}
            <Link to="/signup" className={styles.link}>
              新規登録
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
