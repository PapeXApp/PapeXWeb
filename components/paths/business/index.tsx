import { Suspense } from "react"
import { FlowGround } from "../shared/FlowGround"
import { Faq } from "../shared/Faq"
import { SiteFooter } from "@/components/brand/site-footer"
import { Hero } from "./Hero"
import { WhyMerchants } from "./WhyMerchants"
import { HowItWorks } from "./HowItWorks"
import { RdsSticker } from "./RdsSticker"
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
//   04 RdsSticker           N  "Is it safe?"
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
      {/* Each section below the hero is its own Suspense boundary (nothing
          here suspends, so the server HTML is unchanged). React then hydrates
          them one at a time and can stop between them for a tap, instead of
          blocking the phone for the whole page at once (Nico, 2026-10-22:
          the menu was slow to respond while the page started up). */}
      <Hero />
      <Suspense fallback={null}>
        <TapToRetain />
      </Suspense>
      {/* #how: the hero's "See how it works" target. */}
      <div id="how" className="min-[821px]:scroll-mt-[100px]">
        <Suspense fallback={null}>
          <WhyMerchants />
        </Suspense>
      </div>
      {/* SLOT: merchant value calculator (coming soon) */}
      <Suspense fallback={null}>
        <RdsSticker />
      </Suspense>
      <Suspense fallback={null}>
        <HowItWorks />
      </Suspense>
      <Suspense fallback={null}>
        <DemoForm />
      </Suspense>
      <Suspense fallback={null}>
        <Faq id="faq" eyebrowIndex="06" ground="light" heading={businessFaqHeading} items={businessFaq} />
      </Suspense>
    </FlowGround>
  )
}
