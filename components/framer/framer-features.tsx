import Image from "next/image"
import { Reveal, RevealGroup } from "./anim"
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
            <Reveal as="article" direction="up" key={feature.title} className="feature-card">
              <h4>{feature.title}</h4>
              <p>{feature.description}</p>
              <div className="feature-card-img">
                <Image src={feature.image} alt={feature.alt} width={400} height={147} />
              </div>
            </Reveal>
          ))}
        </RevealGroup>

        <RevealGroup as="div" stagger={0.1} className="features-grid-bottom">
          {FEATURES_BOTTOM.map((feature) => (
            <Reveal as="article" direction="up" key={feature.title} className="feature-card">
              <h4>{feature.title}</h4>
              <p>{feature.description}</p>
              <div className="feature-card-img">
                <Image src={feature.image} alt={feature.alt} width={400} height={147} />
              </div>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
