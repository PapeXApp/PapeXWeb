import { Reveal } from "@/components/motion";
import { featuresContent } from "./content";

/** 2.5 Features — dark. Two mirrored rows revealed with the clip-path mask wipe. */
export function Features() {
  return (
    <section
      data-nav-theme="dark"
      style={{
        background: "var(--navy)",
        color: "var(--offwhite)",
        padding: "clamp(90px,11vw,160px) clamp(20px,5vw,56px)",
      }}
    >
      <div className="grid" style={{ maxWidth: 1150, margin: "0 auto", gap: "clamp(70px,9vw,130px)" }}>
        {featuresContent.rows.map((row, index) => {
          const mirrored = index % 2 === 1;
          return (
            <Reveal
              variant="up"
              key={row.eyebrow}
              className="grid items-center"
              style={{
                gridTemplateColumns: "1fr 1fr",
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
                className="flex items-center justify-center text-center"
                style={{
                  order: mirrored ? 1 : 2,
                  aspectRatio: "4 / 3",
                  borderRadius: 20,
                  background: "repeating-linear-gradient(45deg,#0a2431 0 12px,#0c2937 12px 24px)",
                  border: "1px solid var(--hairline-dark)",
                  /* TODO: promote to token — Courier New mono placeholder face has no shared var yet. */
                  fontFamily: "'Courier New', monospace",
                  fontSize: 13,
                  color: "var(--muted-on-dark)",
                  letterSpacing: ".08em",
                  padding: 20,
                }}
              >
                <span aria-hidden="true">{row.placeholderLabel}</span>
              </Reveal>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
