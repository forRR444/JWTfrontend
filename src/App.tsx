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

function Protected({
  token,
  children,
}: {
  token: string | null;
  children: React.ReactNode;
}) {
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => getToken());

  // 別タブのログアウトなどに対応
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token") {
        setToken(getToken());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLoginSuccess = (res: LoginResponse) => {
    // 念のためstateも更新
    setToken(res.token);
  };

  const handleLogout = () => {
    // 1) localStorage をクリア
    clearAuth();
    // 2) App の state を同期的に null にする
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            token ? (
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
          element={<Navigate to={token ? "/me" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
