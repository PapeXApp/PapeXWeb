import { Ribbon } from "../shared/Ribbon"
import { marquee } from "./content"
import s from "./story.module.css"

/**
 * 3.3 Marquee — a mono ribbon on the running ground (see shared/Ribbon.tsx).
 * On /business it closes §03's one-screen block (story.module.css .after), so
 * it carries that block's foot: a little air before §04 starts.
 */
export function MarqueeBand() {
  return <Ribbon phrases={marquee.phrases} duration={marquee.durationSeconds} className={s.storyRibbon} />
}
