import Image from "next/image"
import { Reveal, RevealGroup, Spotlight } from "./anim"
import { FEATURES_BOTTOM, FEATURES_TOP } from "./constants"

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
            <Reveal as="article" direction="up" hoverLift key={feature.title} className="feature-card">
              {/* Card hover-glow: a soft brand light tracks the cursor inside the
                  card, painted behind the content (glowZIndex 0) with
                  pointer-events:none. Sits inside the hover-lift transform as a
                  background layer, so it composes with Phase 2 lift instead of
                  fighting it. */}
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
          ))}
        </RevealGroup>

        <RevealGroup as="div" stagger={0.1} className="features-grid-bottom">
          {FEATURES_BOTTOM.map((feature) => (
            <Reveal as="article" direction="up" hoverLift key={feature.title} className="feature-card">
              {/* Card hover-glow: a soft brand light tracks the cursor inside the
                  card, painted behind the content (glowZIndex 0) with
                  pointer-events:none. Sits inside the hover-lift transform as a
                  background layer, so it composes with Phase 2 lift instead of
                  fighting it. */}
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
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
