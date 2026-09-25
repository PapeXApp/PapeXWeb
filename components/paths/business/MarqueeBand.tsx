import { Ribbon } from "../shared/Ribbon"
import { marquee } from "./content"
import s from "./story.module.css"

/**
 * 3.3 Marquee — a mono ribbon on the running ground (see shared/Ribbon.tsx).
 * On /business it closes §03's one-screen unit: RetainStory renders it
 * inside story.module.css .unit, right under the dashboard columns.
 */
export function MarqueeBand() {
  return <Ribbon phrases={marquee.phrases} duration={marquee.durationSeconds} className={s.storyRibbon} />
}
