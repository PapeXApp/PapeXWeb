// components/blog/format.ts
//
// Fixed-locale date formatting for the blog. The old pages called
// `toLocaleDateString()` with no locale, so the same post read "9/1/2026" on
// the server, "01/09/2026" for a UK visitor, and hydration could disagree.
// One locale, one time zone (UTC — Firestore timestamps are UTC instants and
// a post "dated" midnight UTC must not slide to the previous day in PT).

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

/** "September 1, 2026", or '' when the date is missing/invalid. */
export function formatPostDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const t = Date.parse(iso)
  return Number.isNaN(t) ? '' : DATE_FORMAT.format(t)
}
