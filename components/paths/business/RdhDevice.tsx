import { Reveal } from "@/components/motion"
import { PlaceholderBox } from "./PlaceholderBox"
import { rdhDevice } from "./content"

export function RdhDevice() {
  return (
    <section
      data-nav-theme="light"
      className="px-[clamp(20px,5vw,56px)] py-[clamp(90px,11vw,160px)]"
      style={{ background: "var(--white)", color: "var(--ink)" }}
    >
      {/* The spec's fixed 1fr/1fr grid needs an explicit single-column
          collapse below the 820px breakpoint. */}
      <div className="mx-auto grid max-w-[1150px] grid-cols-1 items-center gap-[clamp(30px,5vw,70px)] max-[820px]:grid-cols-1 min-[821px]:grid-cols-2">
        <Reveal variant="mask">
          <PlaceholderBox
            label={rdhDevice.placeholderLabel}
            aspectRatio="1/1"
            theme="light"
            borderRadius="22px"
          />
        </Reveal>

        <Reveal as="div">
          <div
            className="mb-4 text-[13px] font-semibold uppercase tracking-[.24em]"
            style={{ color: "var(--orange)" }}
          >
            {rdhDevice.eyebrow}
          </div>
          <h2
            className="text-[clamp(28px,3.8vw,50px)] font-bold leading-[1.03] tracking-[-.02em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {rdhDevice.heading}
          </h2>
          <div className="mt-[26px] grid gap-3.5">
            {rdhDevice.points.map((point) => (
              <div key={point} className="flex items-start gap-3.5">
                <span
                  aria-hidden="true"
                  className="text-[18px] font-bold leading-[1.4]"
                  style={{ color: "var(--orange)" }}
                >
                  →
                </span>
                <span className="text-[16px] leading-[1.45]" style={{ color: "#4a4a4a" }}>
                  {point}
                </span>
              </div>
            ))}
            <div className="flex items-start gap-3.5">
              <span
                aria-hidden="true"
                className="text-[18px] font-bold leading-[1.4]"
                style={{ color: "var(--orange)" }}
              >
                →
              </span>
              <span className="text-[16px] leading-[1.45]" style={{ color: "#4a4a4a" }}>
                {rdhDevice.complianceText}{" "}
                {/* No PCI documentation page exists yet in this repo — matching the
                    prototype, this stays a styled cue rather than a link to an
                    invented destination. */}
                <span className="cursor-pointer" style={{ color: "var(--orange)" }}>
                  {rdhDevice.complianceLinkLabel}
                </span>
                .
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
