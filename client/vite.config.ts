import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function ensureAbsoluteUrl(value: string, origin: string): string {
  if (/^https?:\/\//i.test(value)) return value
  const normalizedPath = value.startsWith('/') ? value : `/${value}`
  return `${origin}${normalizedPath}`
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5000'
  const siteUrl = (env.VITE_SITE_URL || 'https://www.scnt-eg.me').replace(/\/$/, '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'scnt-absolute-social-meta',
        enforce: 'post',
        transformIndexHtml(html) {
          return html
            .replace(
              /(<meta\s+property="og:image"\s+content=")([^"]*)("\s*\/?>)/i,
              (_full, prefix, value, suffix) => `${prefix}${ensureAbsoluteUrl(value, siteUrl)}${suffix}`,
            )
            .replace(
              /(<meta\s+property="og:image:secure_url"\s+content=")([^"]*)("\s*\/?>)/i,
              (_full, prefix, value, suffix) => `${prefix}${ensureAbsoluteUrl(value, siteUrl)}${suffix}`,
            )
            .replace(
              /(<meta\s+name="twitter:image"\s+content=")([^"]*)("\s*\/?>)/i,
              (_full, prefix, value, suffix) => `${prefix}${ensureAbsoluteUrl(value, siteUrl)}${suffix}`,
            )
        },
      },
    ],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
