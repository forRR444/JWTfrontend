import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // /api/* のリクエストをバックエンドにプロキシ
      // Docker環境ではサービス名（backend）を使用
      "/api": {
        target: "http://backend:3000",
        changeOrigin: true,
        // Cookieを転送
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            // リクエストのCookieをプロキシに転送
            if (req.headers.cookie) {
              proxyReq.setHeader("Cookie", req.headers.cookie);
            }
          });
        },
      },
    },
  },
});
