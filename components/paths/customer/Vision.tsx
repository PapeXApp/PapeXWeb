import Link from "next/link";
import { Magnetic, Reveal, Ripple, WordReveal } from "@/components/motion";
import { visionContent } from "./content";
import styles from "./customer.module.css";

/**
 * 2.8 Vision + CTA — light. Closing section of the customer path.
 * The secondary button cross-navigates to the merchant/business path — an
 * intentional bridge between the two homes (README §2.8). The business route
 * is owned by another agent; `/business` matches the README's suggested
 * production route naming (`/`, `/customers`, `/business`).
 */
export function Vision() {
  return (
    <section
      data-nav-theme="light"
      style={{
        background: "var(--offwhite)",
        color: "var(--navy)",
        padding: "clamp(90px,11vw,160px) clamp(20px,5vw,56px)",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <Reveal variant="up">
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: ".24em",
              textTransform: "uppercase",
              color: "var(--orange)",
              marginBottom: 20,
            }}
          >
            {visionContent.eyebrow}
          </div>
          <WordReveal
            as="h2"
            className="[font-family:var(--font-display)] font-bold text-[clamp(32px,4.8vw,66px)] leading-[1.03] tracking-[-.02em]"
          >
            {visionContent.headline}
          </WordReveal>
          <p
            style={{
              marginTop: 24,
              fontSize: 18,
              lineHeight: 1.55,
              color: "#5a5a5a",
              maxWidth: "52ch",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {visionContent.body}
          </p>
        </Reveal>

        <Reveal
          variant="up"
          className="flex flex-wrap justify-center"
          style={{ marginTop: 48, gap: 16 }}
        >
          <Magnetic>
            <Ripple variant="navy">
              <button
                type="button"
                className={styles.ctaButton}
                style={{
                  border: "none",
                  cursor: "pointer",
                  padding: "16px 34px",
                  borderRadius: 999,
                  background: "var(--orange)",
                  color: "var(--navy)",
                  fontWeight: 600,
                  fontSize: 16,
                  boxShadow: "0 6px 22px rgba(235,113,0,.3)",
                }}
              >
                {visionContent.primaryCta}
              </button>
            </Ripple>
          </Magnetic>
          <Link
            href="/business"
            className={styles.secondaryButton}
            style={{
              cursor: "pointer",
              padding: "16px 34px",
              borderRadius: 999,
              background: "transparent",
              color: "var(--navy)",
              fontWeight: 600,
              fontSize: 16,
              border: "1.5px solid rgba(0,18,29,.2)",
            }}
          >
            {visionContent.secondaryCta}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
