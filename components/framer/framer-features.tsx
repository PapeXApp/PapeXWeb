"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures"
import { Reveal, Spotlight } from "./anim"
import { FEATURES_BOTTOM, FEATURES_TOP } from "./constants"

// One flat sequence of 5 cards (top 3 + bottom 2) for the horizontal carousel.
const FEATURES = [...FEATURES_TOP, ...FEATURES_BOTTOM]

export function FramerFeatures() {
  // Embla initializes in an effect (SSR renders the full slide markup below, so
  // all 5 cards are present in server HTML with no hydration mismatch).
  //
  // dragFree:false → snap to cards. containScroll:'trimSnaps' trims dead snaps
  // at the ends so the first/last card align cleanly. The WheelGestures plugin
  // detects gesture axis: a horizontal-intent wheel/trackpad swipe moves the
  // carousel, while a vertical wheel is ignored by Embla and scrolls the page
  // natively. We deliberately do NOT set `forceWheelAxis`, which would trap
  // vertical scroll.
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: false, align: "start", dragFree: false, containScroll: "trimSnaps" },
    [WheelGesturesPlugin()]
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <section id="feature" className="features">
      <div className="framer-container">
        <Reveal as="header" direction="up" className="features-head">
          <p className="section-label">Features</p>
          <h2 className="section-title">Streamline finances with smart features.</h2>
        </Reveal>

        <div className="embla">
          <div className="embla__viewport" ref={emblaRef}>
            <div className="embla__container">
              {FEATURES.map((feature) => (
                <div className="embla__slide" key={feature.title}>
                  {/* Each slide hosts the original feature card design. hoverLift
                      + Spotlight card-glow are preserved per card. */}
                  <Reveal
                    as="article"
                    direction="up"
                    hoverLift
                    className="feature-card embla__slide-card"
                  >
                    <Spotlight
                      mode="card"
                      className="feature-card-glow"
                      color="rgba(255, 153, 51, 0.30)"
                      radius={300}
                      intensity={0.9}
                    >
                      <h4>{feature.title}</h4>
                      <p>{feature.description}</p>
                      <div className="feature-card-img">
                        <Image src={feature.image} alt={feature.alt} width={400} height={147} />
                      </div>
                    </Spotlight>
                  </Reveal>
                </div>
              ))}
            </div>
          </div>

          <div className="embla__controls">
            <div className="embla__buttons">
              <button
                type="button"
                className="embla__button embla__button--prev"
                aria-label="Previous feature"
                onClick={scrollPrev}
                disabled={!canPrev}
              >
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path
                    d="M15 6l-6 6 6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="embla__button embla__button--next"
                aria-label="Next feature"
                onClick={scrollNext}
                disabled={!canNext}
              >
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path
                    d="M9 6l6 6-6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="embla__dots" role="tablist" aria-label="Feature slides">
              {scrollSnaps.map((_, index) => (
                <button
                  type="button"
                  key={index}
                  className={
                    "embla__dot" + (index === selectedIndex ? " embla__dot--selected" : "")
                  }
                  aria-label={`Go to feature ${index + 1}`}
                  aria-selected={index === selectedIndex}
                  role="tab"
                  onClick={() => scrollTo(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
