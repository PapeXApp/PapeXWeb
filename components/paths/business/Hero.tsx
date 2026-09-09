import Image from "next/image"
import { Phone } from "lucide-react"
import { WordReveal, ChildStagger, Ripple, Spotlight } from "@/components/motion"
import { hero } from "./content"

// Local, declarative-only keyframe for the RDH artwork's infinite float loop
// (`animation:floaty 7s` in the prototype, PapeX Home.dc.html:753). Plain CSS
// animation, not hand-rolled JS — the motion toolkit's `Loops` behaviors
// (`floaty`) aren't part of its exported component API, so it's recreated
// here scoped to this file. `prefers-reduced-motion` collapses it to static.
function HeroLoopStyles() {
  return (
    <style>{`
      @keyframes rdh-hero-floaty { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
      .rdh-hero-float { animation: rdh-hero-floaty 7s ease-in-out infinite }
      @media (prefers-reduced-motion: reduce) {
        .rdh-hero-float { animation: none }
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
                no-op. `data-magnetic` was removed from this CTA in the
                prototype delta (C8), so it's a plain Ripple button now. */}
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
            {/* Click-to-call chip (3.1b) — replaces the plain "or call" text span. */}
            <a
              href={hero.phoneHref}
              className="inline-flex items-center gap-[11px] rounded-full border px-5 py-[7px] no-underline transition-[border-color,box-shadow,transform] duration-[250ms] hover:-translate-y-px hover:shadow-[0_12px_28px_rgba(0,18,29,.13)]"
              style={{
                background: "var(--white)",
                borderColor: "rgba(0,18,29,.14)",
                boxShadow: "0 6px 18px rgba(0,18,29,.06)",
              }}
            >
              <span
                aria-hidden="true"
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
                style={{ background: "rgba(235,113,0,.12)" }}
              >
                <Phone size={15} strokeWidth={2.2} style={{ color: "var(--orange)" }} />
              </span>
              <span className="flex flex-col leading-[1.15]">
                <span
                  className="text-[11px] font-semibold uppercase tracking-[.14em]"
                  style={{ color: "rgba(0,18,29,.45)" }}
                >
                  {hero.phoneLabel}
                </span>
                <span className="text-[17px] font-bold tracking-[-.01em]" style={{ color: "var(--ink)" }}>
                  {hero.phone}
                </span>
              </span>
            </a>
          </div>
        </ChildStagger>

        {/* RDH device at the POS — real product artwork (3.1c), replacing the
            striped placeholder + stylized device card. */}
        <div className="flex items-center justify-center">
          <div className="rdh-hero-float">
            <Image
              src="/product/rdh-device.svg"
              alt={hero.deviceAlt}
              width={430}
              height={350}
              className="h-auto w-[clamp(300px,34vw,430px)]"
              style={{ filter: "drop-shadow(0 30px 60px rgba(0,18,29,.4))" }}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
