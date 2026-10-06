"use client"

import { ScrollReveal, ScrollWords } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { tapToRetain } from "./content"
import { IntroScene } from "./intro/IntroScene"
import bstyles from "./business.module.css"

// 02 "What is Tap to Retain?" — LIGHT ground (the hero above is navy).
//
// Web 2.1 W3 (Nico, 2026-09-24): a pinned scroll scene replaces the old
// three-station loop. A paper receipt grows until you can read it, then flies
// into a phone and becomes the App Clip receipt; then the same for a paper
// coupon, which becomes a coupon in the app's Coupons tab. Both halves are
// live — no "Coming soon" anywhere. The scene, its caption cards and the
// reduced-motion static version live in ./intro (IntroScene.tsx,
// IntroStatic.tsx).
//
// P3-B3 (Nico, 2026-09-25: "bring the title a little bit down… the blank
// space seems a little weird"): on desktop the heading rides INSIDE the pin,
// at its top, and the scene takes the rest of the screen — title and scene are
// one composition, with no empty band between them and no centring slack
// before §03. Phones, short screens, reduced motion and no-JS keep the heading
// in flow above (IntroScene picks by CSS, so nothing moves at hydration).
export function TapToRetain() {
  // One header element tree, placed twice by IntroScene (in flow / in the
  // pin); CSS shows exactly one of them.
  const header = <Header />
  return (
    <FlowSection
      id={tapToRetain.id}
      ground="navy"
      index="02"
      className={`${bstyles.rhythm} flow-root px-[clamp(20px,5vw,56px)]`}
    >
      <div className="mx-auto w-full max-w-[1150px]">
        <IntroScene header={header} />
      </div>
    </FlowSection>
  )
}

// p8 (Noah: reveals "don't appear as quickly as they should on the phone"):
// the heading block is scroll-linked (ScrollReveal + ScrollWords, motion.css:
// risen in within ~13vh of entering) instead of the IntersectionObserver
// blur-in, which waited for 12% of the block to clear the bottom 6% and then
// ran ~1.2s. Same as §04/§06 since P3-R1.
function Header() {
  const t = tapToRetain
  return (
    <ScrollReveal className="max-w-[820px]">
      <SectionLabel index="02">{t.eyebrow}</SectionLabel>
      <ScrollWords
        as="h2"
        className="text-[length:var(--fs-h2)] font-bold leading-[1.04] tracking-[-.02em] [font-family:var(--font-display)]"
      >
        {t.heading}
      </ScrollWords>
      <p
        className="mt-[var(--gap-title)] max-w-[52ch] text-[length:var(--fs-lead)] leading-[1.55]"
        style={{ color: "var(--flow-fg-2)" }}
      >
        {t.lead}
      </p>
    </ScrollReveal>
  )
}
