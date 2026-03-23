import { Suspense } from "react"
import PosCalculatorClient from "./pos-calculator-client"
import { MainNavigation, MainFooter } from "@/components/main-navigation"

function PosCalculatorFallback() {
  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      <MainNavigation />
      <main className="flex-1 container mx-auto py-8 px-4 flex items-center justify-center">
        <p className="text-[#0a3d62] text-lg font-medium">Loading calculator…</p>
      </main>
      <MainFooter />
    </div>
  )
}

export default function PosCalculatorPage() {
  return (
    <Suspense fallback={<PosCalculatorFallback />}>
      <PosCalculatorClient />
    </Suspense>
  )
}
