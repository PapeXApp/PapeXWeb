import Image from "next/image"
import { HOW_STEPS } from "./constants"

export function FramerHowItWorks() {
  return (
    <section id="how" className="how">
      <div className="container how-layout">
        <header className="how-head">
          <p className="section-label">How it works</p>
          <h2 className="section-title">Start getting value today.</h2>
        </header>
        <div className="how-steps">
          {HOW_STEPS.map((step) => (
            <article key={step.num} className="how-step">
              <div className="how-step-num">{step.num}</div>
              <h4>{step.title}</h4>
              <p>{step.description}</p>
              <div className="how-step-img">
                <Image src={step.image} alt={step.alt} width={536} height={320} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
