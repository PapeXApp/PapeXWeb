// lib/cards/countdown.ts
//
// The one piece of formatting a client does itself: the offer's "N days left"
// chip, computed from the server's `validity.expiresAt` and the client's
// clock. Everything else a card shows arrives as finished text.
//
// THE RULE (the Swift port implements the same arithmetic):
//   expiresAt is the LAST second of the final valid day, in the merchant's
//   timezone, sent as UTC (`2026-10-20T23:59:59Z`, `2026-09-23T06:59:59Z`).
//   Truncate now to whole seconds. If now > expiresAt the chip is hidden;
//   otherwise days = floor((expiresAt − now) / 86 400 s).
//     0 → "Last day", 1 → "1 day left", n → "n days left".
//   Because expiresAt sits on the merchant's day boundary, this counts the
//   merchant's calendar days without the client knowing the timezone (a DST
//   change can shift the flip by an hour on two nights a year).
//   Once the window closes the chip disappears, and the redemption (code /
//   barcode / QR) is REMOVED and replaced by "Expired <date>" (isExpired,
//   formatExpired), whatever hideWhenExpired says. An expired coupon never
//   shows a usable code anywhere.

const DAY_SECONDS = 86_400;
const EXPIRES_AT_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/;

/**
 * `YYYY-MM-DDTHH:MM:SSZ` → epoch seconds, or null if it is not exactly that
 * shape or not a real calendar instant (2026-02-30 is rejected, not rolled).
 */
export function parseExpiresAt(value: string): number | null {
  const m = EXPIRES_AT_RE.exec(value);
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number);
  const ms = Date.UTC(y, mo - 1, d, h, mi, s);
  const back = new Date(ms);
  if (
    back.getUTCFullYear() !== y ||
    back.getUTCMonth() !== mo - 1 ||
    back.getUTCDate() !== d ||
    back.getUTCHours() !== h ||
    back.getUTCMinutes() !== mi ||
    back.getUTCSeconds() !== s
  ) {
    return null;
  }
  return ms / 1000;
}

/** Whole days left, or null when the window has closed (or expiresAt is unreadable). */
export function countdownDays(expiresAt: string, now: Date): number | null {
  const exp = parseExpiresAt(expiresAt);
  if (exp == null) return null;
  const nowSec = Math.floor(now.getTime() / 1000);
  if (!Number.isFinite(nowSec) || nowSec > exp) return null;
  return Math.floor((exp - nowSec) / DAY_SECONDS);
}

/**
 * True iff the window has closed: floor(now / 1 s) > expiresAt, the chip's own
 * rule. An unparseable expiresAt or an unusable clock is NOT expired (the
 * offer behaves as it always did). Redemption codes/barcodes are gated on this.
 */
export function isExpired(expiresAt: string, now: Date): boolean {
  const exp = parseExpiresAt(expiresAt);
  if (exp == null) return false;
  const nowSec = Math.floor(now.getTime() / 1000);
  return Number.isFinite(nowSec) && nowSec > exp;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "Expired Sep 22, 2026". expiresAt is 23:59:59 merchant-local sent as UTC, so
 * the merchant's last valid day is the UTC date of (expiresAt - 12h) for any
 * offset from UTC-12 to UTC+11. Returns "Expired" if expiresAt is unreadable.
 */
export function formatExpired(expiresAt: string): string {
  const exp = parseExpiresAt(expiresAt);
  if (exp == null) return "Expired";
  const d = new Date((exp - 12 * 3600) * 1000);
  return `Expired ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** The chip's text. Fixed English strings, identical to the demo layer's and the clip's. */
export function formatCountdown(days: number): string {
  if (days <= 0) return "Last day";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

/**
 * The resolver side of the rule, for sources that know "days left" rather
 * than an instant: the last second of the UTC day `days` after `now`'s.
 * Used by the demo source, whose anchor is UTC calendar days
 * (lib/demoReceipts.ts offerDaysRemaining).
 */
export function endOfUtcDayAfter(now: Date, days: number): string {
  const ms = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days, 23, 59, 59);
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}
