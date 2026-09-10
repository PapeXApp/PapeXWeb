import { Counter, Parallax, Reveal } from "@/components/motion";
import { Atmosphere } from "./Atmosphere";
import { proofContent } from "./content";

/** 2.7 Social proof — dark. Counters animate once on reveal; logos are illustrative placeholders. */
export function Proof() {
  return (
    <section
      data-nav-theme="dark"
      className="relative"
      style={{
        background: "var(--navy)",
        color: "var(--offwhite)",
        padding: "clamp(90px,11vw,160px) clamp(20px,5vw,56px)",
      }}
    >
      {/* HowItWorks above is off-white — bleed it down so the band change is
          a fade rather than a cut. */}
      <Atmosphere tone="dark" seam="top" lines="none" />

      <Parallax factor={0.06} className="pointer-events-none absolute inset-0">
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(80% 60% at 50% 0%, rgba(235,113,0,.1), transparent 60%)",
          }}
        />
      </Parallax>

      <div className="relative" style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Presentation only — the numbers themselves are still the
            illustrative placeholders flagged in content.ts and need real data
            before launch. Each stat is a cell in one hairline-framed strip with
            dividers between, tabular figures so the counting-up doesn't jitter
            the width, and a tracked caps label under a short orange rule. */}
        <Reveal
          variant="up"
          className="grid text-center"
          style={{
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            borderRadius: 24,
            border: "1px solid rgba(245,245,245,.10)",
            background: "linear-gradient(180deg, rgba(245,245,245,.045), rgba(245,245,245,.015))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.07), 0 30px 60px rgba(0,0,0,.25)",
            overflow: "hidden",
          }}
        >
          {proofContent.counters.map((counter, index) => (
            <div
              key={counter.label}
              style={{
                padding: "clamp(28px,4vw,48px) clamp(16px,2vw,28px)",
                borderLeft: index === 0 ? "none" : "1px solid rgba(245,245,245,.08)",
              }}
            >
              <Counter
                value={counter.value}
                className="block [font-family:var(--font-display)] font-bold text-[clamp(40px,5.2vw,68px)] leading-none tracking-[-.02em] text-[var(--orange)] [font-variant-numeric:tabular-nums]"
              />
              <div
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 2,
                  margin: "18px auto 14px",
                  borderRadius: 2,
                  background: "linear-gradient(90deg, transparent, rgba(235,113,0,.8), transparent)",
                }}
              />
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  color: "rgba(245,245,245,.62)",
                }}
              >
                {counter.label}
              </div>
            </div>
          ))}
        </Reveal>

        <Reveal
          variant="up"
          className="grid"
          style={{
            marginTop: "clamp(50px,6vw,80px)",
            gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
            gap: 16,
          }}
        >
          {Array.from({ length: proofContent.pressLogoSlots }).map((_, index) => (
            <div
              // static placeholder slots — order never changes, index is a stable key
              key={index}
              aria-hidden="true"
              className="flex items-center justify-center text-center"
              style={{
                height: 64,
                borderRadius: 12,
                border: "1px dashed rgba(245,245,245,.16)",
                /* TODO: promote to token — Courier New mono placeholder face has no shared var yet. */
                fontFamily: "'Courier New', monospace",
                fontSize: 12,
                color: "rgba(245,245,245,.35)",
              }}
            >
              [ press logo ]
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
