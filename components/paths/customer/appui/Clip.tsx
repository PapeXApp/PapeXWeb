import { useId } from "react";
import { cn } from "@/lib/utils";
import { StatusBar } from "./Chrome";
import s from "./appui.module.css";
/* The interaction-only styles (the real View button + its prompt glow) live in
   customer.module.css, not in the kit sheet — see the "APP CLIP CARD" block
   there. Two sheets on purpose: appui.module.css is the shared app-UI kit and
   is owned by the app restyle running in parallel. */
import c from "../customer.module.css";
/* Device + iOS system chrome (lock screen, Live Activity, wallpaper) lives
   with the phone frame, in iphone.module.css (2.1, 2026-09-23). */
import ip from "../iphone.module.css";

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
 * An iOS lock-screen wallpaper in Apple's layered style (stacked, soft-shadowed
 * wave bands, like the iOS 16-18 "Collections" gradients) but in brand navy,
 * blue and orange. 2.1 (2026-09-23): replaces a stack of radial blobs that read
 * as a generic Android gradient. Drawn, not an image; ids are per-instance
 * because the hero and the walkthrough both mount one.
 */
function Wallpaper() {
  const id = useId().replace(/:/g, "");
  const g = (name: string) => `${name}-${id}`;
  return (
    <svg className={ip.wall} viewBox="0 0 393 852" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={g("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00121d" />
          <stop offset="0.55" stopColor="#04233a" />
          <stop offset="1" stopColor="#00121d" />
        </linearGradient>
        {/* Each band is lit at its crest and falls into shadow below it, the
            way Apple's layered wallpapers are shaded; the next band's drop
            shadow then lands on that dark part. Vertical ramps, because a
            horizontal one read as a flat flag. */}
        <linearGradient id={g("blue")} x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0" stopColor="#2a9df0" />
          <stop offset="0.16" stopColor="#0079d1" />
          <stop offset="0.42" stopColor="#063b66" />
          <stop offset="1" stopColor="#00121d" />
        </linearGradient>
        <linearGradient id={g("orange")} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#ff9d45" />
          <stop offset="0.14" stopColor="#eb7100" />
          <stop offset="0.42" stopColor="#8a3c02" />
          <stop offset="1" stopColor="#1a0f0a" />
        </linearGradient>
        <linearGradient id={g("deep")} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#123e5e" />
          <stop offset="0.3" stopColor="#06243a" />
          <stop offset="1" stopColor="#00121d" />
        </linearGradient>
        <radialGradient id={g("sheen")} cx="0.78" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={g("lift")} x="-10%" y="-20%" width="120%" height="140%">
          <feDropShadow dx="0" dy="-10" stdDeviation="14" floodColor="#000814" floodOpacity="0.55" />
        </filter>
      </defs>
      <rect width="393" height="852" fill={`url(#${g("sky")})`} />
      <path
        filter={`url(#${g("lift")})`}
        fill={`url(#${g("blue")})`}
        d="M0 330C96 318 170 250 250 214s110-40 143-44V852H0Z"
      />
      <path
        filter={`url(#${g("lift")})`}
        fill={`url(#${g("orange")})`}
        d="M0 540C88 520 150 452 236 420s124-10 157-14V852H0Z"
      />
      <path
        filter={`url(#${g("lift")})`}
        fill={`url(#${g("deep")})`}
        d="M0 700C110 690 180 630 270 612s98 2 123 8V852H0Z"
      />
      <rect width="393" height="852" fill={`url(#${g("sheen")})`} />
      {/* crest highlights: the thin light line along each band's top edge */}
      <g fill="none" stroke="#fff" strokeWidth="1" strokeOpacity="0.22">
        <path d="M0 330C96 318 170 250 250 214s110-40 143-44" />
        <path d="M0 540C88 520 150 452 236 420s124-10 157-14" />
        <path d="M0 700C110 690 180 630 270 612s98 2 123 8" />
      </g>
    </svg>
  );
}

function FlashlightGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2.8h8v3.6l-1.8 3v11a1.4 1.4 0 0 1-1.4 1.4h-1.6a1.4 1.4 0 0 1-1.4-1.4v-11L8 6.4Z" />
      <path d="M8 6.4h8" />
      <circle cx="12" cy="13.2" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CameraGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.2 8.4a2 2 0 0 1 2-2h2.6l1.5-2h5.4l1.5 2h2.6a2 2 0 0 1 2 2v9.4a2 2 0 0 1-2 2H5.2a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="12.9" r="3.6" />
    </svg>
  );
}

/** Copy for the lock screen's idle Live Activity. */
export type LockPrompt = { title: string; body: string };

/** What the lock screen shows: "Mon Jun 8" over "10:24". */
export type ReceiptMoment = { date: string; time: string };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Only for a receipt with no parseable date/time. The demo receipt has both. */
const FALLBACK_MOMENT: ReceiptMoment = { date: "Mon Jun 8", time: "10:24" };

/**
 * The moment the phone was tapped = the moment the receipt printed, read off
 * the DECODED receipt (`summarizeReceipt(...).dateline`, e.g.
 * "Jun 8, 2026 • 10:24 AM"), so the lock screen can never show a different
 * day than the receipt it is about to open (2.1, 2026-09-24, Nico). Accepts
 * the three date shapes lib/receiptSummary recognises. The weekday is computed
 * in UTC from the calendar date, so no timezone can shift it. iOS's lock-screen
 * clock is 12-hour with no AM/PM, hence "10:24".
 */
export function receiptMoment(dateline?: string): ReceiptMoment {
  if (!dateline) return FALLBACK_MOMENT;
  let y: number | undefined;
  let m: number | undefined;
  let d: number | undefined;
  const named = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?:,?\s*(\d{4}))?/i.exec(dateline);
  const iso = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(dateline);
  const us = /\b(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/.exec(dateline);
  if (named) {
    m = MONTHS.findIndex((mo) => mo.toLowerCase() === named[1].slice(0, 3).toLowerCase());
    d = Number(named[2]);
    y = named[3] ? Number(named[3]) : undefined;
  } else if (iso) {
    [y, m, d] = [Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])];
  } else if (us) {
    const yy = Number(us[3]);
    [m, d, y] = [Number(us[1]) - 1, Number(us[2]), yy < 100 ? 2000 + yy : yy];
  }
  let date = FALLBACK_MOMENT.date;
  if (m !== undefined && m >= 0 && m < 12 && d) {
    const day = `${MONTHS[m]} ${d}`;
    date = y ? `${WEEKDAYS[new Date(Date.UTC(y, m, d)).getUTCDay()]} ${day}` : day;
  }
  const t = /\b(\d{1,2}):(\d{2})\b/.exec(dateline);
  const time = t ? `${Number(t[1]) % 12 || 12}:${t[2]}` : FALLBACK_MOMENT.time;
  return { date, time };
}

/**
 * The locked iPhone.
 *
 *   - status bar (right cluster only: an iOS lock screen has no small clock),
 *     date over a very large thin SF clock, flashlight + camera buttons, and
 *     the layered wallpaper — 2.1, 2026-09-23.
 *   - `prompt`: an iOS Live Activity near the bottom ("Tap to get your
 *     receipt / Hold your iPhone near the PapeX device"), with NFC waves that
 *     light toward the phone's bottom edge. It is what keeps the idle hero
 *     from reading as a blank phone.
 *   - `card`: the App Clip card. FALSE at rest in the hero: iOS shows it only
 *     after an NFC tap, so it is the payoff for tapping. Mounting it plays the
 *     kit's slide-up; the prompt and the quick buttons step aside for it.
 *   - `onView` makes the blue View pill a real button; `pulse` gives it the
 *     looping glow ring that says where to click next.
 */
export function ClipLockScreen({
  card = true,
  pulse = false,
  onView,
  prompt,
  moment = FALLBACK_MOMENT,
}: {
  card?: boolean;
  pulse?: boolean;
  onView?: () => void;
  prompt?: LockPrompt;
  /** Date + clock, from receiptMoment() of the receipt this tap opens. */
  moment?: ReceiptMoment;
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
    <div className={ip.lock}>
      <Wallpaper />
      <StatusBar time="" />
      <div className={ip.clock} aria-hidden="true">
        <div className={ip.date}>{moment.date}</div>
        <div className={ip.time}>{moment.time}</div>
      </div>

      {prompt ? (
        <div className={cn(ip.activity, ip.leaves, card && ip.gone)} aria-hidden={card}>
          <span className={ip.activityIcon} aria-hidden="true">
            <PapeXMark className="h-full w-full" />
          </span>
          <span className={ip.activityText}>
            <span className={ip.activityTitle}>{prompt.title}</span>
            <span className={ip.activityBody}>{prompt.body}</span>
          </span>
          <svg
            viewBox="0 0 30 46"
            className={ip.activityWaves}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M11 22a3 3 0 0 1 0 2" />
            <path d="M18 18a9 9 0 0 1 0 10" />
            <path d="M25 13a16 16 0 0 1 0 20" />
          </svg>
        </div>
      ) : null}

      <span className={cn(ip.quick, ip.quickL, ip.leaves, card && ip.gone)} aria-hidden="true">
        <FlashlightGlyph />
      </span>
      <span className={cn(ip.quick, ip.quickR, ip.leaves, card && ip.gone)} aria-hidden="true">
        <CameraGlyph />
      </span>

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
      className={ip.islandLock}
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

export function ClipReading({
  label = "Reading your receipt",
  time = FALLBACK_MOMENT.time,
}: {
  label?: string;
  /** Status-bar clock — pass receiptMoment(...).time so it matches the lock screen. */
  time?: string;
}) {
  return (
    <div className={s.reading}>
      <StatusBar time={time} />
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
