import { Reveal, WordReveal } from "@/components/motion";
import { problemContent } from "./content";

/** 2.2 Problem — light. */
export function Problem() {
  return (
    <section
      data-nav-theme="light"
      style={{
        background: "var(--offwhite)",
        color: "var(--navy)",
        padding: "clamp(90px,11vw,170px) clamp(20px,5vw,56px)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
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
            {problemContent.eyebrow}
          </div>
          <WordReveal
            as="h2"
            className="max-w-[20ch] [font-family:var(--font-display)] font-bold text-[clamp(32px,4.6vw,62px)] leading-[1.02] tracking-[-.02em]"
          >
            {problemContent.headline}
          </WordReveal>
        </Reveal>
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
            gap: "clamp(20px,3vw,44px)",
            marginTop: "clamp(50px,6vw,90px)",
          }}
        >
          {problemContent.stats.map((stat) => (
            <Reveal variant="up" key={stat.value}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "clamp(48px,6vw,76px)",
                  color: "var(--orange)",
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <p style={{ marginTop: 10, fontSize: 16, color: "#4a4a4a", lineHeight: 1.45, maxWidth: "24ch" }}>
                {stat.caption}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
