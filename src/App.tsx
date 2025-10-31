import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./Login";
import SignUp from "./SignUp";
import MePage from "./MePage";
import MealsPage from "./MealsPage";
import type { LoginResponse } from "./types";
import { getToken, clearAuth } from "./auth";
import { scheduleTokenRefresh, cancelTokenRefresh } from "./api";

// 有効期限チェック
function getExpSec(): number {
  const raw = localStorage.getItem("access_token_expires") || "0";
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}
function isAccessTokenExpired(): boolean {
  const expSec = getExpSec();
  if (!expSec) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= expSec - 30; // 30秒前倒し
}

// 未認証イベント/自動ログアウトを束ねる
function AuthBridge({ setToken }: { setToken: (t: string | null) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const publicPaths = new Set<string>(["/login", "/signup"]);

  useEffect(() => {
    // 起動時：期限切れならログアウト
    if (!getToken() || isAccessTokenExpired()) {
      clearAuth();
      setToken(null);
      cancelTokenRefresh(); // タイマーもクリア
      if (!publicPaths.has(location.pathname)) {
        navigate("/login", { replace: true });
      }
    } else {
      // ログイン状態ならプロアクティブな更新をスケジュール
      scheduleTokenRefresh();
    }

    // 自動ログアウトタイマー（フォールバック用）
    // プロアクティブ更新が失敗した場合の最終防御線
    const nowMs = Date.now();
    const expMs = getExpSec() * 1000;
    const delay = Math.max(0, expMs - nowMs);
    let timeoutId: number | undefined = undefined;
    if (delay > 0 && !isAccessTokenExpired()) {
      timeoutId = window.setTimeout(() => {
        clearAuth();
        setToken(null);
        cancelTokenRefresh();
        if (!publicPaths.has(location.pathname)) {
          navigate("/login", { replace: true });
        }
      }, delay);
    }

    // refresh失敗（401）通知
    const onUnauthorized = () => {
      clearAuth();
      setToken(null);
      cancelTokenRefresh();
      if (!publicPaths.has(location.pathname)) {
        navigate("/login", { replace: true });
      }
    };
    window.addEventListener("unauthorized", onUnauthorized);

    // サインアップ/ログイン成功通知（トークン更新時も発火）
    const onAuthorized = () => {
      setToken(getToken());
      scheduleTokenRefresh(); // 更新されたトークンで次の更新をスケジュール
    };
    window.addEventListener("authorized", onAuthorized);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener("unauthorized", onUnauthorized);
      window.removeEventListener("authorized", onAuthorized);
    };
  }, [navigate, setToken, location.pathname]);

  return null;
}

function Protected({
  token,
  children,
}: {
  token: string | null;
  children: React.ReactNode;
}) {
  if (!token || isAccessTokenExpired()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => getToken());

  // 別タブの変化（同タブには発火しない）
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
    setToken(res.token);
  };

  const handleLogout = () => {
    clearAuth();
    setToken(null);
    cancelTokenRefresh();
  };

  return (
    <BrowserRouter>
      <AuthBridge setToken={setToken} />
      <Routes>
        <Route
          path="/login"
          element={
            token && !isAccessTokenExpired() ? (
              <Navigate to="/meals" replace />
            ) : (
              <Login onSuccess={handleLoginSuccess} />
            )
          }
        />
        {/* ★ サインアップ後も state を確実に同期 */}
        <Route
          path="/signup"
          element={<SignUp onSuccess={handleLoginSuccess} />}
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
          path="/meals"
          element={
            <Protected token={token}>
              <MealsPage />
            </Protected>
          }
        />
        <Route
          path="/"
          element={
            <Navigate
              to={token && !isAccessTokenExpired() ? "/meals" : "/login"}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
