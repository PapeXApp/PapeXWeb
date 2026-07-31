import { Counter, Parallax, Reveal } from "@/components/motion";
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
        <Reveal
          variant="up"
          className="grid text-center"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "clamp(24px,4vw,60px)" }}
        >
          {proofContent.counters.map((counter) => (
            <div key={counter.label}>
              <Counter
                value={counter.value}
                className="block [font-family:var(--font-display)] font-bold text-[clamp(44px,6vw,80px)] leading-none text-[var(--orange)]"
              />
              <div style={{ marginTop: 8, fontSize: 15, color: "rgba(245,245,245,.6)", letterSpacing: ".02em" }}>
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
