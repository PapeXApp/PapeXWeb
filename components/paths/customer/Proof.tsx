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
      style={{ padding: "var(--section-pad) clamp(20px,5vw,56px)" }}
    >
      <div style={{ maxWidth: 1150, margin: "0 auto" }}>
        <Reveal variant="up">
          <SectionLabel index="06">{LABEL}</SectionLabel>
          <h2 className="sr-only">At a glance</h2>
        </Reveal>
        {/* ONE compact hairline strip (2026-09-22). This used to be three
            ~300px-tall stacked cells — digit, orange rule, label — which gave
            three product facts the visual weight of a full section. Now it is
            a single ~150px band: digit LEFT, label RIGHT, cells split by the
            ground's hairline token so the strip never turns into a stray box
            while the ground crossfades. `divide-x` flips to `divide-y` in the
            single-column stack below 720px, so the dividers stay between
            cells in both directions. Font sizes are untouched (a follow-up
            worker owns type) — the 96px display digit is what sets the band's
            height. */}
        <div
          className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] divide-x divide-[color:var(--flow-hair)] max-[719px]:grid-cols-1 max-[719px]:divide-x-0 max-[719px]:divide-y"
          style={{
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
              className="flex items-center gap-[clamp(14px,1.8vw,22px)]"
              style={{ padding: "clamp(20px,2.4vw,28px) clamp(18px,2.2vw,28px)" }}
            >
              <span className="[font-family:var(--font-display)] font-bold text-[length:var(--fs-stat)] leading-none tracking-[-.02em] text-[var(--orange)] [font-variant-numeric:tabular-nums]">
                {fact.value}
              </span>
              <div
                style={{
                  fontFamily: "var(--font-label)",
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: ".14em",
                  lineHeight: 1.5,
                  textTransform: "uppercase",
                  color: "var(--flow-fg-2)",
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
