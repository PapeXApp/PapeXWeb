import type { CSSProperties, Ref } from "react"
import { cn } from "@/lib/utils"
import { SectionLabel } from "../shared/SectionLabel"
import { storyDashboard } from "./story"
import s from "./story.module.css"

// The dashboard's info — the last beat of the "Tap to Retain" scroll story
// (story/RetainStory.tsx). The heading (DashboardCopy) rises in under the
// docked laptop inside the pinned screen; the three columns and the customer
// line follow the scene in normal flow, with room around them (W3, Nico:
// "too cluttered; add space"), in both the scene and the reduced-motion
// version (story/StaticStory.tsx).
//
// Copy lives in story.ts (B5's file), not business/content.ts. All text sits
// on the running ground, so it takes --flow-* ink.

export function DashboardCopy({
  className,
  style,
  ref,
}: {
  className?: string
  style?: CSSProperties
  ref?: Ref<HTMLDivElement>
}) {
  return (
    <div ref={ref} className={className} style={style}>
      <SectionLabel>{storyDashboard.eyebrow}</SectionLabel>
      {/* --fs-h3, not --fs-h2: it shares the screen with the laptop above it. */}
      <h3 className="mx-auto max-w-[30ch] text-[length:var(--fs-h3)] font-bold leading-[1.06] tracking-[-.02em] [font-family:var(--font-display)]">
        {storyDashboard.heading}
      </h3>
      <p
        className="mx-auto mt-[calc(var(--gap-title,24px)*.5)] max-w-[60ch] text-[15px] leading-[1.5] min-[821px]:text-[length:var(--fs-lead)]"
        style={{ color: "var(--flow-fg-2)" }}
      >
        {storyDashboard.lead}
      </p>
    </div>
  )
}

export function DashboardColumns({
  className,
  style,
  ref,
}: {
  className?: string
  style?: CSSProperties
  ref?: Ref<HTMLDivElement>
}) {
  return (
    <div ref={ref} className={cn(s.cols, className)} style={style}>
      {storyDashboard.columns.map((column) => (
        <div key={column.title}>
          <div aria-hidden="true" className={s.colRule} />
          <h4 className={s.colTitle}>{column.title}</h4>
          <p className={s.colBody}>{column.body}</p>
        </div>
      ))}
    </div>
  )
}

/** The customer's side of the value, in one line. */
export function CustomerLine({
  className,
  style,
  ref,
}: {
  className?: string
  style?: CSSProperties
  ref?: Ref<HTMLParagraphElement>
}) {
  return (
    <p ref={ref} className={cn(s.customerLine, className)} style={style}>
      <strong>{storyDashboard.customerLine.lead}</strong> {storyDashboard.customerLine.body}
    </p>
  )
}
