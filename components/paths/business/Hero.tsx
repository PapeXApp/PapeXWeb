import { WordReveal, ChildStagger, Ripple, Magnetic, Spotlight } from "@/components/motion"
import { hero } from "./content"

// Local, declarative-only keyframes for the two infinite decorative loops in
// this section (the RDH card's float and its NFC ripple rings). These are
// plain CSS animations, not hand-rolled JS — the motion toolkit's `Loops`
// behaviors (`floaty`, `ripple`) aren't part of its exported component API,
// so they're recreated here scoped to this file. `prefers-reduced-motion`
// is honored by collapsing both to a static state.
function HeroLoopStyles() {
  return (
    <style>{`
      @keyframes rdh-hero-floaty { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
      @keyframes rdh-hero-ripple { 0% { transform: translate(-50%, -50%) scale(.35); opacity: .6 } 100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0 } }
      .rdh-hero-float { animation: rdh-hero-floaty 7s ease-in-out infinite }
      .rdh-hero-ring { animation: rdh-hero-ripple 2.4s ease-out infinite }
      .rdh-hero-ring--offset { animation-delay: 1.2s }
      @media (prefers-reduced-motion: reduce) {
        .rdh-hero-float { animation: none }
        .rdh-hero-ring { animation: none; opacity: 0 }
      }
    `}</style>
  )
}

export function Hero() {
  return (
    <section
      data-nav-theme="light"
      className="relative flex min-h-screen items-center overflow-hidden px-[clamp(20px,5vw,56px)] pb-20 pt-[120px]"
      style={{ background: "var(--offwhite)", color: "var(--ink)" }}
    >
      <HeroLoopStyles />
      <Spotlight
        strength={70}
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 70% at 22% 40%, rgba(235,113,0,.16), transparent 55%)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-[clamp(30px,5vw,70px)]">
        <ChildStagger className="max-w-[560px]">
          <div
            className="mb-[22px] text-[13px] font-semibold uppercase tracking-[.26em]"
            style={{ color: "var(--orange)" }}
          >
            {hero.eyebrow}
          </div>
          <WordReveal
            as="h1"
            className="text-[clamp(38px,5.6vw,80px)] font-bold leading-none tracking-[-.025em] [font-family:var(--font-display)]"
          >
            {hero.heading}
          </WordReveal>
          <p
            className="mt-[26px] max-w-[46ch] text-[clamp(17px,1.5vw,20px)] leading-[1.5]"
            style={{ color: "var(--muted-on-light)" }}
          >
            {hero.lead}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            {/* Jumps to the on-page demo form (section 3.7) — this page's own
                nav/global CTA wiring is owned by another agent, so the hero's
                local CTA is a self-contained, working anchor rather than a
                no-op. */}
            <Magnetic className="inline-block rounded-full">
              <Ripple as="div" variant="navy" className="inline-block overflow-hidden rounded-full">
                <a
                  href="#demo"
                  className="block rounded-full px-[30px] py-[15px] text-base font-semibold transition-shadow duration-300 hover:shadow-[0_12px_34px_rgba(235,113,0,.5)]"
                  style={{
                    background: "var(--orange)",
                    color: "var(--ink)",
                    boxShadow: "0 6px 22px rgba(235,113,0,.3)",
                  }}
                >
                  {hero.ctaLabel}
                </a>
              </Ripple>
            </Magnetic>
            <span className="text-sm" style={{ color: "rgba(0,18,29,.5)" }}>
              {hero.ctaSubtext}
            </span>
          </div>
        </ChildStagger>

        {/* RDH device at the POS — the tap moment is core narrative, styled in detail rather than placeholdered */}
        <div className="flex items-center justify-center">
          <div className="rdh-hero-float relative">
            <div
              className="relative flex w-[clamp(280px,32vw,400px)] items-center justify-center border"
              style={{
                aspectRatio: "1/1",
                borderRadius: "24px",
                borderColor: "rgba(255,255,255,.08)",
                background:
                  "repeating-linear-gradient(45deg, #0a2431 0 12px, #0c2937 12px 24px)",
              }}
            >
              <span
                role="img"
                aria-label={hero.devicePlaceholderLabel}
                className="absolute left-4 top-4 font-mono text-[13px] tracking-[.08em]"
                style={{ color: "rgba(245,245,245,.4)" }}
              >
                {hero.devicePlaceholderLabel}
              </span>

              {/* stylized device card — kept detailed per spec, real render swaps in later */}
              <div
                className="w-[64%] rounded-[18px] border px-[18px] py-[22px] text-center"
                style={{
                  background: "linear-gradient(160deg,#12303e,#081d27)",
                  borderColor: "rgba(255,255,255,.12)",
                  boxShadow: "0 30px 60px rgba(0,0,0,.4)",
                }}
              >
                <div
                  className="text-[15px] font-bold tracking-[.02em]"
                  style={{ color: "var(--offwhite)", fontFamily: "var(--font-display)" }}
                >
                  {hero.deviceCardTitle}
                </div>
                <div className="relative mx-auto mt-[18px] flex h-20 w-20 items-center justify-center">
                  <span
                    aria-hidden="true"
                    className="rdh-hero-ring absolute left-1/2 top-1/2 h-20 w-20 rounded-full border-2"
                    style={{ borderColor: "var(--orange)" }}
                  />
                  <span
                    aria-hidden="true"
                    className="rdh-hero-ring rdh-hero-ring--offset absolute left-1/2 top-1/2 h-20 w-20 rounded-full border-2"
                    style={{ borderColor: "var(--orange)" }}
                  />
                  <span
                    aria-hidden="true"
                    className="relative h-[34px] w-[34px] rounded-full"
                    style={{
                      background: "var(--orange)",
                      boxShadow: "0 0 0 8px rgba(235,113,0,.16)",
                    }}
                  />
                </div>
                <div
                  className="mt-4 text-[11px] font-semibold tracking-[.06em]"
                  style={{ color: "rgba(245,245,245,.7)" }}
                >
                  {hero.deviceTapLabel}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
