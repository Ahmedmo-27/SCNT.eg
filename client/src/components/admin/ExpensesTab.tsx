import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import {
  fetchExpenses,
  fetchExpenseSummary,
  createExpense,
  logDecantGiveaway,
  updateExpense,
  deleteExpense,
  fetchCostConfig,
  updateCostConfig,
  fetchCogsAnalysis,
  updateProductOilPrice,
  type ExpenseItem,
  type ExpenseCategory,
  type ExpenseUnit,
  type ExpenseSummary,
  type CostConfig,
  type CogsData,
  type CogsAnalysisResponse,
} from '../../services/adminExpenseApi'

function formatEgp(val: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 2,
  }).format(val || 0)
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  OILS: 'Fragrance Oils',
  FRAGRANT_ALCOHOL: 'Fragrant Alcohol',
  CLEANING_ALCOHOL: 'Cleaning Alcohol',
  BOTTLES: 'Bottles & Atomizers (All)',
  BOTTLES_50ML: '50ml Bottles & Atomizers',
  BOTTLES_100ML: '100ml Bottles & Atomizers',
  BOXES: 'Outer Boxes (All)',
  BOXES_50ML: '50ml Outer Boxes',
  BOXES_100ML: '100ml Outer Boxes',
  BOTTLE_STICKERS: 'Bottle Stickers (Meter)',
  BOX_SEALING_STICKERS: 'Box Sealing Stickers (Sheet)',
  BOX_TOP_STICKERS: 'Box Top Stickers (Meter)',
  THANK_YOU_CARDS: 'Thank You Cards',
  DECANT_CARDS: 'Decant Cards',
  DECANTS_3ML: '3ml Decants',
  WRAPPING_SHEETS: 'Wrapping Sheets',
  SHREDDED_PAPER: 'Shredded Paper (Bags)',
  LAB_TOOLS: 'Lab Tools & Equipment',
  PACKAGING_SHIPPING: 'Packaging & Couriers',
  MARKETING_GIVEAWAYS: 'Promotions & Giveaways',
  MISCELLANEOUS: 'Miscellaneous Overhead',
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  OILS: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  FRAGRANT_ALCOHOL: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  CLEANING_ALCOHOL: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
  BOTTLES: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
  BOTTLES_50ML: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
  BOTTLES_100ML: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
  BOXES: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  BOXES_50ML: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  BOXES_100ML: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  BOTTLE_STICKERS: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  BOX_SEALING_STICKERS: 'bg-teal-500/10 text-teal-700 border-teal-500/20',
  BOX_TOP_STICKERS: 'bg-lime-500/10 text-lime-700 border-lime-500/20',
  THANK_YOU_CARDS: 'bg-pink-500/10 text-pink-700 border-pink-500/20',
  DECANT_CARDS: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
  DECANTS_3ML: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  WRAPPING_SHEETS: 'bg-violet-500/10 text-violet-700 border-violet-500/20',
  SHREDDED_PAPER: 'bg-stone-500/10 text-stone-700 border-stone-500/20',
  LAB_TOOLS: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  PACKAGING_SHIPPING: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  MARKETING_GIVEAWAYS: 'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/20',
  MISCELLANEOUS: 'bg-zinc-500/10 text-zinc-700 border-zinc-500/20',
}

const CATEGORY_DEFAULT_TITLES: Partial<Record<ExpenseCategory, string>> = {
  OILS: 'Fragrance Oils',
  BOTTLE_STICKERS: 'Bottle Sticker Roll (Meters)',
  BOX_SEALING_STICKERS: 'Box Sealing Sticker Sheets',
  BOX_TOP_STICKERS: 'Box Top Sticker Roll (Meters)',
  FRAGRANT_ALCOHOL: 'Fragrant Alcohol 96% (Ethanol)',
  CLEANING_ALCOHOL: 'Cleaning Alcohol (IPA)',
  SHREDDED_PAPER: 'Shredded Paper Packaging Bags',
  WRAPPING_SHEETS: 'Protective Wrapping Sheets',
  THANK_YOU_CARDS: 'Thank You Customer Cards',
  DECANT_CARDS: 'Custom 3ml Decant Cards',
  DECANTS_3ML: '3ml Decant Sample Vials',
  BOTTLES: '100ml Glass Perfume Bottles & Atomizers',
  BOTTLES_50ML: '50ml Glass Perfume Bottles & Atomizers',
  BOTTLES_100ML: '100ml Glass Perfume Bottles & Atomizers',
  BOXES: '100ml Rigid Packaging Outer Boxes',
  BOXES_50ML: '50ml Rigid Packaging Outer Boxes',
  BOXES_100ML: '100ml Rigid Packaging Outer Boxes',
  PACKAGING_SHIPPING: 'Courier Shipping Bags & Flyers',
  LAB_TOOLS: 'Lab Equipment & Measuring Tools',
  MARKETING_GIVEAWAYS: 'Promotional Giveaway Campaign',
}

type SubTabKey = 'ledger' | 'rates' | 'calculator' | 'promotions' | 'catalog'

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | string)[] = []
  if (current <= 3) {
    for (let i = 1; i <= 4; i++) pages.push(i)
    pages.push('...')
    pages.push(total)
  } else if (current >= total - 2) {
    pages.push(1)
    pages.push('...')
    for (let i = total - 3; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    pages.push('...')
    pages.push(current - 1)
    pages.push(current)
    pages.push(current + 1)
    pages.push('...')
    pages.push(total)
  }
  return pages
}

export function ExpensesTab() {
  const [subTab, setSubTab] = useState<SubTabKey>('ledger')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Data states
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [expensesLoading, setExpensesLoading] = useState(false)
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [costConfig, setCostConfig] = useState<CostConfig | null>(null)
  const [cogsData, setCogsData] = useState<CogsData | null>(null)
  const [cogsAnalysis, setCogsAnalysis] = useState<CogsAnalysisResponse | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, pages: 1 })

  // Filters for ledger
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showGiveawayModal, setShowGiveawayModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null)

  // Form: Add/Edit Expense
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('OILS')
  const [formAmount, setFormAmount] = useState('')
  const [formQuantity, setFormQuantity] = useState('1')
  const [formUnitPrice, setFormUnitPrice] = useState('')
  const [formUnit, setFormUnit] = useState<ExpenseUnit>('units')
  const [formSupplier, setFormSupplier] = useState('')
  const [formInvoice, setFormInvoice] = useState('')
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [formNotes, setFormNotes] = useState('')
  const [formSyncBenchmark, setFormSyncBenchmark] = useState(false)

  // Form: Quick Decant Giveaway
  const [giveawayCount, setGiveawayCount] = useState('5')
  const [giveawayCampaign, setGiveawayCampaign] = useState('Sample Promotion')
  const [giveawayRecipient, setGiveawayRecipient] = useState('')
  const [giveawayNotes, setGiveawayNotes] = useState('')
  const [giveawayFragranceId, setGiveawayFragranceId] = useState<string>('')

  // Form: Multi-fragrance promotional campaign calculator (Full Boxed Bottles, Decants, or Mixed)
  const [usePromoCalculator, setUsePromoCalculator] = useState(false)
  const [promoCampaignType, setPromoCampaignType] = useState<'BOTTLES_100ML' | 'BOTTLES_50ML' | 'DECANTS' | 'MIXED'>('BOTTLES_100ML')
  const [promoTargetTotal, setPromoTargetTotal] = useState<number>(10)
  const [promoAllocations, setPromoAllocations] = useState<
    { productId: string; productName: string; format: '100ml' | '50ml' | 'decant3ml'; quantity: number; unitCost: number }[]
  >([])
  const [promoSelectedFragranceId, setPromoSelectedFragranceId] = useState<string>('')
  const [promoSelectedFormat, setPromoSelectedFormat] = useState<'100ml' | '50ml' | 'decant3ml'>('100ml')
  const [promoAllocQuantity, setPromoAllocQuantity] = useState<string>('5')

  // Form: Product assignment for oil expenses
  const [formAssignedProduct, setFormAssignedProduct] = useState<string>('')

  // Form: Benchmark rates editing state
  const [ratesForm, setRatesForm] = useState<CostConfig | null>(null)

  // Fragrance-specific selection and custom oil pricing (supports Grams and Kilograms)
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>('')
  const [editingOilProductId, setEditingOilProductId] = useState<string | null>(null)
  const [editingOilValue, setEditingOilValue] = useState<string>('')
  const [fragranceOilUnit, setFragranceOilUnit] = useState<'grams' | 'kg'>('grams')

  // Calculator simulation state
  const [simRetail100, setSimRetail100] = useState<number>(750)
  const [simRetail50, setSimRetail50] = useState<number>(500)
  const [simRetailDecant, setSimRetailDecant] = useState<number>(120)

  const showToast = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 3500)
  }

  // Load expenses list
  const loadExpenses = useCallback(
    async (targetPage = page, targetLimit = limit) => {
      setExpensesLoading(true)
      try {
        const res = await fetchExpenses({
          category: categoryFilter,
          search: searchQuery,
          startDate: startDateFilter,
          endDate: endDateFilter,
          page: targetPage,
          limit: targetLimit,
        })
        setExpenses(res.items)
        setPagination(res.pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch expenses')
      } finally {
        setExpensesLoading(false)
      }
    },
    [categoryFilter, searchQuery, startDateFilter, endDateFilter, page, limit]
  )

  // Load summary and cost config
  const loadOverviewAndConfig = useCallback(async () => {
    try {
      const [sum, cfgRes] = await Promise.all([fetchExpenseSummary(), fetchCostConfig()])
      setSummary(sum)
      setCostConfig(cfgRes.config)
      setRatesForm(JSON.parse(JSON.stringify(cfgRes.config)))
      setCogsData(cfgRes.cogs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration')
    }
  }, [])

  // Load catalog analysis
  const loadCatalogAnalysis = useCallback(async () => {
    try {
      const res = await fetchCogsAnalysis()
      setCogsAnalysis(res)
      if (res.productAnalysis && res.productAnalysis.length > 0) {
        setSelectedProductSlug((prev) => {
          if (!prev || prev === 'DEFAULT') return res.productAnalysis[0].slug
          return prev
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load catalog analysis')
    }
  }, [])

  useEffect(() => {
    void loadOverviewAndConfig()
    void loadCatalogAnalysis()
  }, [loadOverviewAndConfig, loadCatalogAnalysis])

  useEffect(() => {
    if (subTab === 'ledger' || subTab === 'promotions') {
      void loadExpenses(page, limit)
    } else if (subTab === 'catalog' || subTab === 'calculator') {
      void loadCatalogAnalysis()
    }
  }, [subTab, loadExpenses, loadCatalogAnalysis, page, limit])

  const handleSaveProductOilPrice = async (
    productId: string,
    val: number,
    unit: 'grams' | 'kg' = fragranceOilUnit
  ) => {
    setBusy(true)
    setError(null)
    try {
      const payload =
        unit === 'grams'
          ? {
              oilCostPerGram: val,
              oilCostPerMl: val,
              oilCostPerKg: Number((val * 1000).toFixed(2)),
              unit: 'grams' as const,
              pricePerUnit: val,
            }
          : {
              oilCostPerKg: val,
              oilCostPerMl: Number((val / 1000).toFixed(4)),
              oilCostPerGram: Number((val / 1000).toFixed(4)),
              unit: 'kg' as const,
              pricePerUnit: val,
            }
      const res = await updateProductOilPrice(productId, payload)
      showToast(
        `Updated oil price for ${res.product.name} to ${formatEgp(unit === 'grams' ? val : val / 1000)}/g (${formatEgp(unit === 'grams' ? val * 1000 : val)}/kg)`
      )
      setEditingOilProductId(null)
      await Promise.all([loadCatalogAnalysis(), loadOverviewAndConfig()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update fragrance oil price')
    } finally {
      setBusy(false)
    }
  }

  // Promotional Campaign Reference Calculations (Bottles with Boxes & Decants)
  const baseNonOil100ml = cogsData?.breakdowns?.size100ml?.baseNonOilCost || 105.08
  const baseNonOil50ml = cogsData?.breakdowns?.size50ml?.baseNonOilCost || 81.08
  const baseNonOilDecant = cogsData?.breakdowns?.decant3ml?.baseNonOilCost || 7.3

  const productsWithOil = cogsAnalysis?.productAnalysis?.filter((p) => p.oilCostPerMl > 0) || []
  const avgOilPerMl =
    productsWithOil.length > 0
      ? productsWithOil.reduce((sum, p) => sum + p.oilCostPerMl, 0) / productsWithOil.length
      : 3.0

  const avg100mlCost = Number((baseNonOil100ml + 25 * avgOilPerMl).toFixed(2))
  const avg50mlCost = Number((baseNonOil50ml + 15 * avgOilPerMl).toFixed(2))
  const avgDecantCost = Number((baseNonOilDecant + 1 * avgOilPerMl).toFixed(2))

  const getFormatBaselineCost = (fmt: '100ml' | '50ml' | 'decant3ml'): number => {
    if (fmt === '100ml') return avg100mlCost
    if (fmt === '50ml') return avg50mlCost
    return avgDecantCost
  }

  const getFragranceFormatCogs = (productId: string, fmt: '100ml' | '50ml' | 'decant3ml'): number => {
    const prod = cogsAnalysis?.productAnalysis?.find((p) => p._id === productId)
    if (!prod) return getFormatBaselineCost(fmt)
    if (fmt === '100ml') return prod.size100ml.cogs
    if (fmt === '50ml') return prod.size50ml.cogs
    return prod.decant3ml?.cogs || baseNonOilDecant
  }

  const activeBaselineUnitCost =
    promoCampaignType === 'BOTTLES_100ML'
      ? avg100mlCost
      : promoCampaignType === 'BOTTLES_50ML'
      ? avg50mlCost
      : promoCampaignType === 'DECANTS'
      ? avgDecantCost
      : getFormatBaselineCost(promoSelectedFormat)

  const unassignedFormat: '100ml' | '50ml' | 'decant3ml' =
    promoCampaignType === 'BOTTLES_100ML'
      ? '100ml'
      : promoCampaignType === 'BOTTLES_50ML'
      ? '50ml'
      : promoCampaignType === 'DECANTS'
      ? 'decant3ml'
      : promoSelectedFormat

  const allocatedUnitsCount = promoAllocations.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0)
  const unassignedUnitsCount = Math.max(0, promoTargetTotal - allocatedUnitsCount)

  const allocatedCostSum = Number(
    promoAllocations
      .reduce((sum, a) => sum + (Number(a.quantity) || 0) * (Number(a.unitCost) || 0), 0)
      .toFixed(2)
  )
  const unassignedCostSum = Number((unassignedUnitsCount * activeBaselineUnitCost).toFixed(2))
  const computedPromoTotalAmount = Number((allocatedCostSum + unassignedCostSum).toFixed(2))
  const computedPromoBlendedUnitCost =
    promoTargetTotal > 0 ? Number((computedPromoTotalAmount / promoTargetTotal).toFixed(2)) : 0

  const count100ml =
    promoAllocations
      .filter((a) => a.format === '100ml')
      .reduce((sum, a) => sum + Number(a.quantity || 0), 0) +
    (unassignedFormat === '100ml' ? unassignedUnitsCount : 0)

  const count50ml =
    promoAllocations
      .filter((a) => a.format === '50ml')
      .reduce((sum, a) => sum + Number(a.quantity || 0), 0) +
    (unassignedFormat === '50ml' ? unassignedUnitsCount : 0)

  const countDecants =
    promoAllocations
      .filter((a) => a.format === 'decant3ml')
      .reduce((sum, a) => sum + Number(a.quantity || 0), 0) +
    (unassignedFormat === 'decant3ml' ? unassignedUnitsCount : 0)

  const getSavedPriceForItem = (
    category: ExpenseCategory,
    assignedProdId?: string,
    titleText?: string
  ): { price: number; unit: ExpenseUnit; label: string } | null => {
    if (category === 'OILS') {
      const isGrams = formUnit === 'grams'
      if (assignedProdId && cogsAnalysis) {
        const prod = cogsAnalysis.productAnalysis.find((p) => p._id === assignedProdId)
        if (prod && prod.oilCostPerKg > 0) {
          const price = isGrams
            ? (prod.oilCostPerGram || Number((prod.oilCostPerKg / 1000).toFixed(4)))
            : prod.oilCostPerKg
          return {
            price,
            unit: isGrams ? 'grams' : 'kg',
            label: `${prod.name} Benchmark Rate (${isGrams ? 'Per Gram' : 'Per Kg'})`,
          }
        }
      }
      const recentOil = expenses.find(
        (e) => e.category === 'OILS' && (!assignedProdId || e.assignedProduct === assignedProdId)
      )
      if (recentOil && recentOil.unitCost > 0) {
        return { price: recentOil.unitCost, unit: recentOil.unit, label: 'Last Recorded Oil Purchase' }
      }
      return null
    }

    if (category === 'BOTTLE_STICKERS') {
      const price = costConfig?.stickers?.bottleStickers?.costPerMeter || 50
      return { price, unit: 'meters', label: 'Roll Benchmark per Meter' }
    }

    if (category === 'BOX_SEALING_STICKERS') {
      const price = costConfig?.stickers?.boxSealingStickers?.costPerSheet || 150
      return { price, unit: 'sheets', label: 'Sheet Benchmark (40 pcs)' }
    }

    if (category === 'BOX_TOP_STICKERS') {
      const price = costConfig?.stickers?.boxTopStickers?.costPerMeter || 50
      return { price, unit: 'meters', label: 'Roll Benchmark per Meter' }
    }

    if (category === 'FRAGRANT_ALCOHOL') {
      const price = costConfig?.liquids?.fragrantAlcoholCostPerLiter || 200
      return { price, unit: 'liters', label: 'Ethanol 96% Benchmark per Liter' }
    }

    if (category === 'CLEANING_ALCOHOL') {
      const price = costConfig?.liquids?.cleaningAlcoholCostPerLiter || 90
      return { price, unit: 'liters', label: 'Isopropyl Alcohol per Liter' }
    }

    if (category === 'SHREDDED_PAPER') {
      const price = costConfig?.wrapping?.shreddedPaper?.costPerBag || 45
      return { price, unit: 'bags', label: 'Bag Benchmark (Makes ~3 boxes)' }
    }

    if (category === 'WRAPPING_SHEETS') {
      const price = costConfig?.wrapping?.wrappingSheetUnitCost || 2.5
      return { price, unit: 'pcs', label: 'Wrapping Sheet Benchmark' }
    }

    if (category === 'THANK_YOU_CARDS') {
      const price = costConfig?.cards?.thankYouCard?.unitCost || 0.7
      return { price, unit: 'pcs', label: 'Thank You Card Benchmark' }
    }

    if (category === 'DECANT_CARDS') {
      const price = costConfig?.cards?.decantCard?.unitCost || 0.9
      return { price, unit: 'pcs', label: 'Decant Card Benchmark' }
    }

    if (category === 'DECANTS_3ML') {
      const price = costConfig?.bottles?.decant3mlVial || 6
      return { price, unit: 'pcs', label: '3ml Sample Vial Benchmark' }
    }

    if (category === 'BOTTLES_50ML') {
      const price = costConfig?.bottles?.size50ml || 28
      return { price, unit: 'pcs', label: '50ml Bottle Benchmark' }
    }

    if (category === 'BOTTLES_100ML') {
      const price = costConfig?.bottles?.size100ml || 38
      return { price, unit: 'pcs', label: '100ml Bottle Benchmark' }
    }

    if (category === 'BOTTLES') {
      const is50 = (titleText || '').toLowerCase().includes('50')
      const price = is50 ? costConfig?.bottles?.size50ml || 28 : costConfig?.bottles?.size100ml || 38
      return { price, unit: 'pcs', label: is50 ? '50ml Bottle Benchmark' : '100ml Bottle Benchmark' }
    }

    if (category === 'BOXES_50ML') {
      const price = costConfig?.boxes?.size50ml || 16
      return { price, unit: 'pcs', label: '50ml Box Benchmark' }
    }

    if (category === 'BOXES_100ML') {
      const price = costConfig?.boxes?.size100ml || 22
      return { price, unit: 'pcs', label: '100ml Box Benchmark' }
    }

    if (category === 'BOXES') {
      const is50 = (titleText || '').toLowerCase().includes('50')
      const price = is50 ? costConfig?.boxes?.size50ml || 16 : costConfig?.boxes?.size100ml || 22
      return { price, unit: 'pcs', label: is50 ? '50ml Box Benchmark' : '100ml Box Benchmark' }
    }

    if (category === 'PACKAGING_SHIPPING') {
      const price = costConfig?.wrapping?.courierFlyerUnitCost || 3
      return { price, unit: 'pcs', label: 'Courier Flyer Benchmark' }
    }

    const recent = expenses.find((e) => e.category === category)
    if (recent && recent.unitCost > 0) {
      return { price: recent.unitCost, unit: recent.unit, label: 'Last Recorded Purchase Price' }
    }

    return null
  }

  const handleCategoryChange = (cat: ExpenseCategory) => {
    setFormCategory(cat)

    if (cat === 'MARKETING_GIVEAWAYS') {
      setFormUnit('pcs')
      setUsePromoCalculator(true)
      if (!formTitle || Object.values(CATEGORY_DEFAULT_TITLES).includes(formTitle)) {
        setFormTitle(`${promoTargetTotal} Items Promotion`)
      }
      setFormUnitPrice(String(computedPromoBlendedUnitCost))
      setFormAmount(String(computedPromoTotalAmount))
      return
    }

    if (!formTitle || Object.values(CATEGORY_DEFAULT_TITLES).includes(formTitle)) {
      setFormTitle(CATEGORY_DEFAULT_TITLES[cat] || '')
    }

    const defaultTitle = CATEGORY_DEFAULT_TITLES[cat] || formTitle
    const saved = getSavedPriceForItem(cat, formAssignedProduct, defaultTitle)
    if (saved) {
      setFormUnit(saved.unit)
      setFormUnitPrice(String(saved.price))
      const q = Number(formQuantity) || 1
      setFormAmount(String(Number((saved.price * q).toFixed(2))))
    } else {
      if (cat === 'BOTTLE_STICKERS' || cat === 'BOX_TOP_STICKERS') setFormUnit('meters')
      else if (cat === 'BOX_SEALING_STICKERS') setFormUnit('sheets')
      else if (cat === 'SHREDDED_PAPER') setFormUnit('bags')
      else if (cat === 'OILS') setFormUnit(fragranceOilUnit)
      else if (cat === 'FRAGRANT_ALCOHOL' || cat === 'CLEANING_ALCOHOL') setFormUnit('liters')
      else setFormUnit('pcs')
      setFormUnitPrice('')
      setFormAmount('')
    }
  }

  const handleAssignedProductChange = (prodId: string) => {
    setFormAssignedProduct(prodId)
    if (!prodId) {
      if (formCategory === 'OILS') {
        setFormUnitPrice('')
        setFormAmount('')
      }
      return
    }

    const prod = cogsAnalysis?.productAnalysis.find((p) => p._id === prodId)
    if (prod) {
      if (!formTitle || Object.values(CATEGORY_DEFAULT_TITLES).includes(formTitle) || formTitle.endsWith('Fragrance Oil')) {
        setFormTitle(`${prod.name} Fragrance Oil`)
      }
      if (prod.oilCostPerKg > 0) {
        const isGrams = formUnit === 'grams'
        const unitPrice = isGrams
          ? (prod.oilCostPerGram || Number((prod.oilCostPerKg / 1000).toFixed(4)))
          : prod.oilCostPerKg
        setFormUnitPrice(String(unitPrice))
        const q = Number(formQuantity) || 1
        setFormAmount(String(Number((unitPrice * q).toFixed(2))))
      } else {
        setFormUnitPrice('')
        setFormAmount('')
      }
    }
  }

  useEffect(() => {
    if (usePromoCalculator && showAddModal) {
      setFormAmount(String(computedPromoTotalAmount))
      setFormQuantity(String(promoTargetTotal))
      setFormUnitPrice(String(computedPromoBlendedUnitCost))
      setFormUnit('pcs')
    }
  }, [usePromoCalculator, computedPromoTotalAmount, computedPromoBlendedUnitCost, promoTargetTotal, showAddModal])

  const openAddModal = (item?: ExpenseItem) => {
    if (item) {
      setEditingExpense(item)
      setFormTitle(item.title)
      setFormCategory(item.category)
      setFormAmount(String(item.amount))
      setFormQuantity(String(item.quantity))
      setFormUnitPrice(String(item.unitCost || (item.quantity ? Number((item.amount / item.quantity).toFixed(4)) : '')))
      setFormUnit(item.unit)
      setFormSupplier(item.supplier || '')
      setFormInvoice(item.invoiceNumber || '')
      setFormDate(item.date ? item.date.slice(0, 10) : new Date().toISOString().slice(0, 10))
      setFormNotes(item.notes || '')
      const assignedId =
        typeof item.assignedProduct === 'object' && item.assignedProduct?._id
          ? item.assignedProduct._id
          : typeof item.assignedProduct === 'string'
          ? item.assignedProduct
          : ''
      setFormAssignedProduct(assignedId)
      setFormSyncBenchmark(false)

      if (item.promotionDetails?.fragranceAllocations && item.promotionDetails.fragranceAllocations.length > 0) {
        setUsePromoCalculator(true)
        setPromoCampaignType(item.promotionDetails.promoType || 'MIXED')
        setPromoTargetTotal(item.promotionDetails.totalUnitsGiven || item.quantity || 10)
        setPromoAllocations(
          item.promotionDetails.fragranceAllocations.map((a) => ({
            productId: typeof a.product === 'object' && a.product?._id ? a.product._id : (a.product as string) || '',
            productName: a.productName || 'Fragrance',
            format: (a.format as '100ml' | '50ml' | 'decant3ml') || '100ml',
            quantity: a.quantity || 0,
            unitCost: a.unitCost || 0,
          }))
        )
      } else {
        setUsePromoCalculator(item.category === 'MARKETING_GIVEAWAYS')
        setPromoCampaignType('BOTTLES_100ML')
        setPromoTargetTotal(item.category === 'MARKETING_GIVEAWAYS' ? item.quantity || 10 : 10)
        setPromoAllocations([])
      }
    } else {
      setEditingExpense(null)
      setFormTitle('')
      setFormCategory('OILS')
      setFormAmount('')
      setFormQuantity('1')
      setFormUnitPrice('')
      setFormUnit('kg')
      setFormSupplier('')
      setFormInvoice('')
      setFormDate(new Date().toISOString().slice(0, 10))
      setFormNotes('')
      setFormAssignedProduct('')
      setFormSyncBenchmark(false)
      setUsePromoCalculator(false)
      setPromoCampaignType('BOTTLES_100ML')
      setPromoTargetTotal(10)
      setPromoAllocations([])
      setPromoSelectedFragranceId('')
      setPromoSelectedFormat('100ml')
      setPromoAllocQuantity('5')
    }
    setShowAddModal(true)
  }

  const handleSaveExpense = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      let promotionPayload = undefined
      if (formCategory === 'MARKETING_GIVEAWAYS' || usePromoCalculator) {
        promotionPayload = {
          campaignName: formTitle || `${promoTargetTotal} Items Promotional Campaign`,
          promoType: promoCampaignType,
          bottles100mlGiven: count100ml,
          bottles50mlGiven: count50ml,
          decantUnitsGiven: countDecants,
          totalUnitsGiven: promoTargetTotal,
          decantUnitCostApplied: computedPromoBlendedUnitCost,
          recipient: formSupplier || 'Marketing Distribution',
          fragranceAllocations: promoAllocations.map((a) => ({
            product: a.productId || null,
            productName: a.productName,
            format: a.format,
            quantity: a.quantity,
            unitCost: a.unitCost,
            totalCost: Number((a.quantity * a.unitCost).toFixed(2)),
          })),
          unassignedFormat,
          unassignedQuantity: unassignedUnitsCount,
          unassignedUnitCost: activeBaselineUnitCost,
        }
      }

      const payload = {
        title: formTitle,
        category: formCategory,
        amount: Number(formAmount),
        quantity: Number(formQuantity) || 1,
        unit: formUnit,
        supplier: formSupplier,
        invoiceNumber: formInvoice,
        date: formDate,
        notes: formNotes,
        assignedProduct: formCategory === 'OILS' && formAssignedProduct ? formAssignedProduct : null,
        syncWithCostConfig: formSyncBenchmark,
        promotionDetails: promotionPayload,
      }

      if (editingExpense) {
        await updateExpense(editingExpense._id, payload)
        showToast('Expense updated successfully')
      } else {
        await createExpense(payload)
        showToast('Expense logged successfully')
        setPage(1)
      }

      setShowAddModal(false)
      await Promise.all([
        loadExpenses(editingExpense ? page : 1, limit),
        loadOverviewAndConfig(),
        loadCatalogAnalysis(),
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Delete this expense record?')) return
    setBusy(true)
    setError(null)
    try {
      await deleteExpense(id)
      showToast('Expense removed')
      if (expenses.length === 1 && page > 1) {
        setPage((p) => p - 1)
      } else {
        await Promise.all([loadExpenses(page, limit), loadOverviewAndConfig()])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense')
    } finally {
      setBusy(false)
    }
  }

  const handleLogGiveaway = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const isMultiFragrance = usePromoCalculator
      const countToLog = isMultiFragrance ? promoTargetTotal : Number(giveawayCount)
      const res = await logDecantGiveaway({
        count: countToLog,
        format: promoCampaignType === 'MIXED' ? 'mixed' : promoSelectedFormat,
        campaignName: giveawayCampaign,
        recipient: giveawayRecipient,
        notes: giveawayNotes,
        fragranceId: isMultiFragrance ? null : giveawayFragranceId || null,
        fragranceAllocations: isMultiFragrance
          ? promoAllocations.map((a) => ({
              product: a.productId || null,
              productName: a.productName,
              format: a.format,
              quantity: a.quantity,
              unitCost: a.unitCost,
              totalCost: Number((a.quantity * a.unitCost).toFixed(2)),
            }))
          : [],
        unassignedFormat,
        unassignedQuantity: isMultiFragrance ? unassignedUnitsCount : 0,
        unassignedUnitCost: isMultiFragrance ? activeBaselineUnitCost : 0,
      })
      showToast(
        `Logged giveaway of ${countToLog} units (${formatEgp(res.totalLogged)}) into promotional expenses!`
      )
      setShowGiveawayModal(false)
      setPage(1)
      await Promise.all([loadExpenses(1, limit), loadOverviewAndConfig()])
      setGiveawayRecipient('')
      setGiveawayNotes('')
      setGiveawayFragranceId('')
      setPromoAllocations([])
      await Promise.all([loadExpenses(), loadOverviewAndConfig()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log promotional giveaway')
    } finally {
      setBusy(false)
    }
  }

  const handleSaveRates = async (e: FormEvent) => {
    e.preventDefault()
    if (!ratesForm) return
    setBusy(true)
    setError(null)
    try {
      const res = await updateCostConfig(ratesForm)
      setCostConfig(res.config)
      setRatesForm(JSON.parse(JSON.stringify(res.config)))
      setCogsData(res.cogs)
      showToast('Material benchmarks & COGS formulas updated!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rates')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs text-white shadow-xl animate-fade-in flex items-center gap-2">
          <span>✓</span>
          <span>{feedback}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button className="underline font-medium" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Top Level Metric Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card asMotion={false} className="p-4 bg-scnt-bg/60 border-scnt-border/60">
          <p className="text-[11px] font-mono uppercase tracking-wider text-scnt-text-muted">Total Spendings</p>
          <p className="mt-1 text-2xl font-light text-scnt-text">
            {formatEgp(summary?.totals?.totalSpent || 0)}
          </p>
          <p className="mt-1 text-[11px] text-scnt-text-muted">
            {summary?.totals?.totalEntries || 0} purchase entries
          </p>
        </Card>

        <Card asMotion={false} className="p-4 bg-scnt-bg/60 border-scnt-border/60">
          <p className="text-[11px] font-mono uppercase tracking-wider text-scnt-text-muted">Spent This Month</p>
          <p className="mt-1 text-2xl font-light text-scnt-text">
            {formatEgp(summary?.totals?.thisMonthSpent || 0)}
          </p>
          <p className="mt-1 text-[11px] text-scnt-text-muted">
            Last Month: {formatEgp(summary?.totals?.lastMonthSpent || 0)}
          </p>
        </Card>

        <Card asMotion={false} className="p-4 bg-scnt-bg/60 border-scnt-border/60">
          <p className="text-[11px] font-mono uppercase tracking-wider text-scnt-text-muted">Promo & Giveaways</p>
          <p className="mt-1 text-2xl font-light text-fuchsia-700">
            {formatEgp(summary?.totals?.totalPromoSCS || 0)}
          </p>
          <p className="mt-1 text-[11px] text-scnt-text-muted">
            {summary?.totals?.totalBottlesGiven || 0} bottles · {summary?.totals?.totalDecantsGiven || 0} decants gifted
          </p>
        </Card>

        <Card asMotion={false} className="p-4 bg-scnt-bg/60 border-scnt-border/60">
          <p className="text-[11px] font-mono uppercase tracking-wider text-scnt-text-muted">Unit Benchmarks</p>
          <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-800 border border-emerald-500/20">
              Meter Sticker: {formatEgp(cogsData?.unitCostsSummary?.bottleStickerFromMeter || 5)}
            </span>
            <span className="rounded bg-teal-500/10 px-1.5 py-0.5 text-teal-800 border border-teal-500/20">
              Sheet Seal: {formatEgp(cogsData?.unitCostsSummary?.boxSealingStickerFromSheet || 1.88)}
            </span>
            <span className="rounded bg-stone-500/10 px-1.5 py-0.5 text-stone-800 border border-stone-500/20">
              Shredded/Box: {formatEgp(cogsData?.unitCostsSummary?.shreddedPaperPerBox || 15)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-scnt-text-muted">
            100ml COGS: <span className="font-medium text-scnt-text">{formatEgp(cogsData?.breakdowns?.size100ml?.totalCogs || 0)}</span> · 3ml Decant: <span className="font-medium text-scnt-text">{formatEgp(cogsData?.breakdowns?.decant3ml?.totalCogs || 0)}</span>
          </p>
        </Card>
      </div>

      {/* Sub-Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-scnt-border/60 pb-3">
        <div className="flex flex-wrap gap-1">
          {[
            { key: 'ledger' as SubTabKey, label: 'Spendings Ledger' },
            { key: 'rates' as SubTabKey, label: 'Material Benchmark Rates' },
            { key: 'calculator' as SubTabKey, label: 'COGS & Profit Calculator' },
            { key: 'promotions' as SubTabKey, label: 'Promotions & Giveaways' },
            { key: 'catalog' as SubTabKey, label: 'Catalog Margins' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                subTab === tab.key
                  ? 'bg-scnt-text text-scnt-bg shadow-sm'
                  : 'bg-scnt-card/40 text-scnt-text-muted hover:text-scnt-text hover:bg-scnt-card/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowGiveawayModal(true)}
            className="!px-4 !py-1.5 text-xs border-fuchsia-400 text-fuchsia-800 hover:bg-fuchsia-50"
          >
            🎁 Log 3ml Decant Giveaway
          </Button>
          <Button onClick={() => openAddModal()} className="!px-4 !py-1.5 text-xs">
            + Log Expense
          </Button>
        </div>
      </div>

      {/* SUB-TAB 1: SPENDINGS LEDGER */}
      {subTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <Card asMotion={false} className="p-4 bg-scnt-card/40">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-[11px] text-scnt-text-muted uppercase">Category</label>
                <select
                  className="mt-1 w-full rounded-md border border-scnt-border/80 bg-scnt-bg px-2.5 py-1.5 text-xs text-scnt-text"
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="ALL">All Categories</option>
                  {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-scnt-text-muted uppercase">Search</label>
                <input
                  type="text"
                  placeholder="Supplier, title, invoice, notes..."
                  className="mt-1 w-full rounded-md border border-scnt-border/80 bg-scnt-bg px-2.5 py-1.5 text-xs text-scnt-text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                />
              </div>

              <div>
                <label className="text-[11px] text-scnt-text-muted uppercase">From Date</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-scnt-border/80 bg-scnt-bg px-2.5 py-1.5 text-xs text-scnt-text"
                  value={startDateFilter}
                  onChange={(e) => {
                    setStartDateFilter(e.target.value)
                    setPage(1)
                  }}
                />
              </div>

              <div>
                <label className="text-[11px] text-scnt-text-muted uppercase">To Date</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-scnt-border/80 bg-scnt-bg px-2.5 py-1.5 text-xs text-scnt-text"
                  value={endDateFilter}
                  onChange={(e) => {
                    setEndDateFilter(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>

            {(categoryFilter !== 'ALL' || searchQuery || startDateFilter || endDateFilter) && (
              <div className="mt-3 pt-2.5 border-t border-scnt-border/40 flex items-center justify-between text-xs">
                <span className="text-scnt-text-muted">
                  Filters active
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('ALL')
                    setSearchQuery('')
                    setStartDateFilter('')
                    setEndDateFilter('')
                    setPage(1)
                  }}
                  className="text-xs text-scnt-text underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </Card>

          {/* Expenses Table */}
          <Card asMotion={false} className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-scnt-text border-collapse">
                <thead className="bg-scnt-card/80 text-[11px] font-mono uppercase text-scnt-text-muted border-b border-scnt-border/60">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Item / Description</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Qty & Unit</th>
                    <th className="px-4 py-3">Total (EGP)</th>
                    <th className="px-4 py-3">Unit Cost</th>
                    <th className="px-4 py-3">Supplier / Inv#</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-scnt-border/40">
                  {expensesLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-scnt-text-muted">
                        Loading spendings ledger entries...
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-scnt-text-muted">
                        No expenses found. Click "+ Log Expense" or "🎁 Log 3ml Decant Giveaway" to record spendings.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((item) => (
                      <tr key={item._id} className="hover:bg-scnt-card/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-[11px] text-scnt-text-muted whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-scnt-text">{item.title}</p>
                          {item.assignedProduct && typeof item.assignedProduct === 'object' && item.assignedProduct.name && (
                            <span className="mt-0.5 inline-block text-[10px] rounded px-1.5 py-0.5 bg-amber-500/10 text-amber-800 border border-amber-500/20 font-medium mr-1.5">
                              Fragrance: {item.assignedProduct.name}
                            </span>
                          )}
                          {item.promotionDetails?.fragranceAllocations && item.promotionDetails.fragranceAllocations.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.promotionDetails.fragranceAllocations.map((a, i) => (
                                <span key={i} className="text-[10px] rounded px-1.5 py-0.2 bg-fuchsia-500/10 text-fuchsia-900 border border-fuchsia-500/20 font-medium">
                                  {a.quantity}x {a.productName} ({formatEgp(a.totalCost)})
                                </span>
                              ))}
                              {item.promotionDetails.unassignedQuantity ? (
                                <span className="text-[10px] rounded px-1.5 py-0.2 bg-amber-500/10 text-amber-800 border border-amber-500/20 font-medium">
                                  {item.promotionDetails.unassignedQuantity}x approx unassigned
                                </span>
                              ) : null}
                            </div>
                          )}
                          {item.notes && <p className="text-[11px] text-scnt-text-muted line-clamp-1">{item.notes}</p>}
                          {item.promotionDetails?.campaignName && (
                            <span className="mt-0.5 inline-block text-[10px] text-fuchsia-700">
                              Campaign: {item.promotionDetails.campaignName} ({item.promotionDetails.decantUnitsGiven} decants)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                              CATEGORY_COLORS[item.category] || 'bg-zinc-100 text-zinc-700 border-zinc-200'
                            }`}
                          >
                            {CATEGORY_LABELS[item.category] || item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px]">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3 font-semibold text-scnt-text whitespace-nowrap">
                          {formatEgp(item.amount)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-scnt-text-muted whitespace-nowrap">
                          {formatEgp(item.unitCost)} / {item.unit}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-scnt-text-muted">
                          {item.supplier || '—'} {item.invoiceNumber ? `(#${item.invoiceNumber})` : ''}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openAddModal(item)}
                              disabled={busy}
                              className="rounded px-2 py-1 text-[11px] text-scnt-text hover:bg-scnt-card/80 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => void handleDeleteExpense(item._id)}
                              disabled={busy}
                              className="rounded px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-scnt-border/60 px-4 py-3 text-xs text-scnt-text-muted">
              {/* Range & Total Entries */}
              <div className="flex items-center gap-3">
                <span>
                  {pagination.total > 0 ? (
                    <>
                      Showing <strong className="text-scnt-text font-mono">{(page - 1) * limit + 1}</strong>–
                      <strong className="text-scnt-text font-mono">
                        {Math.min(page * limit, pagination.total)}
                      </strong>{' '}
                      of <strong className="text-scnt-text font-mono">{pagination.total}</strong> entries
                    </>
                  ) : (
                    'No entries'
                  )}
                </span>

                {/* Rows per page selector */}
                <div className="flex items-center gap-1.5 ml-2 border-l border-scnt-border/60 pl-3">
                  <span className="text-[11px]">Rows:</span>
                  <select
                    className="rounded border border-scnt-border/80 bg-scnt-bg px-2 py-0.5 text-xs text-scnt-text"
                    value={limit}
                    onChange={(e) => {
                      const newLimit = Number(e.target.value)
                      setLimit(newLimit)
                      setPage(1)
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Navigation buttons */}
              {pagination.pages > 1 && (
                <div className="flex items-center gap-1">
                  {/* First page button */}
                  <button
                    type="button"
                    disabled={page <= 1 || expensesLoading || busy}
                    onClick={() => setPage(1)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-scnt-border/80 bg-scnt-bg text-xs text-scnt-text hover:bg-scnt-card/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="First page"
                  >
                    «
                  </button>

                  {/* Previous button */}
                  <button
                    type="button"
                    disabled={page <= 1 || expensesLoading || busy}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-7 px-2.5 items-center justify-center rounded border border-scnt-border/80 bg-scnt-bg text-xs text-scnt-text hover:bg-scnt-card/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1 px-1">
                    {getPageNumbers(page, pagination.pages).map((pNum, idx) => {
                      if (pNum === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-1 text-scnt-text-muted">
                            …
                          </span>
                        )
                      }
                      const isCurrent = pNum === page
                      return (
                        <button
                          key={pNum}
                          type="button"
                          disabled={expensesLoading || busy}
                          onClick={() => setPage(Number(pNum))}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition-colors ${
                            isCurrent
                              ? 'bg-scnt-text text-scnt-bg font-semibold'
                              : 'border border-scnt-border/80 bg-scnt-bg text-scnt-text hover:bg-scnt-card/80'
                          }`}
                        >
                          {pNum}
                        </button>
                      )
                    })}
                  </div>

                  {/* Next button */}
                  <button
                    type="button"
                    disabled={page >= pagination.pages || expensesLoading || busy}
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    className="inline-flex h-7 px-2.5 items-center justify-center rounded border border-scnt-border/80 bg-scnt-bg text-xs text-scnt-text hover:bg-scnt-card/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>

                  {/* Last page button */}
                  <button
                    type="button"
                    disabled={page >= pagination.pages || expensesLoading || busy}
                    onClick={() => setPage(pagination.pages)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-scnt-border/80 bg-scnt-bg text-xs text-scnt-text hover:bg-scnt-card/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Last page"
                  >
                    »
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* SUB-TAB 2: MATERIAL BENCHMARK RATES & FORMULAS */}
      {subTab === 'rates' && ratesForm && (
        <form onSubmit={handleSaveRates} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 1. Fragrance Liquids & Formulas */}
            <Card asMotion={false} className="p-5 space-y-4">
              <div className="border-b border-scnt-border/40 pb-2">
                <h3 className="text-sm font-semibold text-scnt-text">1. Fragrance Liquids & Alcohol</h3>
                <p className="text-[11px] text-scnt-text-muted">Oils, perfumer's ethanol, and cleaning alcohol</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>💡</span>
                    <span>Individual Fragrance Oil Pricing</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                    Fragrance oils have <strong>no default or global price</strong>. Each fragrance in your catalog has its own separate oil cost per kg / ml based on its unique formula. Configure specific fragrance oil prices in the <strong>COGS Recipe Simulator</strong> or <strong>Catalog Margins</strong> tab.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] text-scnt-text-muted">Fragrant Alcohol / Liter (EGP)</label>
                  <input
                    type="number"
                    step="any"
                    className="mt-1 w-full rounded-md border border-scnt-border/80 bg-scnt-bg px-2.5 py-1.5 text-xs text-scnt-text"
                    value={ratesForm.liquids.fragrantAlcoholCostPerLiter}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setRatesForm((r) =>
                        r
                          ? {
                              ...r,
                              liquids: {
                                ...r.liquids,
                                fragrantAlcoholCostPerLiter: val,
                                fragrantAlcoholCostPerMl: Number((val / 1000).toFixed(4)),
                              },
                            }
                          : null
                      )
                    }}
                  />
                  <span className="text-[10px] text-scnt-text-muted">
                    = {formatEgp(ratesForm.liquids.fragrantAlcoholCostPerMl)} / ml
                  </span>
                </div>

                <div>
                  <label className="text-[11px] text-scnt-text-muted">Cleaning Alcohol / Liter (EGP)</label>
                  <input
                    type="number"
                    step="any"
                    className="mt-1 w-full rounded-md border border-scnt-border/80 bg-scnt-bg px-2.5 py-1.5 text-xs text-scnt-text"
                    value={ratesForm.liquids.cleaningAlcoholCostPerLiter}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setRatesForm((r) =>
                        r ? { ...r, liquids: { ...r.liquids, cleaningAlcoholCostPerLiter: val } } : null
                      )
                    }}
                  />
                </div>
              </div>

              {/* Recipe Volume Breakdown */}
              <div className="rounded-lg bg-scnt-card/40 p-3 space-y-2 border border-scnt-border/40 text-xs">
                <p className="text-[11px] font-medium text-scnt-text">Bottle Recipe Ratios (ml)</p>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-scnt-text-muted">100ml Bottle</span>
                    <div className="mt-1 flex gap-1">
                      <input
                        type="number"
                        placeholder="Oil ml"
                        className="w-1/2 rounded border px-1.5 py-1 text-xs"
                        value={ratesForm.liquids.recipes.size100ml.oilMl}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setRatesForm((r) =>
                            r
                              ? {
                                  ...r,
                                  liquids: {
                                    ...r.liquids,
                                    recipes: {
                                      ...r.liquids.recipes,
                                      size100ml: { ...r.liquids.recipes.size100ml, oilMl: val },
                                    },
                                  },
                                }
                              : null
                          )
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Alc ml"
                        className="w-1/2 rounded border px-1.5 py-1 text-xs"
                        value={ratesForm.liquids.recipes.size100ml.alcoholMl}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setRatesForm((r) =>
                            r
                              ? {
                                  ...r,
                                  liquids: {
                                    ...r.liquids,
                                    recipes: {
                                      ...r.liquids.recipes,
                                      size100ml: { ...r.liquids.recipes.size100ml, alcoholMl: val },
                                    },
                                  },
                                }
                              : null
                          )
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-scnt-text-muted">50ml Bottle</span>
                    <div className="mt-1 flex gap-1">
                      <input
                        type="number"
                        placeholder="Oil ml"
                        className="w-1/2 rounded border px-1.5 py-1 text-xs"
                        value={ratesForm.liquids.recipes.size50ml.oilMl}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setRatesForm((r) =>
                            r
                              ? {
                                  ...r,
                                  liquids: {
                                    ...r.liquids,
                                    recipes: {
                                      ...r.liquids.recipes,
                                      size50ml: { ...r.liquids.recipes.size50ml, oilMl: val },
                                    },
                                  },
                                }
                              : null
                          )
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Alc ml"
                        className="w-1/2 rounded border px-1.5 py-1 text-xs"
                        value={ratesForm.liquids.recipes.size50ml.alcoholMl}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setRatesForm((r) =>
                            r
                              ? {
                                  ...r,
                                  liquids: {
                                    ...r.liquids,
                                    recipes: {
                                      ...r.liquids.recipes,
                                      size50ml: { ...r.liquids.recipes.size50ml, alcoholMl: val },
                                    },
                                  },
                                }
                              : null
                          )
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-scnt-text-muted">3ml Decant</span>
                    <div className="mt-1 flex gap-1">
                      <input
                        type="number"
                        placeholder="Oil ml"
                        className="w-1/2 rounded border px-1.5 py-1 text-xs"
                        value={ratesForm.liquids.recipes.decant3ml.oilMl}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setRatesForm((r) =>
                            r
                              ? {
                                  ...r,
                                  liquids: {
                                    ...r.liquids,
                                    recipes: {
                                      ...r.liquids.recipes,
                                      decant3ml: { ...r.liquids.recipes.decant3ml, oilMl: val },
                                    },
                                  },
                                }
                              : null
                          )
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Alc ml"
                        className="w-1/2 rounded border px-1.5 py-1 text-xs"
                        value={ratesForm.liquids.recipes.decant3ml.alcoholMl}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setRatesForm((r) =>
                            r
                              ? {
                                  ...r,
                                  liquids: {
                                    ...r.liquids,
                                    recipes: {
                                      ...r.liquids.recipes,
                                      decant3ml: { ...r.liquids.recipes.decant3ml, alcoholMl: val },
                                    },
                                  },
                                }
                              : null
                          )
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Stickers: Bought by the Meter and Sold by the Sheet */}
            <Card asMotion={false} className="p-5 space-y-4">
              <div className="border-b border-scnt-border/40 pb-2">
                <h3 className="text-sm font-semibold text-scnt-text">2. Stickers (Meter & Sheet Yields)</h3>
                <p className="text-[11px] text-scnt-text-muted">Calculates exact unit cost per applied sticker</p>
              </div>

              {/* Bottle Stickers (Meter) */}
              <div className="rounded-lg border border-scnt-border/40 p-3 bg-scnt-card/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-emerald-800">Bottle Stickers (Bought by the METER)</span>
                  <span className="text-[11px] font-mono font-semibold text-emerald-700">
                    {formatEgp(
                      ratesForm.stickers.bottleStickers.stickersPerMeter > 0
                        ? ratesForm.stickers.bottleStickers.costPerMeter /
                            ratesForm.stickers.bottleStickers.stickersPerMeter
                        : 0
                    )}{' '}
                    / sticker
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-scnt-text-muted">Cost per Meter (EGP)</label>
                    <input
                      type="number"
                      step="any"
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                      value={ratesForm.stickers.bottleStickers.costPerMeter}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setRatesForm((r) =>
                          r
                            ? {
                                ...r,
                                stickers: {
                                  ...r.stickers,
                                  bottleStickers: { ...r.stickers.bottleStickers, costPerMeter: val },
                                },
                              }
                            : null
                        )
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-scnt-text-muted">Stickers Yield / Meter</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                      value={ratesForm.stickers.bottleStickers.stickersPerMeter}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setRatesForm((r) =>
                          r
                            ? {
                                ...r,
                                stickers: {
                                  ...r.stickers,
                                  bottleStickers: { ...r.stickers.bottleStickers, stickersPerMeter: val },
                                },
                              }
                            : null
                        )
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Box Sealing Stickers (Sheet) */}
              <div className="rounded-lg border border-scnt-border/40 p-3 bg-scnt-card/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-teal-800">Box Sealing Stickers (Sold by the SHEET)</span>
                  <span className="text-[11px] font-mono font-semibold text-teal-700">
                    {formatEgp(
                      ratesForm.stickers.boxSealingStickers.stickersPerSheet > 0
                        ? ratesForm.stickers.boxSealingStickers.costPerSheet /
                            ratesForm.stickers.boxSealingStickers.stickersPerSheet
                        : 0
                    )}{' '}
                    / seal
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-scnt-text-muted">Cost per Sheet (EGP)</label>
                    <input
                      type="number"
                      step="any"
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                      value={ratesForm.stickers.boxSealingStickers.costPerSheet}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setRatesForm((r) =>
                          r
                            ? {
                                ...r,
                                stickers: {
                                  ...r.stickers,
                                  boxSealingStickers: { ...r.stickers.boxSealingStickers, costPerSheet: val },
                                },
                              }
                            : null
                        )
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-scnt-text-muted">Seals Yield / Sheet</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                      value={ratesForm.stickers.boxSealingStickers.stickersPerSheet}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setRatesForm((r) =>
                          r
                            ? {
                                ...r,
                                stickers: {
                                  ...r.stickers,
                                  boxSealingStickers: { ...r.stickers.boxSealingStickers, stickersPerSheet: val },
                                },
                              }
                            : null
                        )
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Box Top Stickers (Meter) */}
              <div className="rounded-lg border border-scnt-border/40 p-3 bg-scnt-card/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-lime-800">Box Top / Lid Stickers (Bought by the METER)</span>
                  <span className="text-[11px] font-mono font-semibold text-lime-700">
                    {formatEgp(
                      ratesForm.stickers.boxTopStickers.stickersPerMeter > 0
                        ? ratesForm.stickers.boxTopStickers.costPerMeter /
                            ratesForm.stickers.boxTopStickers.stickersPerMeter
                        : 0
                    )}{' '}
                    / sticker
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-scnt-text-muted">Cost per Meter (EGP)</label>
                    <input
                      type="number"
                      step="any"
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                      value={ratesForm.stickers.boxTopStickers.costPerMeter}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setRatesForm((r) =>
                          r
                            ? {
                                ...r,
                                stickers: {
                                  ...r.stickers,
                                  boxTopStickers: { ...r.stickers.boxTopStickers, costPerMeter: val },
                                },
                              }
                            : null
                        )
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-scnt-text-muted">Stickers Yield / Meter</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                      value={ratesForm.stickers.boxTopStickers.stickersPerMeter}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setRatesForm((r) =>
                          r
                            ? {
                                ...r,
                                stickers: {
                                  ...r.stickers,
                                  boxTopStickers: { ...r.stickers.boxTopStickers, stickersPerMeter: val },
                                },
                              }
                            : null
                        )
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Cards: Thank You Cards & Decant Cards */}
            <Card asMotion={false} className="p-5 space-y-4">
              <div className="border-b border-scnt-border/40 pb-2">
                <h3 className="text-sm font-semibold text-scnt-text">3. Cards (Thank You & Decant Cards)</h3>
                <p className="text-[11px] text-scnt-text-muted">Batch cost and piece cost calculations</p>
              </div>

              {/* Thank You Card */}
              <div className="rounded-lg border border-scnt-border/40 p-3 bg-scnt-card/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-pink-800">Thank You Cards (In-Box / In-Order)</span>
                  <span className="text-[11px] font-mono font-semibold text-pink-700">
                    {formatEgp(
                      ratesForm.cards.thankYouCard.batchQuantity > 0
                        ? ratesForm.cards.thankYouCard.batchCost / ratesForm.cards.thankYouCard.batchQuantity
                        : 0
                    )}{' '}
                    / card
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-scnt-text-muted">Batch Cost (EGP)</label>
                    <input
                      type="number"
                      step="any"
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                      value={ratesForm.cards.thankYouCard.batchCost}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setRatesForm((r) =>
                          r
                            ? {
                                ...r,
                                cards: {
                                  ...r.cards,
                                  thankYouCard: { ...r.cards.thankYouCard, batchCost: val },
                                },
                              }
                            : null
                        )
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-scnt-text-muted">Batch Quantity</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                      value={ratesForm.cards.thankYouCard.batchQuantity}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setRatesForm((r) =>
                          r
                            ? {
                                ...r,
                                cards: {
                                  ...r.cards,
                                  thankYouCard: { ...r.cards.thankYouCard, batchQuantity: val },
                                },
                              }
                            : null
                        )
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Decant Card */}
              <div className="rounded-lg border border-scnt-border/40 p-3 bg-scnt-card/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-rose-800">Decant Cards (For 3ml Decant mount)</span>
                  <span className="text-[11px] font-mono font-semibold text-rose-700">
                    {formatEgp(
                      ratesForm.cards.decantCard.batchQuantity > 0
                        ? ratesForm.cards.decantCard.batchCost / ratesForm.cards.decantCard.batchQuantity
                        : 0
                    )}{' '}
                    / card
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-scnt-text-muted">Batch Cost (EGP)</label>
                    <input
                      type="number"
                      step="any"
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                      value={ratesForm.cards.decantCard.batchCost}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setRatesForm((r) =>
                          r
                            ? {
                                ...r,
                                cards: {
                                  ...r.cards,
                                  decantCard: { ...r.cards.decantCard, batchCost: val },
                                },
                              }
                            : null
                        )
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-scnt-text-muted">Batch Quantity</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                      value={ratesForm.cards.decantCard.batchQuantity}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setRatesForm((r) =>
                          r
                            ? {
                                ...r,
                                cards: {
                                  ...r.cards,
                                  decantCard: { ...r.cards.decantCard, batchQuantity: val },
                                },
                              }
                            : null
                        )
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* 4. Wrapping, Shredded Paper & Bottles/Boxes */}
            <Card asMotion={false} className="p-5 space-y-4">
              <div className="border-b border-scnt-border/40 pb-2">
                <h3 className="text-sm font-semibold text-scnt-text">4. Wrapping, Shredded Paper & Containers</h3>
                <p className="text-[11px] text-scnt-text-muted">Boxes, glass bottles, wrapping paper & filler</p>
              </div>

              {/* Shredded paper: 1 bag makes ~3 boxes */}
              <div className="rounded-lg border border-scnt-border/40 p-3 bg-scnt-card/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-stone-800">Shredded Paper (1 Bag makes ~3 Boxes)</span>
                  <span className="text-[11px] font-mono font-semibold text-stone-700">
                    {formatEgp(
                      ratesForm.wrapping.shreddedPaper.boxesPerBag > 0
                        ? ratesForm.wrapping.shreddedPaper.costPerBag /
                            ratesForm.wrapping.shreddedPaper.boxesPerBag
                        : 0
                    )}{' '}
                    / box
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-scnt-text-muted">Cost per Bag (EGP)</label>
                    <input
                      type="number"
                      step="any"
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                      value={ratesForm.wrapping.shreddedPaper.costPerBag}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setRatesForm((r) =>
                          r
                            ? {
                                ...r,
                                wrapping: {
                                  ...r.wrapping,
                                  shreddedPaper: { ...r.wrapping.shreddedPaper, costPerBag: val },
                                },
                              }
                            : null
                        )
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-scnt-text-muted">Boxes filled per Bag</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                      value={ratesForm.wrapping.shreddedPaper.boxesPerBag}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setRatesForm((r) =>
                          r
                            ? {
                                ...r,
                                wrapping: {
                                  ...r.wrapping,
                                  shreddedPaper: { ...r.wrapping.shreddedPaper, boxesPerBag: val },
                                },
                              }
                            : null
                        )
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-scnt-text-muted">Wrapping Sheet / Unit (EGP)</label>
                  <input
                    type="number"
                    step="any"
                    className="mt-1 w-full rounded border px-2 py-1 text-xs"
                    value={ratesForm.wrapping.wrappingSheetUnitCost}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setRatesForm((r) =>
                        r ? { ...r, wrapping: { ...r.wrapping, wrappingSheetUnitCost: val } } : null
                      )
                    }}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-scnt-text-muted">Courier Flyer / Mailer (EGP)</label>
                  <input
                    type="number"
                    step="any"
                    className="mt-1 w-full rounded border px-2 py-1 text-xs"
                    value={ratesForm.wrapping.courierFlyerUnitCost}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setRatesForm((r) =>
                        r ? { ...r, wrapping: { ...r.wrapping, courierFlyerUnitCost: val } } : null
                      )
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-scnt-text-muted">50ml Bottle (EGP)</label>
                  <input
                    type="number"
                    step="any"
                    className="mt-1 w-full rounded border px-2 py-1 text-xs"
                    value={ratesForm.bottles.size50ml}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setRatesForm((r) =>
                        r ? { ...r, bottles: { ...r.bottles, size50ml: val } } : null
                      )
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-scnt-text-muted">100ml Bottle (EGP)</label>
                  <input
                    type="number"
                    step="any"
                    className="mt-1 w-full rounded border px-2 py-1 text-xs"
                    value={ratesForm.bottles.size100ml}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setRatesForm((r) =>
                        r ? { ...r, bottles: { ...r.bottles, size100ml: val } } : null
                      )
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-scnt-text-muted">3ml Vial (EGP)</label>
                  <input
                    type="number"
                    step="any"
                    className="mt-1 w-full rounded border px-2 py-1 text-xs"
                    value={ratesForm.bottles.decant3mlVial}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setRatesForm((r) =>
                        r ? { ...r, bottles: { ...r.bottles, decant3mlVial: val } } : null
                      )
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-scnt-text-muted">50ml Outer Box (EGP)</label>
                  <input
                    type="number"
                    step="any"
                    className="mt-1 w-full rounded border px-2 py-1 text-xs"
                    value={ratesForm.boxes.size50ml}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setRatesForm((r) => (r ? { ...r, boxes: { ...r.boxes, size50ml: val } } : null))
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-scnt-text-muted">100ml Outer Box (EGP)</label>
                  <input
                    type="number"
                    step="any"
                    className="mt-1 w-full rounded border px-2 py-1 text-xs"
                    value={ratesForm.boxes.size100ml}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setRatesForm((r) => (r ? { ...r, boxes: { ...r.boxes, size100ml: val } } : null))
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setRatesForm(costConfig ? JSON.parse(JSON.stringify(costConfig)) : null)}
            >
              Reset to Saved
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving...' : 'Save Benchmark Rates & Formulas'}
            </Button>
          </div>
        </form>
      )}

      {/* SUB-TAB 3: COGS & PROFIT CALCULATOR (BILL OF MATERIALS) */}
      {subTab === 'calculator' && cogsData && (() => {
        const selectedProduct =
          cogsAnalysis?.productAnalysis.find((p) => p.slug === selectedProductSlug) ||
          cogsAnalysis?.productAnalysis[0] ||
          null

        const isOilSet = Boolean(selectedProduct && (selectedProduct.oilCostPerKg > 0 || selectedProduct.oilCostPerMl > 0))
        const activeBreakdowns = selectedProduct?.breakdowns || cogsData.breakdowns
        const activeOilCostPerMl = selectedProduct ? selectedProduct.oilCostPerMl : 0
        const activeOilCostPerKg = selectedProduct ? selectedProduct.oilCostPerKg : 0

        return (
          <div className="space-y-6">
            {/* Fragrance Selector & Oil Price Customizer */}
            <Card asMotion={false} className="p-4 bg-scnt-card/40 border-scnt-border/60">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-scnt-text-muted">
                      Select Fragrance Recipe:
                    </label>
                    <select
                      className="mt-1 block rounded-md border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs font-medium text-scnt-text"
                      value={selectedProduct?.slug || ''}
                      onChange={(e) => {
                        const slug = e.target.value
                        setSelectedProductSlug(slug)
                        if (cogsAnalysis) {
                          const prod = cogsAnalysis.productAnalysis.find((p) => p.slug === slug)
                          if (prod) {
                            setSimRetail100(prod.size100ml.retailPrice)
                            setSimRetail50(prod.size50ml.retailPrice)
                            if (fragranceOilUnit === 'grams') {
                              const gPrice = prod.oilCostPerGram || (prod.oilCostPerKg > 0 ? Number((prod.oilCostPerKg / 1000).toFixed(4)) : '')
                              setEditingOilValue(gPrice ? String(gPrice) : '')
                            } else {
                              setEditingOilValue(prod.oilCostPerKg > 0 ? String(prod.oilCostPerKg) : '')
                            }
                          }
                        }
                      }}
                    >
                      {cogsAnalysis?.productAnalysis.map((p) => (
                        <option key={p._id} value={p.slug}>
                          {p.name} {p.oilCostPerKg > 0 ? `(${formatEgp(fragranceOilUnit === 'grams' ? (p.oilCostPerGram || p.oilCostPerKg / 1000) : p.oilCostPerKg)}/${fragranceOilUnit === 'grams' ? 'g' : 'kg'})` : '(⚠ Oil Price Needed)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-lg border border-scnt-border/60 bg-scnt-bg px-3 py-1.5 text-xs">
                    <span className="text-[10px] text-scnt-text-muted uppercase">Active Fragrance Oil Rate:</span>
                    {isOilSet ? (
                      <p className="font-semibold text-emerald-800">
                        {fragranceOilUnit === 'grams'
                          ? `${formatEgp(activeOilCostPerMl)} / g `
                          : `${formatEgp(activeOilCostPerKg)} / kg `}
                        <span className="text-[11px] font-normal text-scnt-text-muted">
                          ({fragranceOilUnit === 'grams' ? `${formatEgp(activeOilCostPerKg)} / kg` : `${formatEgp(activeOilCostPerMl)} / g`})
                        </span>
                      </p>
                    ) : (
                      <p className="font-semibold text-amber-700">
                        Not Set (0.00 EGP)
                      </p>
                    )}
                  </div>
                </div>

                {selectedProduct && (
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <label className="text-[10px] text-scnt-text-muted block">
                        Set {selectedProduct.name} Oil ({fragranceOilUnit === 'grams' ? 'EGP/g' : 'EGP/kg'})
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder={fragranceOilUnit === 'grams' ? 'e.g. 3.5' : 'e.g. 3500'}
                        className="w-32 rounded border border-scnt-border bg-scnt-bg px-2 py-1 text-xs font-semibold"
                        value={editingOilValue}
                        onChange={(e) => setEditingOilValue(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={() => void handleSaveProductOilPrice(selectedProduct._id, Number(editingOilValue), fragranceOilUnit)}
                      disabled={busy || !editingOilValue}
                      className="!px-3 !py-1 text-xs mt-3"
                    >
                      Save Oil Price
                    </Button>
                  </div>
                )}
              </div>

              {selectedProduct && !isOilSet && (
                <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-900 flex items-center justify-between">
                  <span>
                    ⚠ <strong>Oil price required:</strong> Each fragrance has a unique oil price. Please enter <strong>{selectedProduct.name}</strong>'s oil cost per kg above to compute total COGS and profit margin.
                  </span>
                  <span className="font-mono text-[11px] text-amber-800">
                    Base Packaging & Alcohol: {formatEgp(activeBreakdowns.size100ml.baseNonOilCost || 0)}
                  </span>
                </div>
              )}
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* 100ml Bottle BOM */}
              <Card asMotion={false} className="p-5 space-y-4">
                <div className="border-b border-scnt-border/40 pb-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-scnt-text-muted">Perfume Format</span>
                  <h3 className="text-lg font-light text-scnt-text">
                    100ml Bottle {selectedProduct ? `(${selectedProduct.name})` : ''}
                  </h3>
                </div>

                <div className="space-y-2 text-xs divide-y divide-scnt-border/30">
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">
                      Fragrance Oil (25ml @ {formatEgp(activeOilCostPerMl)}/ml)
                    </span>
                    <span className="font-mono font-medium">{formatEgp(activeBreakdowns.size100ml.oilCost)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Fragrant Alcohol (75ml)</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size100ml.alcoholCost)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">100ml Glass Bottle & Atomizer</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size100ml.bottleCost)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">100ml Outer Packaging Box</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size100ml.boxCost)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Bottle Sticker (From Meter)</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size100ml.stickerDetails.bottleSticker)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Box Top Sticker (From Meter)</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size100ml.stickerDetails.boxTopSticker)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Box Sealing Sticker (Sheet)</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size100ml.stickerDetails.boxSealingSticker)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Shredded Paper (1/3 Bag)</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size100ml.packagingDetails.shreddedPaper)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Wrapping Sheet</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size100ml.packagingDetails.wrappingSheet)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Thank You Card</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size100ml.packagingDetails.thankYouCard)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Courier Flyer</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size100ml.packagingDetails.courierFlyer)}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-semibold text-sm border-t border-scnt-border/80">
                    <span>Total Unit COGS</span>
                    <span className="text-emerald-700">{formatEgp(activeBreakdowns.size100ml.totalCogs)}</span>
                  </div>
                </div>

                {/* Profit Simulator */}
                <div className="rounded-lg bg-scnt-card/40 p-3 space-y-2 border border-scnt-border/40 text-xs">
                  <label className="text-[11px] text-scnt-text-muted">Simulate Retail Price (EGP)</label>
                  <input
                    type="number"
                    className="w-full rounded border px-2 py-1 text-sm font-semibold"
                    value={simRetail100}
                    onChange={(e) => setSimRetail100(Number(e.target.value))}
                  />
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-scnt-border/30">
                    <div>
                      <span className="text-[10px] text-scnt-text-muted">Gross Profit</span>
                      <p className="text-sm font-semibold text-emerald-800">
                        {formatEgp(simRetail100 - activeBreakdowns.size100ml.totalCogs)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-scnt-text-muted">Margin</span>
                      <p className="text-sm font-semibold text-emerald-800">
                        {simRetail100 > 0
                          ? (((simRetail100 - activeBreakdowns.size100ml.totalCogs) / simRetail100) * 100).toFixed(1)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 50ml Bottle BOM */}
              <Card asMotion={false} className="p-5 space-y-4">
                <div className="border-b border-scnt-border/40 pb-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-scnt-text-muted">Perfume Format</span>
                  <h3 className="text-lg font-light text-scnt-text">
                    50ml Bottle {selectedProduct ? `(${selectedProduct.name})` : ''}
                  </h3>
                </div>

                <div className="space-y-2 text-xs divide-y divide-scnt-border/30">
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">
                      Fragrance Oil (15ml @ {formatEgp(activeOilCostPerMl)}/ml)
                    </span>
                    <span className="font-mono font-medium">{formatEgp(activeBreakdowns.size50ml.oilCost)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Fragrant Alcohol (35ml)</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size50ml.alcoholCost)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">50ml Glass Bottle & Atomizer</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size50ml.bottleCost)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">50ml Outer Packaging Box</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size50ml.boxCost)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Bottle Sticker (From Meter)</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size50ml.stickerDetails.bottleSticker)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Box Top Sticker (From Meter)</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size50ml.stickerDetails.boxTopSticker)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Box Sealing Sticker (Sheet)</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size50ml.stickerDetails.boxSealingSticker)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Shredded Paper (1/3 Bag)</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size50ml.packagingDetails.shreddedPaper)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Wrapping Sheet</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size50ml.packagingDetails.wrappingSheet)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Thank You Card</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size50ml.packagingDetails.thankYouCard)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Courier Flyer</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.size50ml.packagingDetails.courierFlyer)}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-semibold text-sm border-t border-scnt-border/80">
                    <span>Total Unit COGS</span>
                    <span className="text-emerald-700">{formatEgp(activeBreakdowns.size50ml.totalCogs)}</span>
                  </div>
                </div>

                {/* Profit Simulator */}
                <div className="rounded-lg bg-scnt-card/40 p-3 space-y-2 border border-scnt-border/40 text-xs">
                  <label className="text-[11px] text-scnt-text-muted">Simulate Retail Price (EGP)</label>
                  <input
                    type="number"
                    className="w-full rounded border px-2 py-1 text-sm font-semibold"
                    value={simRetail50}
                    onChange={(e) => setSimRetail50(Number(e.target.value))}
                  />
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-scnt-border/30">
                    <div>
                      <span className="text-[10px] text-scnt-text-muted">Gross Profit</span>
                      <p className="text-sm font-semibold text-emerald-800">
                        {formatEgp(simRetail50 - activeBreakdowns.size50ml.totalCogs)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-scnt-text-muted">Margin</span>
                      <p className="text-sm font-semibold text-emerald-800">
                        {simRetail50 > 0
                          ? (((simRetail50 - activeBreakdowns.size50ml.totalCogs) / simRetail50) * 100).toFixed(1)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 3ml Decant BOM */}
              <Card asMotion={false} className="p-5 space-y-4">
                <div className="border-b border-scnt-border/40 pb-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-scnt-text-muted">Discovery / Promo</span>
                  <h3 className="text-lg font-light text-scnt-text">
                    3ml Decant {selectedProduct ? `(${selectedProduct.name})` : ''}
                  </h3>
                </div>

                <div className="space-y-2 text-xs divide-y divide-scnt-border/30">
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">
                      3ml Blend (1ml Oil @ {formatEgp(activeOilCostPerMl)} + 2ml Alc)
                    </span>
                    <span className="font-mono font-medium">{formatEgp(activeBreakdowns.decant3ml.liquidCost)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">3ml Decant Glass/Plastic Vial</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.decant3ml.vialCost)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-scnt-text-muted">Custom Decant Card Mount</span>
                    <span className="font-mono">{formatEgp(activeBreakdowns.decant3ml.decantCardCost)}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-semibold text-sm border-t border-scnt-border/80">
                    <span>Total Unit COGS</span>
                    <span className="text-emerald-700">{formatEgp(activeBreakdowns.decant3ml.totalCogs)}</span>
                  </div>
                </div>

                {/* Promotional Value / Gifting Impact */}
                <div className="rounded-lg bg-fuchsia-500/10 p-3 space-y-2 border border-fuchsia-500/20 text-xs">
                  <span className="font-medium text-fuchsia-900">🎁 Promotion Cost Impact</span>
                  <p className="text-[11px] text-fuchsia-800">
                    Giving away 10 sample decants absorbs{' '}
                    <span className="font-semibold">{formatEgp(activeBreakdowns.decant3ml.totalCogs * 10)}</span> from
                    your marketing budget.
                  </p>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full !px-3 !py-1.5 text-xs border-fuchsia-400 text-fuchsia-800 hover:bg-fuchsia-100"
                      onClick={() => setShowGiveawayModal(true)}
                    >
                      Log Decants Giveaway
                    </Button>
                  </div>
                </div>

                {/* Commercial Sale simulator */}
                <div className="rounded-lg bg-scnt-card/40 p-3 space-y-2 border border-scnt-border/40 text-xs">
                  <label className="text-[11px] text-scnt-text-muted">If Sold as Discovery Set / Single (EGP)</label>
                  <input
                    type="number"
                    className="w-full rounded border px-2 py-1 text-sm font-semibold"
                    value={simRetailDecant}
                    onChange={(e) => setSimRetailDecant(Number(e.target.value))}
                  />
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-scnt-border/30">
                    <div>
                      <span className="text-[10px] text-scnt-text-muted">Gross Profit</span>
                      <p className="text-sm font-semibold text-emerald-800">
                        {formatEgp(simRetailDecant - activeBreakdowns.decant3ml.totalCogs)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-scnt-text-muted">Margin</span>
                      <p className="text-sm font-semibold text-emerald-800">
                        {simRetailDecant > 0
                          ? (((simRetailDecant - activeBreakdowns.decant3ml.totalCogs) / simRetailDecant) * 100).toFixed(1)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )
      })()}

      {/* SUB-TAB 4: PROMOTIONS & GIVEAWAYS */}
      {subTab === 'promotions' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card asMotion={false} className="p-4 bg-fuchsia-500/10 border-fuchsia-500/20">
              <p className="text-[11px] font-mono uppercase tracking-wider text-fuchsia-800">Total Marketing Budget Spent</p>
              <p className="mt-1 text-2xl font-light text-fuchsia-950">
                {formatEgp(summary?.totals?.totalPromoSCS || 0)}
              </p>
              <p className="mt-1 text-[11px] text-scnt-text-muted">
                Bottles, decants & packaging absorbed
              </p>
            </Card>

            <Card asMotion={false} className="p-4 bg-scnt-bg/60 border-scnt-border/60">
              <p className="text-[11px] font-mono uppercase tracking-wider text-scnt-text-muted">Full Bottles Gifted</p>
              <p className="mt-1 text-2xl font-light text-emerald-800">
                {summary?.totals?.totalBottlesGiven || 0} boxed sets
              </p>
              <p className="mt-1 text-[11px] text-scnt-text-muted">
                {summary?.totals?.total100mlGiven || 0}x 100ml · {summary?.totals?.total50mlGiven || 0}x 50ml
              </p>
            </Card>

            <Card asMotion={false} className="p-4 bg-scnt-bg/60 border-scnt-border/60">
              <p className="text-[11px] font-mono uppercase tracking-wider text-scnt-text-muted">3ml Decants Gifted</p>
              <p className="mt-1 text-2xl font-light text-scnt-text">
                {summary?.totals?.totalDecantsGiven || 0} units
              </p>
              <p className="mt-1 text-[11px] text-scnt-text-muted">
                Cost Absorbed: {formatEgp((summary?.totals?.totalDecantsGiven || 0) * (cogsData?.breakdowns?.decant3ml?.totalCogs || 10))}
              </p>
            </Card>

            <Card asMotion={false} className="p-4 bg-scnt-bg/60 border-scnt-border/60 flex flex-col justify-center">
              <Button onClick={() => setShowGiveawayModal(true)} className="w-full text-xs">
                🎁 Log Promotional Giveaway
              </Button>
            </Card>
          </div>

          {/* Promotional Ledger */}
          <Card asMotion={false} className="p-4">
            <h3 className="text-sm font-semibold text-scnt-text mb-3">Promotional & Giveaway Campaigns</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-scnt-text">
                <thead className="bg-scnt-card/80 text-[11px] font-mono uppercase text-scnt-text-muted border-b border-scnt-border/60">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Campaign / Recipient</th>
                    <th className="px-4 py-3">Items & Formats Gifted</th>
                    <th className="px-4 py-3">Unit COGS Applied</th>
                    <th className="px-4 py-3">Total Marketing Cost</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-scnt-border/40">
                  {expenses.filter((e) => e.category === 'MARKETING_GIVEAWAYS').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-scnt-text-muted">
                        No promotional giveaways logged yet. Click "Log Promotional Giveaway" to record campaign samples or full bottle gifts.
                      </td>
                    </tr>
                  ) : (
                    expenses
                      .filter((e) => e.category === 'MARKETING_GIVEAWAYS')
                      .map((item) => (
                        <tr key={item._id} className="hover:bg-scnt-card/30">
                          <td className="px-4 py-3 font-mono text-[11px] text-scnt-text-muted whitespace-nowrap">
                            {formatDate(item.date)}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {item.promotionDetails?.campaignName || item.title}
                            {item.promotionDetails?.recipient && (
                              <p className="text-[11px] text-scnt-text-muted">To: {item.promotionDetails.recipient}</p>
                            )}
                            {item.promotionDetails?.fragranceAllocations && item.promotionDetails.fragranceAllocations.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {item.promotionDetails.fragranceAllocations.map((a, i) => (
                                  <span key={i} className="text-[10px] rounded px-1.5 py-0.2 bg-fuchsia-500/10 text-fuchsia-900 border border-fuchsia-500/20 font-medium">
                                    {a.quantity}x {a.productName} ({a.format === '100ml' ? '100ml' : a.format === '50ml' ? '50ml' : '3ml'}) ({formatEgp(a.totalCost)})
                                  </span>
                                ))}
                                {item.promotionDetails.unassignedQuantity ? (
                                  <span className="text-[10px] rounded px-1.5 py-0.2 bg-amber-500/10 text-amber-800 border border-amber-500/20 font-medium">
                                    {item.promotionDetails.unassignedQuantity}x approx unassigned ({item.promotionDetails.unassignedFormat || 'decant'})
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px]">
                            {item.promotionDetails?.bottles100mlGiven || item.promotionDetails?.bottles50mlGiven || item.promotionDetails?.decantUnitsGiven ? (
                              <div className="flex flex-col gap-0.5">
                                {Number(item.promotionDetails.bottles100mlGiven) > 0 && (
                                  <span className="text-emerald-800 font-semibold">{item.promotionDetails.bottles100mlGiven}x 100ml Box Set</span>
                                )}
                                {Number(item.promotionDetails.bottles50mlGiven) > 0 && (
                                  <span className="text-teal-800 font-semibold">{item.promotionDetails.bottles50mlGiven}x 50ml Box Set</span>
                                )}
                                {Number(item.promotionDetails.decantUnitsGiven) > 0 && (
                                  <span className="text-fuchsia-800 font-medium">{item.promotionDetails.decantUnitsGiven}x 3ml Decants</span>
                                )}
                              </div>
                            ) : (
                              <span>{item.quantity} {item.unit || 'pcs'}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-scnt-text-muted">
                            {formatEgp(item.promotionDetails?.decantUnitCostApplied || item.unitCost)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-fuchsia-800">
                            {formatEgp(item.amount)}
                          </td>
                          <td className="px-4 py-3 text-[11px] text-scnt-text-muted">{item.notes || '—'}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* SUB-TAB 5: CATALOG MARGINS */}
      {subTab === 'catalog' && (
        <Card asMotion={false} className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-scnt-text border-collapse">
              <thead className="bg-scnt-card/80 text-[11px] font-mono uppercase text-scnt-text-muted border-b border-scnt-border/60">
                <tr>
                  <th className="px-4 py-3">Fragrance Product</th>
                  <th className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span>Fragrance Oil Price ({fragranceOilUnit === 'grams' ? 'EGP/g' : 'EGP/kg'})</span>
                      <div className="inline-flex items-center rounded border border-scnt-border/60 bg-scnt-bg p-0.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setFragranceOilUnit('grams')}
                          className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                            fragranceOilUnit === 'grams'
                              ? 'bg-scnt-text text-scnt-bg'
                              : 'text-scnt-text-muted hover:text-scnt-text'
                          }`}
                          title="View and edit prices per gram"
                        >
                          g
                        </button>
                        <button
                          type="button"
                          onClick={() => setFragranceOilUnit('kg')}
                          className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                            fragranceOilUnit === 'kg'
                              ? 'bg-scnt-text text-scnt-bg'
                              : 'text-scnt-text-muted hover:text-scnt-text'
                          }`}
                          title="View and edit prices per kilogram"
                        >
                          kg
                        </button>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3">100ml Retail</th>
                  <th className="px-4 py-3">100ml COGS</th>
                  <th className="px-4 py-3">100ml Profit</th>
                  <th className="px-4 py-3">Margin %</th>
                  <th className="px-4 py-3">Markup</th>
                  <th className="px-4 py-3">50ml Retail</th>
                  <th className="px-4 py-3">50ml COGS</th>
                  <th className="px-4 py-3">50ml Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-scnt-border/40">
                {!cogsAnalysis || cogsAnalysis.productAnalysis.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-scnt-text-muted">
                      Loading catalog margins...
                    </td>
                  </tr>
                ) : (
                  cogsAnalysis.productAnalysis.map((prod) => (
                    <tr key={prod._id} className="hover:bg-scnt-card/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-scnt-text">
                        <p>{prod.name}</p>
                        <span className="text-[10px] text-scnt-text-muted">{prod.slug}</span>
                      </td>

                      {/* Fragrance Oil Column with Inline Editor */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {editingOilProductId === prod._id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="any"
                              className="w-24 rounded border border-scnt-border bg-scnt-bg px-2 py-1 text-xs font-semibold"
                              value={editingOilValue}
                              onChange={(e) => setEditingOilValue(e.target.value)}
                              placeholder={fragranceOilUnit === 'grams' ? 'EGP/g' : 'EGP/kg'}
                              autoFocus
                            />
                            <button
                              onClick={() => void handleSaveProductOilPrice(prod._id, Number(editingOilValue), fragranceOilUnit)}
                              disabled={busy || !editingOilValue}
                              className="rounded bg-scnt-text px-2 py-1 text-[11px] font-medium text-scnt-bg hover:opacity-90 transition-opacity"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingOilProductId(null)}
                              className="rounded border border-scnt-border px-1.5 py-1 text-[11px] text-scnt-text-muted hover:text-scnt-text"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-mono font-medium">
                                {prod.oilCostPerKg > 0
                                  ? fragranceOilUnit === 'grams'
                                    ? `${formatEgp(prod.oilCostPerGram || prod.oilCostPerKg / 1000)} / g`
                                    : `${formatEgp(prod.oilCostPerKg)} / kg`
                                  : 'Not Set (0.00 EGP)'}
                              </p>
                              {prod.oilCostPerKg > 0 && (
                                <span className="text-[10px] text-scnt-text-muted block font-mono">
                                  {fragranceOilUnit === 'grams'
                                    ? `${formatEgp(prod.oilCostPerKg)} / kg`
                                    : `${formatEgp(prod.oilCostPerGram || prod.oilCostPerKg / 1000)} / g`}
                                </span>
                              )}
                              <span
                                className={`inline-block text-[10px] rounded px-1.5 py-0.2 border mt-0.5 ${
                                  prod.oilCostPerKg > 0
                                    ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-800 border-amber-500/20'
                                }`}
                              >
                                {prod.oilCostPerKg > 0 ? 'Oil Configured' : '⚠ Oil Price Needed'}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setEditingOilProductId(prod._id)
                                if (fragranceOilUnit === 'grams') {
                                  const val = prod.oilCostPerGram || (prod.oilCostPerKg > 0 ? Number((prod.oilCostPerKg / 1000).toFixed(4)) : '')
                                  setEditingOilValue(val ? String(val) : '')
                                } else {
                                  setEditingOilValue(prod.oilCostPerKg > 0 ? String(prod.oilCostPerKg) : '')
                                }
                              }}
                              className="rounded p-1 text-[11px] text-scnt-text-muted hover:text-scnt-text hover:bg-scnt-card/60"
                              title={`Set this fragrance's oil cost in ${fragranceOilUnit === 'grams' ? 'EGP/gram' : 'EGP/kg'}`}
                            >
                              ✏️
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono">{formatEgp(prod.size100ml.retailPrice)}</td>
                      <td className="px-4 py-3 font-mono text-scnt-text-muted">
                        {formatEgp(prod.size100ml.cogs)}
                        {prod.oilCostPerKg === 0 && (
                          <span className="block text-[10px] text-amber-700">(base only)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-800">
                        {formatEgp(prod.size100ml.grossProfit)}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-800 border border-emerald-500/20">
                          {prod.size100ml.marginPercent}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-scnt-text-muted">
                        {prod.size100ml.markupMultiplier}x
                      </td>
                      <td className="px-4 py-3 font-mono">{formatEgp(prod.size50ml.retailPrice)}</td>
                      <td className="px-4 py-3 font-mono text-scnt-text-muted">{formatEgp(prod.size50ml.cogs)}</td>
                      <td className="px-4 py-3 font-semibold">
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-800 border border-emerald-500/20">
                          {prod.size50ml.marginPercent}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL: ADD / EDIT EXPENSE */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-xs p-4 sm:p-6">
          <div className="relative my-auto w-full max-w-lg rounded-xl bg-scnt-bg border border-scnt-border p-6 shadow-2xl max-h-[min(90vh,calc(100vh-3rem))] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-scnt-border/40">
              <h3 className="text-base font-semibold text-scnt-text">
                {editingExpense ? 'Edit Expense Record' : 'Log New Expense / Procurement'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-xs text-scnt-text-muted hover:text-scnt-text hover:bg-scnt-card/60 transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="text-xs text-scnt-text-muted">Expense Item Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50m Bottle Sticker Roll, 10 Bags Shredded Paper"
                  className="mt-1 w-full rounded-md border border-scnt-border bg-scnt-bg px-3 py-2 text-xs text-scnt-text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-scnt-text-muted">Category</label>
                  <select
                    className="mt-1 w-full rounded-md border border-scnt-border bg-scnt-bg px-2.5 py-2 text-xs text-scnt-text"
                    value={formCategory}
                    onChange={(e) => handleCategoryChange(e.target.value as ExpenseCategory)}
                  >
                    {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-scnt-text-muted">Unit of Measure</label>
                  <select
                    className="mt-1 w-full rounded-md border border-scnt-border bg-scnt-bg px-2.5 py-2 text-xs text-scnt-text"
                    value={formUnit}
                    onChange={(e) => {
                      const nextUnit = e.target.value as ExpenseUnit
                      if (formCategory === 'OILS' && formUnitPrice) {
                        const currentVal = Number(formUnitPrice)
                        if (formUnit === 'kg' && nextUnit === 'grams' && currentVal > 0) {
                          const converted = Number((currentVal / 1000).toFixed(4))
                          setFormUnitPrice(String(converted))
                          const q = Number(formQuantity) || 1
                          setFormAmount(String(Number((converted * q).toFixed(2))))
                        } else if (formUnit === 'grams' && nextUnit === 'kg' && currentVal > 0) {
                          const converted = Number((currentVal * 1000).toFixed(2))
                          setFormUnitPrice(String(converted))
                          const q = Number(formQuantity) || 1
                          setFormAmount(String(Number((converted * q).toFixed(2))))
                        }
                      }
                      setFormUnit(nextUnit)
                    }}
                  >
                    <option value="meters">Meters (Rolls)</option>
                    <option value="sheets">Sheets</option>
                    <option value="bags">Bags (Shredded)</option>
                    <option value="pcs">Pieces</option>
                    <option value="grams">Grams (g)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="liters">Liters</option>
                    <option value="ml">Milliliters</option>
                    <option value="units">Units</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {(formCategory === 'BOTTLES' || formCategory === 'BOTTLES_50ML' || formCategory === 'BOTTLES_100ML') && (
                <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3 space-y-1.5">
                  <label className="text-xs font-semibold text-indigo-950 block">
                    Bottle Size & Rate Variant
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormCategory('BOTTLES_50ML')
                        setFormTitle('50ml Glass Perfume Bottles & Atomizers')
                        setFormUnit('pcs')
                        const p = costConfig?.bottles?.size50ml || 28
                        setFormUnitPrice(String(p))
                        const q = Number(formQuantity) || 1
                        setFormAmount(String(Number((p * q).toFixed(2))))
                      }}
                      className={`flex-1 rounded-md py-1.5 text-xs font-semibold border transition-all ${
                        formCategory === 'BOTTLES_50ML' || (formCategory === 'BOTTLES' && formTitle.toLowerCase().includes('50'))
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-indigo-300 bg-scnt-bg text-indigo-900 hover:border-indigo-500'
                      }`}
                    >
                      50ml Bottle ({formatEgp(costConfig?.bottles?.size50ml || 28)})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormCategory('BOTTLES_100ML')
                        setFormTitle('100ml Glass Perfume Bottles & Atomizers')
                        setFormUnit('pcs')
                        const p = costConfig?.bottles?.size100ml || 38
                        setFormUnitPrice(String(p))
                        const q = Number(formQuantity) || 1
                        setFormAmount(String(Number((p * q).toFixed(2))))
                      }}
                      className={`flex-1 rounded-md py-1.5 text-xs font-semibold border transition-all ${
                        formCategory === 'BOTTLES_100ML' || (formCategory === 'BOTTLES' && !formTitle.toLowerCase().includes('50'))
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-indigo-300 bg-scnt-bg text-indigo-900 hover:border-indigo-500'
                      }`}
                    >
                      100ml Bottle ({formatEgp(costConfig?.bottles?.size100ml || 38)})
                    </button>
                  </div>
                </div>
              )}

              {(formCategory === 'BOXES' || formCategory === 'BOXES_50ML' || formCategory === 'BOXES_100ML') && (
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 space-y-1.5">
                  <label className="text-xs font-semibold text-purple-950 block">
                    Outer Box Size & Rate Variant
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormCategory('BOXES_50ML')
                        setFormTitle('50ml Rigid Packaging Outer Boxes')
                        setFormUnit('pcs')
                        const p = costConfig?.boxes?.size50ml || 16
                        setFormUnitPrice(String(p))
                        const q = Number(formQuantity) || 1
                        setFormAmount(String(Number((p * q).toFixed(2))))
                      }}
                      className={`flex-1 rounded-md py-1.5 text-xs font-semibold border transition-all ${
                        formCategory === 'BOXES_50ML' || (formCategory === 'BOXES' && formTitle.toLowerCase().includes('50'))
                          ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                          : 'border-purple-300 bg-scnt-bg text-purple-900 hover:border-purple-500'
                      }`}
                    >
                      50ml Box ({formatEgp(costConfig?.boxes?.size50ml || 16)})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormCategory('BOXES_100ML')
                        setFormTitle('100ml Rigid Packaging Outer Boxes')
                        setFormUnit('pcs')
                        const p = costConfig?.boxes?.size100ml || 22
                        setFormUnitPrice(String(p))
                        const q = Number(formQuantity) || 1
                        setFormAmount(String(Number((p * q).toFixed(2))))
                      }}
                      className={`flex-1 rounded-md py-1.5 text-xs font-semibold border transition-all ${
                        formCategory === 'BOXES_100ML' || (formCategory === 'BOXES' && !formTitle.toLowerCase().includes('50'))
                          ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                          : 'border-purple-300 bg-scnt-bg text-purple-900 hover:border-purple-500'
                      }`}
                    >
                      100ml Box ({formatEgp(costConfig?.boxes?.size100ml || 22)})
                    </button>
                  </div>
                </div>
              )}

              {formCategory === 'OILS' && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5">
                  <label className="text-xs font-semibold text-amber-900 block">
                    Assign Oil to Fragrance (Each fragrance has a distinct oil price)
                  </label>
                  <select
                    className="w-full rounded-md border border-amber-500/40 bg-scnt-bg px-2.5 py-1.5 text-xs text-scnt-text"
                    value={formAssignedProduct}
                    onChange={(e) => handleAssignedProductChange(e.target.value)}
                  >
                    <option value="">— Unassigned General Oil / Bulk —</option>
                    {cogsAnalysis?.productAnalysis.map((p) => {
                      const isGrams = formUnit === 'grams'
                      const rateText = isGrams
                        ? `${formatEgp(p.oilCostPerGram || p.oilCostPerKg / 1000)}/g (${formatEgp(p.oilCostPerKg)}/kg)`
                        : `${formatEgp(p.oilCostPerKg)}/kg (${formatEgp(p.oilCostPerGram || p.oilCostPerKg / 1000)}/g)`
                      return (
                        <option key={p._id} value={p._id}>
                          {p.name} {p.oilCostPerKg > 0 ? `(Current: ${rateText})` : '(Oil price not set)'}
                        </option>
                      )
                    })}
                  </select>
                  {formAssignedProduct && (
                    <p className="text-[11px] text-amber-800">
                      Selecting a fragrance automatically loads its saved oil benchmark rate so you can record or adjust it.
                    </p>
                  )}
                </div>
              )}

              {/* Promotional Fragrance & Decants Batch Calculator */}
              {(formCategory === 'MARKETING_GIVEAWAYS' || usePromoCalculator) && (
                <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🎁</span>
                      <div>
                        <h4 className="text-xs font-semibold text-fuchsia-950">
                          Promotional Fragrance & Decant Giveaway Calculator
                        </h4>
                        <p className="text-[10px] text-fuchsia-800">
                          Supports full boxed bottles (100ml / 50ml with boxes, stickers & wrapping) and 3ml decants.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUsePromoCalculator(!usePromoCalculator)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                        usePromoCalculator
                          ? 'bg-fuchsia-600 text-white border-fuchsia-600'
                          : 'bg-scnt-bg text-scnt-text-muted border-scnt-border'
                      }`}
                    >
                      {usePromoCalculator ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  {usePromoCalculator && (
                    <>
                      {/* Campaign Format Selector */}
                      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-scnt-bg border border-scnt-border/60">
                        <span className="text-[11px] font-medium text-scnt-text-muted px-2">Format:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPromoCampaignType('BOTTLES_100ML')
                            setPromoSelectedFormat('100ml')
                            if (promoTargetTotal === 100) setPromoTargetTotal(10)
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                            promoCampaignType === 'BOTTLES_100ML'
                              ? 'bg-scnt-text text-scnt-bg font-semibold'
                              : 'text-scnt-text-muted hover:text-scnt-text'
                          }`}
                        >
                          🧴 100ml Boxed Bottles
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPromoCampaignType('BOTTLES_50ML')
                            setPromoSelectedFormat('50ml')
                            if (promoTargetTotal === 100) setPromoTargetTotal(10)
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                            promoCampaignType === 'BOTTLES_50ML'
                              ? 'bg-scnt-text text-scnt-bg font-semibold'
                              : 'text-scnt-text-muted hover:text-scnt-text'
                          }`}
                        >
                          🧴 50ml Boxed Bottles
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPromoCampaignType('DECANTS')
                            setPromoSelectedFormat('decant3ml')
                            if (promoTargetTotal === 10) setPromoTargetTotal(100)
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                            promoCampaignType === 'DECANTS'
                              ? 'bg-scnt-text text-scnt-bg font-semibold'
                              : 'text-scnt-text-muted hover:text-scnt-text'
                          }`}
                        >
                          🎁 3ml Sample Decants
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPromoCampaignType('MIXED')
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                            promoCampaignType === 'MIXED'
                              ? 'bg-scnt-text text-scnt-bg font-semibold'
                              : 'text-scnt-text-muted hover:text-scnt-text'
                          }`}
                        >
                          📦 Mixed Campaign
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-scnt-bg/80 p-3 rounded-lg border border-scnt-border/40">
                        <div>
                          <label className="text-xs font-medium text-scnt-text block">
                            Total Planned Units in Campaign:
                          </label>
                          <input
                            type="number"
                            min="1"
                            className="mt-1 w-full rounded border border-scnt-border bg-scnt-bg px-2.5 py-1.5 text-xs font-bold text-scnt-text"
                            value={promoTargetTotal}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1)
                              setPromoTargetTotal(val)
                            }}
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-scnt-text-muted block">
                            Baseline Approx Cost ({unassignedFormat}):
                          </span>
                          <p className="mt-1 text-xs font-mono font-medium text-scnt-text">
                            ~{formatEgp(activeBaselineUnitCost)} / unit
                          </p>
                          <span className="text-[10px] text-scnt-text-muted block leading-tight mt-0.5">
                            {unassignedFormat === '100ml'
                              ? '100ml Bottle + Box + 3 Stickers + Shredded Paper + Wrapping + Card + Flyer + Alcohol + Oil'
                              : unassignedFormat === '50ml'
                              ? '50ml Bottle + Box + 3 Stickers + Packaging + Card + Flyer + Alcohol + Oil'
                              : '3ml Vial + Decant Card + Alcohol + Perfume Oil'}
                          </span>
                        </div>
                      </div>

                      {/* Progress & Allocation Summary */}
                      <div className="rounded-lg border border-scnt-border/60 p-3 text-xs space-y-2 bg-scnt-bg">
                        <div className="flex items-center justify-between font-medium">
                          <span>Allocation Progress:</span>
                          <span className="font-mono">
                            {allocatedUnitsCount} / {promoTargetTotal} Items Specified
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-scnt-border/40 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 transition-all ${
                              allocatedUnitsCount === promoTargetTotal
                                ? 'bg-emerald-500'
                                : allocatedUnitsCount > promoTargetTotal
                                ? 'bg-rose-500'
                                : 'bg-fuchsia-500'
                            }`}
                            style={{
                              width: `${Math.min(100, (allocatedUnitsCount / promoTargetTotal) * 100)}%`,
                            }}
                          />
                        </div>

                        {allocatedUnitsCount < promoTargetTotal && (
                          <div className="flex items-center justify-between text-[11px] text-amber-800">
                            <span>
                              ⏳ <strong>{unassignedUnitsCount} {unassignedFormat} unassigned:</strong> priced at approx ~{formatEgp(activeBaselineUnitCost)}/ea ({formatEgp(unassignedCostSum)})
                            </span>
                          </div>
                        )}

                        {allocatedUnitsCount === promoTargetTotal && (
                          <div className="text-[11px] text-emerald-800 font-medium">
                            ✓ Exactly {promoTargetTotal} / {promoTargetTotal} items allocated with exact fragrance COGS (bottles, boxes & packaging included)!
                          </div>
                        )}

                        {allocatedUnitsCount > promoTargetTotal && (
                          <div className="text-[11px] text-rose-800 font-medium">
                            ⚠ Warning: Allocated {allocatedUnitsCount} items exceeds campaign total of {promoTargetTotal}.
                          </div>
                        )}
                      </div>

                      {/* Fragrance Allocation Rows */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-scnt-text block">
                          Specify Items per Fragrance:
                        </label>

                        {promoAllocations.length === 0 ? (
                          <div className="text-center py-2.5 px-3 text-xs text-scnt-text-muted border border-dashed rounded-lg bg-scnt-bg/40">
                            No individual perfumes specified yet. The entire campaign ({promoTargetTotal} items) is currently estimated at ~{formatEgp(promoTargetTotal * activeBaselineUnitCost)}. Choose fragrances below to calculate with their exact bottle, box, and oil recipe COGS!
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-44 overflow-y-auto">
                            {promoAllocations.map((row, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2 p-2 rounded bg-scnt-bg border border-scnt-border/60 text-xs"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-scnt-text truncate">{row.productName}</span>
                                    <span className="text-[10px] rounded px-1.5 py-0.2 bg-fuchsia-500/10 text-fuchsia-800 font-medium border border-fuchsia-500/20">
                                      {row.format === '100ml'
                                        ? '100ml Full Box Set'
                                        : row.format === '50ml'
                                        ? '50ml Full Box Set'
                                        : '3ml Decant'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-scnt-text-muted font-mono">
                                    {row.unitCost > 0
                                      ? `${formatEgp(row.unitCost)} / unit COGS (complete)`
                                      : `Base non-oil packaging`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="1"
                                    className="w-16 rounded border border-scnt-border px-1.5 py-1 text-xs font-semibold text-center"
                                    value={row.quantity}
                                    onChange={(e) => {
                                      const newQty = Math.max(1, parseInt(e.target.value) || 1)
                                      setPromoAllocations((prev) =>
                                        prev.map((r, i) => (i === idx ? { ...r, quantity: newQty } : r))
                                      )
                                    }}
                                  />
                                  <span className="text-[11px] text-scnt-text-muted">pcs</span>
                                  <span className="font-mono font-semibold text-scnt-text min-w-[70px] text-right">
                                    {formatEgp(row.quantity * row.unitCost)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setPromoAllocations((prev) => prev.filter((_, i) => i !== idx))}
                                    className="p-1 text-scnt-text-muted hover:text-rose-600 text-xs"
                                    title="Remove fragrance"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Fragrance Row Controls */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <select
                            className="flex-1 min-w-[170px] rounded border border-scnt-border bg-scnt-bg px-2.5 py-1.5 text-xs text-scnt-text"
                            value={promoSelectedFragranceId}
                            onChange={(e) => setPromoSelectedFragranceId(e.target.value)}
                          >
                            <option value="">— Select Fragrance —</option>
                            {cogsAnalysis?.productAnalysis.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name}{' '}
                                {promoSelectedFormat === '100ml'
                                  ? `(100ml: ${formatEgp(p.size100ml.cogs)})`
                                  : promoSelectedFormat === '50ml'
                                  ? `(50ml: ${formatEgp(p.size50ml.cogs)})`
                                  : `(3ml: ${formatEgp(p.decant3ml?.cogs || baseNonOilDecant)})`}
                              </option>
                            ))}
                          </select>

                          {promoCampaignType === 'MIXED' && (
                            <select
                              className="w-32 rounded border border-scnt-border bg-scnt-bg px-2 py-1.5 text-xs text-scnt-text font-medium"
                              value={promoSelectedFormat}
                              onChange={(e) =>
                                setPromoSelectedFormat(e.target.value as '100ml' | '50ml' | 'decant3ml')
                              }
                            >
                              <option value="100ml">100ml Box Set</option>
                              <option value="50ml">50ml Box Set</option>
                              <option value="decant3ml">3ml Decant</option>
                            </select>
                          )}

                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            className="w-16 rounded border border-scnt-border bg-scnt-bg px-2 py-1.5 text-xs font-semibold text-center"
                            value={promoAllocQuantity}
                            onChange={(e) => setPromoAllocQuantity(e.target.value)}
                          />

                          <Button
                            type="button"
                            variant="outline"
                            disabled={!promoSelectedFragranceId || !promoAllocQuantity}
                            onClick={() => {
                              const prod = cogsAnalysis?.productAnalysis.find(
                                (p) => p._id === promoSelectedFragranceId
                              )
                              if (!prod) return
                              const qty = Math.max(1, parseInt(promoAllocQuantity) || 1)
                              const itemCost = getFragranceFormatCogs(prod._id, promoSelectedFormat)

                              setPromoAllocations((prev) => {
                                const existingIdx = prev.findIndex(
                                  (r) => r.productId === prod._id && r.format === promoSelectedFormat
                                )
                                if (existingIdx >= 0) {
                                  return prev.map((r, i) =>
                                    i === existingIdx ? { ...r, quantity: r.quantity + qty } : r
                                  )
                                }
                                return [
                                  ...prev,
                                  {
                                    productId: prod._id,
                                    productName: prod.name,
                                    format: promoSelectedFormat,
                                    quantity: qty,
                                    unitCost: itemCost,
                                  },
                                ]
                              })

                              setPromoSelectedFragranceId('')
                              setPromoAllocQuantity(String(Math.max(1, unassignedUnitsCount - qty)))
                            }}
                            className="!px-3 !py-1.5 text-xs"
                          >
                            + Add to Campaign
                          </Button>

                          {unassignedUnitsCount > 0 && promoSelectedFragranceId && (
                            <button
                              type="button"
                              onClick={() => {
                                setPromoAllocQuantity(String(unassignedUnitsCount))
                              }}
                              className="text-[11px] text-fuchsia-700 hover:underline"
                            >
                              Fill remaining ({unassignedUnitsCount})
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Live Total Cost Breakdown */}
                      <div className="rounded-lg bg-fuchsia-500/10 p-3 border border-fuchsia-500/20 text-xs space-y-1">
                        <div className="flex justify-between text-scnt-text">
                          <span>Allocated Items Cost ({allocatedUnitsCount} items):</span>
                          <span className="font-mono font-medium">{formatEgp(allocatedCostSum)}</span>
                        </div>
                        {unassignedUnitsCount > 0 && (
                          <div className="flex justify-between text-amber-800">
                            <span>
                              Unassigned Remaining ({unassignedUnitsCount} {unassignedFormat} @ ~{formatEgp(activeBaselineUnitCost)}):
                            </span>
                            <span className="font-mono font-medium">{formatEgp(unassignedCostSum)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 font-bold text-sm text-fuchsia-950 border-t border-fuchsia-500/30">
                          <span>Total Promotional Campaign Cost:</span>
                          <span className="font-mono">{formatEgp(computedPromoTotalAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-scnt-text-muted pt-0.5">
                          <span>
                            Contains: {count100ml > 0 ? `${count100ml}x 100ml ` : ''}
                            {count50ml > 0 ? `${count50ml}x 50ml ` : ''}
                            {countDecants > 0 ? `${countDecants}x 3ml Decants` : ''}
                          </span>
                          <span>Blended Unit Cost: {formatEgp(computedPromoBlendedUnitCost)} / unit</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Saved Benchmark Rate Indicator & Pricing Row */}
              {(() => {
                const currentSavedPrice = getSavedPriceForItem(formCategory, formAssignedProduct, formTitle)
                const numericUnit = Number(formUnitPrice)
                const isPriceModified =
                  Boolean(currentSavedPrice && formUnitPrice !== '' && !isNaN(numericUnit) && Math.abs(numericUnit - currentSavedPrice.price) > 0.0001)

                return (
                  <div className="space-y-3">
                    {/* Active Saved Price Banner */}
                    {currentSavedPrice && (
                      <div
                        className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                          isPriceModified
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-900'
                            : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{isPriceModified ? '⚡' : '✓'}</span>
                          <div>
                            <div className="font-medium">
                              {isPriceModified ? 'Price Adjusted from Saved Rate' : 'Loaded Active Saved Price'}:
                              <span className="font-mono font-bold ml-1.5">{formatEgp(currentSavedPrice.price)}</span> / {currentSavedPrice.unit}
                            </div>
                            <p className="text-[10px] text-scnt-text-muted">
                              {currentSavedPrice.label} · {isPriceModified ? 'You can edit the price below if it changed.' : 'Pre-filled automatically from system records.'}
                            </p>
                          </div>
                        </div>

                        {isPriceModified && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormUnitPrice(String(currentSavedPrice.price))
                              const q = Number(formQuantity) || 1
                              setFormAmount(String(Number((currentSavedPrice.price * q).toFixed(2))))
                            }}
                            className="px-2 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-900 text-[11px] font-medium transition-colors"
                          >
                            ↺ Revert to Saved ({formatEgp(currentSavedPrice.price)})
                          </button>
                        )}
                      </div>
                    )}

                    {/* Synchronized 3-field Pricing Grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="text-xs text-scnt-text-muted flex items-center justify-between">
                          <span>Unit Price (EGP / {formUnit})</span>
                          {currentSavedPrice && (
                            <span className="text-[10px] text-emerald-700 font-mono">
                              Saved: {formatEgp(currentSavedPrice.price)}
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder={currentSavedPrice ? String(currentSavedPrice.price) : '0.00'}
                          className={`mt-1 w-full rounded-md border bg-scnt-bg px-3 py-2 text-xs font-semibold text-scnt-text ${
                            isPriceModified ? 'border-amber-500 font-bold' : 'border-scnt-border'
                          }`}
                          value={formUnitPrice}
                          onChange={(e) => {
                            const val = e.target.value
                            setFormUnitPrice(val)
                            const q = Number(formQuantity) || 1
                            if (val !== '' && !isNaN(Number(val))) {
                              setFormAmount(String(Number((Number(val) * q).toFixed(2))))
                              if (currentSavedPrice && Math.abs(Number(val) - currentSavedPrice.price) > 0.0001) {
                                setFormSyncBenchmark(true)
                              }
                            }
                          }}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-scnt-text-muted">Quantity Purchased ({formUnit})</label>
                        <input
                          type="number"
                          step="any"
                          required
                          min="0.0001"
                          placeholder="1"
                          className="mt-1 w-full rounded-md border border-scnt-border bg-scnt-bg px-3 py-2 text-xs font-semibold text-scnt-text"
                          value={formQuantity}
                          onChange={(e) => {
                            const qVal = e.target.value
                            setFormQuantity(qVal)
                            const q = Number(qVal) || 0
                            if (formUnitPrice !== '' && !isNaN(Number(formUnitPrice))) {
                              setFormAmount(String(Number((Number(formUnitPrice) * q).toFixed(2))))
                            }
                          }}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-scnt-text-muted">Total Paid Amount (EGP)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="0.00"
                          className="mt-1 w-full rounded-md border border-scnt-border bg-scnt-bg px-3 py-2 text-xs font-bold text-scnt-text"
                          value={formAmount}
                          onChange={(e) => {
                            const amtVal = e.target.value
                            setFormAmount(amtVal)
                            const q = Number(formQuantity) || 1
                            if (amtVal !== '' && !isNaN(Number(amtVal)) && q > 0) {
                              const calculatedUnit = Number((Number(amtVal) / q).toFixed(4))
                              setFormUnitPrice(String(calculatedUnit))
                              if (currentSavedPrice && Math.abs(calculatedUnit - currentSavedPrice.price) > 0.0001) {
                                setFormSyncBenchmark(true)
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    {isPriceModified && currentSavedPrice && (
                      <div className="rounded bg-amber-500/10 border border-amber-500/30 p-2 text-[11px] text-amber-800 flex items-center justify-between">
                        <span>
                          💡 Price adjusted from saved benchmark (was {formatEgp(currentSavedPrice.price)} → now {formatEgp(numericUnit)} / {formUnit}).
                        </span>
                        <span className="font-semibold text-amber-900">
                          {formSyncBenchmark ? '✓ Sync benchmark enabled' : 'Check sync below to save'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-scnt-text-muted">Supplier / Vendor</label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Ahram Printing"
                    className="mt-1 w-full rounded-md border border-scnt-border bg-scnt-bg px-3 py-2 text-xs text-scnt-text"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs text-scnt-text-muted">Invoice / Receipt #</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    className="mt-1 w-full rounded-md border border-scnt-border bg-scnt-bg px-3 py-2 text-xs text-scnt-text"
                    value={formInvoice}
                    onChange={(e) => setFormInvoice(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-scnt-text-muted">Date of Purchase</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-scnt-border bg-scnt-bg px-3 py-2 text-xs text-scnt-text"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-scnt-text-muted">Notes / Details</label>
                <textarea
                  rows={2}
                  placeholder="Additional specifications or quality notes..."
                  className="mt-1 w-full rounded-md border border-scnt-border bg-scnt-bg px-3 py-2 text-xs text-scnt-text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="syncBenchmark"
                  checked={formSyncBenchmark}
                  onChange={(e) => setFormSyncBenchmark(e.target.checked)}
                  className="rounded border-scnt-border"
                />
                <label htmlFor="syncBenchmark" className="text-xs text-scnt-text cursor-pointer">
                  {formCategory === 'OILS' && formAssignedProduct
                    ? 'Update selected fragrance official oil benchmark rate with this purchase cost'
                    : 'Update active benchmark price with this purchase cost'}
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} disabled={busy}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? 'Saving...' : editingExpense ? 'Update Expense' : 'Record Expense'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROMOTIONAL & GIVEAWAY EXPENSE */}
      {showGiveawayModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-xs p-4 sm:p-6">
          <div className="relative my-auto w-full max-w-lg rounded-xl bg-scnt-bg border border-scnt-border p-6 shadow-2xl max-h-[min(90vh,calc(100vh-3rem))] overflow-y-auto">
            <div className="flex items-start justify-between pb-2 mb-2 border-b border-scnt-border/40">
              <div>
                <h3 className="text-base font-semibold text-scnt-text mb-0.5">🎁 Log Promotional Giveaway</h3>
                <p className="text-[11px] text-scnt-text-muted">
                  Record promotional gifts for full boxed bottles (100ml / 50ml) or 3ml decants with custom cards.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGiveawayModal(false)}
                className="rounded-lg p-1 text-xs text-scnt-text-muted hover:text-scnt-text hover:bg-scnt-card/60 transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogGiveaway} className="space-y-3">
              <div className="flex items-center justify-between border-b border-scnt-border/40 pb-2">
                <span className="text-xs font-medium text-scnt-text">Campaign Structure:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setUsePromoCalculator(false)
                      setPromoAllocations([])
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                      !usePromoCalculator
                        ? 'bg-scnt-text text-scnt-bg border-scnt-text'
                        : 'bg-scnt-bg text-scnt-text-muted border-scnt-border'
                    }`}
                  >
                    Single Fragrance
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsePromoCalculator(true)
                      setPromoTargetTotal(Number(giveawayCount) || 10)
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                      usePromoCalculator
                        ? 'bg-fuchsia-600 text-white border-fuchsia-600'
                        : 'bg-scnt-bg text-scnt-text-muted border-scnt-border'
                    }`}
                  >
                    Multi-Fragrance Campaign
                  </button>
                </div>
              </div>

              {!usePromoCalculator ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-scnt-text-muted">Item Presentation</label>
                      <select
                        className="mt-1 w-full rounded-md border border-scnt-border bg-scnt-bg px-2.5 py-2 text-xs text-scnt-text"
                        value={promoSelectedFormat}
                        onChange={(e) =>
                          setPromoSelectedFormat(e.target.value as '100ml' | '50ml' | 'decant3ml')
                        }
                      >
                        <option value="100ml">100ml Boxed Bottle (Full Set)</option>
                        <option value="50ml">50ml Boxed Bottle (Full Set)</option>
                        <option value="decant3ml">3ml Decant with Custom Card</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-scnt-text-muted">Units Given Away</label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="mt-1 w-full rounded-md border border-scnt-border bg-scnt-bg px-3 py-2 text-xs text-scnt-text font-semibold"
                        value={giveawayCount}
                        onChange={(e) => setGiveawayCount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-scnt-text-muted">Fragrance Recipe (Optional)</label>
                    <select
                      className="mt-1 w-full rounded-md border border-scnt-border bg-scnt-bg px-2.5 py-2 text-xs text-scnt-text"
                      value={giveawayFragranceId}
                      onChange={(e) => setGiveawayFragranceId(e.target.value)}
                    >
                      <option value="">— Generic / Base Packaging Only —</option>
                      {cogsAnalysis?.productAnalysis.map((p) => {
                        const unitCost =
                          promoSelectedFormat === '100ml'
                            ? p.size100ml.cogs
                            : promoSelectedFormat === '50ml'
                            ? p.size50ml.cogs
                            : p.decant3ml?.cogs || baseNonOilDecant
                        return (
                          <option key={p._id} value={p._id}>
                            {p.name} ({formatEgp(unitCost)} unit COGS)
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  {cogsData && (() => {
                    const matchedProd =
                      giveawayFragranceId && cogsAnalysis
                        ? cogsAnalysis.productAnalysis.find((p) => p._id === giveawayFragranceId)
                        : null
                    const unitCost = giveawayFragranceId
                      ? getFragranceFormatCogs(giveawayFragranceId, promoSelectedFormat)
                      : promoSelectedFormat === '100ml'
                      ? baseNonOil100ml
                      : promoSelectedFormat === '50ml'
                      ? baseNonOil50ml
                      : baseNonOilDecant
                    const totalPromotionalCost = Number(
                      (unitCost * (Number(giveawayCount) || 1)).toFixed(2)
                    )

                    return (
                      <div className="rounded-lg bg-fuchsia-500/10 p-3 text-xs text-fuchsia-900 border border-fuchsia-500/20">
                        <div className="flex justify-between">
                          <span>
                            Unit COGS (
                            {promoSelectedFormat === '100ml'
                              ? '100ml Full Box Set'
                              : promoSelectedFormat === '50ml'
                              ? '50ml Full Box Set'
                              : '3ml Decant with Card'}
                            ) {matchedProd ? `(${matchedProd.name})` : '(Base Materials)'}:
                          </span>
                          <span className="font-mono font-semibold">{formatEgp(unitCost)}</span>
                        </div>
                        <div className="flex justify-between pt-1 font-semibold text-sm">
                          <span>Total Marketing Expense to Log:</span>
                          <span className="font-mono">{formatEgp(totalPromotionalCost)}</span>
                        </div>
                        <p className="text-[10px] text-scnt-text-muted mt-1">
                          Calculated from actual bottle/vial, box, meter stickers, sheet seal, wrap, paper and alcohol benchmarks.
                        </p>
                      </div>
                    )
                  })()}
                </>
              ) : (
                <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-3.5 space-y-3">
                  {/* Campaign Format Selector */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-scnt-bg border border-scnt-border/60">
                    <span className="text-[11px] font-medium text-scnt-text-muted px-2">Format:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPromoCampaignType('BOTTLES_100ML')
                        setPromoSelectedFormat('100ml')
                        if (promoTargetTotal === 100) setPromoTargetTotal(10)
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        promoCampaignType === 'BOTTLES_100ML'
                          ? 'bg-scnt-text text-scnt-bg font-semibold'
                          : 'text-scnt-text-muted hover:text-scnt-text'
                      }`}
                    >
                      🧴 100ml Boxed Bottles
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPromoCampaignType('BOTTLES_50ML')
                        setPromoSelectedFormat('50ml')
                        if (promoTargetTotal === 100) setPromoTargetTotal(10)
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        promoCampaignType === 'BOTTLES_50ML'
                          ? 'bg-scnt-text text-scnt-bg font-semibold'
                          : 'text-scnt-text-muted hover:text-scnt-text'
                      }`}
                    >
                      🧴 50ml Boxed Bottles
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPromoCampaignType('DECANTS')
                        setPromoSelectedFormat('decant3ml')
                        if (promoTargetTotal === 10) setPromoTargetTotal(100)
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        promoCampaignType === 'DECANTS'
                          ? 'bg-scnt-text text-scnt-bg font-semibold'
                          : 'text-scnt-text-muted hover:text-scnt-text'
                      }`}
                    >
                      🎁 3ml Sample Decants
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPromoCampaignType('MIXED')
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        promoCampaignType === 'MIXED'
                          ? 'bg-fuchsia-600 text-white font-semibold'
                          : 'text-scnt-text-muted hover:text-scnt-text'
                      }`}
                    >
                      ✨ Mixed Campaign
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-scnt-bg p-2.5 rounded-lg border border-scnt-border/40">
                    <div>
                      <label className="text-xs font-medium text-scnt-text block">
                        Total Items in Campaign:
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="mt-1 w-full rounded border border-scnt-border bg-scnt-bg px-2.5 py-1 text-xs font-bold text-scnt-text"
                        value={promoTargetTotal}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1)
                          setPromoTargetTotal(val)
                          setGiveawayCount(String(val))
                        }}
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-scnt-text-muted block">Approx Starting Baseline:</span>
                      <p className="mt-1 text-xs font-mono font-medium text-scnt-text">
                        ~{formatEgp(activeBaselineUnitCost)} / item
                      </p>
                      <span className="text-[10px] text-scnt-text-muted">
                        (Bottle/box/stickers/wrap + avg oil)
                      </span>
                    </div>
                  </div>

                  {/* Progress & Allocation Summary */}
                  <div className="rounded-lg border border-scnt-border/60 p-2.5 text-xs space-y-1.5 bg-scnt-bg">
                    <div className="flex items-center justify-between font-medium">
                      <span>Allocation Progress:</span>
                      <span className="font-mono">
                        {allocatedUnitsCount} / {promoTargetTotal} Specified
                      </span>
                    </div>
                    <div className="w-full bg-scnt-border/40 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 transition-all ${
                          allocatedUnitsCount === promoTargetTotal
                            ? 'bg-emerald-500'
                            : allocatedUnitsCount > promoTargetTotal
                            ? 'bg-rose-500'
                            : 'bg-fuchsia-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (allocatedUnitsCount / promoTargetTotal) * 100)}%`,
                        }}
                      />
                    </div>

                    {allocatedUnitsCount < promoTargetTotal && (
                      <div className="text-[11px] text-amber-800">
                        ⏳ <strong>{unassignedUnitsCount} {unassignedFormat} unassigned:</strong> priced at approx ~{formatEgp(activeBaselineUnitCost)}/ea ({formatEgp(unassignedCostSum)})
                      </div>
                    )}

                    {allocatedUnitsCount === promoTargetTotal && (
                      <div className="text-[11px] text-emerald-800 font-medium">
                        ✓ Exactly {promoTargetTotal} / {promoTargetTotal} items allocated with exact fragrance COGS!
                      </div>
                    )}

                    {allocatedUnitsCount > promoTargetTotal && (
                      <div className="text-[11px] text-rose-800 font-medium">
                        ⚠ Warning: Allocated {allocatedUnitsCount} items exceeds campaign total of {promoTargetTotal}.
                      </div>
                    )}
                  </div>

                  {/* Fragrance Allocation Rows */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-scnt-text block">
                      Specify Items per Fragrance:
                    </label>

                    {promoAllocations.length === 0 ? (
                      <div className="text-center py-2 px-3 text-xs text-scnt-text-muted border border-dashed rounded-lg bg-scnt-bg/40">
                        No individual perfumes specified yet. The entire campaign ({promoTargetTotal} items) is currently estimated at ~{formatEgp(promoTargetTotal * activeBaselineUnitCost)}. Choose fragrances below!
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {promoAllocations.map((row, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 p-1.5 rounded bg-scnt-bg border border-scnt-border/60 text-xs"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-scnt-text truncate block">{row.productName}</span>
                              <span className="text-[10px] text-scnt-text-muted">
                                {row.format === '100ml'
                                  ? '100ml Full Box Set'
                                  : row.format === '50ml'
                                  ? '50ml Full Box Set'
                                  : '3ml Decant'} · {formatEgp(row.unitCost)} / unit
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                className="w-14 rounded border border-scnt-border px-1 py-0.5 text-xs font-semibold text-center"
                                value={row.quantity}
                                onChange={(e) => {
                                  const newQty = Math.max(1, parseInt(e.target.value) || 1)
                                  setPromoAllocations((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, quantity: newQty } : r))
                                  )
                                }}
                              />
                              <span className="font-mono font-medium text-scnt-text min-w-[60px] text-right">
                                {formatEgp(row.quantity * row.unitCost)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setPromoAllocations((prev) => prev.filter((_, i) => i !== idx))}
                                className="text-scnt-text-muted hover:text-rose-600 text-xs p-0.5"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <select
                        className="flex-1 min-w-[150px] rounded border border-scnt-border bg-scnt-bg px-2 py-1 text-xs text-scnt-text"
                        value={promoSelectedFragranceId}
                        onChange={(e) => setPromoSelectedFragranceId(e.target.value)}
                      >
                        <option value="">— Select Perfume —</option>
                        {cogsAnalysis?.productAnalysis.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}{' '}
                            {promoSelectedFormat === '100ml'
                              ? `(100ml: ${formatEgp(p.size100ml.cogs)})`
                              : promoSelectedFormat === '50ml'
                              ? `(50ml: ${formatEgp(p.size50ml.cogs)})`
                              : `(3ml: ${formatEgp(p.decant3ml?.cogs || baseNonOilDecant)})`}
                          </option>
                        ))}
                      </select>

                      {promoCampaignType === 'MIXED' && (
                        <select
                          className="w-28 rounded border border-scnt-border bg-scnt-bg px-1.5 py-1 text-xs text-scnt-text font-medium"
                          value={promoSelectedFormat}
                          onChange={(e) =>
                            setPromoSelectedFormat(e.target.value as '100ml' | '50ml' | 'decant3ml')
                          }
                        >
                          <option value="100ml">100ml Set</option>
                          <option value="50ml">50ml Set</option>
                          <option value="decant3ml">3ml Decant</option>
                        </select>
                      )}

                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        className="w-14 rounded border border-scnt-border bg-scnt-bg px-1.5 py-1 text-xs font-semibold text-center"
                        value={promoAllocQuantity}
                        onChange={(e) => setPromoAllocQuantity(e.target.value)}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        disabled={!promoSelectedFragranceId || !promoAllocQuantity}
                        onClick={() => {
                          const prod = cogsAnalysis?.productAnalysis.find((p) => p._id === promoSelectedFragranceId)
                          if (!prod) return
                          const qty = Math.max(1, parseInt(promoAllocQuantity) || 1)
                          const itemCost = getFragranceFormatCogs(prod._id, promoSelectedFormat)

                          setPromoAllocations((prev) => {
                            const existingIdx = prev.findIndex(
                              (r) => r.productId === prod._id && r.format === promoSelectedFormat
                            )
                            if (existingIdx >= 0) {
                              return prev.map((r, i) =>
                                i === existingIdx ? { ...r, quantity: r.quantity + qty } : r
                              )
                            }
                            return [
                              ...prev,
                              {
                                productId: prod._id,
                                productName: prod.name,
                                format: promoSelectedFormat,
                                quantity: qty,
                                unitCost: itemCost,
                              },
                            ]
                          })

                          setPromoSelectedFragranceId('')
                          setPromoAllocQuantity(String(Math.max(1, unassignedUnitsCount - qty)))
                        }}
                        className="!px-2.5 !py-1 text-xs"
                      >
                        + Add
                      </Button>
                    </div>
                  </div>

                  {/* Live Total Cost Breakdown */}
                  <div className="rounded-lg bg-fuchsia-500/10 p-2.5 border border-fuchsia-500/20 text-xs space-y-1">
                    <div className="flex justify-between text-scnt-text">
                      <span>Allocated ({allocatedUnitsCount} items):</span>
                      <span className="font-mono font-medium">{formatEgp(allocatedCostSum)}</span>
                    </div>
                    {unassignedUnitsCount > 0 && (
                      <div className="flex justify-between text-amber-800">
                        <span>
                          Remaining ({unassignedUnitsCount} {unassignedFormat} @ ~{formatEgp(activeBaselineUnitCost)}):
                        </span>
                        <span className="font-mono font-medium">{formatEgp(unassignedCostSum)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 font-bold text-sm text-fuchsia-950 border-t border-fuchsia-500/30">
                      <span>Total Campaign Cost:</span>
                      <span className="font-mono">{formatEgp(computedPromoTotalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-scnt-text-muted">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Influencer Seeding, Order Gift, Pop-up Event"
                  className="mt-1 w-full rounded-md border border-scnt-border bg-scnt-bg px-3 py-2 text-xs text-scnt-text"
                  value={giveawayCampaign}
                  onChange={(e) => setGiveawayCampaign(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-scnt-text-muted">Recipient / Event (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Fashion Week VIPs or Customer loyalty"
                  className="mt-1 w-full rounded-md border border-scnt-border bg-scnt-bg px-3 py-2 text-xs text-scnt-text"
                  value={giveawayRecipient}
                  onChange={(e) => setGiveawayRecipient(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-scnt-text-muted">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Details regarding the promotion..."
                  className="mt-1 w-full rounded-md border border-scnt-border bg-scnt-bg px-3 py-2 text-xs text-scnt-text"
                  value={giveawayNotes}
                  onChange={(e) => setGiveawayNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowGiveawayModal(false)} disabled={busy}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? 'Logging...' : 'Confirm Giveaway Log'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
