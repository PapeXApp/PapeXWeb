import Link from "next/link";
import { Magnetic, Reveal, Ripple, ScrollLit } from "@/components/motion";
import { FlowSection } from "../shared/FlowSection";
import { SectionLabel } from "../shared/SectionLabel";
import { visionContent } from "./content";
import styles from "./customer.module.css";

/**
 * 2.8 Vision + CTA — light. Closing section of the customer path.
 * The statement is the path's one ScrollLit line: its words light up as it
 * scrolls through the viewport. The secondary button cross-navigates to the
 * business path — an intentional bridge between the two homes (README §2.8).
 */
export function Vision() {
  return (
    <FlowSection
      ground="light"
      index="07"
      style={{ padding: "clamp(64px,7vw,110px) clamp(20px,5vw,56px) clamp(90px,11vw,160px)" }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <Reveal variant="up">
          <SectionLabel index="07">{visionContent.eyebrow}</SectionLabel>
          <ScrollLit
            as="h2"
            text={visionContent.headline}
            className="[font-family:var(--font-display)] font-bold text-[clamp(32px,4.8vw,66px)] leading-[1.06] tracking-[-.02em]"
          />
          <p
            style={{
              marginTop: 24,
              fontSize: 18,
              lineHeight: 1.55,
              color: "var(--flow-fg-2)",
              maxWidth: "52ch",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {visionContent.body}
          </p>
        </Reveal>

        <Reveal variant="up" className="flex flex-wrap justify-center" style={{ marginTop: 48, gap: 16 }}>
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
                  boxShadow: "0 6px 22px rgba(235,113,0,.28)",
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
              color: "var(--flow-fg)",
              fontWeight: 600,
              fontSize: 16,
              border: "1.5px solid color-mix(in srgb, var(--flow-fg) 22%, transparent)",
            }}
          >
            {visionContent.secondaryCta}
          </Link>
        </Reveal>
      </div>
    </FlowSection>
  );
}
