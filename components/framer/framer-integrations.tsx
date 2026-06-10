import Image from "next/image"
import { Reveal } from "./anim"
import { INTEGRATION_LOGOS } from "./constants"

const TRACK_B = [
  "/framer-assets/integration-4.png",
  "/framer-assets/integration-2.png",
  "/framer-assets/app-icon.png",
  "/framer-assets/integration-5.png",
  "/framer-assets/integration-1.png",
  "/framer-assets/integration-3.png",
  "/framer-assets/integration-bg.png",
] as const

/**
 * Seamless marquee track. The logo set is rendered twice in markup (the second
 * copy is aria-hidden so screen readers don't see duplicates). The CSS
 * `@keyframes marquee` translates the track by -50% — because the track is
 * exactly two identical copies wide, -50% lands precisely on the start of the
 * second copy, so the loop is visually seamless with no jump.
 *
 * Rendering both copies in markup keeps this fully SSR-safe (no effect, no DOM
 * mutation, no hydration mismatch). Hover-pause is handled in CSS
 * (.logo-track:hover { animation-play-state: paused }).
 */
function LogoTrack({ logos, reverse }: { logos: readonly string[]; reverse?: boolean }) {
  return (
    <div className={`logo-track${reverse ? " reverse" : ""}`}>
      {logos.map((src) => (
        <Image key={src} src={src} alt="Integration partner" width={80} height={40} />
      ))}
      {logos.map((src) => (
        <Image key={`dup-${src}`} src={src} alt="" aria-hidden width={80} height={40} />
      ))}
    </div>
  )
}

export function FramerIntegrations() {
  return (
    <section id="integration" className="integrations">
      <div className="framer-container">
        <Reveal as="header" direction="up" className="integrations-head">
          <p className="section-label">Integrations</p>
          <h2 className="section-title">Works with the tools you already use.</h2>
        </Reveal>
      </div>
      <div className="logo-marquee">
        <LogoTrack logos={INTEGRATION_LOGOS} />
        <LogoTrack logos={TRACK_B} reverse />
      </div>
    </section>
  )
}
