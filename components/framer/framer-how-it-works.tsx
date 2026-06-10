"use client"

import Image from "next/image"
import { useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useLenis } from "lenis/react"
import { Reveal } from "./anim"
import { HOW_STEPS } from "./constants"

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger)
}

const DESKTOP_PINNED = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)"
const MOBILE_REVEAL = "(max-width: 1023px) and (prefers-reduced-motion: no-preference)"

export function FramerHowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  // Lenis instance is only present on desktop (SmoothScroll mounts ReactLenis
  // for min-width:1024 + pointer:fine + no-reduced-motion). On mobile / touch /
  // reduced-motion it is undefined and the sync below simply no-ops.
  const lenis = useLenis()

  useGSAP(
    () => {
      const section = sectionRef.current
      const pin = pinRef.current
      const steps = stepsRef.current
      if (!section || !pin || !steps) return

      // ── Lenis ↔ ScrollTrigger sync ──────────────────────────────────────
      // ReactLenis runs autoRaf, so Lenis already ticks. We only need to tell
      // ScrollTrigger to recompute on every Lenis scroll. When Lenis is absent
      // (mobile / reduced-motion) native scroll drives ScrollTrigger normally.
      if (lenis) {
        lenis.on("scroll", ScrollTrigger.update)
      }

      const mm = gsap.matchMedia()

      // ── DESKTOP: pinned, step-by-step scroll-jacked sequence ────────────
      mm.add(DESKTOP_PINNED, () => {
        const stepEls = gsap.utils.toArray<HTMLElement>(".how-step", steps)
        const bars = progressRef.current
          ? gsap.utils.toArray<HTMLElement>(".how-progress-bar", progressRef.current)
          : []

        // Each step (except the first) gets a scroll segment to reveal itself.
        const segments = Math.max(stepEls.length - 1, 1)

        // Resting/initial state: stack steps, show the first, hide the rest.
        gsap.set(stepEls, { position: "absolute", inset: 0 })
        gsap.set(stepEls.slice(1), { autoAlpha: 0, yPercent: 12, scale: 0.96 })
        gsap.set(stepEls[0], { autoAlpha: 1, yPercent: 0, scale: 1 })
        if (bars[0]) gsap.set(bars[0], { scaleY: 1 })
        gsap.set(bars.slice(1), { scaleY: 0 })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            // One viewport-height of scroll per transition feels premium.
            end: () => "+=" + window.innerHeight * segments,
            pin: true,
            pinSpacing: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        stepEls.forEach((el, i) => {
          if (i === 0) return
          const prev = stepEls[i - 1]
          tl.to(prev, { autoAlpha: 0, yPercent: -12, scale: 0.96, ease: "power2.in" }, i - 1)
            .fromTo(
              el,
              { autoAlpha: 0, yPercent: 12, scale: 0.96 },
              { autoAlpha: 1, yPercent: 0, scale: 1, ease: "power2.out" },
              i - 1
            )
          if (bars[i]) {
            tl.to(bars[i], { scaleY: 1, ease: "none" }, i - 1)
          }
        })

        return () => {
          // matchMedia cleanup: GSAP reverts the set()/timeline, restoring the
          // natural stacked flow for the non-matching (mobile) layout.
        }
      })

      // ── MOBILE / TOUCH: gentle per-step fade-up reveal (no pin) ─────────
      mm.add(MOBILE_REVEAL, () => {
        const stepEls = gsap.utils.toArray<HTMLElement>(".how-step", steps)
        stepEls.forEach((el) => {
          gsap.from(el, {
            autoAlpha: 0,
            y: 24,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          })
        })
      })

      // Recompute trigger positions once fonts/layout settle.
      ScrollTrigger.refresh()
      const onLoad = () => ScrollTrigger.refresh()
      window.addEventListener("load", onLoad)

      return () => {
        if (lenis) lenis.off("scroll", ScrollTrigger.update)
        window.removeEventListener("load", onLoad)
        mm.revert()
      }
    },
    { scope: sectionRef, dependencies: [lenis] }
  )

  return (
    <section id="how" className="how" ref={sectionRef}>
      <div className="how-pin" ref={pinRef}>
        <div className="framer-container how-layout">
          <Reveal as="header" direction="up" className="how-head">
            <p className="section-label">How it works</p>
            <h2 className="section-title">Start getting value today.</h2>
          </Reveal>
          <div className="how-steps-wrap">
            <div className="how-steps" ref={stepsRef}>
              {HOW_STEPS.map((step) => (
                <article className="how-step" key={step.num}>
                  <div className="how-step-num">{step.num}</div>
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                  <div className="how-step-img">
                    <Image src={step.image} alt={step.alt} width={536} height={320} />
                  </div>
                </article>
              ))}
            </div>
            <div className="how-progress" ref={progressRef} aria-hidden>
              {HOW_STEPS.map((step) => (
                <span className="how-progress-track" key={step.num}>
                  <span className="how-progress-bar" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
