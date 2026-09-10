import Image from "next/image"
import { Reveal } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { rdhDevice } from "./content"

// 3.5 The RDH device — light ground.
export function RdhDevice() {
  return (
    <FlowSection ground="light" index="04" className="px-[clamp(20px,5vw,56px)] py-[clamp(90px,11vw,160px)]">
      {/* The spec's fixed 1fr/1fr grid needs an explicit single-column
          collapse below the 820px breakpoint. */}
      <div className="mx-auto grid max-w-[1150px] grid-cols-1 items-center gap-[clamp(30px,5vw,70px)] max-[820px]:grid-cols-1 min-[821px]:grid-cols-2">
        <Reveal variant="mask" className="flex items-center justify-center p-[clamp(20px,4vw,44px)]">
          <Image
            src="/product/rdh-device.svg"
            alt={rdhDevice.deviceAlt}
            width={460}
            height={374}
            className="h-auto w-full max-w-[460px]"
            style={{ filter: "drop-shadow(0 26px 44px rgba(0,18,29,.22))" }}
          />
        </Reveal>

        <Reveal as="div">
          <SectionLabel index="04">{rdhDevice.eyebrow}</SectionLabel>
          <h2
            className="text-[clamp(28px,3.8vw,50px)] font-bold leading-[1.03] tracking-[-.02em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {rdhDevice.heading}
          </h2>
          <div className="mt-[26px] grid gap-3.5">
            {rdhDevice.points.map((point) => (
              <div key={point} className="flex items-start gap-3.5">
                <span aria-hidden="true" className="text-[18px] font-bold leading-[1.4]" style={{ color: "var(--orange)" }}>
                  →
                </span>
                <span className="text-[16px] leading-[1.45]" style={{ color: "var(--flow-fg-2)" }}>
                  {point}
                </span>
              </div>
            ))}
            <div className="flex items-start gap-3.5">
              <span aria-hidden="true" className="text-[18px] font-bold leading-[1.4]" style={{ color: "var(--orange)" }}>
                →
              </span>
              <span className="text-[16px] leading-[1.45]" style={{ color: "var(--flow-fg-2)" }}>
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
    </FlowSection>
  )
}
