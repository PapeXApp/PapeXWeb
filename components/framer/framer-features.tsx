import Image from "next/image"
import { Reveal, RevealGroup, Spotlight, Tilt } from "./anim"
import { FEATURES_BOTTOM, FEATURES_TOP } from "./constants"

type Feature = (typeof FEATURES_TOP)[number] | (typeof FEATURES_BOTTOM)[number]

/**
 * One feature card, layered for tactility:
 *  - Reveal (scroll entrance, staggered by the parent RevealGroup) on a
 *    perspective wrapper so the tilt has real depth
 *  - Tilt: 3D pointer tilt + hover lift on desktop, tap-press on touch
 *  - Spotlight: cursor-tracking brand glow painted behind the content
 */
function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <Reveal as="div" direction="up" className="feature-card-outer">
      <Tilt className="feature-card">
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
      </Tilt>
    </Reveal>
  )
}

export function FramerFeatures() {
  return (
    <section id="feature" className="features">
      <div className="framer-container">
        <Reveal as="header" direction="up" className="features-head">
          <p className="section-label">Features</p>
          <h2 className="section-title">Streamline finances with smart features.</h2>
        </Reveal>

        <RevealGroup as="div" stagger={0.1} className="features-grid">
          {FEATURES_TOP.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </RevealGroup>

        <RevealGroup as="div" stagger={0.1} className="features-grid-bottom">
          {FEATURES_BOTTOM.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
