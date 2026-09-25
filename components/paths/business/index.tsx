import { FlowGround } from "../shared/FlowGround"
import { Faq } from "../shared/Faq"
import { SiteFooter } from "@/components/brand/site-footer"
import { Hero } from "./Hero"
import { WhyMerchants } from "./WhyMerchants"
import { HowItWorks } from "./HowItWorks"
import { RdhDevice } from "./RdhDevice"
import { DemoForm } from "./DemoForm"
import { TapToRetain } from "./TapToRetain"
import { businessFaq, businessFaqHeading } from "./faq"

// The "For Business" (merchant) homepage — Screen 3 of the forked-landing
// redesign (docs/design/forked-landing/README.md, sections 3.1-3.7).
//
// Web 2.1 page order (Nico, 2026-09-24). Each section answers the merchant's
// next question, top to bottom:
//   01 Hero                 N  "What is this?" -> "This is Tap to Retain."
//   02 TapToRetain          L  "What is Tap to Retain?" (receipts + coupons)
//   03 WhyMerchants (#how)  L  "How does it work, what do I get?" — the
//                              story scene ending on the latched dashboard
//      [slot] merchant value calculator (coming soon)
//      ribbon                  keeps the running ground
//   04 RdhDevice            N  "Is it safe?"
//   05 HowItWorks (#setup)  L  "How do I get it?" -> DemoForm (#demo), L,
//                              read as one path (no second index)
//   06 FAQ (#faq)           L  shared Faq, last before the footer
//      footer               N  FlowGround's footer slot, outside <main>
// Sections declare a ground; FlowGround crossfades one page-level ground
// between them (components/paths/shared/flow.module.css). Navy never sits
// next to navy: the only navy content section (04) is framed by light.
// `initial="navy"` is the hero's colour and MUST match the fork's top half.
export function BusinessPath() {
  return (
    <FlowGround initial="navy" footer={<SiteFooter inFlow />}>
      <Hero />
      <TapToRetain />
      {/* #how: the hero's "See how it works" target. */}
      <div id="how" className="scroll-mt-[100px]">
        <WhyMerchants />
      </div>
      {/* SLOT: merchant value calculator (coming soon) */}
      <RdhDevice />
      <HowItWorks />
      <DemoForm />
      <Faq id="faq" eyebrowIndex="06" ground="light" heading={businessFaqHeading} items={businessFaq} />
    </FlowGround>
  )
}
