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
        // Bottom padding is shorter than the top: the ribbon follows, and
        // the ribbon + the next section's own top padding already make the
        // breath. Full padding on both sides of it read as a gap.
        padding: "clamp(90px,11vw,170px) clamp(20px,5vw,56px) clamp(64px,7vw,110px)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal variant="up">
          <SectionLabel index="02">{problemContent.eyebrow}</SectionLabel>
          <WordReveal
            as="h2"
            className="max-w-[20ch] [font-family:var(--font-display)] font-bold text-[clamp(32px,4.6vw,62px)] leading-[1.02] tracking-[-.02em]"
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
