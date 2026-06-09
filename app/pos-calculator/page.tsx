import { Suspense } from "react"
import PosCalculatorClient from "./pos-calculator-client"
import { FramerPageShell } from "@/components/framer/framer-page-shell"

function PosCalculatorFallback() {
  return (
    <FramerPageShell>
      <div className="framer-container subpage-inner flex items-center justify-center">
        <p className="text-[#605f5f] text-lg font-medium">Loading calculator…</p>
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
