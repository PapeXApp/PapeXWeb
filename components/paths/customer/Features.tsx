import { Reveal, WordReveal } from "@/components/motion";
import styles from "./customer.module.css";
import { Atmosphere, AtmosphereContent } from "./Atmosphere";
import { ReceiptListShot, ShareSheetShot } from "./FeatureScreens";
import { featuresContent } from "./content";

/** 2.5 Features — dark. Two mirrored rows revealed with the clip-path mask wipe. */
export function Features() {
  return (
    <section
      data-nav-theme="dark"
      className={styles.atmosHost}
      style={{
        background: "var(--navy)",
        color: "var(--offwhite)",
        padding: "clamp(90px,11vw,160px) clamp(20px,5vw,56px)",
      }}
    >
      <Atmosphere tone="dark" seam="top" />
      <AtmosphereContent>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Reveal variant="up">
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: ".24em",
              textTransform: "uppercase",
              color: "var(--orange)",
              marginBottom: 18,
            }}
          >
            {featuresContent.eyebrow}
          </div>
          <WordReveal
            as="h2"
            className="max-w-[20ch] [font-family:var(--font-display)] font-bold text-[clamp(30px,4.4vw,58px)] leading-[1.03] tracking-[-.02em]"
          >
            {featuresContent.headline}
          </WordReveal>
        </Reveal>
      </div>
      <div className="grid" style={{ maxWidth: 1150, margin: "clamp(46px,5vw,72px) auto 0", gap: "clamp(70px,9vw,130px)" }}>
        {featuresContent.rows.map((row, index) => {
          const mirrored = index % 2 === 1;
          return (
            <Reveal
              variant="up"
              key={row.eyebrow}
              className="grid items-center"
              style={{
                // Was a hard "1fr 1fr", so even a 390px phone got two squeezed
                // columns (the app shot rendered 160px wide). auto-fit with a
                // floor collapses to one column when two can't breathe; the
                // min(100%, …) stops the floor itself overflowing tiny screens.
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
                gap: "clamp(30px,5vw,80px)",
              }}
            >
              <div style={{ order: mirrored ? 2 : 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: ".24em",
                    textTransform: "uppercase",
                    color: "var(--orange)",
                    marginBottom: 16,
                  }}
                >
                  {row.eyebrow}
                </div>
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
                    color: "var(--muted-on-dark)",
                    maxWidth: "42ch",
                  }}
                >
                  {row.body}
                </p>
              </div>
              <Reveal
                variant="mask"
                className="flex items-center justify-center"
                style={{ order: mirrored ? 1 : 2 }}
              >
                {/* Real app screens, built from PapeXV2's own tokens — these
                    were striped "[ app screen: … ]" TODO boxes waiting on
                    simulator captures that never arrived. See FeatureScreens.tsx. */}
                {index === 0 ? <ReceiptListShot /> : <ShareSheetShot />}
              </Reveal>
            </Reveal>
          );
        })}
      </div>
      </AtmosphereContent>
    </section>
  );
}
