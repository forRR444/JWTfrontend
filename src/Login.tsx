import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login, scheduleTokenRefresh } from "./api";
import type { LoginResponse } from "./types";
import { Link } from "react-router-dom";
import { AppHeader } from "./components/AppHeader";
import { AppIntroSection } from "./components/AppIntroSection";
import styles from "./styles/auth.module.css";

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

  const handleLogin = async (loginEmail: string, loginPassword: string) => {
    setErrMsg("");
    setLoading(true);
    try {
      const res = await login({ email: loginEmail, password: loginPassword });
      localStorage.setItem("access_token", res.token);
      localStorage.setItem("access_token_expires", String(res.expires ?? ""));
      localStorage.setItem("current_user", JSON.stringify(res.user ?? null));

      scheduleTokenRefresh();

      onSuccess?.(res);
      navigate("/me", { replace: true });
    } catch (err: any) {
      setErrMsg(err?.message ?? "ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

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

      <div className={styles.contentWrapper}>
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
