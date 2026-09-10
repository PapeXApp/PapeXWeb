import { Reveal } from "@/components/motion";
import { FlowSection } from "../shared/FlowSection";
import { SectionLabel } from "../shared/SectionLabel";
import { proofContent } from "./content";

/** Section label. Not in content.ts (read-only for this workstream) — it is
 *  interface copy, not a claim. */
const LABEL = "At a glance";

/**
 * 2.7 Product facts — navy ground.
 *
 * These are PRODUCT FACTS (1 tap, 0 apps to download first, 2 ways to open
 * it), not usage stats, so they are set as large STATIC tabular figures and
 * come in with the standard blur-in reveal. Counting up to 0 or 1 would be
 * silly, and a count-up implies a metric that grew. The press-logo row is
 * gone until there are outlets we can name.
 */
export function Proof() {
  return (
    <FlowSection
      ground="navy"
      index="06"
      style={{ padding: "clamp(90px,11vw,160px) clamp(20px,5vw,56px) clamp(64px,7vw,110px)" }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal variant="up">
          <SectionLabel index="06">{LABEL}</SectionLabel>
        </Reveal>
        {/* One hairline-framed strip, cells split by hairlines. Frame and
            dividers use the ground's hairline token so the strip never turns
            into a stray box while the ground crossfades. */}
        <div
          className="grid text-center"
          style={{
            marginTop: 8,
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            borderRadius: 16,
            border: "1px solid var(--flow-hair)",
            overflow: "hidden",
          }}
        >
          {proofContent.counters.map((fact, index) => (
            <Reveal
              key={fact.label}
              variant="up"
              delay={index * 0.09}
              style={{
                padding: "clamp(34px,4.4vw,56px) clamp(18px,2.4vw,32px)",
                borderLeft: index === 0 ? "none" : "1px solid var(--flow-hair)",
              }}
            >
              <span className="block [font-family:var(--font-display)] font-bold text-[clamp(56px,7vw,96px)] leading-none tracking-[-.02em] text-[var(--orange)] [font-variant-numeric:tabular-nums]">
                {fact.value}
              </span>
              <div
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 1,
                  margin: "22px auto 16px",
                  background: "linear-gradient(90deg, transparent, rgba(235,113,0,.85), transparent)",
                }}
              />
              <div
                style={{
                  fontFamily: "var(--font-label)",
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: ".14em",
                  lineHeight: 1.5,
                  textTransform: "uppercase",
                  color: "var(--flow-fg-2)",
                  maxWidth: "26ch",
                  margin: "0 auto",
                }}
              >
                {fact.label}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </FlowSection>
  );
}
