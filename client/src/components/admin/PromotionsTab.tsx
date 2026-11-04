import { useEffect, useState, useMemo, type FormEvent } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import {
  fetchAdminCampaigns,
  createAdminCampaign,
  updateAdminCampaign,
  deleteAdminCampaign,
  fetchAdminCampaignLeads,
  type AdminPromotionCampaign,
  type CampaignLeadsResponse,
  type PromotionType,
  type PromotionTheme,
} from '../../services/promotionsApi'
import { PromotionalModal } from '../promotions/PromotionalModal'

type CampaignFormData = {
  name: string
  type: PromotionType
  badgeEn: string
  badgeAr: string
  titleEn: string
  titleAr: string
  subtitleEn: string
  subtitleAr: string
  descriptionEn: string
  descriptionAr: string
  discountHighlightEn: string
  discountHighlightAr: string
  ctaTextEn: string
  ctaTextAr: string
  promoCode: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: string
  minSubtotal: string
  startsAt: string
  expiresAt: string
  isActive: boolean
  showModal: boolean
  theme: PromotionTheme
}

const emptyForm: CampaignFormData = {
  name: '',
  type: 'SPECIAL_EVENT',
  badgeEn: 'Limited Event',
  badgeAr: 'عرض خاص',
  titleEn: '',
  titleAr: '',
  subtitleEn: '',
  subtitleAr: '',
  descriptionEn: 'Enter your email to receive your exclusive promo code.',
  descriptionAr: 'أدخل بريدك الإلكتروني لاستلام كود الخصم الحصري فوراً.',
  discountHighlightEn: '20% OFF',
  discountHighlightAr: 'خصم 20%',
  ctaTextEn: 'Claim My Discount',
  ctaTextAr: 'احصل على كود الخصم',
  promoCode: '',
  discountType: 'PERCENTAGE',
  discountValue: '20',
  minSubtotal: '0',
  startsAt: '',
  expiresAt: '',
  isActive: true,
  showModal: true,
  theme: 'black_friday',
}

function formatDatetimeLocal(isoString: string | null | undefined): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Evergreen (No date limit)'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'Invalid date'
  return d.toLocaleDateString('en-EG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PromotionsTab() {
  const [campaigns, setCampaigns] = useState<AdminPromotionCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CampaignFormData>(emptyForm)

  // Preview Modal State
  const [previewingCampaign, setPreviewingCampaign] = useState<AdminPromotionCampaign | null>(null)

  // Leads Modal State
  const [viewingLeads, setViewingLeads] = useState<CampaignLeadsResponse | null>(null)
  const [loadingLeads, setLoadingLeads] = useState(false)

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const data = await fetchAdminCampaigns()
      setCampaigns(data)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCampaigns()
  }, [])

  // KPI Calculations
  const totalLeads = useMemo(
    () => campaigns.reduce((sum, c) => sum + (c.leadsCount || 0), 0),
    [campaigns]
  )

  const activeSpecialCampaign = useMemo(() => {
    const now = Date.now()
    return campaigns.find(
      (c) =>
        c.type === 'SPECIAL_EVENT' &&
        c.isActive &&
        c.showModal &&
        (!c.startsAt || new Date(c.startsAt).getTime() <= now) &&
        (!c.expiresAt || new Date(c.expiresAt).getTime() >= now)
    )
  }, [campaigns])

  const activeWelcomeCampaign = useMemo(() => {
    return campaigns.find((c) => c.type === 'DEFAULT_WELCOME' && c.isActive && c.showModal)
  }, [campaigns])

  const startEdit = (c: AdminPromotionCampaign) => {
    setEditingCampaignId(c._id)
    setFormData({
      name: c.name,
      type: c.type,
      badgeEn: c.badge?.en || '',
      badgeAr: c.badge?.ar || '',
      titleEn: c.title?.en || '',
      titleAr: c.title?.ar || '',
      subtitleEn: c.subtitle?.en || '',
      subtitleAr: c.subtitle?.ar || '',
      descriptionEn: c.description?.en || '',
      descriptionAr: c.description?.ar || '',
      discountHighlightEn: c.discountHighlight?.en || '',
      discountHighlightAr: c.discountHighlight?.ar || '',
      ctaTextEn: c.ctaText?.en || '',
      ctaTextAr: c.ctaText?.ar || '',
      promoCode: c.promoCode || '',
      discountType: c.discountType || 'PERCENTAGE',
      discountValue: String(c.discountValue || 0),
      minSubtotal: String(c.minSubtotal || 0),
      startsAt: formatDatetimeLocal(c.startsAt),
      expiresAt: formatDatetimeLocal(c.expiresAt),
      isActive: c.isActive,
      showModal: c.showModal,
      theme: c.theme || 'black_friday',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingCampaignId(null)
    setFormData(emptyForm)
    setErrorMessage(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const payload: Partial<AdminPromotionCampaign> = {
        name: formData.name.trim(),
        type: formData.type,
        badge: { en: formData.badgeEn.trim(), ar: formData.badgeAr.trim() },
        title: { en: formData.titleEn.trim(), ar: formData.titleAr.trim() },
        subtitle: { en: formData.subtitleEn.trim(), ar: formData.subtitleAr.trim() },
        description: { en: formData.descriptionEn.trim(), ar: formData.descriptionAr.trim() },
        discountHighlight: {
          en: formData.discountHighlightEn.trim(),
          ar: formData.discountHighlightAr.trim(),
        },
        ctaText: { en: formData.ctaTextEn.trim(), ar: formData.ctaTextAr.trim() },
        promoCode: formData.promoCode.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue) || 10,
        minSubtotal: Number(formData.minSubtotal) || 0,
        startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        isActive: formData.isActive,
        showModal: formData.showModal,
        theme: formData.theme,
      }

      if (editingCampaignId) {
        await updateAdminCampaign(editingCampaignId, payload)
        setStatusMessage('Campaign updated successfully!')
      } else {
        await createAdminCampaign(payload)
        setStatusMessage('New campaign created successfully!')
      }

      await loadCampaigns()
      cancelEdit()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save campaign')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete campaign "${name}"?`)) return
    setBusy(true)
    try {
      await deleteAdminCampaign(id)
      await loadCampaigns()
      if (editingCampaignId === id) cancelEdit()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete campaign')
    } finally {
      setBusy(false)
    }
  }

  const handleOpenLeads = async (id: string) => {
    setLoadingLeads(true)
    try {
      const data = await fetchAdminCampaignLeads(id)
      setViewingLeads(data)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load leads')
    } finally {
      setLoadingLeads(false)
    }
  }

  const handleExportCsv = () => {
    if (!viewingLeads || viewingLeads.leads.length === 0) return
    const rows = [
      ['Email', 'Promo Code', 'Claimed Date', 'Locale', 'Visitor ID'],
      ...viewingLeads.leads.map((l) => [
        l.email,
        l.promoCode,
        new Date(l.claimedAt).toISOString(),
        l.locale || 'en',
        l.visitorId || '',
      ]),
    ]

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((f) => `"${f}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `leads_${viewingLeads.campaign.name.replace(/\s+/g, '_')}_${Date.now()}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Live Preview Modal */}
      {previewingCampaign ? (
        <PromotionalModal
          previewCampaign={{
            _id: previewingCampaign._id,
            name: previewingCampaign.name,
            type: previewingCampaign.type,
            badge: previewingCampaign.badge,
            title: previewingCampaign.title,
            subtitle: previewingCampaign.subtitle,
            description: previewingCampaign.description,
            discountHighlight: previewingCampaign.discountHighlight,
            ctaText: previewingCampaign.ctaText,
            theme: previewingCampaign.theme,
            startsAt: previewingCampaign.startsAt,
            expiresAt: previewingCampaign.expiresAt,
          }}
          onClosePreview={() => setPreviewingCampaign(null)}
        />
      ) : null}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card asMotion={false} className="p-4 border-scnt-border/80">
          <span className="text-xs font-medium text-scnt-text-muted">Current Live Storefront Status</span>
          <div className="mt-2 flex items-center gap-2">
            {activeSpecialCampaign ? (
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            ) : activeWelcomeCampaign ? (
              <span className="flex h-2.5 w-2.5 rounded-full bg-blue-400" />
            ) : (
              <span className="flex h-2.5 w-2.5 rounded-full bg-zinc-500" />
            )}
            <p className="font-semibold text-sm text-scnt-text">
              {activeSpecialCampaign
                ? `Special Event: ${activeSpecialCampaign.name}`
                : activeWelcomeCampaign
                ? `Normal Times: ${activeWelcomeCampaign.name}`
                : 'No modal active'}
            </p>
          </div>
          <p className="text-[11px] text-scnt-text-muted mt-1">
            {activeSpecialCampaign
              ? `Scheduled: active until ${formatDisplayDate(activeSpecialCampaign.expiresAt)}`
              : activeWelcomeCampaign
              ? 'Showing default first-order welcome discount'
              : 'Storefront modal will not pop up'}
          </p>
        </Card>

        <Card asMotion={false} className="p-4 border-scnt-border/80">
          <span className="text-xs font-medium text-scnt-text-muted">Total Campaigns</span>
          <p className="mt-1 font-mono text-2xl font-bold text-scnt-text">{campaigns.length}</p>
          <p className="text-[11px] text-scnt-text-muted mt-1">
            {campaigns.filter((c) => c.type === 'SPECIAL_EVENT').length} Special Events ·{' '}
            {campaigns.filter((c) => c.type === 'DEFAULT_WELCOME').length} Evergreen Welcome
          </p>
        </Card>

        <Card asMotion={false} className="p-4 border-scnt-border/80">
          <span className="text-xs font-medium text-scnt-text-muted">Total Email Leads Captured</span>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">{totalLeads}</p>
          <p className="text-[11px] text-scnt-text-muted mt-1">
            Subscribers who claimed codes via popup modal
          </p>
        </Card>
      </div>

      {statusMessage ? (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
          {errorMessage}
        </div>
      ) : null}

      {/* Campaign Form: Create or Edit */}
      <Card asMotion={false} className="p-5 border-scnt-border/80">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-serif text-lg text-scnt-text font-bold">
              {editingCampaignId ? 'Edit Promotional Campaign' : 'Create Promotional Campaign'}
            </h3>
            <p className="text-xs text-scnt-text-muted">
              Configure scheduled event discounts (like Black Friday) or your default first-order
              welcome offer.
            </p>
          </div>
          {editingCampaignId ? (
            <Button variant="outline" className="text-xs py-1 px-3" onClick={cancelEdit}>
              Cancel Edit
            </Button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Top row: Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-scnt-text mb-1">
                Campaign Name (Internal) *
              </label>
              <input
                required
                className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm text-scnt-text"
                placeholder="e.g. Black Friday 2026 or Welcome Offer"
                value={formData.name}
                onChange={(e) => setFormData((s) => ({ ...s, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-scnt-text mb-1">Campaign Type</label>
              <select
                className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm text-scnt-text"
                value={formData.type}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, type: e.target.value as PromotionType }))
                }
              >
                <option value="SPECIAL_EVENT">
                  Special Event (Time-Limited: Black Friday, Flash Sale, Eid)
                </option>
                <option value="DEFAULT_WELCOME">
                  Normal Times Fallback (Evergreen First Order Welcome)
                </option>
              </select>
            </div>
          </div>

          {/* Schedule Dates (for Special Events) */}
          {formData.type === 'SPECIAL_EVENT' ? (
            <div className="rounded-xl border border-scnt-border/60 bg-scnt-bg-elevated/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-scnt-text">
                  📅 Event Schedule (Start & Expiration Dates)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-[10px] text-scnt-accent-primary hover:underline"
                    onClick={() => {
                      const now = new Date()
                      const nextWeek = new Date(now.getTime() + 7 * 86400000)
                      setFormData((s) => ({
                        ...s,
                        startsAt: formatDatetimeLocal(now.toISOString()),
                        expiresAt: formatDatetimeLocal(nextWeek.toISOString()),
                      }))
                    }}
                  >
                    Preset: Next 7 Days
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    className="text-[10px] text-scnt-accent-primary hover:underline"
                    onClick={() => {
                      const now = new Date()
                      const inThreeDays = new Date(now.getTime() + 3 * 86400000)
                      setFormData((s) => ({
                        ...s,
                        startsAt: formatDatetimeLocal(now.toISOString()),
                        expiresAt: formatDatetimeLocal(inThreeDays.toISOString()),
                      }))
                    }}
                  >
                    Preset: Weekend Sale (3 Days)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-scnt-text-muted mb-1">
                    Event Starts At
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-xs text-scnt-text"
                    value={formData.startsAt}
                    onChange={(e) => setFormData((s) => ({ ...s, startsAt: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-scnt-text-muted mb-1">
                    Event Expires At
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-xs text-scnt-text"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData((s) => ({ ...s, expiresAt: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Linked Promo Code & Discount Values */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-scnt-text mb-1">
                Discount Code *
              </label>
              <input
                required
                className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm font-mono uppercase text-scnt-text"
                placeholder="e.g. BF2026 or FIRST10"
                value={formData.promoCode}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, promoCode: e.target.value.toUpperCase() }))
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-scnt-text mb-1">
                Discount Type
              </label>
              <select
                className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm text-scnt-text"
                value={formData.discountType}
                onChange={(e) =>
                  setFormData((s) => ({
                    ...s,
                    discountType: e.target.value as 'PERCENTAGE' | 'FIXED',
                  }))
                }
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (EGP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-scnt-text mb-1">
                Discount Value *
              </label>
              <input
                type="number"
                min="1"
                required
                className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm text-scnt-text"
                value={formData.discountValue}
                onChange={(e) => setFormData((s) => ({ ...s, discountValue: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-scnt-text mb-1">
                Min Subtotal (EGP)
              </label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm text-scnt-text"
                value={formData.minSubtotal}
                onChange={(e) => setFormData((s) => ({ ...s, minSubtotal: e.target.value }))}
              />
            </div>
          </div>

          {/* Bilingual Modal Presentation Content */}
          <div className="rounded-xl border border-scnt-border/60 bg-scnt-bg-elevated/10 p-4 space-y-4">
            <span className="text-xs font-semibold text-scnt-text">
              ✨ Modal Copy & Content (English & Arabic)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* English Column */}
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-wider font-bold text-scnt-accent-primary">
                  English Content
                </p>

                <div>
                  <label className="block text-[11px] text-scnt-text-muted mb-1">
                    Badge / Eyebrow
                  </label>
                  <input
                    className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
                    placeholder="e.g. BLACK FRIDAY SALE"
                    value={formData.badgeEn}
                    onChange={(e) => setFormData((s) => ({ ...s, badgeEn: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-scnt-text-muted mb-1">
                    Title / Headline *
                  </label>
                  <input
                    required
                    className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
                    placeholder="e.g. Black Friday Private Access"
                    value={formData.titleEn}
                    onChange={(e) => setFormData((s) => ({ ...s, titleEn: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-scnt-text-muted mb-1">Subtitle</label>
                  <input
                    className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
                    placeholder="e.g. Unlock 20% off all artisanal creations"
                    value={formData.subtitleEn}
                    onChange={(e) => setFormData((s) => ({ ...s, subtitleEn: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-scnt-text-muted mb-1">
                    Discount Highlight Banner
                  </label>
                  <input
                    className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
                    placeholder="e.g. 20% OFF ALL PRODUCTS"
                    value={formData.discountHighlightEn}
                    onChange={(e) =>
                      setFormData((s) => ({ ...s, discountHighlightEn: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-scnt-text-muted mb-1">Description</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
                    placeholder="e.g. Enter your email to receive your private invitation code."
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData((s) => ({ ...s, descriptionEn: e.target.value }))}
                  />
                </div>
              </div>

              {/* Arabic Column */}
              <div className="space-y-3" dir="rtl">
                <p className="text-[11px] uppercase tracking-wider font-bold text-scnt-accent-primary">
                  المحتوى العربي (Arabic Content)
                </p>

                <div>
                  <label className="block text-[11px] text-scnt-text-muted mb-1">شارة العرض</label>
                  <input
                    className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
                    placeholder="مثال: عروض الجمعة البيضاء"
                    value={formData.badgeAr}
                    onChange={(e) => setFormData((s) => ({ ...s, badgeAr: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-scnt-text-muted mb-1">
                    العنوان الرئيسي *
                  </label>
                  <input
                    required
                    className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
                    placeholder="مثال: خصومات الجمعة البيضاء الحصرية"
                    value={formData.titleAr}
                    onChange={(e) => setFormData((s) => ({ ...s, titleAr: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-scnt-text-muted mb-1">
                    العنوان الفرعي
                  </label>
                  <input
                    className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
                    placeholder="مثال: احصل على خصم 20% على جميع المجموعات"
                    value={formData.subtitleAr}
                    onChange={(e) => setFormData((s) => ({ ...s, subtitleAr: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-scnt-text-muted mb-1">
                    شارة الخصم البارزة
                  </label>
                  <input
                    className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
                    placeholder="مثال: خصم 20% على كل العطور"
                    value={formData.discountHighlightAr}
                    onChange={(e) =>
                      setFormData((s) => ({ ...s, discountHighlightAr: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-scnt-text-muted mb-1">الوصف</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
                    placeholder="مثال: أدخل بريدك الإلكتروني لاستلام كود الخصم الحصري فوراً."
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData((s) => ({ ...s, descriptionAr: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Theme & Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-scnt-text mb-1">
                Visual Modal Theme
              </label>
              <select
                className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-xs text-scnt-text"
                value={formData.theme}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, theme: e.target.value as PromotionTheme }))
                }
              >
                <option value="black_friday">Black Friday (Obsidian & Gold Highlights)</option>
                <option value="gold_luxury">Gold Luxury (Warm Champagne & Gold)</option>
                <option value="minimal_dark">Minimal SCNT Dark</option>
              </select>
            </div>

            <label className="flex items-center gap-2 pt-4 text-xs font-medium text-scnt-text cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData((s) => ({ ...s, isActive: e.target.checked }))}
                className="rounded border-scnt-border"
              />
              Campaign Active
            </label>

            <label className="flex items-center gap-2 pt-4 text-xs font-medium text-scnt-text cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showModal}
                onChange={(e) => setFormData((s) => ({ ...s, showModal: e.target.checked }))}
                className="rounded border-scnt-border"
              />
              Show Popup Modal to First Visitors
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={busy}>
              {editingCampaignId ? 'Update Campaign' : 'Create Campaign'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPreviewingCampaign({
                  _id: 'preview_temp',
                  name: formData.name || 'Preview',
                  type: formData.type,
                  badge: { en: formData.badgeEn, ar: formData.badgeAr },
                  title: { en: formData.titleEn || 'Title', ar: formData.titleAr || 'عنوان' },
                  subtitle: { en: formData.subtitleEn, ar: formData.subtitleAr },
                  description: { en: formData.descriptionEn, ar: formData.descriptionAr },
                  discountHighlight: {
                    en: formData.discountHighlightEn,
                    ar: formData.discountHighlightAr,
                  },
                  ctaText: { en: formData.ctaTextEn, ar: formData.ctaTextAr },
                  promoCode: formData.promoCode || 'TESTCODE',
                  discountType: formData.discountType,
                  discountValue: Number(formData.discountValue) || 10,
                  minSubtotal: Number(formData.minSubtotal) || 0,
                  startsAt: formData.startsAt,
                  expiresAt: formData.expiresAt,
                  isActive: true,
                  showModal: true,
                  theme: formData.theme,
                  leadsCount: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })
              }}
            >
              👁️ Preview Modal
            </Button>

            {editingCampaignId ? (
              <Button type="button" variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      {/* Campaigns List */}
      <Card asMotion={false} className="p-5 border-scnt-border/80">
        <h3 className="font-serif text-lg text-scnt-text font-bold mb-4">
          All Promotional Campaigns ({campaigns.length})
        </h3>

        {loading ? (
          <p className="text-xs text-scnt-text-muted animate-pulse">Loading campaigns…</p>
        ) : campaigns.length === 0 ? (
          <p className="text-xs text-scnt-text-muted">
            No promotional campaigns found. Create your first campaign above!
          </p>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => {
              const now = Date.now()
              const isSpecial = c.type === 'SPECIAL_EVENT'
              const isStarted = !c.startsAt || new Date(c.startsAt).getTime() <= now
              const isExpired = c.expiresAt && new Date(c.expiresAt).getTime() < now
              const isCurrentlyActive = c.isActive && isStarted && !isExpired

              return (
                <div
                  key={c._id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-scnt-border/60 bg-scnt-bg/50 p-4 transition-colors hover:border-scnt-border"
                >
                  <div className="space-y-1.5 min-w-[260px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif text-base font-bold text-scnt-text">
                        {c.name}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          isSpecial
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {isSpecial ? 'Special Event' : 'Evergreen Welcome'}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          isCurrentlyActive
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : isExpired
                            ? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {isCurrentlyActive
                          ? '● Active Now'
                          : isExpired
                          ? 'Expired'
                          : !c.isActive
                          ? 'Inactive'
                          : 'Scheduled Future'}
                      </span>

                      <span className="rounded bg-scnt-bg-elevated px-2 py-0.5 text-[11px] font-mono font-bold text-[#c5a962]">
                        {c.promoCode} ({c.discountValue}% OFF)
                      </span>
                    </div>

                    <p className="text-xs text-scnt-text-muted">
                      Title: {c.title?.en} · {c.title?.ar}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 pt-1">
                      {isSpecial ? (
                        <span>
                          Period: {formatDisplayDate(c.startsAt)} → {formatDisplayDate(c.expiresAt)}
                        </span>
                      ) : (
                        <span>Schedule: Evergreen Normal Times</span>
                      )}
                      <span>·</span>
                      <span className="text-emerald-400 font-semibold">
                        {c.leadsCount || 0} Emails Captured
                      </span>
                      <span>·</span>
                      <span>Theme: {c.theme}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      className="text-xs py-1 px-3"
                      onClick={() => setPreviewingCampaign(c)}
                    >
                      👁️ Preview
                    </Button>

                    <Button
                      variant="outline"
                      className="text-xs py-1 px-3"
                      onClick={() => handleOpenLeads(c._id)}
                    >
                      👥 View Leads ({c.leadsCount || 0})
                    </Button>

                    <Button
                      variant="outline"
                      className="text-xs py-1 px-3"
                      onClick={() => startEdit(c)}
                      disabled={busy}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      className="text-xs py-1 px-3 text-rose-400 hover:text-rose-300 border-rose-500/30"
                      onClick={() => handleDelete(c._id, c.name)}
                      disabled={busy}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Captured Leads Modal */}
      {viewingLeads ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingLeads(null)
          }}
        >
          <div className="relative flex flex-col max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-scnt-border/80 bg-scnt-bg shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-scnt-border/40 p-4 sm:p-5">
              <div>
                <h4 className="font-serif text-lg font-bold text-scnt-text">
                  Captured Leads: {viewingLeads.campaign.name}
                </h4>
                <p className="text-xs text-scnt-text-muted">
                  Total {viewingLeads.totalCount} subscribers who claimed code{' '}
                  <span className="font-mono font-bold text-scnt-accent-primary">
                    {viewingLeads.campaign.promoCode}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="text-xs py-1 px-3"
                  onClick={handleExportCsv}
                  disabled={viewingLeads.leads.length === 0}
                >
                  📥 Export CSV
                </Button>
                <button
                  type="button"
                  onClick={() => setViewingLeads(null)}
                  className="rounded-lg p-2 text-scnt-text-muted hover:text-scnt-text"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Leads Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {loadingLeads ? (
                <p className="text-xs text-scnt-text-muted text-center py-6 animate-pulse">
                  Loading leads…
                </p>
              ) : viewingLeads.leads.length === 0 ? (
                <p className="text-xs text-scnt-text-muted text-center py-6">
                  No email leads have been captured for this campaign yet.
                </p>
              ) : (
                <div className="divide-y divide-scnt-border/40 rounded-xl border border-scnt-border/60 overflow-hidden">
                  {viewingLeads.leads.map((l) => (
                    <div
                      key={l._id}
                      className="flex items-center justify-between p-3 text-xs bg-scnt-bg/60"
                    >
                      <div>
                        <p className="font-semibold text-scnt-text">{l.email}</p>
                        <p className="text-[10px] text-scnt-text-muted">
                          Locale: {l.locale || 'en'} · Visitor ID:{' '}
                          {l.visitorId ? `${l.visitorId.slice(0, 12)}…` : 'Direct'}
                        </p>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {new Date(l.claimedAt).toLocaleString('en-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
