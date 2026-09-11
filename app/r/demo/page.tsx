// app/r/demo/page.tsx
//
// The demo receipt route: `https://papex.app/r/demo?sid=<demo-sid>`.
//
// WHY THIS URL SHAPE, EXACTLY
//   The shipped iOS App Clip accepts any path under `/r/` and reads the sid
//   from the QUERY STRING (PapeXClip's InvocationURL: scheme https, host
//   exactly papex.app, path `/r`, `/r/`, or anything with the prefix `/r/`,
//   and `sid` as a query item matching ^[a-f0-9]{16}$). So `/r/demo?sid=…`
//   invokes the clip with NO new app build. Two corollaries, both load-bearing:
//     - the sid MUST stay in the query. `/r/demo/<sid>` has no `sid` query
//       item, so the clip throws .missingSid and a stranger's first
//       impression of PapeX is the clip's error screen.
//     - a second App Clip Advanced Experience must be registered in App Store
//       Connect for the exact URL `https://papex.app/r/demo` (no query
//       string). Apple resolves the most specific registered prefix, so that
//       registration is what makes the choice between `/r` and `/r/demo`
//       deterministic instead of per-device.
//   app/demo/r/page.tsx is the web-only fallback if that registration does
//   not propagate in time — same component, a path the clip cannot match.
//
// WHY A SEPARATE ROUTE AT ALL
//   Isolation at the routing layer. `/r` serves every real customer who taps
//   a countertop device; a bug in demo handling must not be able to reach
//   them. Note the split of responsibilities: this ROUTE decides which iOS
//   experience fires, and lib/demoReceipts.ts decides whether the sid is
//   claimable. Neither substitutes for the other — a demo sid reached through
//   `/r?sid=` still loses its Save button (app/r/page.tsx), and a production
//   sid pasted into this URL still gets production semantics (the redirect
//   below).
//
// WHAT IT RENDERS
//   The real receipt, undecorated, with "Get PapeX" as the only CTA.
//   Deliberately NOT the DemoBanner / SampleFrame / watermark treatment `/r`
//   uses for its `?demo=1` sample: those exist to mark FABRICATED data (see
//   lib/receiptState.ts — a real defect fix, don't undo it), and these
//   receipts are real seeded data from a real provisioned merchant. Stamping
//   "Made-up data, not a real purchase" across the pitch would be both untrue
//   and self-defeating.
//
//   No SaveToPapex, and no import of it anywhere in this module's graph —
//   see CtaRow.tsx. Claiming is single-owner per sid, so a demo tag offering
//   Save is a tag offering an action that fails for everyone after the first
//   person. lib/demoReceipts.ts documents the one hole this cannot close (the
//   App Clip's own Save button, which lives in the shipped binary).
//
//   No ReceiptUpgrade polling island either: a demo blob must be text
//   ESC/POS, never a Blaze raster, so there is nothing to wait for. If a
//   raster ever does arrive the bitmap still renders below — just without a
//   poller, which is the honest degradation.
//
// This segment inherits app/r/loading.tsx (Next applies a segment's
// loading.tsx to its children) and there is no app/r/layout.tsx, so the
// skeleton and chrome match `/r` for free.

import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fetchReceiptBytes } from "@/lib/rdh";
import { resolveDemoRoute } from "@/lib/demoReceipts";
import { platformFromUserAgent } from "@/lib/storeLinks";
import { parseEscPos } from "@/lib/escpos";
import { summarizeReceipt, hasStructure as computeHasStructure } from "@/lib/receiptSummary";
import { hasVisibleContent } from "@/lib/receiptState";
import {
  Shell,
  StateCard,
  ReceiptNotAvailable,
  ReceiptView,
  DemoCtaRow,
  AppCta,
} from "../ui";
import RetryButton from "../RetryButton";

export const metadata: Metadata = {
  title: "Your PapeX Receipt",
  description: "View your digital receipt from PapeX.",
  robots: {
    index: false,
    follow: false,
  },
};

// Same reasoning as /r: a query param plus a live upstream fetch decide every
// render. Never prerender, never cache.
export const dynamic = "force-dynamic";

export default async function DemoReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawSid = Array.isArray(params.sid) ? params.sid[0] : params.sid;

  // Fail toward production, never the reverse — the rule and its rationale
  // live with the decision, in lib/demoReceipts.ts's resolveDemoRoute, so
  // they can be unit-tested (lib/demoReceipts.test.ts) without a Next.js
  // runtime. This page is a thin adapter over it.
  //
  // A redirect, not a rewrite, and that is safe here: the rewrite-never-
  // redirect rule in middleware.ts is specifically about HOST routing, where a
  // 3xx is visible to Apple's AASA crawler. This is an ordinary in-app
  // navigation on a path Apple never fetches, and a redirect is the better
  // behaviour — the visitor ends up on the canonical `/r?sid=` URL rather
  // than on a demo URL that silently behaves like production.
  const route = resolveDemoRoute(rawSid);
  if (route.action === "redirect") {
    redirect(route.url);
  }
  const sid = route.sid;

  const uaHeader = (await headers()).get("user-agent") ?? "";
  // Only ever decides which store link leads — never what the page shows.
  const platform = platformFromUserAgent(uaHeader);

  const result = await fetchReceiptBytes(sid);
  const receipt = result.status === "ok" ? parseEscPos(result.bytes) : undefined;
  const summary = receipt ? summarizeReceipt(receipt.lines) : undefined;
  const rasterPage = receipt?.rasterPage?.fullPage ? receipt.rasterPage : undefined;

  // A demo tag whose blob has expired or was never seeded. Says so plainly
  // rather than inventing content — the honesty rules `/r` follows apply here
  // for exactly the same reason, and a booth visitor being shown a fabricated
  // receipt is worse than a booth visitor being shown an empty state.
  if (result.status === "not_found" || (summary && !hasVisibleContent(summary, {
    hasFullPageImage: rasterPage != null,
  }))) {
    return (
      <Shell>
        <ReceiptNotAvailable />
        <AppCta platform={platform} />
      </Shell>
    );
  }

  if (result.status === "ok" && summary) {
    return (
      <Shell>
        <ReceiptView
          summary={summary}
          hasStructure={computeHasStructure(summary)}
          logo={receipt?.logo}
          rasterPage={rasterPage}
        />
        <DemoCtaRow platform={platform} />
      </Shell>
    );
  }

  // Transport/backend failure, and the (unreachable) "fetch said ok but
  // nothing parsed" case. Failing toward retry is always safer than failing
  // toward fabricated content.
  return (
    <Shell>
      <StateCard
        icon="warning"
        title="Couldn't load your receipt"
        message="We're having trouble right now — try again in a moment."
      >
        <RetryButton />
      </StateCard>
      <AppCta platform={platform} />
    </Shell>
  );
}
