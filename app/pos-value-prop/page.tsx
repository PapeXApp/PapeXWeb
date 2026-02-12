'use client'

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  calculatePosValuePropModel,
  posValuePropDefaults,
  posValuePropFieldSections,
  posValuePropSources,
  type PosValuePropFieldDefinition,
  type PosValuePropInputs,
} from "@/lib/posValuePropModel"
import { MainNavigation, MainFooter } from "@/components/main-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calculator, ExternalLink, ReceiptText, TrendingUp, Users } from "lucide-react"

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

function formatInteger(value: number) {
  return integerFormatter.format(value)
}

function formatDecimal(value: number) {
  return decimalFormatter.format(value)
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

interface AssumptionFieldProps {
  field: PosValuePropFieldDefinition
  value: number
  onChange: (key: keyof PosValuePropInputs, value: number) => void
}

function AssumptionField({ field, value, onChange }: AssumptionFieldProps) {
  const isCurrency = field.unit === "currency"
  const isPercentage = field.unit === "percentage"

  return (
    <div className="space-y-2">
      <Label htmlFor={field.key} className="text-[#0a3d62]">
        {field.label}
      </Label>
      <div className="relative">
        {isCurrency && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#0a3d62]/70">
            $
          </span>
        )}
        <Input
          id={field.key}
          type="number"
          value={value}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(event) => {
            const parsedValue = Number(event.target.value)
            onChange(field.key, Number.isFinite(parsedValue) ? parsedValue : 0)
          }}
          className={[
            "border-[#0a3d62]/20 bg-white",
            isCurrency ? "pl-8" : "",
            isPercentage ? "pr-8" : "",
          ].join(" ")}
        />
        {isPercentage && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#0a3d62]/70">
            %
          </span>
        )}
      </div>
      <p className="text-xs text-[#0a3d62]/70">{field.description}</p>
    </div>
  )
}

export default function PosValuePropPage() {
  const [inputs, setInputs] = useState<PosValuePropInputs>({ ...posValuePropDefaults })

  const model = useMemo(() => calculatePosValuePropModel(inputs), [inputs])

  const handleInputChange = (key: keyof PosValuePropInputs, value: number) => {
    setInputs((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      <MainNavigation />

      <main className="flex-1 container mx-auto py-8 px-4 relative overflow-hidden">
        <div className="absolute top-12 left-10 h-40 w-40 gradient-accent rounded-full blur-3xl opacity-10" />
        <div className="absolute bottom-10 right-10 h-40 w-40 gradient-primary rounded-full blur-3xl opacity-10" />

        <div className="relative z-10 space-y-6">
          <section className="bg-white/95 border border-white/40 rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-3">
                <Badge className="bg-[#0a3d62] text-white hover:bg-[#0a3d62] w-fit">
                  POS Partner Calculator
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-[#0a3d62]">
                  POS Value Prop Model
                </h1>
                <p className="text-[#0a3d62]/80 max-w-3xl">
                  Partners can plug in assumptions and instantly explore margin impact, analytics lift,
                  and projected revenue upside. All default model numbers are centralized in{" "}
                  <code className="text-[#0a3d62] font-semibold">lib/posValuePropModel.ts</code>.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="border-[#0a3d62]/30 text-[#0a3d62] hover:text-[#ff9933] hover:border-[#ff9933]"
                  onClick={() => setInputs({ ...posValuePropDefaults })}
                >
                  Reset to defaults
                </Button>
                <Link href="/contact">
                  <Button className="gradient-accent text-white border-none">Talk to our team</Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="bg-white/95 border border-white/40">
              <CardHeader className="pb-2">
                <CardDescription className="text-[#0a3d62]/70">Monthly transaction volume</CardDescription>
                <CardTitle className="text-[#0a3d62] text-2xl flex items-center gap-2">
                  <ReceiptText className="h-5 w-5 text-[#ff9933]" />
                  {formatInteger(model.grossMargin.totalTransactionsPerMonth)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-white/95 border border-white/40">
              <CardHeader className="pb-2">
                <CardDescription className="text-[#0a3d62]/70">
                  Yearly POS e-receipt infrastructure cost
                </CardDescription>
                <CardTitle className="text-[#0a3d62] text-2xl flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-[#ff9933]" />
                  {formatCurrency(model.grossMargin.yearlyPosReceiptInfrastructureCost)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-white/95 border border-white/40">
              <CardHeader className="pb-2">
                <CardDescription className="text-[#0a3d62]/70">
                  Additional identifiable customers / merchant
                </CardDescription>
                <CardTitle className="text-[#0a3d62] text-2xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#ff9933]" />
                  {formatDecimal(model.analytics.additionalIdentifiableCustomersPerMerchant)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-white/95 border border-white/40">
              <CardHeader className="pb-2">
                <CardDescription className="text-[#0a3d62]/70">
                  Additional annual POS revenue (with PayX)
                </CardDescription>
                <CardTitle className="text-[#0a3d62] text-2xl flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#ff9933]" />
                  {formatCurrency(model.analytics.additionalAnnualPosRevenueWithPayX)}
                </CardTitle>
              </CardHeader>
            </Card>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-6">
            <div className="space-y-4">
              {posValuePropFieldSections.map((section) => (
                <Card key={section.id} className="bg-white/95 border border-white/40">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#0a3d62]">{section.title}</CardTitle>
                    <CardDescription className="text-[#0a3d62]/75">
                      {section.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {section.fields.map((field) => (
                      <AssumptionField
                        key={field.key}
                        field={field}
                        value={inputs[field.key]}
                        onChange={handleInputChange}
                      />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-white/95 border border-white/40">
              <CardHeader>
                <CardTitle className="text-xl text-[#0a3d62]">Modeled outcomes</CardTitle>
                <CardDescription className="text-[#0a3d62]/75">
                  Live results based on your current assumptions.
                </CardDescription>
                {model.diagnostics.receiptRatesWereNormalized && (
                  <p className="text-xs text-[#0a3d62]/80 bg-[#d0e4f4]/60 p-2 rounded-md">
                    Receipt mix totals {formatDecimal(model.diagnostics.receiptRateTotalPct)}%. The
                    model automatically normalizes rates to keep receipt volume aligned to transaction
                    volume.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="gross-margin" className="w-full">
                  <TabsList className="bg-[#d0e4f4] text-[#0a3d62]">
                    <TabsTrigger value="gross-margin">Gross Margin</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="sources">Sources</TabsTrigger>
                  </TabsList>

                  <TabsContent value="gross-margin" className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[#0a3d62]">Type</TableHead>
                          <TableHead className="text-right text-[#0a3d62]">Monthly volume</TableHead>
                          <TableHead className="text-right text-[#0a3d62]">Monthly cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Printed</TableCell>
                          <TableCell className="text-right">
                            {formatInteger(model.grossMargin.printedReceiptsPerMonth)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.grossMargin.monthlyPaperReceiptCost)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Emailed</TableCell>
                          <TableCell className="text-right">
                            {formatInteger(model.grossMargin.emailedReceiptsPerMonth)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.grossMargin.monthlyEmailReceiptCost)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Texted</TableCell>
                          <TableCell className="text-right">
                            {formatInteger(model.grossMargin.textedReceiptsPerMonth)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.grossMargin.monthlySmsReceiptCost)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>No receipt</TableCell>
                          <TableCell className="text-right">
                            {formatInteger(model.grossMargin.noReceiptTransactionsPerMonth)}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-semibold">Monthly POS e-receipt total</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatInteger(
                              model.grossMargin.emailedReceiptsPerMonth +
                                model.grossMargin.textedReceiptsPerMonth
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(model.grossMargin.monthlyPosReceiptInfrastructureCost)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-[#0a3d62]/15 p-3">
                        <p className="text-[#0a3d62]/70">Yearly POS e-receipt cost</p>
                        <p className="text-lg font-semibold text-[#0a3d62]">
                          {formatCurrency(model.grossMargin.yearlyPosReceiptInfrastructureCost)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#0a3d62]/15 p-3">
                        <p className="text-[#0a3d62]/70">Yearly combined cost-offset potential</p>
                        <p className="text-lg font-semibold text-[#0a3d62]">
                          {formatCurrency(model.grossMargin.yearlyCombinedReceiptCostOffsetPotential)}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[#0a3d62]">Metric</TableHead>
                          <TableHead className="text-right text-[#0a3d62]">Without PayX</TableHead>
                          <TableHead className="text-right text-[#0a3d62]">With PayX</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Identifiable customers / merchant</TableCell>
                          <TableCell className="text-right">
                            {formatDecimal(model.analytics.identifiableCustomersWithoutPayXPerMerchant)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDecimal(model.analytics.identifiableCustomersWithPayXPerMerchant)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Repeat customers / merchant</TableCell>
                          <TableCell className="text-right">
                            {formatDecimal(model.analytics.repeatCustomersWithoutPayXPerMerchant)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDecimal(model.analytics.repeatCustomersWithPayXPerMerchant)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Estimated repeat spend / merchant</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.estimatedRepeatSpendWithoutPayXPerMerchant)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.estimatedRepeatSpendWithPayXPerMerchant)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Monthly incremental merchant revenue</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.monthlyIncrementalMerchantRevenueWithoutPayX)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.monthlyIncrementalMerchantRevenueWithPayX)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Yearly incremental merchant revenue (per merchant)</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.yearlyIncrementalMerchantRevenueWithoutPayX)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.yearlyIncrementalMerchantRevenueWithPayX)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Total added merchant revenue (network)</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.totalAddedMerchantRevenueWithoutPayX)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.totalAddedMerchantRevenueWithPayX)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Total added POS revenue (network)</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.totalAddedPosRevenueWithoutPayX)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(model.analytics.totalAddedPosRevenueWithPayX)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <div className="rounded-lg border border-[#ff9933]/40 bg-[#ff9933]/10 p-4">
                      <p className="text-sm text-[#0a3d62]/80">Incremental annual POS upside with PayX</p>
                      <p className="text-2xl font-bold text-[#0a3d62]">
                        {formatCurrency(model.analytics.additionalAnnualPosRevenueWithPayX)}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="sources" className="space-y-3">
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
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <MainFooter />
    </div>
  )
}
