import { Reveal, WordReveal } from "@/components/motion";
import { FlowSection } from "../shared/FlowSection";
import { PointerLitGroup } from "../shared/PointerLit";
import { SectionLabel } from "../shared/SectionLabel";
import { ReceiptListShot, ShareSheetShot } from "./FeatureScreens";
import { featuresContent } from "./content";

/**
 * 2.5 Features — NAVY ground since 2026-09-22 (was light). The customer page
 * now reads light, light, light, NAVY, light, navy, navy, footer navy: the
 * app shots get one dark beat in the middle of the light run, and Proof/Vision
 * close on the second. Every ink here is already --flow-*; the .featShot card
 * bed gets a navy variant in customer.module.css (a white card with a navy
 * shadow is a glowing slab on navy).
 * Two mirrored rows; the app shots come in with the clip-path mask wipe and
 * are pointer-lit (`data-lit` on FeatureScreens' `.featShot`, inside the mask
 * Reveal, so the reveal never fights it).
 */
export function Features() {
  return (
    <FlowSection
      ground="navy"
      index="04"
      style={{ padding: "var(--section-pad) clamp(20px,5vw,56px)" }}
    >
      {/* Same 1150 column as the rows below, so the label, headline and the
          first row share one left edge. */}
      <div style={{ maxWidth: 1150, margin: "0 auto" }}>
        <Reveal variant="up">
          <SectionLabel index="04">{featuresContent.eyebrow}</SectionLabel>
          <WordReveal
            as="h2"
            className="max-w-[20ch] [font-family:var(--font-display)] font-bold text-[length:var(--fs-h2)] leading-[1.03] tracking-[-.02em]"
          >
            {featuresContent.headline}
          </WordReveal>
        </Reveal>
      </div>
      <PointerLitGroup
        className="grid"
        style={{ maxWidth: 1150, margin: "clamp(28px,3vw,44px) auto 0", gap: "clamp(44px,5vw,72px)" }}
      >
        {featuresContent.rows.map((row, index) => {
          const mirrored = index % 2 === 1;
          return (
            <Reveal
              variant="up"
              key={row.eyebrow}
              className="grid items-center"
              style={{
                // auto-fit with a floor collapses to one column when two can't
                // breathe; the min(100%, …) stops the floor itself overflowing
                // tiny screens.
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
                gap: "clamp(30px,5vw,80px)",
              }}
            >
              <div style={{ order: mirrored ? 2 : 1 }}>
                <SectionLabel index={`04.${index + 1}`} style={{ marginBottom: 16 }}>
                  {row.eyebrow}
                </SectionLabel>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "clamp(28px,3.4vw,46px)",
                    lineHeight: 1.05,
                    letterSpacing: "-.02em",
                  }}
                >
                  {row.title}
                </h3>
                <p
                  style={{
                    marginTop: 18,
                    fontSize: 17,
                    lineHeight: 1.55,
                    color: "var(--flow-fg-2)",
                    maxWidth: "42ch",
                  }}
                >
                  {row.body}
                </p>
              </div>
              <Reveal variant="mask" className="flex items-center justify-center" style={{ order: mirrored ? 1 : 2 }}>
                {/* Real app screens, built from PapeXV2's own tokens — see FeatureScreens.tsx. */}
                {index === 0 ? <ReceiptListShot /> : <ShareSheetShot />}
              </Reveal>
            </Reveal>
          );
        })}
      </PointerLitGroup>
    </FlowSection>
  );
}
