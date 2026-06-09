"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"
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

function LogoTrack({ logos, reverse }: { logos: readonly string[]; reverse?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track || track.children.length > logos.length) return
    const items = [...track.children]
    items.forEach((logo) => track.appendChild(logo.cloneNode(true)))
  }, [logos.length])

  return (
    <div ref={trackRef} className={`logo-track${reverse ? " reverse" : ""}`}>
      {logos.map((src) => (
        <Image key={src} src={src} alt="Integration partner" width={80} height={40} />
      ))}
    </div>
  )
}

export function FramerIntegrations() {
  return (
    <section id="integration" className="integrations">
      <div className="framer-container">
        <header className="integrations-head">
          <p className="section-label">Integrations</p>
          <h2 className="section-title">Works with the tools you already use.</h2>
        </header>
      </div>
      <div className="logo-marquee">
        <LogoTrack logos={INTEGRATION_LOGOS} />
        <LogoTrack logos={TRACK_B} reverse />
      </div>
    </section>
  )
}
