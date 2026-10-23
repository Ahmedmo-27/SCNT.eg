import { apiDeleteDataAuthed, apiGetDataAuthed, apiPostDataAuthed, apiPutDataAuthed } from './api'

export type ExpenseCategory =
  | 'OILS'
  | 'FRAGRANT_ALCOHOL'
  | 'CLEANING_ALCOHOL'
  | 'BOTTLES'
  | 'BOXES'
  | 'BOTTLE_STICKERS'
  | 'BOX_SEALING_STICKERS'
  | 'BOX_TOP_STICKERS'
  | 'THANK_YOU_CARDS'
  | 'DECANT_CARDS'
  | 'DECANTS_3ML'
  | 'WRAPPING_SHEETS'
  | 'SHREDDED_PAPER'
  | 'LAB_TOOLS'
  | 'PACKAGING_SHIPPING'
  | 'MARKETING_GIVEAWAYS'
  | 'MISCELLANEOUS'

export type ExpenseUnit =
  | 'meters'
  | 'sheets'
  | 'bags'
  | 'pcs'
  | 'kg'
  | 'grams'
  | 'liters'
  | 'ml'
  | 'units'
  | 'other'

export interface ExpenseItem {
  _id: string
  title: string
  category: ExpenseCategory
  amount: number
  quantity: number
  unit: ExpenseUnit
  unitCost: number
  supplier?: string
  date: string
  invoiceNumber?: string
  notes?: string
  promotionDetails?: {
    campaignName?: string
    decantUnitsGiven?: number
    decantUnitCostApplied?: number
    recipient?: string
  }
  createdAt: string
  updatedAt: string
}

export interface ExpenseSummary {
  totals: {
    totalSpent: number
    thisMonthSpent: number
    lastMonthSpent: number
    totalPromoSCS: number
    totalDecantsGiven: number
    totalEntries: number
  }
  categoryBreakdown: {
    category: ExpenseCategory
    totalAmount: number
    count: number
    percentage: number
  }[]
  monthlyTrend: {
    month: string
    total: number
    count: number
  }[]
}

export interface CostConfig {
  _id?: string
  key: string
  liquids: {
    oilCostPerKg: number
    oilCostPerMl: number
    fragrantAlcoholCostPerLiter: number
    fragrantAlcoholCostPerMl: number
    cleaningAlcoholCostPerLiter: number
    recipes: {
      size50ml: { oilMl: number; alcoholMl: number }
      size100ml: { oilMl: number; alcoholMl: number }
      decant3ml: { oilMl: number; alcoholMl: number }
    }
  }
  bottles: {
    size50ml: number
    size100ml: number
    decant3mlVial: number
  }
  boxes: {
    size50ml: number
    size100ml: number
  }
  stickers: {
    bottleStickers: {
      costPerMeter: number
      stickersPerMeter: number
      unitCost: number
    }
    boxSealingStickers: {
      costPerSheet: number
      stickersPerSheet: number
      unitCost: number
    }
    boxTopStickers: {
      costPerMeter: number
      stickersPerMeter: number
      unitCost: number
    }
  }
  cards: {
    thankYouCard: {
      batchCost: number
      batchQuantity: number
      unitCost: number
    }
    decantCard: {
      batchCost: number
      batchQuantity: number
      unitCost: number
    }
  }
  wrapping: {
    wrappingSheetUnitCost: number
    shreddedPaper: {
      costPerBag: number
      boxesPerBag: number
      unitCostPerBox: number
    }
    courierFlyerUnitCost: number
  }
  currency: string
}

export interface CogsBreakdownProduct {
  oilCost: number
  alcoholCost: number
  bottleCost: number
  boxCost: number
  stickersCost: number
  stickerDetails: {
    bottleSticker: number
    boxTopSticker: number
    boxSealingSticker: number
  }
  packagingCost: number
  packagingDetails: {
    wrappingSheet: number
    shreddedPaper: number
    thankYouCard: number
    courierFlyer: number
  }
  totalCogs: number
}

export interface CogsBreakdownDecant {
  liquidCost: number
  vialCost: number
  decantCardCost: number
  totalCogs: number
}

export interface CogsData {
  breakdowns: {
    size100ml: CogsBreakdownProduct
    size50ml: CogsBreakdownProduct
    decant3ml: CogsBreakdownDecant
  }
  unitCostsSummary: {
    bottleStickerFromMeter: number
    boxSealingStickerFromSheet: number
    boxTopSticker: number
    thankYouCard: number
    decantCard: number
    shreddedPaperPerBox: number
    oilPerMl: number
    fragrantAlcoholPerMl: number
  }
}

export interface CostConfigResponse {
  config: CostConfig
  cogs: CogsData
}

export interface ProductMarginItem {
  _id: string
  name: string
  slug: string
  stock: number
  oilCostPerKg: number
  oilCostPerMl: number
  hasCustomOilPrice: boolean
  breakdowns?: {
    size100ml: CogsBreakdownProduct
    size50ml: CogsBreakdownProduct
    decant3ml: CogsBreakdownDecant
  }
  size100ml: {
    retailPrice: number
    cogs: number
    grossProfit: number
    marginPercent: number
    markupMultiplier: number
  }
  size50ml: {
    retailPrice: number
    cogs: number
    grossProfit: number
    marginPercent: number
  }
  decant3ml?: {
    cogs: number
  }
}

export interface CogsAnalysisResponse {
  benchmarks: {
    size100ml: CogsBreakdownProduct
    size50ml: CogsBreakdownProduct
    decant3ml: CogsBreakdownDecant
  }
  productAnalysis: ProductMarginItem[]
  decant3mlAnalysis: {
    cogs: number
    breakdown: CogsBreakdownDecant
    suggestedSellingPrice: number
    suggestedGrossProfit: number
    suggestedMarginPercent: number
  }
}

export async function fetchExpenses(params?: {
  category?: string
  search?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}): Promise<{ items: ExpenseItem[]; pagination: { total: 0; page: number; limit: number; pages: number } }> {
  const query = new URLSearchParams()
  if (params?.category && params.category !== 'ALL') query.set('category', params.category)
  if (params?.search) query.set('search', params.search)
  if (params?.startDate) query.set('startDate', params.startDate)
  if (params?.endDate) query.set('endDate', params.endDate)
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))

  const qs = query.toString() ? `?${query.toString()}` : ''
  return apiGetDataAuthed(`/admin/expenses${qs}`)
}

export async function fetchExpenseSummary(): Promise<ExpenseSummary> {
  return apiGetDataAuthed('/admin/expenses/summary')
}

export async function createExpense(payload: Partial<ExpenseItem> & { syncWithCostConfig?: boolean }): Promise<ExpenseItem> {
  return apiPostDataAuthed('/admin/expenses', payload)
}

export async function logDecantGiveaway(payload: {
  count: number
  campaignName?: string
  recipient?: string
  notes?: string
}): Promise<{ expense: ExpenseItem; decantUnitCost: number; totalLogged: number }> {
  return apiPostDataAuthed('/admin/expenses/log-decant-giveaway', payload)
}

export async function updateExpense(id: string, payload: Partial<ExpenseItem>): Promise<ExpenseItem> {
  return apiPutDataAuthed(`/admin/expenses/${id}`, payload)
}

export async function deleteExpense(id: string): Promise<void> {
  return apiDeleteDataAuthed(`/admin/expenses/${id}`)
}

export async function fetchCostConfig(): Promise<CostConfigResponse> {
  return apiGetDataAuthed('/admin/cost-config')
}

export async function updateCostConfig(payload: Partial<CostConfig>): Promise<CostConfigResponse> {
  return apiPutDataAuthed('/admin/cost-config', payload)
}

export async function fetchCogsAnalysis(): Promise<CogsAnalysisResponse> {
  return apiGetDataAuthed('/admin/cogs-analysis')
}

export async function updateProductOilPrice(
  productId: string,
  payload: { oilCostPerKg?: number; oilCostPerMl?: number }
): Promise<{ product: { _id: string; name: string; oilCostPerKg: number; oilCostPerMl: number }; cogs: CogsData }> {
  return apiPutDataAuthed(`/admin/expenses/products/${productId}/oil-price`, payload)
}
