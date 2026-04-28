/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full API origin + path prefix, e.g. http://localhost:5000/api (production builds) */
  readonly VITE_API_URL?: string
  /** Dev-only: proxy /api to this origin (default http://localhost:5000) */
  readonly VITE_API_PROXY_TARGET?: string
  /** Public web origin for canonical and sitemap links, e.g. https://www.scnt-eg.me */
  readonly VITE_SITE_URL?: string
  /** Optional Google Analytics 4 measurement ID, e.g. G-XXXXXXXXXX */
  readonly VITE_GA_MEASUREMENT_ID?: string
  /** Optional Google Search Console verification token */
  readonly VITE_GSC_VERIFICATION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
