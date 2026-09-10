import { FlowGround } from "../shared/FlowGround"
import { Hero } from "./Hero"
import { WhyMerchants } from "./WhyMerchants"
import { MarqueeBand } from "./MarqueeBand"
import { HowItWorks } from "./HowItWorks"
import { RdhDevice } from "./RdhDevice"
import { DashboardPreview } from "./DashboardPreview"
import { DemoForm } from "./DemoForm"

// The "For Business" (merchant) homepage — Screen 3 of the forked-landing
// redesign (docs/design/forked-landing/README.md, sections 3.1-3.7).
// Section order: hero -> why -> ribbon -> how -> RDH -> dashboard -> demo.
// Sections declare a ground; FlowGround crossfades one page-level ground
// between them (components/paths/shared/flow.module.css):
//   Hero navy · Why light · ribbon · How navy · RDH light · Dashboard navy ·
//   Demo light -> (footer navy)
// `initial="navy"` is the hero's colour and MUST match the fork's top half.
// The shared footer is owned by another agent and rendered outside this
// component.
export function BusinessPath() {
  return (
    <FlowGround initial="navy">
      <Hero />
      <WhyMerchants />
      <MarqueeBand />
      <HowItWorks />
      <RdhDevice />
      <DashboardPreview />
      <DemoForm />
    </FlowGround>
  )
}
