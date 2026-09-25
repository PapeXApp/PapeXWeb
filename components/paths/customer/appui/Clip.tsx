import { useId } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { StatusBar } from "./Chrome";
/* Device + iOS system chrome (lock screen, wallpaper, the App Clip card, the
   App Clip launch banner, the loading beat) lives with the phone frame, in
   iphone.module.css. Nothing here reads customer.module.css any more (W3,
   2026-09-24): that sheet belongs to the page sections. */
import ip from "../iphone.module.css";

/**
 * The iOS + App Clip beats of the tap story. Rebuilt W3 (2026-09-24) against
 * app-media/reference/clip-*.png (reference only, never embedded) and the
 * App Clip's own Swift (Papex_AppClip ReceiptView.swift):
 *
 *   ClipLockScreen  the locked iPhone: iOS 26 bold clock over the date, an
 *                   abstract PapeX-palette wallpaper (not an Apple one), the
 *                   status bar, flashlight + camera. After a tap, iOS's App
 *                   Clip card rises from the bottom: 3:2 card image with a
 *                   close button, "PapeX / Tap to View Your Receipt", the
 *                   periwinkle View pill, then "Powered by PapeX 17+" and
 *                   "App Store >". No Live Activity on /customers (Nico:
 *                   nothing on the lock screen before the tap but time, date
 *                   and wallpaper); `prompt` is kept only for /business's
 *                   RetainStory, which still passes one.
 *   ClipReading     Swift `LoadingState`: the ReceiptMarkIcon, "Reading your
 *                   receipt" (Barlow 24 bold) and the 184x5 track with a
 *                   78pt sliding segment, under iOS's App Clip banner.
 *   ClipTopBar      iOS's App Clip launch banner ("Powered by PapeX · App
 *                   Store >"), the system strip iOS lays over a freshly
 *                   launched clip.
 *
 * All presentational; the callers own timing.
 */

/** Copy for the (business-only) lock-screen Live Activity. */
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

/* --- small drawn pieces ---------------------------------------------------- */

/**
 * The PapeX app icon, from the synced asset (public/app/kit/brand/
 * papex_app_icon.png — the real icon PapeXV2 ships). next/image serves it at
 * icon size instead of the 330 KB source.
 */
export function PapeXAppIcon({ className }: { className?: string }) {
  return (
    <span className={cn(ip.appIcon, className)} aria-hidden="true">
      <Image src="/app/kit/brand/papex_app_icon.png" alt="" width={88} height={88} sizes="88px" draggable={false} />
    </span>
  );
}

/** Apple's App Store glyph (the three-stroke "A"), as the card and banner draw it. */
function AppStoreGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={ip.storeGlyph} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M9.6 4.2 17 17.2M14.4 4.2 7 17.2M4.6 14.2h10.2M16.6 14.2h2.8" />
    </svg>
  );
}

function FlashlightGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 2.4h8a.8.8 0 0 1 .8.8v2.6a1.8 1.8 0 0 1-.4 1.1L15 9v10.8A1.8 1.8 0 0 1 13.2 21.6h-2.4A1.8 1.8 0 0 1 9 19.8V9L7.6 6.9a1.8 1.8 0 0 1-.4-1.1V3.2a.8.8 0 0 1 .8-.8Zm4 9.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z" />
    </svg>
  );
}

function CameraGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.3 4.2h5.4c.5 0 .9.2 1.2.6l1.1 1.6h2.3A2.6 2.6 0 0 1 21.9 9v8.6a2.6 2.6 0 0 1-2.6 2.6H4.7a2.6 2.6 0 0 1-2.6-2.6V9a2.6 2.6 0 0 1 2.6-2.6H7l1.1-1.6c.3-.4.7-.6 1.2-.6ZM12 9.2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 1.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z" />
    </svg>
  );
}

/**
 * The App Clip card image (3:2, like the 1800x1200 header image App Store
 * Connect asks for): a white PapeX receipt with NFC waves off its left edge,
 * on navy. Drawn from the reference card, in brand colours.
 */
function CardArt() {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 390 260" className={ip.cardArtSvg} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id={`acg${id}`} cx="0.42" cy="0.2" r="0.75">
          <stop offset="0" stopColor="#35516a" />
          <stop offset="0.55" stopColor="#0f2638" />
          <stop offset="1" stopColor="#05131e" />
        </radialGradient>
        <linearGradient id={`acp${id}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9edf1" />
        </linearGradient>
      </defs>
      <rect width="390" height="260" fill={`url(#acg${id})`} />
      <g transform="rotate(-3 212 130)">
        <path
          d="M160 32h108v196l-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6Z"
          fill={`url(#acp${id})`}
        />
        {/* the PapeX lockup at the top of the ticket */}
        <path d="M184 60 206 48l-7 14-4 1Z" fill="#eb7100" />
        <path d="m206 48-7 14 4 4Z" fill="#b85a00" />
        <text x="209" y="64" fontFamily="'AK Barlow', Barlow, system-ui, sans-serif" fontSize="17" fontWeight="500" fill="#6b7680">
          PapeX
        </text>
        <g fill="#5d6873">
          <rect x="176" y="88" width="46" height="4.5" rx="2.2" />
          <rect x="176" y="104" width="62" height="4.5" rx="2.2" />
          <rect x="176" y="120" width="40" height="4.5" rx="2.2" />
          <rect x="176" y="136" width="56" height="4.5" rx="2.2" />
          <rect x="176" y="152" width="36" height="4.5" rx="2.2" />
          <rect x="176" y="168" width="50" height="4.5" rx="2.2" />
          <rect x="236" y="104" width="18" height="4.5" rx="2.2" />
          <rect x="236" y="136" width="18" height="4.5" rx="2.2" />
          <rect x="236" y="152" width="18" height="4.5" rx="2.2" />
          <rect x="236" y="168" width="18" height="4.5" rx="2.2" />
        </g>
        <rect x="176" y="184" width="76" height="1.2" fill="#c6ced6" />
        <rect x="176" y="196" width="22" height="5" rx="2.5" fill="#eb7100" />
        <rect x="224" y="196" width="30" height="5" rx="2.5" fill="#eb7100" />
      </g>
      <g fill="none" stroke="#eb7100" strokeWidth="4.2" strokeLinecap="round">
        {/* three concentric arcs about (104,129), opening toward the ticket */}
        <path d="M112.5 120.5A12 12 0 0 1 112.5 137.5" />
        <path d="M119.6 113.4A22 22 0 0 1 119.6 144.6" />
        <path d="M126.6 106.4A32 32 0 0 1 126.6 151.6" />
      </g>
    </svg>
  );
}

/**
 * The locked iPhone, and (once `card`) iOS's App Clip card over it.
 * `onView` makes the View pill a real button; `pulse` gives it a few glow
 * rings (finite) pointing at the next click.
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
  /** /business only — a lock-screen Live Activity. /customers never passes it. */
  prompt?: LockPrompt;
  /** Date + clock, from receiptMoment() of the receipt this tap opens. */
  moment?: ReceiptMoment;
}) {
  const view = onView ? (
    <button
      type="button"
      className={cn(ip.viewBtn, pulse && ip.viewPulse)}
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
    <span className={ip.viewBtn}>View</span>
  );

  return (
    <div className={ip.lock}>
      <div className={ip.wall} aria-hidden="true" />
      <StatusBar time="" />
      <div className={ip.clock} aria-hidden="true">
        <div className={ip.date}>{moment.date}</div>
        <div className={ip.time}>{moment.time}</div>
      </div>

      {prompt ? (
        <div className={cn(ip.activity, ip.leaves, card && ip.gone)} aria-hidden={card}>
          <PapeXAppIcon className={ip.activityIcon} />
          <span className={ip.activityText}>
            <span className={ip.activityTitle}>{prompt.title}</span>
            <span className={ip.activityBody}>{prompt.body}</span>
          </span>
        </div>
      ) : null}

      <span className={cn(ip.quick, ip.quickL, ip.leaves, card && ip.gone)} aria-hidden="true">
        <FlashlightGlyph />
      </span>
      <span className={cn(ip.quick, ip.quickR, ip.leaves, card && ip.gone)} aria-hidden="true">
        <CameraGlyph />
      </span>

      {card ? (
        <div className={ip.acard}>
          <div className={ip.cardArt}>
            <CardArt />
            <span className={ip.cardClose} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="m7 7 10 10M17 7 7 17" />
              </svg>
            </span>
          </div>
          <div className={ip.cardBody}>
            <div className={ip.cardRow}>
              <span className={ip.cardText}>
                <span className={ip.cardName}>PapeX</span>
                <span className={ip.cardTag}>Tap to View Your Receipt</span>
              </span>
              {view}
            </div>
            <div className={ip.cardRule} aria-hidden="true" />
            <div className={ip.cardCredit} aria-hidden="true">
              <PapeXAppIcon className={ip.cardCreditIcon} />
              <span className={ip.cardCreditText}>
                <span className={ip.cardPowered}>Powered by</span>
                <span className={ip.cardCreditName}>
                  PapeX <span className={ip.age}>17+</span>
                </span>
              </span>
              <span className={ip.cardStore}>
                <AppStoreGlyph />
                App Store
                <span className={ip.cardStoreChev}>›</span>
              </span>
            </div>
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
    <svg viewBox="0 0 24 24" className={ip.islandLock} fill="currentColor" aria-hidden="true">
      <path d="M8.2 10V7.6a3.8 3.8 0 0 1 7.6 0V10h.4A2.3 2.3 0 0 1 18.5 12.3v6.4a2.3 2.3 0 0 1-2.3 2.3H7.8a2.3 2.3 0 0 1-2.3-2.3v-6.4A2.3 2.3 0 0 1 7.8 10Zm1.9 0h3.8V7.6a1.9 1.9 0 0 0-3.8 0Z" />
    </svg>
  );
}

/**
 * Swift `ReceiptMarkIcon`: an orange card tucked behind a white receipt with
 * a merchant line, body lines and an orange total. Drawn on a 100x100 box.
 */
function ReceiptMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`rmc${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFC487" />
          <stop offset="0.5" stopColor="#EB7100" />
          <stop offset="1" stopColor="#C25E00" />
        </linearGradient>
        <linearGradient id={`rmp${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBFDFE" />
          <stop offset="0.5" stopColor="#E4EBF0" />
          <stop offset="1" stopColor="#C0CCD5" />
        </linearGradient>
      </defs>
      <rect x="2" y="22" width="54" height="68" rx="10" fill={`url(#rmc${id})`} transform="rotate(-13 29 56)" />
      <g transform="rotate(4 59 50)">
        <path d="M27 9h64v76l-5.3 4-5.3-4-5.3 4-5.3-4-5.4 4-5.3-4-5.3 4-5.3-4-5.3 4-5.4-4-5.3 4-5.3-4Z" fill={`url(#rmp${id})`} />
        <g fill="#3D4E59">
          <rect x="39" y="22" width="26" height="4" rx="2" opacity="0.55" />
          <rect x="39" y="31" width="40" height="3" rx="1.5" opacity="0.22" />
          <rect x="39" y="39" width="33" height="3" rx="1.5" opacity="0.22" />
          <rect x="39" y="47" width="38" height="3" rx="1.5" opacity="0.22" />
        </g>
        <rect x="39" y="57" width="14" height="4" rx="2" fill="#EB7100" />
        <rect x="68" y="57" width="11" height="4" rx="2" fill="#EB7100" />
      </g>
    </svg>
  );
}

/** Swift `LoadingState`, under iOS's App Clip launch banner. */
export function ClipReading({
  label = "Reading your receipt",
  time = FALLBACK_MOMENT.time,
}: {
  label?: string;
  /** Status-bar clock — pass receiptMoment(...).time so it matches the lock screen. */
  time?: string;
}) {
  return (
    <div className={ip.reading}>
      <StatusBar time={time} />
      <ClipTopBar className={ip.bannerPinned} />
      <ReceiptMark className={ip.readingMark} />
      <div className={ip.readingLabel}>{label}</div>
      <div className={ip.readingTrack} aria-hidden="true">
        <span className={ip.readingSeg} />
      </div>
    </div>
  );
}

/**
 * iOS's App Clip launch banner: app icon, "Powered by / PapeX / PapeX" and
 * "App Store >". System UI, not the clip's own top bar (that one is in
 * ClipApp.tsx). In flow by default; pass a className to pin it.
 */
export function ClipTopBar({ className }: { className?: string }) {
  return (
    <div className={cn(ip.banner, className)} aria-hidden="true">
      <PapeXAppIcon className={ip.bannerIcon} />
      <span className={ip.bannerText}>
        <span className={ip.bannerPowered}>Powered by</span>
        <span className={ip.bannerName}>PapeX</span>
        <span className={ip.bannerSub}>PapeX</span>
      </span>
      <span className={ip.bannerStore}>
        <AppStoreGlyph />
        App Store
        <span className={ip.cardStoreChev}>›</span>
      </span>
    </div>
  );
}
