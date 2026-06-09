import Image from "next/image"
import { APP_DOWNLOAD_URL } from "./constants"

export function FramerHero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-sky" aria-hidden="true">
        <Image src="/framer-assets/hero-clouds.png" alt="" fill priority sizes="100vw" style={{ objectFit: "cover", objectPosition: "center bottom" }} />
      </div>
      <div className="hero-inner">
        <div className="hero-copy">
          <h1 id="hero-title">
            Stop losing money
            <br />
            to missing receipts.
          </h1>
          <p className="hero-desc">
            PapeX automatically captures and organizes every transaction after purchase, so nothing gets lost, and every
            deduction is accounted for.
          </p>
        </div>

        <div className="hero-visual">
          <Image
            className="hero-phone"
            src="/framer-assets/phone-mockup.png"
            alt="PapeX app on iPhone showing recent receipts and spending"
            width={320}
            height={572}
            priority
          />

          <div className="hero-float hero-float--receipt hero-card-white">
            <div className="card-row">
              <div className="card-icon" aria-hidden="true">
                ★
              </div>
              <div>
                <div className="card-title">Receipt saved automatically</div>
                <div className="card-sub">You spent $167.24 at Walmart</div>
              </div>
            </div>
          </div>

          <div className="hero-float hero-float--expense hero-card-white strong">
            <div className="card-meta">August Expense Summary</div>
            <div className="card-amount">$167.24</div>
            <div className="card-detail">Across 37 receipts</div>
          </div>

          <div className="hero-float hero-float--pos hero-pill">
            <div className="pill-title">POS Connected</div>
            <div className="pill-sub">Receipts flow directly to your phone</div>
          </div>

          <div className="hero-float hero-float--tax hero-pill">
            <div className="pill-title">Tax Ready</div>
            <div className="pill-sub">Business expenses organized year-round</div>
          </div>

          <div className="hero-float hero-float--family hero-card-white">
            <div className="card-title">You were added to the group &quot;Smith Family&quot;</div>
            <div className="card-sub">Share receipts with Mom and 3 others</div>
          </div>

          <div className="hero-float hero-float--find hero-pill">
            <div className="pill-title">Find Any Receipt</div>
            <div className="pill-sub">Search by store, date, or amount</div>
          </div>
        </div>

        <div className="hero-cta-wrap">
          <a href={APP_DOWNLOAD_URL} className="btn-download" target="_blank" rel="noopener noreferrer">
            Download App
          </a>
        </div>
      </div>
    </section>
  )
}
