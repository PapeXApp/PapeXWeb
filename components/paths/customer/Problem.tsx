import { Reveal, WordReveal } from "@/components/motion";
import { FlowSection } from "../shared/FlowSection";
import { SectionLabel } from "../shared/SectionLabel";
import { FlipCardGrid } from "./FlipCards";
import { problemContent } from "./content";

/** 2.2 Problem — light. Three tap-to-flip cards, each with a scripted scene on the back. */
export function Problem() {
  return (
    <FlowSection
      ground="light"
      index="02"
      style={{
        padding: "var(--section-pad) clamp(20px,5vw,56px) var(--section-pad)",
      }}
    >
      <div style={{ maxWidth: 1150, margin: "0 auto" }}>
        <Reveal variant="up">
          <SectionLabel index="02">{problemContent.eyebrow}</SectionLabel>
          <WordReveal
            as="h2"
            className="max-w-[20ch] [font-family:var(--font-display)] font-bold text-[length:var(--fs-h2)] leading-[1.02] tracking-[-.02em]"
          >
            {problemContent.headline}
          </WordReveal>
        </Reveal>
        <Reveal variant="up">
          <FlipCardGrid />
        </Reveal>
      </div>
    </FlowSection>
  );
}
