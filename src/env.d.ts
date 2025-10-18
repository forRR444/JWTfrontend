/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_ORIGIN?: string; // http://localhost:3000
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
