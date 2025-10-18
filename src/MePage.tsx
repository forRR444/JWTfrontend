import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "./api";

type Me = {
  id: number | string;
  name: string;
};

export default function MePage() {
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

  if (error) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!me) return <p>読み込み中...</p>;

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", padding: 16 }}>
      <h2>マイページ</h2>
      <p>ID: {String(me.id)}</p>
      <p>名前: {me.name}</p>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login", { replace: true });
          }}
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
