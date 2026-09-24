import { FlowGround } from "../shared/FlowGround"
import { FlowSection } from "../shared/FlowSection"
import { SiteFooter } from "@/components/brand/site-footer"
import { Hero } from "./Hero"
import { WhyMerchants } from "./WhyMerchants"
import { MarqueeBand } from "./MarqueeBand"
import { HowItWorks } from "./HowItWorks"
import { RdhDevice } from "./RdhDevice"
import { DemoForm } from "./DemoForm"
import { TapToRetain } from "./TapToRetain"

// The "For Business" (merchant) homepage — Screen 3 of the forked-landing
// redesign (docs/design/forked-landing/README.md, sections 3.1-3.7).
//
// Web 2.1 page order (Nico, 2026-09-24). Each section answers the merchant's
// next question, top to bottom:
//   01 Hero                 N  "What is this?" -> "This is Tap to Retain."
//   02 TapToRetain          L  "What is Tap to Retain?" (receipts + coupons)
//   03 WhyMerchants (#how)  L  "How does it work, what do I get?" — the
//                              receipt scene ending on the laptop + dashboard
//                              (owned by B5, which is rebuilding it)
//      [slot] merchant value calculator (coming soon)
//      ribbon                  keeps the running ground
//   04 RdhDevice            N  "Is it safe?"
//   05 HowItWorks (#setup)  L  "How do I get it?" -> DemoForm (#demo), L,
//                              read as one path (no second index)
//   06 FAQ (#faq)           L  SLOT C3, last before the footer
//      footer               N
// Sections declare a ground; FlowGround crossfades one page-level ground
// between them (components/paths/shared/flow.module.css). Navy never sits
// next to navy: the only navy content section (04) is framed by light.
// `initial="navy"` is the hero's colour and MUST match the fork's top half.
export function BusinessPath() {
  return (
    <FlowGround initial="navy">
      <Hero />
      <TapToRetain />
      {/* #how: the hero's "See how it works" target. A wrapper, not an id on
          the section, so B5 can rebuild WhyMerchants without owning it. */}
      <div id="how" className="scroll-mt-[100px]">
        <WhyMerchants />
      </div>
      {/* SLOT: merchant value calculator (coming soon) */}
      <MarqueeBand />
      <RdhDevice />
      <HowItWorks />
      <DemoForm />
      {/* Empty anchor for the footer's /business#faq link until C3 lands.
          When Faq mounts with id="faq", drop this wrapper's id (one per page). */}
      <div id="faq" className="scroll-mt-[100px]">
        {/* SLOT C3: <Faq id="faq" items={businessFaq} /> */}
      </div>
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
