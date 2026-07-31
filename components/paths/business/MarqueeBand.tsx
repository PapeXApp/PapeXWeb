import { Marquee } from "@/components/motion"
import { marquee } from "./content"

export function MarqueeBand() {
  return (
    <div
      data-nav-theme="light"
      className="overflow-hidden py-[15px]"
      style={{ background: "var(--orange)" }}
    >
      <Marquee duration={marquee.durationSeconds} className="whitespace-nowrap">
        <span
          className="inline-flex items-center text-[clamp(20px,2.3vw,30px)] font-bold"
          style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
        >
          {marquee.phrases.map((phrase) => (
            <span key={phrase} className="inline-flex items-center">
              <span className="px-[30px]">{phrase}</span>
              <i
                aria-hidden="true"
                className="inline-block h-[9px] w-[9px] rotate-45"
                style={{ background: "var(--ink)" }}
              />
            </span>
          ))}
        </span>
      </Marquee>
    </div>
  )
}
