import { StatusBar } from "./Chrome";
import s from "./appui.module.css";

/**
 * The App Clip beats of the tap story, rebuilt 2026-09-22 from the camera
 * shots in app-media/reference/clip-*.png (blurry on purpose — structure was
 * taken from them, not pixels).
 *
 *   1. ClipLockScreen  — the phone is locked; iOS slides the App Clip card up
 *                        from the bottom: receipt art + NFC waves, "PapeX /
 *                        Tap to View Your Receipt", a blue View pill, and the
 *                        "Powered by PapeX  ·  App Store >" credit strip.
 *   2. ClipReading     — "Reading your receipt" with the PapeX card mark and
 *                        an orange progress bar.
 *   3. ClipTopBar      — the strip that stays pinned above the rendered
 *                        receipt once the clip is open.
 *
 * All three are presentational; the hero owns the timing.
 */

/** The PapeX paper-plane-over-a-card mark, drawn (no raster asset needed). */
function PapeXMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="20" y="10" width="34" height="44" rx="5" fill="#fbfbfa" />
      <path d="M27 22h20M27 30h20M27 38h12" stroke="#c7ced6" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M6 34 30 18l-8 18-6 1z" fill="#fb8500" />
      <path d="m30 18-8 18 5 6z" fill="#d97100" />
    </svg>
  );
}

function NfcWaves() {
  return (
    <svg viewBox="0 0 30 46" className={s.clipWaves} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <path d="M25 13a16 16 0 0 1 0 20" />
      <path d="M18 18a9 9 0 0 1 0 10" />
      <path d="M11 22a3 3 0 0 1 0 2" />
    </svg>
  );
}

export function ClipLockScreen() {
  return (
    <div className={s.lock}>
      <div className={s.lockWall} aria-hidden="true" />
      <svg viewBox="0 0 24 24" className={s.lockPadlock} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="5" y="10.5" width="14" height="10" rx="3" />
        <path d="M8.4 10.5V7.8a3.6 3.6 0 0 1 7.2 0v2.7" />
      </svg>
      <div className={s.lockClock} aria-hidden="true">
        <div className={s.lockDate}>Tue Sep 22</div>
        <div className={s.lockTime}>7:12</div>
      </div>

      <div className={s.clipCard}>
        <div className={s.clipHero}>
          <span className={s.clipClose} aria-hidden="true">
            ×
          </span>
          <div className={s.clipArt} aria-hidden="true">
            <NfcWaves />
            <div className={s.clipPaper}>
              <div className={s.clipPaperMark}>PapeX</div>
              <div className={s.clipPaperLines}>
                <i /><i /><i /><i /><i />
                <i className={s.clipPaperAcc} />
              </div>
            </div>
          </div>
        </div>

        <div className={s.clipFoot}>
          <span>
            <span className={s.clipName} style={{ display: "block" }}>
              PapeX
            </span>
            <span className={s.clipTagline} style={{ display: "block" }}>
              Tap to View Your Receipt
            </span>
          </span>
          <span className={s.clipView}>View</span>
        </div>

        <div className={s.clipCredit} aria-hidden="true">
          <span className={s.clipCreditMark}>
            <PapeXMark className="h-full w-full" />
          </span>
          <span>
            Powered by
            <span className={s.clipCreditName} style={{ display: "block" }}>
              PapeX
            </span>
          </span>
          <span className={s.clipStore}>App Store ›</span>
        </div>
      </div>
    </div>
  );
}

export function ClipReading({ label = "Reading your receipt" }: { label?: string }) {
  return (
    <div className={s.reading}>
      <StatusBar time="7:12" />
      <PapeXMark className={s.readingMark} />
      <div className={s.readingLabel}>{label}</div>
      <div className={s.readingTrack} aria-hidden="true">
        <span className={s.readingFill} />
      </div>
    </div>
  );
}

/** The bar pinned above the rendered receipt inside the clip. */
export function ClipTopBar() {
  return (
    <div className={s.clipBar}>
      <span className={s.clipCreditMark}>
        <PapeXMark className="h-full w-full" />
      </span>
      <span className={s.clipBarText}>
        <span className={s.clipBarPowered}>Powered by</span>
        <span className={s.clipBarName}>PapeX</span>
      </span>
      <span className={s.clipBarStore}>App Store ›</span>
    </div>
  );
}
