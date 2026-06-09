import Link from "next/link"
import { APP_DOWNLOAD_URL, PRICING_PLANS } from "./constants"

export function FramerPricing() {
  return (
    <section id="pricing" className="pricing">
      <div className="container">
        <header className="pricing-head">
          <p className="section-label">Pricing</p>
          <h2 className="section-title">Simple plans. Clear value.</h2>
          <p className="section-intro">
            Start free. Upgrade when you need exports, teams, or deeper integrations.
          </p>
        </header>

        <div className="pricing-grid">
          {PRICING_PLANS.map((plan) => {
            const cta =
              plan.ctaType === "download" ? (
                <a
                  href={APP_DOWNLOAD_URL}
                  className="btn-download pricing-cta"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {plan.ctaLabel}
                </a>
              ) : (
                <Link href={plan.ctaHref ?? "/contact"} className="btn-download pricing-cta">
                  {plan.ctaLabel}
                </Link>
              )

            return (
              <article
                key={plan.name}
                className={`pricing-card${plan.featured ? " pricing-card--featured" : ""}`}
              >
                <div className={`pricing-card-head${plan.tag ? " pricing-card-head--split" : ""}`}>
                  <h3 className="pricing-plan-name">{plan.name}</h3>
                  {plan.tag ? <span className="pricing-tag">{plan.tag}</span> : null}
                </div>
                <div className="pricing-card-body">
                  <div className="pricing-price-row">
                    <span className="pricing-amount">{plan.price}</span>
                    <span className="pricing-period">{plan.period}</span>
                  </div>
                  <ul className="pricing-features">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
                {cta}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
