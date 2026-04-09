/**
 * Site-wide depth: warm studio light, soft vignette, paper grain.
 * Fixed behind all pages; never captures pointer events.
 */
export function GlobalAtmosphere() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* Base lift — subtle vertical warmth */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, 
            #f4efe8 0%, 
            var(--color-scnt-bg) 38%, 
            #e8dfd4 100%)`,
        }}
      />

      {/* Key light — soft studio from upper left */}
      <div className="absolute -left-[25%] -top-[35%] h-[min(85vh,820px)] w-[min(95vw,900px)] rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent blur-3xl" />

      {/* Fill / rim — gentle warmth from bottom right */}
      <div className="absolute -bottom-[20%] -right-[15%] h-[min(70vh,640px)] w-[min(85vw,720px)] rounded-full bg-gradient-to-tl from-amber-100/20 via-rose-100/5 to-transparent blur-3xl" />

      {/* Secondary cool whisper — stops beige from feeling flat */}
      <div className="absolute left-1/2 top-[8%] h-[40vh] w-[70vw] -translate-x-1/2 rounded-full bg-gradient-to-b from-slate-200/15 to-transparent blur-3xl" />

      {/* Vignette — emotional focus without darkness */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: `inset 0 0 140px 50px rgba(42, 38, 34, 0.055)`,
        }}
      />

      {/* Paper / fabric grain */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`,
          backgroundSize: '220px 220px',
        }}
      />

      {/* Micro-depth speckle (secondary to noise) */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(rgba(42,38,34,0.35) 0.6px, transparent 0.7px)`,
          backgroundSize: '14px 14px',
        }}
      />
    </div>
  )
}
