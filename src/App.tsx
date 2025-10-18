import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./Login";
import MePage from "./MePage";
import type { LoginResponse } from "./types";
import { getToken, clearAuth } from "./auth";

// === 追加: 有効期限チェック（localStorageのexpiresを見る） ★
function getExpSec(): number {
  const raw = localStorage.getItem("access_token_expires") || "0";
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}
function isAccessTokenExpired(): boolean {
  const expSec = getExpSec();
  if (!expSec) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  // 30秒の余裕を持って期限切れ扱いにする
  return nowSec >= expSec - 30;
}

// === 追加: ルーター配下で navigate を使い、未認証イベント/自動ログアウトを束ねる ★
function AuthBridge({ setToken }: { setToken: (t: string | null) => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    // 起動時に期限切れなら即ログアウト
    if (!getToken() || isAccessTokenExpired()) {
      clearAuth();
      setToken(null);
      navigate("/login", { replace: true });
    }

    // 期限に合わせて自動ログアウト（タブ滞在中に期限が来た場合）
    const nowMs = Date.now();
    const expMs = getExpSec() * 1000;
    const delay = Math.max(0, expMs - nowMs);
    let timeoutId: number | undefined = undefined;
    if (delay > 0 && !isAccessTokenExpired()) {
      timeoutId = window.setTimeout(() => {
        clearAuth();
        setToken(null);
        navigate("/login", { replace: true });
      }, delay);
    }

    // api.ts 側で refresh 失敗時に dispatch される "unauthorized" を拾う
    const onUnauthorized = () => {
      clearAuth();
      setToken(null);
      navigate("/login", { replace: true });
    };
    window.addEventListener("unauthorized", onUnauthorized);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener("unauthorized", onUnauthorized);
    };
  }, [navigate, setToken]);

  return null;
}

function Protected({
  token,
  children,
}: {
  token: string | null;
  children: React.ReactNode;
}) {
  // トークン存在だけでなく「有効性」でもチェックする ★
  if (!token || isAccessTokenExpired()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => getToken());

  // 別タブのログアウト/ログイン反映
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token" || e.key === "access_token_expires") {
        setToken(getToken());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLoginSuccess = (res: LoginResponse) => {
    // ログイン成功時に state を同期
    setToken(res.token);
  };

  const handleLogout = () => {
    clearAuth();
    setToken(null);
  };

  return (
    <BrowserRouter>
      {/* 追加: ルーター配下で未認証遷移/自動ログアウトを集中管理 ★ */}
      <AuthBridge setToken={setToken} />
      <Routes>
        <Route
          path="/login"
          element={
            token && !isAccessTokenExpired() ? (
              <Navigate to="/me" replace />
            ) : (
              <Login onSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/me"
          element={
            <Protected token={token}>
              <MePage onLogout={handleLogout} />
            </Protected>
          }
        />
        <Route
          path="/"
          element={
            <Navigate
              to={token && !isAccessTokenExpired() ? "/me" : "/login"}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
