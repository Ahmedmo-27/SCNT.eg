import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { EightPointStar } from '../components/ui/EightPointStar'

type PlaceholderPageProps = {
  title: string
  subtitle?: string
}

export function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <p className="mb-4 inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
          <EightPointStar size={9} className="opacity-45" />
          SCNT.eg
        </p>
        <h1 className="font-serif text-4xl text-scnt-text">{title}</h1>
        {subtitle ? (
          <p className="mt-4 text-scnt-text-muted">{subtitle}</p>
        ) : null}
        <p className="mt-10 text-sm text-scnt-text-muted">
          This route is wired for the full MERN build — content ships in the next
          implementation pass.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 text-sm text-scnt-text underline-offset-4 transition-opacity hover:opacity-75"
        >
          <EightPointStar size={10} className="opacity-40" />
          Back to home
        </Link>
      </div>
    </Layout>
  )
}
