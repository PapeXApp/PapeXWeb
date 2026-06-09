import Image from "next/image"
import { FEATURES_BOTTOM, FEATURES_TOP } from "./constants"

export function FramerFeatures() {
  return (
    <section id="feature" className="features">
      <div className="container">
        <header className="features-head">
          <p className="section-label">Features</p>
          <h2 className="section-title">Streamline finances with smart features.</h2>
        </header>

        <div className="features-grid">
          {FEATURES_TOP.map((feature) => (
            <article key={feature.title} className="feature-card">
              <h4>{feature.title}</h4>
              <p>{feature.description}</p>
              <div className="feature-card-img">
                <Image src={feature.image} alt={feature.alt} width={400} height={147} />
              </div>
            </article>
          ))}
        </div>

        <div className="features-grid-bottom">
          {FEATURES_BOTTOM.map((feature) => (
            <article key={feature.title} className="feature-card">
              <h4>{feature.title}</h4>
              <p>{feature.description}</p>
              <div className="feature-card-img">
                <Image src={feature.image} alt={feature.alt} width={400} height={147} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
