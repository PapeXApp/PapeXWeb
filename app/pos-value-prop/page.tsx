'use client'

import { useMemo, useState } from "react"
import {
  calculatePosValuePropModel,
  posValuePropDefaults,
  posValuePropSources,
  type PosValuePropInputs,
} from "@/lib/posValuePropModel"
import { MainNavigation, MainFooter } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const BLUE_INPUT_CELL_CLASS = "bg-[#d0e4f4]/80"
const ORANGE_TOTAL_ROW_CLASS = "bg-[#ff9933]/20"

type EditableField =
  | "merchantCount"
  | "transactionsPerMerchantPerMonth"
  | "uniqueCustomersPerMerchantPerMonth"
  | "averageOrderValue"

const INTEGER_EDITABLE_FIELDS: EditableField[] = [
  "merchantCount",
  "transactionsPerMerchantPerMonth",
  "uniqueCustomersPerMerchantPerMonth",
]

function isIntegerEditableField(field: EditableField) {
  return INTEGER_EDITABLE_FIELDS.includes(field)
}

function formatInteger(value: number) {
  return integerFormatter.format(value)
}

function formatDecimal(value: number) {
  return decimalFormatter.format(value)
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`
}

export default function PosValuePropPage() {
  const [inputs, setInputs] = useState<PosValuePropInputs>({ ...posValuePropDefaults })
  const model = useMemo(() => calculatePosValuePropModel(inputs), [inputs])

  const handleEditableInputChange = (field: EditableField, rawValue: string) => {
    if (rawValue.trim() === "") {
      setInputs((previous) => ({
        ...previous,
        [field]: 0,
      }))
      return
    }

    const parsedValue = Number(rawValue)

    if (!Number.isFinite(parsedValue)) {
      return
    }

    const normalizedBaseValue = Math.max(0, parsedValue)
    const normalizedValue = isIntegerEditableField(field)
      ? Math.round(normalizedBaseValue)
      : normalizedBaseValue

    setInputs((previous) => ({
      ...previous,
      [field]: normalizedValue,
    }))
  }

  const combinedPrintedAndEmailedRate =
    inputs.printedReceiptRatePct + inputs.emailedReceiptRatePct
  const combinedPrintedAndEmailedVolume =
    model.grossMargin.printedReceiptsPerMonth + model.grossMargin.emailedReceiptsPerMonth

  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      <MainNavigation />

      <main className="flex-1 container mx-auto py-8 px-4 relative overflow-hidden">
        <div className="absolute top-12 left-10 h-40 w-40 gradient-accent rounded-full blur-3xl opacity-10" />
        <div className="absolute bottom-10 right-10 h-40 w-40 gradient-primary rounded-full blur-3xl opacity-10" />

        <div className="relative z-10 space-y-6">
          <section className="bg-white/95 border border-white/40 rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="space-y-2 text-center">
              <div className="flex justify-center">
                <Badge className="bg-[#0a3d62] text-white hover:bg-[#0a3d62] w-fit">
                  POS Partner Calculator
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#0a3d62]">POS Value Prop Model</h1>
              <p className="text-[#0a3d62]/80 max-w-3xl mx-auto">
                Spreadsheet-style POS value modeling based on the current example assumptions.
              </p>
            </div>
          </section>

          <section>
            <Card className="bg-white/95 border border-white/40">
              <CardHeader>
                <CardTitle className="text-xl text-[#0a3d62]">Modeled outcomes</CardTitle>
                <CardDescription className="text-[#0a3d62]/75">
                  Gross margin and analytics views are stacked below with sources at the bottom.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold text-[#0a3d62]">Gross Margin</h2>

                  <div className="overflow-x-auto rounded-md border border-[#0a3d62]/20">
                    <Table className="min-w-[760px] text-sm">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[#0a3d62]">Cost</TableHead>
                          <TableHead className="text-right text-[#0a3d62]">Value</TableHead>
                          <TableHead className="text-[#0a3d62]">Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-[#0a3d62]">
                        <TableRow>
                          <TableCell>Per printed receipt</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(inputs.costPerPrintedReceipt)}
                          </TableCell>
                          <TableCell>Thermal paper + printer wear</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Per 1,000 emails sent</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(inputs.costPerThousandEmails)}
                          </TableCell>
                          <TableCell>Delivery + compliance overhead</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Per 1,000 texts sent</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(inputs.costPerThousandTexts)}
                          </TableCell>
                          <TableCell>Carrier + anti-fraud overhead</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="border-[#0a3d62]/15">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-[#0a3d62]">Costs for ESPs</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 text-sm text-[#0a3d62]/85">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Engineering time</li>
                          <li>Deliverability monitoring</li>
                          <li>Bounce handling</li>
                          <li>List management</li>
                          <li>Compliance (CAN-SPAM, GDPR, CCPA)</li>
                          <li>Uptime redundancy</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-[#0a3d62]/15">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-[#0a3d62]">Costs for SMS</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 text-sm text-[#0a3d62]/85">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Delivery tracking</li>
                          <li>Opt-out processing (&quot;STOP&quot; handling)</li>
                          <li>Carrier filtering management</li>
                          <li>Fraud prevention</li>
                          <li>Message formatting logic</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="overflow-x-auto rounded-md border border-[#0a3d62]/20">
                    <Table className="min-w-[820px] text-sm">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[#0a3d62]">Example</TableHead>
                          <TableHead className="text-right text-[#0a3d62]">Input / Mix</TableHead>
                          <TableHead className="text-right text-[#0a3d62]">Monthly Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-[#0a3d62]">
                        <TableRow>
                          <TableCell>Merchants</TableCell>
                          <TableCell className={`text-right font-medium ${BLUE_INPUT_CELL_CLASS}`}>
                            <Input
                              aria-label="Merchants"
                              type="number"
                              inputMode="numeric"
                              min={0}
                              step={100}
                              value={inputs.merchantCount}
                              onChange={(event) =>
                                handleEditableInputChange("merchantCount", event.target.value)
                              }
                              className="h-8 border-[#0a3d62]/20 bg-[#d0e4f4]/60 text-right text-[#0a3d62] focus-visible:ring-[#0a3d62]/20"
                            />
                          </TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Transactions total (typical SMB)</TableCell>
                          <TableCell className={`text-right font-medium ${BLUE_INPUT_CELL_CLASS}`}>
                            <Input
                              aria-label="Transactions total per merchant per month"
                              type="number"
                              inputMode="numeric"
                              min={0}
                              step={10}
                              value={inputs.transactionsPerMerchantPerMonth}
                              onChange={(event) =>
                                handleEditableInputChange(
                                  "transactionsPerMerchantPerMonth",
                                  event.target.value
                                )
                              }
                              className="h-8 border-[#0a3d62]/20 bg-[#d0e4f4]/60 text-right text-[#0a3d62] focus-visible:ring-[#0a3d62]/20"
                            />
                          </TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Unique Customers per Month</TableCell>
                          <TableCell className={`text-right font-medium ${BLUE_INPUT_CELL_CLASS}`}>
                            <Input
                              aria-label="Unique customers per month"
                              type="number"
                              inputMode="numeric"
                              min={0}
                              step={10}
                              value={inputs.uniqueCustomersPerMerchantPerMonth}
                              onChange={(event) =>
                                handleEditableInputChange(
                                  "uniqueCustomersPerMerchantPerMonth",
                                  event.target.value
                                )
                              }
                              className="h-8 border-[#0a3d62]/20 bg-[#d0e4f4]/60 text-right text-[#0a3d62] focus-visible:ring-[#0a3d62]/20"
                            />
                          </TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Average Order Value ($)</TableCell>
                          <TableCell className={`text-right font-medium ${BLUE_INPUT_CELL_CLASS}`}>
                            <Input
                              aria-label="Average order value"
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step={0.5}
                              value={inputs.averageOrderValue}
                              onChange={(event) =>
                                handleEditableInputChange("averageOrderValue", event.target.value)
                              }
                              className="h-8 border-[#0a3d62]/20 bg-[#d0e4f4]/60 text-right text-[#0a3d62] focus-visible:ring-[#0a3d62]/20"
                            />
                          </TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Printed</TableCell>
                          <TableCell className="text-right">
                            {formatPercent(inputs.printedReceiptRatePct)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatInteger(model.grossMargin.printedReceiptsPerMonth)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Emailed</TableCell>
                          <TableCell className="text-right">
                            {formatPercent(inputs.emailedReceiptRatePct)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatInteger(model.grossMargin.emailedReceiptsPerMonth)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Printed + emailed</TableCell>
                          <TableCell className="text-right">
                            {formatPercent(combinedPrintedAndEmailedRate)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatInteger(combinedPrintedAndEmailedVolume)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Texted</TableCell>
                          <TableCell className="text-right">
                            {formatPercent(inputs.textedReceiptRatePct)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatInteger(model.grossMargin.textedReceiptsPerMonth)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>No receipt</TableCell>
                          <TableCell className="text-right">
                            {formatPercent(inputs.noReceiptRatePct)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatInteger(model.grossMargin.noReceiptTransactionsPerMonth)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-semibold">Total receipts created monthly</TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatInteger(model.grossMargin.totalTransactionsPerMonth)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="overflow-x-auto rounded-md border border-[#0a3d62]/20">
                    <Table className="min-w-[760px] text-sm">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[#0a3d62]">Type of Receipt</TableHead>
                          <TableHead className="text-right text-[#0a3d62]">
                            Monthly POS Costs (indirect to merchants)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-[#0a3d62]">
                        <TableRow>
                          <TableCell>print + email</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.grossMargin.monthlyEmailReceiptCost)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>text</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.grossMargin.monthlySmsReceiptCost)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className={`font-semibold ${ORANGE_TOTAL_ROW_CLASS}`}>
                            Monthly E-Receipt Total
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${ORANGE_TOTAL_ROW_CLASS}`}>
                            {formatCurrency(model.grossMargin.monthlyPosReceiptInfrastructureCost)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className={`font-semibold ${ORANGE_TOTAL_ROW_CLASS}`}>
                            Yearly E-Receipt Total
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${ORANGE_TOTAL_ROW_CLASS}`}>
                            {formatCurrency(model.grossMargin.yearlyPosReceiptInfrastructureCost)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <p className="text-sm text-[#0a3d62]/80">
                    <span className="font-semibold">Pitch Sentence:</span> PapeX removes the need for
                    POS-generated paper and email receipts by handling receipt delivery post-checkout,
                    reducing per-transaction receipt infrastructure costs and improving gross margins.
                  </p>
                </section>

                <section className="space-y-4 border-t border-[#0a3d62]/15 pt-6">
                  <h2 className="text-lg font-semibold text-[#0a3d62]">Analytics</h2>

                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] gap-4">
                    <div className="overflow-x-auto rounded-md border border-[#0a3d62]/20">
                      <Table className="min-w-[760px] text-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[#0a3d62]">Basic Metrics for Example</TableHead>
                            <TableHead className="text-right text-[#0a3d62]">Value</TableHead>
                            <TableHead className="text-[#0a3d62]">Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-[#0a3d62]">
                          <TableRow>
                            <TableCell>Average Order Value ($)</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(inputs.averageOrderValue)}
                            </TableCell>
                            <TableCell>site source</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Transactions per Month</TableCell>
                            <TableCell className="text-right">
                              {formatInteger(inputs.transactionsPerMerchantPerMonth)}
                            </TableCell>
                            <TableCell>per merchant baseline</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Unique Customers per Month</TableCell>
                            <TableCell className="text-right">
                              {formatInteger(inputs.uniqueCustomersPerMerchantPerMonth)}
                            </TableCell>
                            <TableCell>estimated active profiles</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Total POS Customer Count (# Merchants)</TableCell>
                            <TableCell className="text-right">
                              {formatInteger(inputs.merchantCount)}
                            </TableCell>
                            <TableCell>network-wide footprint</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Typical POS Processing Fee (%)</TableCell>
                            <TableCell className="text-right">
                              {formatPercent(inputs.posRevenueSharePct)}
                            </TableCell>
                            <TableCell>share of added merchant revenue</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <Card className="border-[#0a3d62]/15">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-[#0a3d62]">They would get:</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 text-sm text-[#0a3d62]/85">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Higher digital receipt penetration</li>
                          <li>More identifiable transactions</li>
                          <li>Better paper/waste handling</li>
                          <li>Better lifetime value calculations</li>
                          <li>Better retention analytics</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="overflow-x-auto rounded-md border border-[#0a3d62]/20">
                    <Table className="min-w-[900px] text-sm">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[#0a3d62]">Example</TableHead>
                          <TableHead className="text-right text-[#0a3d62]">Without PapeX</TableHead>
                          <TableHead className="text-right text-[#0a3d62]">With PapeX</TableHead>
                          <TableHead className="text-[#0a3d62]">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-[#0a3d62]">
                        <TableRow>
                          <TableCell>Identified Transactions Rate (%)</TableCell>
                          <TableCell className="text-right">
                            {formatPercent(inputs.identifiedTransactionRateWithoutPapeXPct)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPercent(inputs.identifiedTransactionRateWithPapeXPct)}
                          </TableCell>
                          <TableCell>because not everyone has PapeX YET</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Identified Customers</TableCell>
                          <TableCell className="text-right">
                            {formatDecimal(model.analytics.identifiableCustomersWithoutPapeXPerMerchant)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDecimal(model.analytics.identifiableCustomersWithPapeXPerMerchant)}
                          </TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>6-Day Repeat Rate (%)</TableCell>
                          <TableCell className="text-right">{formatPercent(inputs.repeatRatePct)}</TableCell>
                          <TableCell className="text-right">{formatPercent(inputs.repeatRatePct)}</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>6-Day Repeat Customers</TableCell>
                          <TableCell className="text-right">
                            {formatDecimal(model.analytics.repeatCustomersWithoutPapeXPerMerchant)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDecimal(model.analytics.repeatCustomersWithPapeXPerMerchant)}
                          </TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Incremental Merchant Revenue per Month</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.monthlyIncrementalMerchantRevenueWithoutPapeX)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.monthlyIncrementalMerchantRevenueWithPapeX)}
                          </TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Incremental Merchant Revenue per Year</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.yearlyIncrementalMerchantRevenueWithoutPapeX)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.yearlyIncrementalMerchantRevenueWithPapeX)}
                          </TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Total Added Merchant Revenue</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.totalAddedMerchantRevenueWithoutPapeX)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.totalAddedMerchantRevenueWithPapeX)}
                          </TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Total Added POS Revenue</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.totalAddedPosRevenueWithoutPapeX)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.totalAddedPosRevenueWithPapeX)}
                          </TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="rounded-xl border-2 border-[#ff9933]/50 bg-[#ff9933]/10 p-5 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#0a3d62]/80">
                      Value Added by PapeX
                    </p>
                    <p className="text-4xl md:text-5xl font-black text-[#ff9933] leading-tight mt-1">
                      {formatCurrency(model.analytics.additionalAnnualPosRevenueWithPapeX)}
                    </p>
                    <p className="text-sm font-semibold text-[#0a3d62] mt-1">
                      Additional annual POS revenue
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-[#0a3d62]/85">
                    <p className="font-semibold text-[#0a3d62]">Pitch Sentences</p>
                    <p>
                      <span className="font-semibold">POS:</span> Once integrated with the POS and once
                      users are signed into PapeX, every transaction can be tied to an identity-safe
                      profile connected to that POS environment.
                    </p>
                    <p>
                      <span className="font-semibold">GPT:</span> Once integrated with the POS and adopted
                      by users, PapeX links transactions to a persistent, privacy-safe customer profile.
                      This enables POS vendors and their merchants to better understand buying behavior,
                      optimize marketing spend, and increase repeat visits — directly driving merchant
                      retention and POS revenue.
                    </p>
                    <p>Direct, intentional, and specific information on spend amongst ad campaigns.</p>
                  </div>
                </section>

                <section className="space-y-3 border-t border-[#0a3d62]/15 pt-6">
                  <h2 className="text-lg font-semibold text-[#0a3d62]">Sources</h2>
                  <p className="text-sm text-[#0a3d62]/80">
                    Source links used for baseline assumptions. Update these in{" "}
                    <code className="font-semibold text-[#0a3d62]">lib/posValuePropModel.ts</code> as
                    your model evolves.
                  </p>
                  {posValuePropSources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-[#0a3d62]/15 p-4 hover:border-[#ff9933]/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#0a3d62]">{source.label}</p>
                          <p className="text-sm text-[#0a3d62]/70">{source.note}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-[#0a3d62]/70 flex-shrink-0 mt-1" />
                      </div>
                    </a>
                  ))}
                </section>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <MainFooter />
    </div>
  )
}
