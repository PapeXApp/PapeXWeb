import { Ribbon } from "../shared/Ribbon";
import { marqueeContent } from "./content";

/** 2.3 Marquee — a mono ribbon on the running ground (see shared/Ribbon.tsx). */
export function MarqueeBand() {
  return <Ribbon phrases={marqueeContent.phrases} duration={marqueeContent.durationSeconds} />;
}
