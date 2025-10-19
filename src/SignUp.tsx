import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "./api";
import { setAuth } from "./auth";
import type { LoginResponse } from "./types";

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
      // トークンを保存
      setAuth(res.token, res.expires, res.user);
      // App.tsx の state を即時同期
      onSuccess?.(res);
      // 予備: カスタムイベントでも通知（別実装でも拾えるように）
      window.dispatchEvent(new Event("authorized"));

      // マイページへ
      navigate("/me", { replace: true });
    } catch (err: any) {
      setErrMsg(err?.message ?? "新規登録に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "48px auto", padding: 16 }}>
      <h2>新規登録</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>名前</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label>パスワード（確認）</label>
          <input
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
          />
        </div>

        {errMsg && <p style={{ color: "crimson" }}>{errMsg}</p>}

        <button disabled={loading} type="submit">
          {loading ? "送信中..." : "登録する"}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        既にアカウントをお持ちですか？ <Link to="/login">ログイン</Link>
      </p>
    </div>
  );
}
