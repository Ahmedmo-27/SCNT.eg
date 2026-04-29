import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CatalogProvider } from './context/CatalogContext'
import { I18nProvider } from './i18n/I18nContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <CatalogProvider>
        <App />
      </CatalogProvider>
    </I18nProvider>
  </StrictMode>,
)

// Register service worker in production to enable caching of assets
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('Service worker registered.', reg))
      .catch((err) => console.error('Service worker registration failed:', err));
  });
}
