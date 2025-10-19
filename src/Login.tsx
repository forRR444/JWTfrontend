import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "./api";
import type { LoginResponse } from "./types";
import { Link } from "react-router-dom";

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrMsg("");
    setLoading(true);
    try {
      const res = await login({ email, password }); // 200 OK
      localStorage.setItem("access_token", res.token);
      localStorage.setItem("access_token_expires", String(res.expires ?? ""));
      localStorage.setItem("current_user", JSON.stringify(res.user ?? null));

      onSuccess?.(res);
      // ログイン成功後、ユーザー情報ページへリダイレクト
      navigate("/me", { replace: true });
    } catch (err: any) {
      setErrMsg(err?.message ?? "ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "64px auto",
        padding: 24,
        border: "1px solid #ddd",
        borderRadius: 8,
      }}
    >
      <h2 style={{ marginTop: 0 }}>ログイン</h2>
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 12 }}>
          <div style={{ fontSize: 12, marginBottom: 4 }}>メールアドレス</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
            placeholder="you@example.com"
          />
        </label>
        <label style={{ display: "block", marginBottom: 16 }}>
          <div style={{ fontSize: 12, marginBottom: 4 }}>パスワード</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
            placeholder="********"
          />
        </label>
        {errMsg && (
          <div style={{ color: "crimson", marginBottom: 12 }}>{errMsg}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 10 }}
        >
          {loading ? "送信中..." : "ログイン"}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        アカウントをお持ちでないですか？ <Link to="/signup">新規登録</Link>
      </p>
    </div>
  );
}
