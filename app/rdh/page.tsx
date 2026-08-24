// app/rdh/page.tsx
//
// Universal-link landing spot for `https://links.papex.app/rdh?sid=<sid>`
// (links.papex.app and papex.app are the same Vercel project/repo).
// SaveToPapex.tsx hands iOS visitors this exact URL as the "Save to PapeX"
// action once a real (non-sample) receipt is showing.
//
// THE ONE FACT THIS PAGE IS BUILT ON
//   If this page renders at all, the PapeX app is NOT installed. When it is
//   installed, iOS intercepts the universal link and hands the sid straight
//   to the app — no web request is ever made (see
//   public/.well-known/apple-app-site-association, which lists `/rdh` and
//   `/rdh/*` under the FULL app's appID, not the App Clip's). So this route
//   does not need to guess at install state: reaching it IS the answer.
//
//   This used to `redirect()` to `/r?sid=` — forwarding the visitor to the
//   receipt viewer they had just tapped "Save to PapeX" from. That reads as
//   the button being broken: the page reloads and nothing has happened, with
//   no route to the app that would actually save anything. Reported from the
//   pilot floor 2026-08-24.
//
// WHY AN INTERSTITIAL RATHER THAN A BARE REDIRECT TO THE APP STORE
//   Someone who tapped a device to get their receipt is mid-errand and may
//   not want a 200 MB download right now. Sending them straight to the App
//   Store takes the receipt away to pay for an install they did not ask for.
//   The App Store is the primary action because it is what they asked for by
//   tapping the button; the receipt stays one tap away underneath it.
//
// KNOWN LIMITATION — the sid does not survive the install.
//   There is no deferred deep link here, so a visitor who installs from this
//   page does not land back on this receipt; they have to tap the device
//   again (which now opens the app directly) or re-open the link. Closing
//   that gap needs either a deferred-link service or a pasteboard handoff,
//   both of which are a bigger decision than this fix.
//
// Sid handling is deliberately unchanged: forward whatever arrived, even a
// malformed one, and let `/r`'s own isValidSid + resolveReceiptState decide.
// A visitor who tapped the device believes they have a receipt; collapsing a
// malformed sid to bare `/r` would show them the DEMO sample as if it were
// real, which is the exact defect that taxonomy exists to prevent.

import Link from "next/link";
import { redirect } from "next/navigation";

import { Shell, GlassCard, APP_STORE_URL } from "../r/ui";

export const dynamic = "force-dynamic";

export default async function RdhUniversalLinkFallback({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawSid = Array.isArray(params.sid) ? params.sid[0] : params.sid;
  const sid = rawSid != null && rawSid.trim().length > 0 ? rawSid.trim() : null;

  // No sid at all: there is nothing to save, so there is nothing to pitch an
  // install for. Send them to /r's demo state, exactly as before.
  if (!sid) redirect("/r");

  return (
    <Shell>
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <GlassCard
          emphasis="neutral"
          radius={9999}
          className="mb-5 flex h-14 w-14 items-center justify-center"
        >
          <span className="text-2xl" aria-hidden>
            &#128179;
          </span>
        </GlassCard>

        <h1 className="font-barlow text-xl font-medium" style={{ color: "var(--page-text)" }}>
          Get PapeX to save this receipt
        </h1>
        <p
          className="mt-2 max-w-xs text-sm"
          style={{ color: "var(--page-text-secondary)" }}
        >
          Saving keeps this receipt in your account, and every receipt after it
          lands there automatically when you tap.
        </p>

        <Link
          href={APP_STORE_URL}
          className="mt-6 w-full max-w-xs rounded-full px-6 py-3 text-center text-sm font-medium text-white transition active:scale-[0.98]"
          style={{ background: "#EB7100" }}
        >
          Get PapeX
        </Link>

        <Link
          href={`/r?sid=${encodeURIComponent(sid)}`}
          className="mt-4 text-sm underline underline-offset-2"
          style={{ color: "var(--page-text-muted)" }}
        >
          Just view this receipt
        </Link>
      </div>
    </Shell>
  );
}
