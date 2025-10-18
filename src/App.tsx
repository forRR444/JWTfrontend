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
import { fetchProjects } from "./api";
import type { LoginResponse, Project } from "./types";

function Projects({
  token,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProjects(token);
        setProjects(data);
      } catch (e: any) {
        setErr(e.message);
      }
    })();
  }, [token]);

  return (
    <div style={{ maxWidth: 720, margin: "32px auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Projects</h2>
        <button onClick={onLogout}>ログアウト</button>
      </div>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      <ul>
        {projects.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}

function ProtectedRoute({
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
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("access_token")
  );

  const handleLoginSuccess = (res: LoginResponse) => {
    setToken(res.token);
  };
  const handleLogout = () => {
    localStorage.clear();
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
              <Login onSuccess={(r: LoginResponse) => setToken(r.token)} />
            )
          }
        />
        <Route
          path="/me"
          element={token ? <MePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/"
          element={<Navigate to={token ? "/me" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
