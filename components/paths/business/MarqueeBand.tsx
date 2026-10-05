import { Ribbon } from "../shared/Ribbon"
import { marquee } from "./content"
import s from "./story.module.css"

/**
 * 3.3 Marquee — a mono ribbon on the running ground (see shared/Ribbon.tsx).
 * On /business it closes §03's one-screen unit: RetainStory renders it
 * inside story.module.css .unit, right under the dashboard columns.
 *
 * p8 (Noah: "looks like a ribbon but broken, not moving"): under
 * prefers-reduced-motion the moving ribbon is hidden and a still, wrapped
 * list of the same phrases shows instead (story.module.css .ribbonStill), so
 * a phone that doesn't animate never shows a cut, frozen run. Both are in
 * the server HTML; CSS shows exactly one (display: none takes the other out
 * of the accessibility tree too).
 */
export function MarqueeBand() {
  return (
    <>
      <Ribbon phrases={marquee.phrases} duration={marquee.durationSeconds} className={s.storyRibbon} />
      <ul className={s.ribbonStill}>
        {marquee.phrases.map((phrase) => (
          <li key={phrase}>{phrase}</li>
        ))}
      </ul>
    </>
  )
}
