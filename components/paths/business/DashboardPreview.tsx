import Image from "next/image"
import type { CSSProperties, Ref } from "react"
import { SectionLabel } from "../shared/SectionLabel"
import { dashboard } from "./content"
import styles from "./business.module.css"

// The merchant dashboard (spec 3.6). Since Web 2.1 it is NOT its own section:
// the receipt scene in 02 already ends on a laptop opening onto this exact
// screenshot, so showing it again three sections later was a duplicate. Its
// copy is now the final act of that scene (FoldReceipt.tsx): as the laptop's
// lid opens it settles to the top of the screen and these pieces rise in
// directly under it — one moment, not a peek now and an explanation later.
//
// Two renderings of the same three pieces, never both at once:
//  - pinned (scroll-driven): FoldReceipt stacks an empty slot the laptop
//    opens into, then <DashboardCopy>, then <DashboardColumns>, and fades the
//    two in from scroll progress.
//  - <DashboardStatic>: server HTML, no-JS and reduced motion. The scene never
//    shows the laptop there, so this carries the screenshot as a plain image.
//
// All text is on the running ground, so it takes --flow-* ink.

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
      <SectionLabel>{dashboard.eyebrow}</SectionLabel>
      {/* --fs-h3, not --fs-h2: the heading sits under the laptop in the same
          screen, and every line it doesn't take is laptop height. */}
      <h2 className="max-w-[30ch] text-[length:var(--fs-h3)] font-bold leading-[1.06] tracking-[-.02em] [font-family:var(--font-display)]">
        {dashboard.heading}
      </h2>
      <p
        className="mt-[calc(var(--gap-title)*.6)] max-w-[60ch] text-[16px] leading-[1.5] min-[821px]:text-[length:var(--fs-lead)]"
        style={{ color: "var(--flow-fg-2)" }}
      >
        {dashboard.lead}
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
    <div ref={ref} className={className ?? styles.dashCols} style={style}>
      {dashboard.columns.map((column) => (
        <div key={column.title}>
          <div aria-hidden="true" className="mb-2 h-px w-10 min-[821px]:mb-3" style={{ background: "var(--orange)" }} />
          <h3
            className="text-[17px] font-bold leading-[1.2] min-[821px]:text-[20px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {column.title}
          </h3>
          <p
            className="mt-1 text-[14px] leading-[1.45] min-[821px]:mt-2 min-[821px]:text-[15.5px] min-[821px]:leading-[1.55]"
            style={{ color: "var(--flow-fg-2)" }}
          >
            {column.body}
          </p>
        </div>
      ))}
    </div>
  )
}

/** Reduced motion / no JS: the same copy, with the screenshot as an image. */
export function DashboardStatic() {
  return (
    <div className={styles.dashStatic}>
      <div
        className={`${styles.dashStaticShot} overflow-hidden rounded-[16px] border`}
        // A hairline from the running ground (was a fixed white 10%, which
        // vanished on light): --flow-hair is navy-on-light / white-on-navy.
        style={{ borderColor: "var(--flow-hair)", boxShadow: "0 30px 70px rgba(0,18,29,.22)" }}
      >
        <Image
          src="/product/merchant-dashboard.png"
          alt={dashboard.dashboardAlt}
          width={2880}
          height={1800}
          sizes="(min-width: 921px) 880px, 100vw"
          className="block h-auto w-full"
        />
      </div>
      <DashboardCopy className={styles.dashStaticCopy} />
      <DashboardColumns />
    </div>
  )
}
