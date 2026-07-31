import { Reveal } from "@/components/motion"
import { PlaceholderBox } from "./PlaceholderBox"
import { DashboardNotifyForm } from "./DashboardNotifyForm"
import { dashboard } from "./content"

export function DashboardPreview() {
  return (
    <section
      data-nav-theme="dark"
      className="px-[clamp(20px,5vw,56px)] py-[clamp(90px,11vw,160px)]"
      style={{ background: "var(--navy)", color: "var(--offwhite)" }}
    >
      <Reveal as="div" className="mx-auto max-w-[1000px] text-center">
        {/* Illustrative: the dashboard product doesn't exist yet — this whole
            block is clearly labelled "Coming soon" rather than presented as shipped. */}
        <div
          className="mb-[22px] inline-block rounded-full border px-[14px] py-1.5 text-[12px] font-semibold uppercase tracking-[.16em]"
          style={{ borderColor: "rgba(235,113,0,.4)", color: "var(--orange)" }}
        >
          {dashboard.pill}
        </div>
        <h2
          className="mx-auto max-w-[20ch] text-[clamp(30px,4.4vw,58px)] font-bold leading-[1.03] tracking-[-.02em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {dashboard.heading}
        </h2>
        <div className="mt-10">
          <PlaceholderBox
            label={dashboard.placeholderLabel}
            aspectRatio="16/9"
            theme="dark"
            stripeSize={14}
            borderRadius="18px"
          />
        </div>
        <DashboardNotifyForm />
      </Reveal>
    </section>
  )
}
