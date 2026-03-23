'use client'

import { useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  calculatePosValuePropModel,
  posValuePropDefaults,
  posValuePropSources,
  type PosValuePropInputs,
} from "@/lib/posValuePropModel"
import { MainNavigation, MainFooter } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExternalLink } from "lucide-react"

const integerFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
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

type EditableField =
  | "merchantCount"
  | "transactionsPerMerchantPerMonth"
  | "uniqueCustomersPerMerchantPerMonth"
  | "averageOrderValue"

const INTEGER_FIELDS: EditableField[] = [
  "merchantCount",
  "transactionsPerMerchantPerMonth",
  "uniqueCustomersPerMerchantPerMonth",
]

const BLUE_INPUT_CELL_CLASS = "bg-[#d0e4f4]/80"
const ORANGE_TOTAL_ROW_CLASS = "bg-[#ff9933]/20"

export default function PosCalculatorClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") === "full" ? "full" : "condensed"
  const [inputs, setInputs] = useState<PosValuePropInputs>({ ...posValuePropDefaults })
  const model = useMemo(() => calculatePosValuePropModel(inputs), [inputs])

  const handleChange = (field: EditableField, raw: string) => {
    if (raw.trim() === "") {
      setInputs((prev) => ({ ...prev, [field]: 0 }))
      return
    }
    const n = Number(raw)
    if (!Number.isFinite(n)) return
    const value = Math.max(0, n)
    const final = INTEGER_FIELDS.includes(field) ? Math.round(value) : value
    setInputs((prev) => ({ ...prev, [field]: final }))
  }

  const handleTabChange = (value: string) => {
    const normalized = value === "full" ? "full" : "condensed"
    const nextUrl = normalized === "full" ? `${pathname}?tab=full` : pathname
    router.replace(nextUrl, { scroll: false })
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
              <Badge className="bg-[#0a3d62] text-white hover:bg-[#0a3d62] w-fit mx-auto">
                Unified
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-[#0a3d62]">POS Calculator</h1>
              <p className="text-[#0a3d62]/80 max-w-3xl mx-auto">
                Use the tabs to switch between a quick calculator and the full value prop model.
              </p>
            </div>
          </section>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="bg-white/90 border border-[#0a3d62]/20 h-auto p-1 w-full sm:w-auto inline-flex">
              <TabsTrigger
                value="condensed"
                className="data-[state=active]:bg-[#0a3d62] data-[state=active]:text-white text-[#0a3d62]"
              >
                Condensed
              </TabsTrigger>
              <TabsTrigger
                value="full"
                className="data-[state=active]:bg-[#0a3d62] data-[state=active]:text-white text-[#0a3d62]"
              >
                Full model
              </TabsTrigger>
            </TabsList>

            <TabsContent value="condensed" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
                <Card className="bg-white/95 border border-white/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-[#0a3d62]">Inputs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <p className="text-[#0a3d62] text-sm font-medium">Merchant locations</p>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={100}
                        value={inputs.merchantCount}
                        onChange={(e) => handleChange("merchantCount", e.target.value)}
                        className="bg-[#d0e4f4]/60 border-[#0a3d62]/20 text-[#0a3d62]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <p className="text-[#0a3d62] text-sm font-medium">
                        Transactions per merchant / month
                      </p>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={10}
                        value={inputs.transactionsPerMerchantPerMonth}
                        onChange={(e) =>
                          handleChange("transactionsPerMerchantPerMonth", e.target.value)
                        }
                        className="bg-[#d0e4f4]/60 border-[#0a3d62]/20 text-[#0a3d62]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <p className="text-[#0a3d62] text-sm font-medium">
                        Unique customers per merchant / month
                      </p>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={10}
                        value={inputs.uniqueCustomersPerMerchantPerMonth}
                        onChange={(e) =>
                          handleChange("uniqueCustomersPerMerchantPerMonth", e.target.value)
                        }
                        className="bg-[#d0e4f4]/60 border-[#0a3d62]/20 text-[#0a3d62]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <p className="text-[#0a3d62] text-sm font-medium">Average order value ($)</p>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.5}
                        value={inputs.averageOrderValue}
                        onChange={(e) => handleChange("averageOrderValue", e.target.value)}
                        className="bg-[#d0e4f4]/60 border-[#0a3d62]/20 text-[#0a3d62]"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 border border-white/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-[#0a3d62]">Outputs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-xl border-2 border-[#ff9933]/50 bg-[#ff9933]/10 p-5 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#0a3d62]/80">
                        Additional annual POS revenue
                      </p>
                      <p className="text-3xl md:text-4xl font-black text-[#ff9933] leading-tight mt-1">
                        {currencyFormatter.format(
                          model.analytics.additionalAnnualPosRevenueWithPapeX
                        )}
                      </p>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-baseline text-[#0a3d62]">
                        <span>Total transactions / month</span>
                        <span className="font-medium">
                          {integerFormatter.format(model.grossMargin.totalTransactionsPerMonth)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline text-[#0a3d62]">
                        <span>Yearly e-receipt cost</span>
                        <span className="font-medium">
                          {currencyFormatter.format(
                            model.grossMargin.yearlyPosReceiptInfrastructureCost
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="full" className="space-y-6">
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
                              {currencyFormatter.format(inputs.costPerPrintedReceipt)}
                            </TableCell>
                            <TableCell>Thermal paper + printer wear</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Per 1,000 emails sent</TableCell>
                            <TableCell className="text-right">
                              {currencyFormatter.format(inputs.costPerThousandEmails)}
                            </TableCell>
                            <TableCell>Delivery + compliance overhead</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Per 1,000 texts sent</TableCell>
                            <TableCell className="text-right">
                              {currencyFormatter.format(inputs.costPerThousandTexts)}
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
                            <li>Opt-out processing ("STOP" handling)</li>
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
                            <TableCell>Merchant locations</TableCell>
                            <TableCell className={`text-right font-medium ${BLUE_INPUT_CELL_CLASS}`}>
                              <Input
                                aria-label="Merchant locations"
                                type="number"
                                inputMode="numeric"
                                min={0}
                                step={100}
                                value={inputs.merchantCount}
                                onChange={(event) =>
                                  handleChange("merchantCount", event.target.value)
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
                                  handleChange("transactionsPerMerchantPerMonth", event.target.value)
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
                                  handleChange("uniqueCustomersPerMerchantPerMonth", event.target.value)
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
                                  handleChange("averageOrderValue", event.target.value)
                                }
                                className="h-8 border-[#0a3d62]/20 bg-[#d0e4f4]/60 text-right text-[#0a3d62] focus-visible:ring-[#0a3d62]/20"
                              />
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-semibold">
                              Printed + emailed (combined, non-additive)
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {percentFormatter.format(combinedPrintedAndEmailedRate)}%
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {integerFormatter.format(combinedPrintedAndEmailedVolume)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Printed (component of combined)</TableCell>
                            <TableCell className="text-right">
                              {percentFormatter.format(inputs.printedReceiptRatePct)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {integerFormatter.format(model.grossMargin.printedReceiptsPerMonth)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Emailed (component of combined)</TableCell>
                            <TableCell className="text-right">
                              {percentFormatter.format(inputs.emailedReceiptRatePct)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {integerFormatter.format(model.grossMargin.emailedReceiptsPerMonth)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Texted</TableCell>
                            <TableCell className="text-right">
                              {percentFormatter.format(inputs.textedReceiptRatePct)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {integerFormatter.format(model.grossMargin.textedReceiptsPerMonth)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>No receipt</TableCell>
                            <TableCell className="text-right">
                              {percentFormatter.format(inputs.noReceiptRatePct)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {integerFormatter.format(model.grossMargin.noReceiptTransactionsPerMonth)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-semibold">
                              Total transactions monthly (no double count)
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                            <TableCell className="text-right font-semibold">
                              {integerFormatter.format(model.grossMargin.totalTransactionsPerMonth)}
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
                              {currencyFormatter.format(model.grossMargin.monthlyEmailReceiptCost)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>text</TableCell>
                            <TableCell className="text-right">
                              {currencyFormatter.format(model.grossMargin.monthlySmsReceiptCost)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className={`font-semibold ${ORANGE_TOTAL_ROW_CLASS}`}>
                              Monthly E-Receipt Total
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${ORANGE_TOTAL_ROW_CLASS}`}>
                              {currencyFormatter.format(
                                model.grossMargin.monthlyPosReceiptInfrastructureCost
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className={`font-semibold ${ORANGE_TOTAL_ROW_CLASS}`}>
                              Yearly E-Receipt Total
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${ORANGE_TOTAL_ROW_CLASS}`}>
                              {currencyFormatter.format(
                                model.grossMargin.yearlyPosReceiptInfrastructureCost
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
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
                                {currencyFormatter.format(inputs.averageOrderValue)}
                              </TableCell>
                              <TableCell>site source</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Transactions per Month</TableCell>
                              <TableCell className="text-right">
                                {integerFormatter.format(inputs.transactionsPerMerchantPerMonth)}
                              </TableCell>
                              <TableCell>per merchant baseline</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Unique Customers per Month</TableCell>
                              <TableCell className="text-right">
                                {integerFormatter.format(inputs.uniqueCustomersPerMerchantPerMonth)}
                              </TableCell>
                              <TableCell>estimated active profiles</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Total POS Customer Count (# Merchants)</TableCell>
                              <TableCell className="text-right">
                                {integerFormatter.format(inputs.merchantCount)}
                              </TableCell>
                              <TableCell>network-wide footprint</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Typical POS Processing Fee (%)</TableCell>
                              <TableCell className="text-right">
                                {percentFormatter.format(inputs.posRevenueSharePct)}%
                              </TableCell>
                              <TableCell>share of added merchant revenue</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Per 1,000 texts sent</TableCell>
                              <TableCell className="text-right">
                                {currencyFormatter.format(inputs.costPerThousandTexts)}
                              </TableCell>
                              <TableCell>SMS delivery cost</TableCell>
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
                              {percentFormatter.format(inputs.identifiedTransactionRateWithoutPapeXPct)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {percentFormatter.format(inputs.identifiedTransactionRateWithPapeXPct)}%
                            </TableCell>
                            <TableCell>because not everyone has PapeX YET</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Identified Customers</TableCell>
                            <TableCell className="text-right">
                              {decimalFormatter.format(
                                model.analytics.identifiableCustomersWithoutPapeXPerMerchant
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {decimalFormatter.format(
                                model.analytics.identifiableCustomersWithPapeXPerMerchant
                              )}
                            </TableCell>
                            <TableCell>-</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>60-Day Repeat Rate (%)</TableCell>
                            <TableCell className="text-right">
                              {percentFormatter.format(inputs.repeatRateWithoutPapeXPct)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {percentFormatter.format(inputs.repeatRateWithPapeXPct)}%
                            </TableCell>
                            <TableCell>-</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>60-Day Repeat Customers</TableCell>
                            <TableCell className="text-right">
                              {decimalFormatter.format(
                                model.analytics.repeatCustomersWithoutPapeXPerMerchant
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {decimalFormatter.format(
                                model.analytics.repeatCustomersWithPapeXPerMerchant
                              )}
                            </TableCell>
                            <TableCell>-</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Incremental Merchant Revenue per Month</TableCell>
                            <TableCell className="text-right">
                              {currencyFormatter.format(
                                model.analytics.monthlyIncrementalMerchantRevenueWithoutPapeX
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {currencyFormatter.format(
                                model.analytics.monthlyIncrementalMerchantRevenueWithPapeX
                              )}
                            </TableCell>
                            <TableCell>-</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Incremental Merchant Revenue per Year</TableCell>
                            <TableCell className="text-right">
                              {currencyFormatter.format(
                                model.analytics.yearlyIncrementalMerchantRevenueWithoutPapeX
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {currencyFormatter.format(
                                model.analytics.yearlyIncrementalMerchantRevenueWithPapeX
                              )}
                            </TableCell>
                            <TableCell>-</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Total Added Merchant Revenue</TableCell>
                            <TableCell className="text-right">
                              {currencyFormatter.format(
                                model.analytics.totalAddedMerchantRevenueWithoutPapeX
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {currencyFormatter.format(model.analytics.totalAddedMerchantRevenueWithPapeX)}
                            </TableCell>
                            <TableCell>-</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Total Added POS Revenue</TableCell>
                            <TableCell className="text-right">
                              {currencyFormatter.format(model.analytics.totalAddedPosRevenueWithoutPapeX)}
                            </TableCell>
                            <TableCell className="text-right">
                              {currencyFormatter.format(model.analytics.totalAddedPosRevenueWithPapeX)}
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
                        {currencyFormatter.format(model.analytics.additionalAnnualPosRevenueWithPapeX)}
                      </p>
                      <p className="text-sm font-semibold text-[#0a3d62] mt-1">
                        Additional annual POS revenue
                      </p>
                    </div>
                  </section>

                  <section className="space-y-3 border-t border-[#0a3d62]/15 pt-6">
                    <h2 className="text-lg font-semibold text-[#0a3d62]">Sources</h2>
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
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <MainFooter />
    </div>
  )
}
