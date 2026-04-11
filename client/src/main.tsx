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
