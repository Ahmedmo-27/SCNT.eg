import {
  apiGetData,
  apiGetDataAuthed,
  apiPostData,
  apiPostDataAuthed,
  apiPutDataAuthed,
  apiDeleteDataAuthed,
} from './api'

export type LocalizedText = {
  en: string
  ar: string
}

export type PromotionTheme =
  | 'scnt_signature'
  | 'black_friday'
  | 'gold_luxury'
  | 'minimal_dark'
export type PromotionType = 'SPECIAL_EVENT' | 'DEFAULT_WELCOME'

export type ActivePromotion = {
  _id: string
  name: string
  type: PromotionType
  badge?: LocalizedText
  title: LocalizedText
  subtitle?: LocalizedText
  description?: LocalizedText
  discountHighlight?: LocalizedText
  ctaText?: LocalizedText
  theme: PromotionTheme
  minSubtotal?: number
  startsAt?: string | null
  expiresAt?: string | null
}

export type ClaimPromotionResult = {
  promoCode: string
  discountHighlight?: LocalizedText
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
}

export type AdminPromotionCampaign = {
  _id: string
  name: string
  type: PromotionType
  badge: LocalizedText
  title: LocalizedText
  subtitle: LocalizedText
  description: LocalizedText
  discountHighlight: LocalizedText
  ctaText: LocalizedText
  promoCode: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minSubtotal: number
  startsAt: string | null
  expiresAt: string | null
  isActive: boolean
  showModal: boolean
  theme: PromotionTheme
  emailSubject?: LocalizedText
  emailHeadline?: LocalizedText
  leadsCount: number
  createdAt: string
  updatedAt: string
}

export type PromotionLeadItem = {
  _id: string
  campaign: string
  email: string
  promoCode: string
  visitorId?: string
  locale?: string
  claimedAt: string
}

export type CampaignLeadsResponse = {
  campaign: {
    _id: string
    name: string
    promoCode: string
  }
  leads: PromotionLeadItem[]
  totalCount: number
}

export async function fetchActivePromotion(): Promise<ActivePromotion | null> {
  return apiGetData<ActivePromotion | null>('/promotions/active')
}

export async function claimPromotion(payload: {
  campaignId: string
  email: string
  locale: 'en' | 'ar'
  visitorId?: string
}): Promise<ClaimPromotionResult> {
  return apiPostData<ClaimPromotionResult>('/promotions/claim', payload)
}

export async function fetchAdminCampaigns(): Promise<AdminPromotionCampaign[]> {
  return apiGetDataAuthed<AdminPromotionCampaign[]>('/admin/promotions')
}

export async function createAdminCampaign(
  payload: Partial<AdminPromotionCampaign>
): Promise<AdminPromotionCampaign> {
  return apiPostDataAuthed<AdminPromotionCampaign>('/admin/promotions', payload)
}

export async function updateAdminCampaign(
  id: string,
  payload: Partial<AdminPromotionCampaign>
): Promise<AdminPromotionCampaign> {
  return apiPutDataAuthed<AdminPromotionCampaign>(`/admin/promotions/${id}`, payload)
}

export async function deleteAdminCampaign(id: string): Promise<null> {
  return apiDeleteDataAuthed<null>(`/admin/promotions/${id}`)
}

export async function fetchAdminCampaignLeads(id: string): Promise<CampaignLeadsResponse> {
  return apiGetDataAuthed<CampaignLeadsResponse>(`/admin/promotions/${id}/leads`)
}
