// app/rdh/page.tsx
//
// Universal-link landing spot for `https://links.papex.app/rdh?sid=<sid>`
// (links.papex.app and papex.app are the same Vercel project/repo).
// SaveToPapex.tsx hands iOS visitors this exact URL as the "Save to PapeX"
// action once a real (non-sample) receipt is showing.
//
// This route only matters as a *fallback*: when the full PapeX app is
// installed, iOS intercepts the universal link before any web page loads
// (per the app's Associated Domains / AASA `applinks` entry — see
// public/.well-known/apple-app-site-association, which lists `/rdh` and
// `/rdh/*` alongside the existing `/r`/`/r/*` App Clip paths so the full
// app — not the App Clip — claims this path). When the app is NOT
// installed, Safari loads this page for real, and all it does is forward
// to the existing `/r` web viewer with the same sid so the visitor isn't
// dropped on a dead link.
//
// Deliberately does not duplicate /r's fetch/render logic — that page
// already owns the full state taxonomy (see lib/receiptState.ts) end to
// end: valid sid -> receipt or NOT_AVAILABLE, malformed sid -> NOT_AVAILABLE,
// no sid at all -> DEMO sample.
//
// IMPORTANT: always forward whatever sid arrived here, even a malformed one
// — only drop to bare `/r` when there truly is no sid. A visitor who tapped
// the device believes they have a receipt; collapsing a malformed sid to
// bare `/r` would land them on /r's DEMO state and show them the sample as
// if it were real, which is the exact defect this taxonomy exists to
// prevent. Let /r's own `isValidSid` + `resolveReceiptState` decide.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RdhUniversalLinkFallback({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawSid = Array.isArray(params.sid) ? params.sid[0] : params.sid;

  if (rawSid != null && rawSid.trim().length > 0) {
    redirect(`/r?sid=${encodeURIComponent(rawSid)}`);
  }
  redirect("/r");
}
