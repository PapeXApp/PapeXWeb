import { Marquee } from "@/components/motion"
import { cn } from "@/lib/utils"
import styles from "./flow.module.css"

const byLength = (phrases: readonly string[]) =>
  phrases
    .map((phrase, i) => ({ phrase, i }))
    .sort((a, b) => a.phrase.length - b.phrase.length || a.i - b.i)
    .map(({ phrase }) => phrase)

/**
 * The phrase ribbon both path homes run between their sections. It replaced
 * a full-bleed orange band — a hard colour block was exactly the kind of cut
 * the flow ground exists to remove. Now it is a slim mono line on whatever
 * ground is running, framed by its own top/bottom hairlines, with orange only
 * in the separators.
 *
 * It scrolls CONTINUOUSLY (`iterations={Infinity}`), paused by Marquee while
 * it is off screen. Under prefers-reduced-motion it is ONE still, centred
 * line that shows only the phrases that fit whole (the rest wrap onto hidden
 * lines), so nothing is ever cut off or drawn over anything.
 *
 * The still line lists the phrases shortest first, so a narrow phone shows
 * several short ones rather than one long one alone.
 *
 * Accessibility: the moving band repeats the phrases, so the whole visual is
 * aria-hidden and a screen reader (or a search engine) gets the phrases once,
 * as a sentence, from the server-rendered sr-only line.
 *
 * Deliberately NOT a FlowSection: it declares no ground, so crossing the
 * middle of the viewport it simply keeps the current one.
 */
export function Ribbon({
  phrases,
  duration,
  className,
}: {
  phrases: readonly string[]
  duration: number
  className?: string
}) {
  return (
    <div className={cn(styles.ribbon, className)}>
      <p className="sr-only">{phrases.join(" ")}</p>
      <div className={styles.ribbonBand} aria-hidden="true">
        <div className={styles.ribbonMask}>
          <Marquee
            duration={duration}
            iterations={Infinity}
            staticContent={
              <span className={cn(styles.ribbonRun, styles.ribbonStill)}>
                {byLength(phrases).map((phrase) => (
                  <span key={phrase} className={styles.ribbonStillItem}>
                    <i className={styles.ribbonSep} />
                    <span>{phrase}</span>
                  </span>
                ))}
              </span>
            }
          >
            <span className={styles.ribbonRun}>
              {phrases.map((phrase) => (
                <span key={phrase} className={styles.ribbonItem}>
                  <span>{phrase}</span>
                  <i className={styles.ribbonSep} />
                </span>
              ))}
            </span>
          </Marquee>
        </div>
      </div>
    </div>
  )
}
