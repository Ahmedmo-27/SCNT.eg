import { Button } from '../ui/Button'
import { EightPointStar } from '../ui/EightPointStar'

type Props = {
  kicker?: string
  title: string
  body?: string
  ctaLabel?: string
  ctaTo?: string
  accent?: string
  imageSrc?: string
  productImageSrc?: string
  imageAlt?: string
  /** When true, flips image/text sides on large screens. */
  flip?: boolean
}

export function CollectionSplitSection({
  kicker,
  title,
  body,
  ctaLabel,
  ctaTo,
  accent,
  imageSrc,
  productImageSrc,
  imageAlt = '',
  flip = false,
}: Props) {
  const gradient = accent
    ? `radial-gradient(ellipse 70% 55% at 10% 0%, ${accent}22 0%, transparent 58%), radial-gradient(ellipse 65% 55% at 95% 80%, ${accent}14 0%, transparent 60%)`
    : undefined

  return (
    <div className="relative h-[calc(100svh-var(--scnt-header-h,5.5rem))] w-full md:h-auto md:min-h-[calc(100svh-var(--scnt-header-h,5.5rem))]">
      <div className="absolute inset-0 -z-10 opacity-95" style={{ background: gradient }} aria-hidden />

      <div className="relative mx-auto flex h-full w-full max-w-6xl items-stretch px-0 md:px-5 lg:px-8">
        <div
          className={`flex h-full w-full flex-col justify-end md:grid md:h-auto md:items-center md:gap-10 md:py-10 lg:gap-14 ${flip ? 'md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.1fr)]' : 'md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)]'
            }`}
        >
          <div className={`relative z-10 mt-auto px-5 pb-8 pt-32 bg-gradient-to-t from-scnt-bg via-scnt-bg/95 to-transparent md:bg-none md:mt-0 md:pt-0 md:order-none md:h-auto md:overflow-visible md:px-0 md:py-0 ${flip ? 'md:order-2' : ''}`}>
            {kicker ? (
              <p className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.32em] text-scnt-text-muted">
                <EightPointStar size={9} className="opacity-45" />
                {kicker}
              </p>
            ) : null}

            <h2 className="max-w-2xl font-serif text-4xl text-scnt-text sm:text-5xl md:text-[3.15rem]">
              {title}
            </h2>

            {body ? (
              <p className="mt-6 max-w-xl whitespace-pre-line text-sm leading-relaxed text-scnt-text-muted sm:text-[0.98rem]">
                {body}
              </p>
            ) : null}

            {ctaLabel && ctaTo ? (
              <div className="mt-10">
                <Button to={ctaTo} variant="outline" className="px-9">
                  {ctaLabel}
                </Button>
              </div>
            ) : null}
          </div>

          <div className={`absolute inset-0 z-0 w-full md:relative md:order-none md:h-auto ${flip ? 'md:order-1' : ''}`}>
            <div className="mx-auto h-full w-full md:max-w-none">
              <div className="relative h-full w-full overflow-hidden border-b border-scnt-border/45 md:bg-scnt-bg-elevated/35 md:shadow-sm md:rounded-2xl md:border md:shadow-[0_32px_80px_-40px_rgba(42,38,34,0.2)]">
                <div className="relative h-full w-full overflow-hidden md:overflow-visible">
                  {imageSrc ? (
                    <picture>
                      <source srcSet={imageSrc} type="image/png" />
                      <img
                        src={imageSrc}
                        alt={imageAlt}
                        className="h-full w-full object-cover md:h-[min(560px,70vh)] lg:h-[min(620px,72vh)]"
                        loading="lazy"
                      />
                    </picture>
                  ) : (
                    <div className="grid h-full w-full place-items-center md:h-[min(560px,70vh)] lg:h-[min(620px,72vh)]">
                      <div className="text-center">
                        <p className="text-xs font-medium uppercase tracking-[0.28em] text-scnt-text-muted">Image slot</p>
                        <p className="mt-2 max-w-xs text-xs text-scnt-text-muted/80">
                          Drop your collection artwork here later.
                        </p>
                      </div>
                    </div>
                  )}

                  <div
                    className="pointer-events-none absolute inset-0 opacity-70"
                    style={{
                      background:
                        accent
                          ? `radial-gradient(ellipse 65% 55% at 70% 0%, ${accent}18 0%, transparent 60%)`
                          : undefined,
                    }}
                    aria-hidden
                  />
                </div>

                {productImageSrc ? (
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex w-full items-center justify-center p-4 md:w-auto md:items-start md:justify-start md:ps-5 md:pt-6 lg:ps-7 lg:pt-8">
                    <picture>
                      <source srcSet={productImageSrc} type="image/png" />
                      <img
                        src={productImageSrc}
                        alt=""
                        className="relative z-30 h-[min(360px,50vh)] w-auto object-contain drop-shadow-2xl md:h-[min(420px,52vh)] md:object-left-top"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

