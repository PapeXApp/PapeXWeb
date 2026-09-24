import { Marquee } from "@/components/motion"
import styles from "./flow.module.css"

/**
 * The phrase ribbon both path homes run between their second and third
 * sections. It replaced a full-bleed orange band — a hard colour block was
 * exactly the kind of cut the flow ground exists to remove. Now it is a slim
 * mono line on whatever ground is running, framed by its own top/bottom
 * hairlines, with orange only in the separators.
 *
 * Deliberately NOT a FlowSection: it declares no ground, so crossing the
 * middle of the viewport it simply keeps the current one.
 */
export function Ribbon({ phrases, duration }: { phrases: readonly string[]; duration: number }) {
  return (
    <div className={styles.ribbon}>
      <div className={styles.ribbonBand}>
        <Marquee duration={duration} className={styles.ribbonTrack}>
          <span className={styles.ribbonRun}>
            {phrases.map((phrase) => (
              <span key={phrase} className={styles.ribbonItem}>
                <span>{phrase}</span>
                <i aria-hidden="true" className={styles.ribbonSep} />
              </span>
            ))}
          </span>
        </Marquee>
      </div>
    </div>
  )
}
