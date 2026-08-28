// app/rdh/page.tsx
//
// Universal-link landing spot for `https://links.papex.app/rdh?sid=<sid>`
// (links.papex.app and papex.app are the same Vercel project/repo).
// SaveToPapex.tsx hands iOS visitors this exact URL as the "Save to PapeX"
// action once a real (non-sample) receipt is showing.
//
// This route only renders when the handoff did NOT happen. When the full
// PapeX app is installed, iOS intercepts the universal link before any web
// page loads (per the app's Associated Domains entitlement plus
// public/.well-known/apple-app-site-association, which lists `/rdh` and
// `/rdh/*` alongside the `/r`/`/r/*` App Clip paths so the full app — not
// the App Clip — claims this path). So arriving here means one of:
//
//   1. The app isn't installed. This is the common case and the reason the
//      route exists: the visitor wants to save a receipt and needs the app.
//   2. The tap happened on a page already served from links.papex.app. iOS
//      does not honour a universal link when the source page is on the same
//      host as the link, so Safari just navigates. The device writes
//      `https://papex.app/r?sid=…` to the tag, so the real-world path is
//      cross-host and unaffected; only links.papex.app/r hits this.
//
// It used to `redirect()` straight back to `/r?sid=…` in both cases, which
// made "Save to PapeX" look like a button that reloads the page — same URL
// bar, same receipt, no app, no store link, nothing said. Both cases now
// get an install page instead. Case 2 shows an install prompt to someone
// who may already have the app, which is why "Open the receipt" stays on
// the page as a way back out.
//
// Deliberately does not duplicate /r's fetch/render logic — that page owns
// the full state taxonomy (see lib/receiptState.ts) end to end. What this
// route DOES borrow is `isValidSid`: a malformed sid must not produce an
// install page for a receipt that cannot exist, so it is forwarded to /r
// and /r's `resolveReceiptState` decides. Only a well-formed sid is worth
// installing an app for.
//
// IMPORTANT: always forward whatever sid arrived here, even a malformed one
// — only drop to bare `/r` when there truly is no sid. A visitor who tapped
// the device believes they have a receipt; collapsing a malformed sid to
// bare `/r` would land them on /r's DEMO state and show them the sample as
// if it were real, which is the exact defect that taxonomy exists to
// prevent.

import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isValidSid } from "@/lib/rdh";
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  platformFromUserAgent,
  type Platform,
} from "@/lib/storeLinks";
import { GlassCard, Shell, T } from "../r/chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Save this receipt to PapeX",
  // No install page in search results — every URL here carries a live sid.
  robots: { index: false, follow: false },
};

function StoreLink({
  href,
  label,
  primary,
}: {
  href: string;
  label: string;
  primary: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        primary
          ? "w-full rounded-full px-6 py-3 text-center text-sm font-medium text-white transition active:scale-[0.98]"
          : "w-full rounded-full px-6 py-3 text-center text-sm font-medium underline underline-offset-2 transition active:scale-[0.98]"
      }
      // Card interior — always a dark surface, so these are `T` tokens, never
      // the shell's theme-aware `--page-*` vars (those go dark-on-dark under
      // prefers-color-scheme: light). ui.tsx's token header has the rule.
      style={
        primary
          ? { background: T.orange, boxShadow: "0 8px 24px rgba(235,113,0,0.45)" }
          : { color: T.textSecondary }
      }
    >
      {label}
    </a>
  );
}

function InstallPapeX({ sid, platform }: { sid: string; platform: Platform }) {
  // Both stores are always reachable — the platform only sets which one is
  // the filled button. See lib/storeLinks.ts.
  const apple = { href: APP_STORE_URL, label: "Download on the App Store" };
  const play = { href: PLAY_STORE_URL, label: "Get it on Google Play" };
  const [lead, other] = platform === "android" ? [play, apple] : [apple, play];

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
      <GlassCard emphasis="standard" className="w-full px-5 py-6">
        <h1 className="font-barlow text-xl font-medium" style={{ color: T.text }}>
          Save this receipt to PapeX
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm" style={{ color: T.textSecondary }}>
          PapeX keeps every receipt you tap, searchable and itemized. Install
          the app, then open this link again — the receipt will be waiting.
        </p>
        <div className="mt-5 flex flex-col items-center gap-2">
          <StoreLink href={lead.href} label={lead.label} primary />
          <StoreLink href={other.href} label={other.label} primary={false} />
        </div>
      </GlassCard>
      <a
        href={`/r?sid=${encodeURIComponent(sid)}`}
        className="mt-5 text-sm underline underline-offset-2"
        style={{ color: "var(--page-text-secondary)" }}
      >
        Open the receipt without the app
      </a>
    </div>
  );
}

export default async function RdhUniversalLinkFallback({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawSid = Array.isArray(params.sid) ? params.sid[0] : params.sid;

  if (rawSid == null || rawSid.trim().length === 0) redirect("/r");
  if (!isValidSid(rawSid)) redirect(`/r?sid=${encodeURIComponent(rawSid)}`);

  const platform = platformFromUserAgent((await headers()).get("user-agent") ?? "");

  return (
    <Shell>
      <InstallPapeX sid={rawSid} platform={platform} />
    </Shell>
  );
}
