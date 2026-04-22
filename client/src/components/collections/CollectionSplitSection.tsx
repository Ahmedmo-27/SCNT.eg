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
    <div className="relative min-h-[calc(100svh-var(--scnt-header-h,5.5rem))] w-full">
      <div className="absolute inset-0 -z-10 opacity-95" style={{ background: gradient }} aria-hidden />

      <div className="relative mx-auto flex h-full w-full max-w-6xl items-stretch px-5 sm:px-8">
        <div
          className={`grid w-full items-center gap-10 py-8 md:py-10 lg:gap-14 ${
            flip ? 'md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.1fr)]' : 'md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)]'
          }`}
        >
        <div className={`${flip ? 'md:order-2' : ''}`}>
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

        <div className={`${flip ? 'md:order-1' : ''}`}>
          <div className="mx-auto w-full max-w-md md:max-w-none">
            <div className="relative overflow-hidden rounded-2xl border border-scnt-border/45 bg-scnt-bg-elevated/35 shadow-[0_32px_80px_-40px_rgba(42,38,34,0.2)]">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="h-[min(560px,70vh)] w-full object-cover sm:h-[min(620px,72vh)]"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-[min(560px,70vh)] w-full place-items-center sm:h-[min(620px,72vh)]">
                  <div className="text-center">
                    <p className="text-xs font-medium uppercase tracking-[0.28em] text-scnt-text-muted">Image slot</p>
                    <p className="mt-2 max-w-xs text-xs text-scnt-text-muted/80">
                      Drop your collection artwork here later.
                    </p>
                  </div>
                </div>
              )}

              {productImageSrc ? (
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-start ps-5 pt-6 sm:ps-7 sm:pt-8">
                  <img
                    src={productImageSrc}
                    alt=""
                    className="h-[min(420px,52vh)] w-auto object-contain object-left-top"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ) : null}

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
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

