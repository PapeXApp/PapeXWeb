export interface PosValuePropInputs {
  merchantCount: number
  transactionsPerMerchantPerMonth: number
  uniqueCustomersPerMerchantPerMonth: number
  averageOrderValue: number
  printedReceiptRatePct: number
  emailedReceiptRatePct: number
  textedReceiptRatePct: number
  noReceiptRatePct: number
  costPerPrintedReceipt: number
  costPerThousandEmails: number
  costPerThousandTexts: number
  identifiedTransactionRateWithoutPapeXPct: number
  identifiedTransactionRateWithPapeXPct: number
  repeatRatePct: number
  monthlyIncrementalMerchantRevenueWithoutPapeX: number
  papeXRevenueLiftPct: number
  posRevenueSharePct: number
}

export type PosValuePropUnit = "count" | "currency" | "percentage"

export interface PosValuePropFieldDefinition {
  key: keyof PosValuePropInputs
  label: string
  description: string
  unit: PosValuePropUnit
  min?: number
  max?: number
  step?: number
}

export interface PosValuePropFieldSection {
  id: string
  title: string
  description: string
  fields: PosValuePropFieldDefinition[]
}

export interface PosValuePropSource {
  label: string
  url: string
  note: string
}

export interface PosValuePropOutputs {
  grossMargin: {
    totalTransactionsPerMonth: number
    printedReceiptsPerMonth: number
    emailedReceiptsPerMonth: number
    textedReceiptsPerMonth: number
    noReceiptTransactionsPerMonth: number
    monthlyPaperReceiptCost: number
    monthlyEmailReceiptCost: number
    monthlySmsReceiptCost: number
    monthlyPosReceiptInfrastructureCost: number
    yearlyPosReceiptInfrastructureCost: number
    yearlyPaperReceiptCost: number
    yearlyCombinedReceiptCostOffsetPotential: number
  }
  analytics: {
    identifiableCustomersWithoutPapeXPerMerchant: number
    identifiableCustomersWithPapeXPerMerchant: number
    additionalIdentifiableCustomersPerMerchant: number
    repeatCustomersWithoutPapeXPerMerchant: number
    repeatCustomersWithPapeXPerMerchant: number
    estimatedRepeatSpendWithoutPapeXPerMerchant: number
    estimatedRepeatSpendWithPapeXPerMerchant: number
    monthlyIncrementalMerchantRevenueWithoutPapeX: number
    monthlyIncrementalMerchantRevenueWithPapeX: number
    yearlyIncrementalMerchantRevenueWithoutPapeX: number
    yearlyIncrementalMerchantRevenueWithPapeX: number
    totalAddedMerchantRevenueWithoutPapeX: number
    totalAddedMerchantRevenueWithPapeX: number
    totalAddedPosRevenueWithoutPapeX: number
    totalAddedPosRevenueWithPapeX: number
    additionalAnnualPosRevenueWithPapeX: number
  }
  diagnostics: {
    receiptRateTotalPct: number
    receiptRatesWereNormalized: boolean
  }
}

export const posValuePropDefaults: PosValuePropInputs = {
  merchantCount: 20000,
  transactionsPerMerchantPerMonth: 3000,
  uniqueCustomersPerMerchantPerMonth: 2000,
  averageOrderValue: 25,
  printedReceiptRatePct: 45,
  emailedReceiptRatePct: 35,
  textedReceiptRatePct: 10,
  noReceiptRatePct: 10,
  costPerPrintedReceipt: 0.03,
  costPerThousandEmails: 0.1,
  costPerThousandTexts: 10,
  identifiedTransactionRateWithoutPapeXPct: 45,
  identifiedTransactionRateWithPapeXPct: 63,
  repeatRatePct: 40,
  monthlyIncrementalMerchantRevenueWithoutPapeX: 20000,
  papeXRevenueLiftPct: 12.5,
  posRevenueSharePct: 0.4,
}

export const posValuePropFieldSections: PosValuePropFieldSection[] = [
  {
    id: "scale",
    title: "Business scale assumptions",
    description: "Baseline operating profile for the POS partner network.",
    fields: [
      {
        key: "merchantCount",
        label: "POS merchants",
        description: "Merchants active on the POS platform.",
        unit: "count",
        min: 0,
        step: 100,
      },
      {
        key: "transactionsPerMerchantPerMonth",
        label: "Transactions per merchant / month",
        description: "Average monthly transactions handled by each merchant.",
        unit: "count",
        min: 0,
        step: 10,
      },
      {
        key: "uniqueCustomersPerMerchantPerMonth",
        label: "Unique customers per merchant / month",
        description: "Estimated unique payers each merchant serves every month.",
        unit: "count",
        min: 0,
        step: 10,
      },
      {
        key: "averageOrderValue",
        label: "Average order value",
        description: "Used for customer-value context in the analytics view.",
        unit: "currency",
        min: 0,
        step: 1,
      },
    ],
  },
  {
    id: "receipt-mix",
    title: "Receipt mix and infrastructure costs",
    description: "How receipts are currently delivered and what that delivery costs.",
    fields: [
      {
        key: "printedReceiptRatePct",
        label: "Printed receipts",
        description: "Share of transactions that generate a printed receipt.",
        unit: "percentage",
        min: 0,
        max: 100,
        step: 1,
      },
      {
        key: "emailedReceiptRatePct",
        label: "Emailed receipts",
        description: "Share of transactions that generate an emailed receipt.",
        unit: "percentage",
        min: 0,
        max: 100,
        step: 1,
      },
      {
        key: "textedReceiptRatePct",
        label: "Texted receipts",
        description: "Share of transactions that generate an SMS receipt.",
        unit: "percentage",
        min: 0,
        max: 100,
        step: 1,
      },
      {
        key: "noReceiptRatePct",
        label: "No receipt",
        description: "Share of transactions where no receipt is created.",
        unit: "percentage",
        min: 0,
        max: 100,
        step: 1,
      },
      {
        key: "costPerPrintedReceipt",
        label: "Cost per printed receipt",
        description: "Paper + hardware overhead estimate per printed receipt.",
        unit: "currency",
        min: 0,
        step: 0.001,
      },
      {
        key: "costPerThousandEmails",
        label: "Cost per 1,000 emails",
        description: "Email provider delivery cost estimate.",
        unit: "currency",
        min: 0,
        step: 0.01,
      },
      {
        key: "costPerThousandTexts",
        label: "Cost per 1,000 texts",
        description: "SMS provider delivery cost estimate.",
        unit: "currency",
        min: 0,
        step: 0.01,
      },
    ],
  },
  {
    id: "revenue-analytics",
    title: "Revenue and analytics assumptions",
    description: "Input levers for identity coverage and partner revenue upside.",
    fields: [
      {
        key: "identifiedTransactionRateWithoutPapeXPct",
        label: "Identified transaction rate (without PapeX)",
        description: "Percent of transactions tied to an identifiable customer profile.",
        unit: "percentage",
        min: 0,
        max: 100,
        step: 1,
      },
      {
        key: "identifiedTransactionRateWithPapeXPct",
        label: "Identified transaction rate (with PapeX)",
        description: "Expected identifiable coverage after PapeX rollout.",
        unit: "percentage",
        min: 0,
        max: 100,
        step: 1,
      },
      {
        key: "repeatRatePct",
        label: "Repeat rate",
        description: "Share of identifiable customers who return in period.",
        unit: "percentage",
        min: 0,
        max: 100,
        step: 1,
      },
      {
        key: "monthlyIncrementalMerchantRevenueWithoutPapeX",
        label: "Monthly incremental merchant revenue (without PapeX)",
        description: "Current monthly merchant-side incremental revenue baseline.",
        unit: "currency",
        min: 0,
        step: 100,
      },
      {
        key: "papeXRevenueLiftPct",
        label: "PapeX revenue lift",
        description: "Expected percentage lift in incremental merchant revenue with PapeX.",
        unit: "percentage",
        min: 0,
        step: 0.1,
      },
      {
        key: "posRevenueSharePct",
        label: "POS revenue share",
        description: "Portion of added merchant revenue captured by the POS platform.",
        unit: "percentage",
        min: 0,
        step: 0.1,
      },
    ],
  },
]

export const posValuePropSources: PosValuePropSource[] = [
  {
    label: "SMS pricing (United States)",
    url: "https://www.twilio.com/en-us/sms/pricing/us",
    note: "Reference for cost per 1,000 texts sent.",
  },
  {
    label: "Paper receipt survey",
    url: "https://greenamerica.org/paper-receipt-survey?utm_source=chatgpt.com",
    note: "Green America survey on paper receipts and customer preferences.",
  },
  {
    label: "Email marketing pricing comparison",
    url: "https://research.aimultiple.com/email-marketing-pricing/",
    note: "Reference for email delivery and marketing cost assumptions.",
  },
]

const YEARLY_MULTIPLIER = 12
const THOUSAND = 1000

const toRatio = (percent: number) => Math.max(percent, 0) / 100

const clampToZero = (value: number) => (Number.isFinite(value) ? Math.max(value, 0) : 0)

export function calculatePosValuePropModel(inputs: PosValuePropInputs): PosValuePropOutputs {
  const merchants = clampToZero(inputs.merchantCount)
  const transactionsPerMerchantPerMonth = clampToZero(inputs.transactionsPerMerchantPerMonth)
  const uniqueCustomersPerMerchantPerMonth = clampToZero(inputs.uniqueCustomersPerMerchantPerMonth)
  const averageOrderValue = clampToZero(inputs.averageOrderValue)

  const printedRate = toRatio(inputs.printedReceiptRatePct)
  const emailedRate = toRatio(inputs.emailedReceiptRatePct)
  const textedRate = toRatio(inputs.textedReceiptRatePct)
  const noReceiptRate = toRatio(inputs.noReceiptRatePct)

  const receiptRateTotal = printedRate + emailedRate + textedRate + noReceiptRate
  const shouldNormalizeRates = receiptRateTotal > 0 && Math.abs(receiptRateTotal - 1) > 0.0001
  const divisor = receiptRateTotal > 0 ? receiptRateTotal : 1

  const totalTransactionsPerMonth = merchants * transactionsPerMerchantPerMonth
  const printedReceiptsPerMonth = totalTransactionsPerMonth * (printedRate / divisor)
  const emailedReceiptsPerMonth = totalTransactionsPerMonth * (emailedRate / divisor)
  const textedReceiptsPerMonth = totalTransactionsPerMonth * (textedRate / divisor)
  const noReceiptTransactionsPerMonth = totalTransactionsPerMonth * (noReceiptRate / divisor)

  const monthlyPaperReceiptCost = printedReceiptsPerMonth * clampToZero(inputs.costPerPrintedReceipt)
  const monthlyEmailReceiptCost =
    (emailedReceiptsPerMonth / THOUSAND) * clampToZero(inputs.costPerThousandEmails)
  const monthlySmsReceiptCost =
    (textedReceiptsPerMonth / THOUSAND) * clampToZero(inputs.costPerThousandTexts)
  const monthlyPosReceiptInfrastructureCost = monthlyEmailReceiptCost + monthlySmsReceiptCost
  const yearlyPosReceiptInfrastructureCost = monthlyPosReceiptInfrastructureCost * YEARLY_MULTIPLIER
  const yearlyPaperReceiptCost = monthlyPaperReceiptCost * YEARLY_MULTIPLIER

  const identifiedWithoutRatio = toRatio(inputs.identifiedTransactionRateWithoutPapeXPct)
  const identifiedWithRatio = toRatio(inputs.identifiedTransactionRateWithPapeXPct)
  const repeatRatio = toRatio(inputs.repeatRatePct)
  const monthlyIncrementalMerchantRevenueWithoutPapeX = clampToZero(
    inputs.monthlyIncrementalMerchantRevenueWithoutPapeX
  )
  const papeXRevenueLiftRatio = toRatio(inputs.papeXRevenueLiftPct)
  const posRevenueShareRatio = toRatio(inputs.posRevenueSharePct)

  const identifiableCustomersWithoutPapeXPerMerchant =
    uniqueCustomersPerMerchantPerMonth * identifiedWithoutRatio
  const identifiableCustomersWithPapeXPerMerchant =
    uniqueCustomersPerMerchantPerMonth * identifiedWithRatio
  const additionalIdentifiableCustomersPerMerchant =
    identifiableCustomersWithPapeXPerMerchant - identifiableCustomersWithoutPapeXPerMerchant

  const repeatCustomersWithoutPapeXPerMerchant =
    identifiableCustomersWithoutPapeXPerMerchant * repeatRatio
  const repeatCustomersWithPapeXPerMerchant = identifiableCustomersWithPapeXPerMerchant * repeatRatio
  const estimatedRepeatSpendWithoutPapeXPerMerchant =
    repeatCustomersWithoutPapeXPerMerchant * averageOrderValue
  const estimatedRepeatSpendWithPapeXPerMerchant =
    repeatCustomersWithPapeXPerMerchant * averageOrderValue

  const monthlyIncrementalMerchantRevenueWithPapeX =
    monthlyIncrementalMerchantRevenueWithoutPapeX * (1 + papeXRevenueLiftRatio)

  const yearlyIncrementalMerchantRevenueWithoutPapeX =
    monthlyIncrementalMerchantRevenueWithoutPapeX * YEARLY_MULTIPLIER
  const yearlyIncrementalMerchantRevenueWithPapeX =
    monthlyIncrementalMerchantRevenueWithPapeX * YEARLY_MULTIPLIER

  const totalAddedMerchantRevenueWithoutPapeX =
    yearlyIncrementalMerchantRevenueWithoutPapeX * merchants
  const totalAddedMerchantRevenueWithPapeX = yearlyIncrementalMerchantRevenueWithPapeX * merchants

  const totalAddedPosRevenueWithoutPapeX = totalAddedMerchantRevenueWithoutPapeX * posRevenueShareRatio
  const totalAddedPosRevenueWithPapeX = totalAddedMerchantRevenueWithPapeX * posRevenueShareRatio

  return {
    grossMargin: {
      totalTransactionsPerMonth,
      printedReceiptsPerMonth,
      emailedReceiptsPerMonth,
      textedReceiptsPerMonth,
      noReceiptTransactionsPerMonth,
      monthlyPaperReceiptCost,
      monthlyEmailReceiptCost,
      monthlySmsReceiptCost,
      monthlyPosReceiptInfrastructureCost,
      yearlyPosReceiptInfrastructureCost,
      yearlyPaperReceiptCost,
      yearlyCombinedReceiptCostOffsetPotential:
        yearlyPaperReceiptCost + yearlyPosReceiptInfrastructureCost,
    },
    analytics: {
      identifiableCustomersWithoutPapeXPerMerchant,
      identifiableCustomersWithPapeXPerMerchant,
      additionalIdentifiableCustomersPerMerchant,
      repeatCustomersWithoutPapeXPerMerchant,
      repeatCustomersWithPapeXPerMerchant,
      estimatedRepeatSpendWithoutPapeXPerMerchant,
      estimatedRepeatSpendWithPapeXPerMerchant,
      monthlyIncrementalMerchantRevenueWithoutPapeX,
      monthlyIncrementalMerchantRevenueWithPapeX,
      yearlyIncrementalMerchantRevenueWithoutPapeX,
      yearlyIncrementalMerchantRevenueWithPapeX,
      totalAddedMerchantRevenueWithoutPapeX,
      totalAddedMerchantRevenueWithPapeX,
      totalAddedPosRevenueWithoutPapeX,
      totalAddedPosRevenueWithPapeX,
      additionalAnnualPosRevenueWithPapeX:
        totalAddedPosRevenueWithPapeX - totalAddedPosRevenueWithoutPapeX,
    },
    diagnostics: {
      receiptRateTotalPct: receiptRateTotal * 100,
      receiptRatesWereNormalized: shouldNormalizeRates,
    },
  }
}
