import { Magnetic, Reveal, Ripple, ScrollLit } from "@/components/motion";
import { APP_STORE_URL } from "@/components/brand/links";
import { FlowSection } from "../shared/FlowSection";
import { SectionLabel } from "../shared/SectionLabel";
import { proofContent, visionContent } from "./content";
import styles from "./customer.module.css";

/**
 * 2.8 Vision + CTA — navy, the page's closing screen (flows straight into the
 * navy footer). The statement is the path's one ScrollLit line: its words
 * light up as it scrolls through the viewport.
 *
 * 2026-09-23 (Nico): this is now the ONE close of the page.
 *   - The "At a glance" section (Proof.tsx, was 06) is gone. Its three
 *     product facts are the only concrete claims it carried, so they live
 *     here as a compact strip between the statement and the CTA — same
 *     words (proofContent in content.ts), no new claims. Section numbering
 *     closes up: this was [07], it is [06].
 *   - "Get the RDH" is gone: customers don't buy the reader. "Download the
 *     app" is the only CTA (visionContent.secondaryCta was deleted at the
 *     2.1 merge).
 *   - A full screen from 821px (`styles.screen`), content centred in it.
 */
export function Vision() {
  return (
    <FlowSection
      ground="navy"
      index="06"
      className={`${styles.screen} ${styles.rhythm}`}
      style={{ padding: "var(--section-pad) clamp(20px,5vw,56px)" }}
    >
      <div className="w-full" style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <Reveal variant="up">
          <SectionLabel index="06">{visionContent.eyebrow}</SectionLabel>
          <ScrollLit
            as="h2"
            text={visionContent.headline}
            className="[font-family:var(--font-display)] font-bold text-[length:var(--fs-h2-emphasis)] leading-[1.06] tracking-[-.02em]"
          />
          <p
            style={{
              marginTop: "var(--gap-title)",
              fontSize: "var(--fs-lead)",
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

        {/* The three product facts from the retired "At a glance" section,
            folded in compactly. From 821px: one hairline-split row of three,
            digit over label. Below: a narrow left-aligned list, digit beside
            label, split by hairlines — the old section's phone layout, which
            keeps the longest label to two lines at 390px. Digit and label keep
            06's treatment (orange display figure, mono label) at a closing-
            section scale. Static figures, not count-ups: they are facts, not
            metrics that grew. Hairlines use --flow-hair so they follow the
            ground while it crossfades. */}
        <Reveal variant="up">
          <ul
            className="mx-auto mt-[var(--gap-body)] grid max-w-[360px] grid-cols-1 divide-y divide-[color:var(--flow-hair)] min-[821px]:max-w-[880px] min-[821px]:grid-cols-3 min-[821px]:divide-x min-[821px]:divide-y-0"
            aria-label="PapeX at a glance"
          >
            {proofContent.counters.map((fact) => (
              <li
                key={fact.label}
                className="flex items-center gap-4 py-3 text-left min-[821px]:flex-col min-[821px]:gap-1.5 min-[821px]:px-[clamp(12px,2vw,24px)] min-[821px]:py-0 min-[821px]:text-center"
              >
                <span className="min-w-[1ch] [font-family:var(--font-display)] text-[clamp(34px,3.4vw,46px)] font-bold leading-none tracking-[-.02em] text-[var(--orange)] [font-variant-numeric:tabular-nums]">
                  {fact.value}
                </span>
                <span
                  className="text-[11.5px] min-[821px]:max-w-[30ch] font-medium uppercase leading-[1.5] tracking-[.1em]"
                  style={{ fontFamily: "var(--font-label)", color: "var(--flow-fg-2)" }}
                >
                  {fact.label}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal variant="up" className="flex justify-center" style={{ marginTop: "var(--gap-body)" }}>
          <Magnetic className={styles.ctaMagnetic}>
            {/* The glow and the press scale live on the Ripple (styles.ctaPill),
                the element that IS the pill — see .ctaPill in
                customer.module.css for why. */}
            <Ripple variant="navy" className={`overflow-hidden rounded-full ${styles.ctaPill}`}>
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaButton}
                style={{
                  border: "none",
                  cursor: "pointer",
                  padding: "17px 38px",
                  borderRadius: 999,
                  background: "var(--orange)",
                  color: "var(--navy)",
                  fontWeight: 600,
                  fontSize: 17,
                  textDecoration: "none",
                  display: "inline-flex",
                }}
              >
                {visionContent.primaryCta}
              </a>
            </Ripple>
          </Magnetic>
        </Reveal>
      </div>
    </FlowSection>
  );
}
