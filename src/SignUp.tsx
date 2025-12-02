import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "./api";
import { setAuth } from "./auth";
import type { LoginResponse } from "./types";
import { AppHeader } from "./components/AppHeader";
import { AppIntroSection } from "./components/AppIntroSection";
import styles from "./styles/auth.module.css";

/**
 * 新規登録（サインアップ）画面コンポーネント
 * - 入力フォーム送信でユーザー登録APIを呼び出し
 * - 成功時に認証情報を保存し、/me へリダイレクト
 */
export default function SignUp({
  onSuccess,
}: {
  onSuccess?: (r: LoginResponse) => void;
}) {
  // 入力状態・エラーメッセージ・通信中フラグの管理
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  /**
   * 登録フォーム送信時の処理
   * - register APIを実行し、成功時にlocalStorageへ認証情報を保存
   * - グローバルで authorized イベントを発火して他タブと同期
   */
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrMsg("");
    setLoading(true);
    try {
      const res = await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setAuth(res.token, res.expires, res.user);
      onSuccess?.(res);
      // 他タブに認証状態の更新を通知
      window.dispatchEvent(new Event("authorized"));

      // Cookieの保存完了を待ってから遷移（ブラウザのCookie保存は非同期）
      await new Promise((resolve) => setTimeout(resolve, 50));
      navigate("/me", { replace: true });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err && typeof err.message === "string"
          ? err.message
          : "新規登録に失敗しました。";
      setErrMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <AppHeader />

        {/* アプリ紹介セクション */}
        <AppIntroSection />

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>新規登録</h2>
          <form onSubmit={onSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                名前
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={styles.input}
                placeholder="山田太郎"
                disabled={loading}
                maxLength={30}
              />
            </div>

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
                placeholder="8文字以上（英数字と-_のみ）"
                disabled={loading}
              />
              <div className={styles.hint}>
                8文字以上、英数字とハイフン・アンダースコアが使用可能
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="passwordConfirmation" className={styles.label}>
                パスワード（確認）
              </label>
              <input
                id="passwordConfirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                className={styles.input}
                placeholder="パスワードを再入力"
                disabled={loading}
              />
            </div>

            {errMsg && <div className={styles.error}>{errMsg}</div>}

            <button disabled={loading} type="submit" className={styles.button}>
              {loading ? "送信中..." : "登録する"}
            </button>
          </form>

          <div className={styles.footer}>
            既にアカウントをお持ちですか？{" "}
            <Link to="/login" className={styles.link}>
              ログイン
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
