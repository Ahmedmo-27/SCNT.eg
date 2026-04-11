import type { Locale } from '../i18n/types'

export function formatEgp(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(amount)
}
