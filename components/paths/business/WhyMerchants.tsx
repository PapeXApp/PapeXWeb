import { Reveal, ScrollLit } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { story } from "./story"
import { RetainStory } from "./story/RetainStory"
import s from "./story.module.css"

// /business section 03, "Tap to Retain" (Web 2.1 FINAL PAGE ORDER, B5).
// One scroll story answers both "how does it work?" and "what do I, and my
// customers, get?": a paper receipt prints and is trashed, the same receipt
// goes to the PapeX device and opens on a customer's phone with one tap, and
// a spark carries it onto the merchant dashboard, whose info rises in last.
// It replaces the old fold-receipt scene AND the separate "What your
// customers see" section. The scene is story/RetainStory.tsx; copy is
// story.ts. The export keeps its old name because business/index.tsx
// (B1's file) mounts it.
//
// P3-B8 (Nico, 2026-09-25: "space here needs to shrink... let's keep the
// title in the animation the whole time so there is some text"): the heading
// is handed to RetainStory, which places it twice and lets CSS show one —
// on desktop screens tall enough for it (>= 821 x 680, motion allowed) it
// rides INSIDE the pin, top-left, for the whole runway, and the camera frames
// every beat in the room left under and beside it; phones, short screens,
// reduced motion and no-JS keep it in flow above, as before. Same pattern as
// §02 (TapToRetain.tsx + intro/IntroScene.tsx). The hidden copy is
// display: none, so assistive tech only ever meets one H2.
//
// B1's index.tsx wraps this section in <div id="how"> and keeps the
// calculator SLOT after it, so neither lives here.
export function WhyMerchants() {
  // One header element tree, placed twice by RetainStory (in flow / in the
  // pin); CSS shows exactly one of them.
  const header = (
    <Reveal>
      <SectionLabel index="03">{story.eyebrow}</SectionLabel>
      <ScrollLit
        as="h2"
        text={story.heading}
        className="max-w-[18ch] text-[length:var(--fs-h2)] font-bold leading-[1.04] tracking-[-.02em] [font-family:var(--font-display)]"
      />
      <p
        className="mt-[var(--gap-title)] max-w-[52ch] text-[16px] leading-[1.5] min-[821px]:text-[length:var(--fs-lead)]"
        style={{ color: "var(--flow-fg-2)" }}
      >
        {story.lead}
      </p>
    </Reveal>
  )
  return (
    <FlowSection ground="light" index="03" className={s.section}>
      <RetainStory header={header} />
    </FlowSection>
  )
}
