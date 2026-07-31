import { Hero } from "./Hero"
import { WhyMerchants } from "./WhyMerchants"
import { MarqueeBand } from "./MarqueeBand"
import { HowItWorks } from "./HowItWorks"
import { RdhDevice } from "./RdhDevice"
import { DashboardPreview } from "./DashboardPreview"
import { DemoForm } from "./DemoForm"

// The "For Business" (merchant) homepage — Screen 3 of the forked-landing
// redesign (docs/design/forked-landing/README.md, sections 3.1-3.7).
// Section order and backgrounds are locked by the design spec's rhythm:
// hero -> why -> marquee -> how -> RDH -> dashboard -> demo. The shared
// footer (Screen 3 continues with `footer #00121D`) is owned by another
// agent and rendered outside this component.
export function BusinessPath() {
  return (
    <>
      <Hero />
      <WhyMerchants />
      <MarqueeBand />
      <HowItWorks />
      <RdhDevice />
      <DashboardPreview />
      <DemoForm />
    </>
  )
}
