import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { LANG_STORAGE_KEY } from './constants'
import { translations } from './translations'
import type { Locale } from './types'

function readInitialLocale(): Locale {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) === 'ar' ? 'ar' : 'en'
  } catch {
    return 'en'
  }
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  let s = template
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{{${k}}}`).join(String(v))
  }
  return s
}

export type I18nContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale)

  useEffect(() => {
    document.documentElement.lang = locale === 'ar' ? 'ar' : 'en'
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    try {
      localStorage.setItem(LANG_STORAGE_KEY, locale)
    } catch {
      /* ignore */
    }
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = translations[locale][key] ?? translations.en[key] ?? key
      return interpolate(raw, vars)
    },
    [locale],
  )

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
