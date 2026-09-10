import Image from "next/image"
import { Phone } from "lucide-react"
import { WordReveal, ChildStagger, Ripple, Spotlight } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
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

// 3.1 Hero — NAVY. The fork's navy top half leads here (2026-09-10), so the
// page opens on the same flat #00121D and the commit reads as that half
// growing. FlowGround (`initial="navy"`) paints the ground; this section only
// declares it, and its text uses the ground's --flow-* ink.
export function Hero() {
  return (
    <FlowSection
      ground="navy"
      className="flex min-h-screen items-center overflow-hidden px-[clamp(20px,5vw,56px)] pb-20 pt-[120px]"
    >
      <HeroLoopStyles />
      <Spotlight
        strength={70}
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(80% 70% at 22% 40%, rgba(235,113,0,.15), transparent 55%)",
        }}
      />

      {/* Text column gets the larger share: at an even split the 80px
          headline broke into five one-word lines. */}
      <div className="relative mx-auto grid w-full max-w-[1150px] grid-cols-1 items-center gap-[clamp(30px,5vw,70px)] min-[900px]:grid-cols-[1.14fr_.86fr]">
        <ChildStagger className="max-w-[620px]">
          <SectionLabel index="01">{hero.eyebrow}</SectionLabel>
          <WordReveal
            as="h1"
            className="text-[clamp(38px,5.1vw,74px)] font-bold leading-[1.02] tracking-[-.025em] [font-family:var(--font-display)]"
          >
            {hero.heading}
          </WordReveal>
          <p
            className="mt-[26px] max-w-[46ch] text-[clamp(17px,1.5vw,20px)] leading-[1.5]"
            style={{ color: "var(--flow-fg-2)" }}
          >
            {hero.lead}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            {/* Jumps to the on-page demo form (section 3.7). */}
            <Ripple as="div" variant="navy" className="inline-block overflow-hidden rounded-full">
              <a
                href="#demo"
                className="block rounded-full px-[30px] py-[15px] text-base font-semibold transition-shadow duration-300 hover:shadow-[0_12px_34px_rgba(235,113,0,.5)]"
                style={{
                  background: "var(--orange)",
                  color: "var(--navy)",
                  boxShadow: "0 6px 22px rgba(235,113,0,.3)",
                }}
              >
                {hero.ctaLabel}
              </a>
            </Ripple>
            {/* Click-to-call chip (3.1b) — dark glass on the navy hero. Its
                fill, border and ink are derived from the ground's ink, so it
                stays legible if the ground crossfades while it's on screen. */}
            <a
              href={hero.phoneHref}
              className="inline-flex items-center gap-[11px] rounded-full border px-5 py-[7px] no-underline transition-[border-color,box-shadow,transform] duration-[250ms] hover:-translate-y-px hover:border-[rgba(235,113,0,.45)]"
              style={{
                background: "color-mix(in srgb, var(--flow-fg) 6%, transparent)",
                borderColor: "color-mix(in srgb, var(--flow-fg) 14%, transparent)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
                backdropFilter: "blur(14px) saturate(140%)",
                WebkitBackdropFilter: "blur(14px) saturate(140%)",
              }}
            >
              <span
                aria-hidden="true"
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
                style={{ background: "rgba(235,113,0,.16)" }}
              >
                <Phone size={15} strokeWidth={2.2} style={{ color: "var(--orange)" }} />
              </span>
              <span className="flex flex-col leading-[1.15]">
                <span
                  className="text-[11px] font-semibold uppercase tracking-[.14em]"
                  style={{ color: "var(--flow-fg-3)" }}
                >
                  {hero.phoneLabel}
                </span>
                <span className="text-[17px] font-bold tracking-[-.01em]" style={{ color: "var(--flow-fg)" }}>
                  {hero.phone}
                </span>
              </span>
            </a>
          </div>
        </ChildStagger>

        {/* RDH device at the POS — real product artwork (3.1c). */}
        <div className="flex items-center justify-center">
          <div className="rdh-hero-float">
            <Image
              src="/product/rdh-device.svg"
              alt={hero.deviceAlt}
              width={430}
              height={350}
              className="h-auto w-[clamp(300px,34vw,430px)]"
              style={{ filter: "drop-shadow(0 30px 60px rgba(0,0,0,.45))" }}
              priority
            />
          </div>
        </div>
      </div>
    </FlowSection>
  )
}
