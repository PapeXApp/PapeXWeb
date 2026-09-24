import { cn } from "@/lib/utils";
import { StatusBar } from "./Chrome";
import s from "./appui.module.css";
/* The interaction-only styles (the real View button + its prompt glow) live in
   customer.module.css, not in the kit sheet — see the "APP CLIP CARD" block
   there. Two sheets on purpose: appui.module.css is the shared app-UI kit and
   is owned by the app restyle running in parallel. */
import c from "../customer.module.css";

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
      <path d="M6 34 30 18l-8 18-6 1z" fill="#eb7100" />
      <path d="m30 18-8 18 5 6z" fill="#b85a00" />
    </svg>
  );
}

function NfcWaves() {
  return (
    <svg viewBox="0 0 30 46" className={cn(s.clipWaves, c.clipWavesBrand)} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <path d="M25 13a16 16 0 0 1 0 20" />
      <path d="M18 18a9 9 0 0 1 0 10" />
      <path d="M11 22a3 3 0 0 1 0 2" />
    </svg>
  );
}

/**
 * The locked phone.
 *
 * `card` is FALSE at rest in the hero (2026-09-22): iOS does not show an App
 * Clip card until something is tapped, so neither do we — the card mounting is
 * the payoff for tapping the reader, and mounting it is also what plays the
 * kit's slide-up-from-the-bottom animation.
 *
 * `onView` makes the blue View pill a real button; `pulse` gives it the
 * looping glow ring that tells the visitor where to click next.
 */
export function ClipLockScreen({
  card = true,
  pulse = false,
  onView,
}: {
  card?: boolean;
  pulse?: boolean;
  onView?: () => void;
}) {
  const view = onView ? (
    <button
      type="button"
      className={cn(c.clipViewBtn, pulse && c.clipViewPulse)}
      onClick={(event) => {
        /* The phone behind this is itself a tap target; without this the
           click would also fire the phone's own handler. */
        event.stopPropagation();
        onView();
      }}
    >
      View
    </button>
  ) : (
    <span className={c.clipViewBtn}>View</span>
  );

  return (
    <div className={s.lock}>
      <div className={s.lockWall} aria-hidden="true" />
      {/* An iOS lock screen's status bar carries NO clock on the left — the
          big clock below is the clock. Only the right cluster shows. */}
      <StatusBar time="" />
      <div className={s.lockClock} aria-hidden="true">
        <div className={s.lockDate}>Tue Sep 22</div>
        <div className={s.lockTime}>7:12</div>
      </div>

      {card ? (
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
                <i className={cn(s.clipPaperAcc, c.clipPaperAccBrand)} />
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
          {view}
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
      ) : null}
    </div>
  );
}

/** The lock glyph iOS shows inside the left end of the Dynamic Island while
 *  the phone is locked. Rendered INTO the island by the phone chrome (see
 *  PhoneChrome's `islandLock`), so it paints above the screen layers. */
export function IslandLockGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className={c.wpIslandLock}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      <rect x="5" y="10.5" width="14" height="10" rx="3" />
      <path d="M8.4 10.5V7.8a3.6 3.6 0 0 1 7.2 0v2.7" />
    </svg>
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
