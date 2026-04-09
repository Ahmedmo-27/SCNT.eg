/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full API origin + path prefix, e.g. http://localhost:5000/api (production builds) */
  readonly VITE_API_URL?: string
  /** Dev-only: proxy /api to this origin (default http://localhost:5000) */
  readonly VITE_API_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
