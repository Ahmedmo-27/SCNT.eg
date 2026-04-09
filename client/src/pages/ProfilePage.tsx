import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { EightPointStar } from '../components/ui/EightPointStar'

const orderHistory = [
  { id: '#SCNT-2041', date: '2026-03-18', total: 'EGP 1,250', status: 'Delivered' },
  { id: '#SCNT-1984', date: '2026-02-04', total: 'EGP 740', status: 'Shipped' },
  { id: '#SCNT-1907', date: '2026-01-12', total: 'EGP 980', status: 'Delivered' },
]

export function ProfilePage() {
  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <header className="max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
            <EightPointStar size={9} className="opacity-45" />
            Account
          </p>
          <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">My Profile</h1>
          <p className="mt-4 text-scnt-text-muted">Manage your details and quickly review your recent orders.</p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card asMotion={false} className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-scnt-text-muted">Profile details</p>
            <div className="mt-4 space-y-3 text-sm text-scnt-text-muted">
              <p>
                <span className="text-scnt-text">Name:</span> Ahmed Customer
              </p>
              <p>
                <span className="text-scnt-text">Email:</span> ahmed@example.com
              </p>
              <p>
                <span className="text-scnt-text">Phone:</span> +20 1XX XXX XXXX
              </p>
            </div>
            <button
              type="button"
              className="mt-6 w-full rounded-full border border-scnt-border/80 px-4 py-2.5 text-sm text-scnt-text transition-colors hover:bg-scnt-bg-muted/60"
            >
              Edit profile
            </button>
          </Card>

          <Card asMotion={false} className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-scnt-text-muted">Recent orders</p>
              <Link to="/shop" className="text-xs uppercase tracking-[0.15em] text-scnt-text underline-offset-4 hover:underline">
                Shop again
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-scnt-border/60">
              {orderHistory.map((order) => (
                <li key={order.id} className="grid gap-2 py-4 text-sm text-scnt-text-muted sm:grid-cols-4 sm:items-center">
                  <span className="font-medium text-scnt-text">{order.id}</span>
                  <span>{order.date}</span>
                  <span>{order.total}</span>
                  <span className="justify-self-start rounded-full bg-scnt-bg-muted/70 px-3 py-1 text-xs uppercase tracking-wide text-scnt-text sm:justify-self-end">
                    {order.status}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
