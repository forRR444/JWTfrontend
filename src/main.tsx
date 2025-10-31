import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// デバッグ用のヘルパー関数をロード（開発環境のみ）
if (import.meta.env.DEV) {
  import('./debug');
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
