import { Ribbon } from "../shared/Ribbon"
import { marquee } from "./content"

/** 3.3 Marquee — a mono ribbon on the running ground (see shared/Ribbon.tsx). */
export function MarqueeBand() {
  return <Ribbon phrases={marquee.phrases} duration={marquee.durationSeconds} />
}
