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
// The heading stays this path's ScrollLit statement, in flow above the
// runway (a view-timeline freezes inside a sticky pin). B1's index.tsx wraps
// this section in <div id="how"> and keeps the calculator SLOT after it, so
// neither lives here.
export function WhyMerchants() {
  return (
    <FlowSection ground="light" index="03" className={s.section}>
      <div className="mx-auto max-w-[1150px]">
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

        <RetainStory />
      </div>
    </FlowSection>
  )
}
