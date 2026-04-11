import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { EightPointStar } from '../ui/EightPointStar'
import { StarDivider } from '../ui/StarDivider'

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  },
}

function GenderCard({
  shopLabel,
  browseLabel,
  title,
  subtitle,
  to,
  accentClass,
}: {
  shopLabel: string
  browseLabel: string
  title: string
  subtitle: string
  to: string
  accentClass: string
}) {
  return (
    <motion.div variants={item}>
      <Link
        to={to}
        className="group relative block overflow-hidden rounded-2xl border border-scnt-border/80 bg-scnt-bg-elevated/40 p-7 shadow-[0_30px_90px_-50px_var(--color-scnt-shadow)] backdrop-blur-md transition-[transform,box-shadow,border-color,background-color] duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] hover:-translate-y-1 hover:border-scnt-border hover:bg-scnt-bg-elevated/60 hover:shadow-[0_46px_110px_-62px_var(--color-scnt-shadow)] sm:p-9"
      >
        <div
          className={`pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full blur-3xl opacity-40 transition-opacity duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] group-hover:opacity-65 ${accentClass}`}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_40%_30%,rgba(255,255,255,0.22)_0%,transparent_62%)] opacity-50" />

        <p className="relative z-[1] text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
          {shopLabel}
        </p>
        <h3 className="relative z-[1] mt-3 font-serif text-2xl text-scnt-text sm:text-3xl">{title}</h3>
        <p className="relative z-[1] mt-2 max-w-md text-sm leading-relaxed text-scnt-text-muted sm:text-base">
          {subtitle}
        </p>
        <span className="relative z-[1] mt-8 inline-flex items-center gap-2 text-sm text-scnt-text transition-colors duration-[var(--duration-scnt)] ease-[var(--ease-scnt)]">
          {browseLabel}
          <span className="inline-block text-scnt-text/35 transition-transform duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] group-hover:translate-x-1 group-hover:rotate-12">
            <EightPointStar size={11} />
          </span>
        </span>
      </Link>
    </motion.div>
  )
}

export function ShopByGender() {
  const { t } = useI18n()
  return (
    <section className="relative px-5 py-24 sm:px-8 sm:py-28">
      <div className="pointer-events-none absolute inset-x-8 top-0 hidden h-px bg-gradient-to-r from-transparent via-scnt-border/70 to-transparent sm:block" />

      <div className="mx-auto max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
              <EightPointStar size={9} className="opacity-45" />
              {t('home.gender.kicker')}
            </p>
            <h2 className="font-serif text-3xl font-medium text-scnt-text sm:text-4xl">{t('home.gender.title')}</h2>
            <p className="mt-3 max-w-lg text-sm text-scnt-text-muted sm:text-base">{t('home.gender.sub')}</p>
          </div>
        </motion.header>

        <StarDivider className="py-2 sm:py-4" />

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid gap-6 sm:grid-cols-2 sm:gap-8"
        >
          <GenderCard
            shopLabel={t('home.gender.shop')}
            browseLabel={t('home.gender.browse')}
            title={t('home.gender.femaleTitle')}
            subtitle={t('home.gender.femaleSub')}
            to="/shop?gender=female"
            accentClass="bg-[radial-gradient(circle,rgba(184,155,94,0.35),transparent_65%)]"
          />
          <GenderCard
            shopLabel={t('home.gender.shop')}
            browseLabel={t('home.gender.browse')}
            title={t('home.gender.maleTitle')}
            subtitle={t('home.gender.maleSub')}
            to="/shop?gender=male"
            accentClass="bg-[radial-gradient(circle,rgba(75,85,99,0.32),transparent_65%)]"
          />
        </motion.div>
      </div>
    </section>
  )
}

