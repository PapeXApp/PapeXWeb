import { FlowGround } from "../shared/FlowGround"
import { FlowSection } from "../shared/FlowSection"
import { SiteFooter } from "@/components/brand/site-footer"
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
//   Hero navy · Why light · ribbon · How LIGHT · RDH NAVY · Dashboard navy ·
//   Demo light · footer navy
// Three flips, not five (2026-09-22): navy, light, light, navy, navy, light,
// navy. Why+How are one light stretch, RDH+Dashboard one navy block, so the
// page turns deliberately instead of strobing section by section.
// `initial="navy"` is the hero's colour and MUST match the fork's top half.
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
      {/* The footer is the page's navy tail, inside the flow (2026-09-22):
          it declares ground="navy" like any other section, so the last light
          section crossfades into it instead of hitting a hard navy edge.
          `inFlow` makes it paint no background and take --flow-* ink. */}
      <FlowSection ground="navy">
        <SiteFooter inFlow />
      </FlowSection>
    </FlowGround>
  )
}
