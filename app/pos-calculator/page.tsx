'use client'

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  calculatePosValuePropModel,
  posValuePropDefaults,
  type PosValuePropInputs,
} from "@/lib/posValuePropModel"
import { MainNavigation, MainFooter } from "@/components/main-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const integerFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
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

export default function PosCalculatorPage() {
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

  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      <MainNavigation />

      <main className="flex-1 container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Badge className="bg-[#0a3d62] text-white hover:bg-[#0a3d62] mb-2">
                Condensed
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-[#0a3d62]">
                POS Calculator
              </h1>
              <p className="text-[#0a3d62]/80 text-sm mt-1">
                Inputs and outputs only.{" "}
                <Link
                  href="/pos-value-prop"
                  className="text-[#ff9933] hover:underline font-medium"
                >
                  Full model
                </Link>
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs */}
            <Card className="bg-white/95 border border-white/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-[#0a3d62]">Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="merchantCount" className="text-[#0a3d62]">
                    Merchant locations
                  </Label>
                  <Input
                    id="merchantCount"
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
                  <Label htmlFor="transactions" className="text-[#0a3d62]">
                    Transactions per merchant / month
                  </Label>
                  <Input
                    id="transactions"
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
                  <Label htmlFor="uniqueCustomers" className="text-[#0a3d62]">
                    Unique customers per merchant / month
                  </Label>
                  <Input
                    id="uniqueCustomers"
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
                  <Label htmlFor="aov" className="text-[#0a3d62]">
                    Average order value ($)
                  </Label>
                  <Input
                    id="aov"
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

            {/* Outputs */}
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
                    {currencyFormatter.format(model.analytics.additionalAnnualPosRevenueWithPapeX)}
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
                      {currencyFormatter.format(model.grossMargin.yearlyPosReceiptInfrastructureCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-[#0a3d62]">
                    <span>Total added POS revenue (with PapeX)</span>
                    <span className="font-medium">
                      {currencyFormatter.format(model.analytics.totalAddedPosRevenueWithPapeX)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <MainFooter />
    </div>
  )
}
