import Image from "next/image"
import { Reveal, RevealGroup } from "./anim"
import { HOW_STEPS } from "./constants"

export function FramerHowItWorks() {
  return (
    <section id="how" className="how">
      <div className="framer-container how-layout">
        <Reveal as="header" direction="up" className="how-head">
          <p className="section-label">How it works</p>
          <h2 className="section-title">Start getting value today.</h2>
        </Reveal>
        <RevealGroup as="div" stagger={0.1} className="how-steps">
          {HOW_STEPS.map((step) => (
            <Reveal as="article" direction="up" key={step.num} className="how-step">
              <div className="how-step-num">{step.num}</div>
              <h4>{step.title}</h4>
              <p>{step.description}</p>
              <div className="how-step-img">
                <Image src={step.image} alt={step.alt} width={536} height={320} />
              </div>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
