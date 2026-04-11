import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { EightPointStar } from '../ui/EightPointStar'
import { Logo } from '../brand/Logo'

export function Footer() {
  const { t } = useI18n()
  return (
    <footer className="relative mt-28 border-t border-scnt-border/80 bg-gradient-to-b from-scnt-bg-muted/40 via-scnt-bg-muted/55 to-scnt-bg-muted/65">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-70"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-5 py-14 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-4">
          <Logo to="/" />
          <p className="text-sm leading-relaxed text-scnt-text-muted">{t('footer.blurb')}</p>
        </div>

        <div className="flex flex-wrap gap-10 text-sm text-scnt-text-muted">
          <div className="space-y-3">
            <p className="font-medium text-scnt-text">{t('footer.shop')}</p>
            <ul className="space-y-2">
              <li>
                <Link className="transition-colors hover:text-scnt-text" to="/shop">
                  {t('nav.shopAll')}
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-scnt-text" to="/collections">
                  {t('nav.collections')}
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-scnt-text" to="/cart">
                  {t('nav.cart')}
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-medium text-scnt-text">{t('footer.house')}</p>
            <ul className="space-y-2">
              <li>
                <Link className="transition-colors hover:text-scnt-text" to="/about">
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-scnt-text" to="/contact">
                  {t('nav.contact')}
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-scnt-text" to="/faqs">
                  {t('nav.faqs')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-scnt-border/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-scnt-text-muted sm:flex-row sm:px-8">
          <p>{t('footer.rights', { year: String(new Date().getFullYear()) })}</p>
          <span className="inline-flex items-center gap-2 opacity-60" aria-hidden>
            <EightPointStar size={9} />
          </span>
        </div>
      </div>
    </footer>
  )
}
