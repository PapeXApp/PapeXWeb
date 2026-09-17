// app/demo/r/page.tsx
//
// The web-only fallback for demo receipts: `https://papex.app/demo/r?sid=`.
//
// Deployed alongside app/r/demo, and expected to go unused. Its whole purpose
// is that NO App Clip experience can match it: the clip's registered
// experience is `https://papex.app/r`, and `/demo/r` is not a prefix-match of
// that under any matcher Apple could be using. An iPhone tapping a tag
// written to this URL gets the plain NFC banner and Safari — no card, but
// also no chance of the card firing on one stranger's phone and not the next.
// If the `/r/demo` advanced experience has not propagated by the day before
// the event, rewriting the tags to this URL is one NFC Tools write per tag
// with no deploy, no App Store, and no network.
//
// CONSEQUENCE FOR NAMING: never give a demo path a name that begins with the
// literal characters `/r`. Whether Apple's prefix match is a raw string
// compare or path-component aware is not documented, and under a raw string
// compare `https://papex.app/r` would prefix `https://papex.app/rdemo`.
// `/demo/…` is safe under both readings. `/demo/*` is also deliberately
// absent from public/.well-known/apple-app-site-association's `applinks`, so
// this route stays on the web even if the full app later claims papex.app/r.
//
// A RE-EXPORT, NOT A COPY. Two URLs, one implementation. A demo whose
// fallback URL renders differently from the primary is precisely the failure
// this pair of routes exists to prevent, and the only way to guarantee they
// cannot drift is for there to be nothing to drift.

import DemoReceiptPage from "@/app/r/demo/page";

export { metadata } from "@/app/r/demo/page";

// Route segment config has to be a literal export in the segment that uses
// it — Next reads these statically and a re-export is not guaranteed to be
// seen. Same value and same reason as the route this delegates to: a query
// param plus a live upstream fetch decide every render.
export const dynamic = "force-dynamic";

export default DemoReceiptPage;
