import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "./api";
import { setAuth } from "./auth";
import type { LoginResponse } from "./types";
import { AppHeader } from "./components/AppHeader";
import styles from "./styles/auth.module.css";

export default function SignUp({
  onSuccess,
}: {
  onSuccess?: (r: LoginResponse) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

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
      window.dispatchEvent(new Event("authorized"));

      navigate("/me", { replace: true });
    } catch (err: any) {
      setErrMsg(err?.message ?? "新規登録に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <AppHeader />

      <div className={styles.contentWrapper}>
        {/* アプリ紹介セクション */}
        <div className={styles.introSection}>
          <h2 className={styles.introTitle}>私の経験から生まれたアプリ</h2>
          <p className={styles.introText}>
            減量をしていた時、食事の記録をつけるのが本当に大変でした。
            食材を1つ1つ検索して、カロリーや栄養素を調べる作業が面倒で、
            「もっと簡単にできないか？」と毎日感じていました。
          </p>
          <p className={styles.introText}>
            そこで、
            <strong>
              食材名を入力するだけで簡単にカロリーや栄養素がわかるアプリ
            </strong>
            を開発しました。
            実際に自分が欲しかった機能を詰め込んだ、実用性重視のツールです。
          </p>
          <p className={styles.introText}>
            <strong>主な機能：</strong>
          </p>
          <ul className={styles.featureList}>
            <li>食材名検索で即座に栄養素を表示</li>
            <li>カロリー・タンパク質・脂質・炭水化物を自動計算</li>
            <li>日別・週別・月別で栄養バランスを可視化</li>
          </ul>
        </div>

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
