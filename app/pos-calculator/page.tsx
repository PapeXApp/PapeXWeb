import { Suspense } from "react"
import PosCalculatorClient from "./pos-calculator-client"
import { FramerPageShell } from "@/components/framer/framer-page-shell"

function PosCalculatorFallback() {
  return (
    <FramerPageShell>
      <div className="container mx-auto py-8 px-4 flex items-center justify-center">
        <p className="text-[#0a3d62] text-lg font-medium">Loading calculator…</p>
      </div>
    </FramerPageShell>
  )
}

export default function PosCalculatorPage() {
  return (
    <Suspense fallback={<PosCalculatorFallback />}>
      <PosCalculatorClient />
    </Suspense>
  )
}
