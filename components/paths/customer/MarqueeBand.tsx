import { Marquee } from "@/components/motion";
import { marqueeContent } from "./content";

/** 2.3 Marquee — orange full-bleed band. */
export function MarqueeBand() {
  return (
    <div data-nav-theme="dark" style={{ background: "var(--orange)", overflow: "hidden", padding: "15px 0" }}>
      <Marquee duration={marqueeContent.durationSeconds}>
        <span className="inline-flex items-center" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(20px,2.3vw,30px)", color: "var(--navy)" }}>
          {marqueeContent.phrases.map((phrase) => (
            <span key={phrase} className="inline-flex items-center">
              <span style={{ padding: "0 30px" }}>{phrase}</span>
              <i
                aria-hidden="true"
                style={{
                  width: 9,
                  height: 9,
                  background: "var(--navy)",
                  transform: "rotate(45deg)",
                  display: "inline-block",
                }}
              />
            </span>
          ))}
        </span>
      </Marquee>
    </div>
  );
}
