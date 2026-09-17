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
//   The real receipt, undecorated, with "Get PapeX" as the only CTA — and,
//   below it, the PapeX value layer for this sid (savings, rewards, the price
//   insight, the merchant's voucher, the email opt-in). That layer comes
//   entirely from lib/demoReceipts.ts's enrichment map and is rendered by
//   ../enrichment.tsx, which is server-only for the same island reasons as
//   ui.tsx. A demo sid with no enrichment renders exactly the page that
//   shipped before the layer existed.
//   Deliberately NOT the DemoBanner / SampleFrame / watermark treatment `/r`
//   uses for its `?demo=1` sample: those exist to mark FABRICATED data in a
//   context where a visitor might mistake it for THEIR OWN real purchase
//   (see lib/receiptState.ts — a real defect fix, don't undo it). That is
//   not the risk here — nobody tapping a demo tag at a booth thinks
//   Hartwell's Market printed for their own purchase — and that treatment's
//   visual weight would read as the company hedging on its own demo.
//
//   Some of these receipts ARE invented (Hartwell's Market, Ellsworth
//   Market — the store, prices and promotions were made up for the pitch);
//   Sunset Leaf is real seeded data from a real provisioned merchant, and
//   is not. Rather than a blanket banner across every demo sid, this is
//   disclosed per-receipt: lib/demoReceipts.ts's `fabricated` field on the
//   enrichment payload drives one calm sentence, `DemoDisclosure` below,
//   that appears only for a receipt actually marked that way.
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
import {
  formatDemoDisclosure,
  getDemoEnrichment,
  offerDaysRemaining,
  resolveDemoRoute,
} from "@/lib/demoReceipts";
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
  DemoDisclosure,
  AppCta,
} from "../ui";
import { EnrichmentSections } from "../enrichment";
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

  // The PapeX value layer for this sid: savings, loyalty, the price insight,
  // the merchant's offer, the email opt-in. `undefined` for a sid with no
  // enrichment and an empty object for a demo sid that simply doesn't carry
  // one (the Sunset Leaf bench tag) — either way EnrichmentSections renders
  // nothing and the page falls back to the bare receipt.
  const enrichment = getDemoEnrichment(sid);

  // The disclosure line for a receipt whose store, prices and promotions
  // were invented for this demo (Hartwell's Market, Ellsworth Market) —
  // `undefined` for one that isn't marked `fabricated` (Sunset Leaf, or a
  // sid with no enrichment at all), in which case nothing renders. See
  // DemoReceiptEnrichment.fabricated and DemoDisclosure for the full
  // argument for why this is per-receipt rather than a blanket banner.
  const disclosure = formatDemoDisclosure(enrichment);

  // The page owns the clock so every function under it stays pure and can be
  // tested at simulated dates. `new Date()` is read exactly once, here.
  //
  // It feeds ONE thing: the offer's "N days left" chip. The voucher's own
  // validity line is a duration ("Valid for 14 days from purchase") and is
  // true on every date there will ever be, and once the window closes the
  // chip disappears rather than turning into "Expired" — because these
  // stickers are permanent and a demo advertising a dead coupon reads as
  // broken software rather than as an old receipt. See DemoOffer in
  // lib/demoReceipts.ts for the full argument.
  const daysRemaining = offerDaysRemaining(enrichment, new Date());

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
        {/* The demo-data disclosure, directly under the receipt: after the
            structured card a screenshot at a loud booth is most likely to
            already include, before the value layer resumes the pitch below.
            Absent entirely for a non-`fabricated` receipt (Sunset Leaf) — see
            DemoDisclosure in ../ui.tsx for why this isn't the SampleFrame /
            watermark treatment. */}
        {disclosure && <DemoDisclosure text={disclosure} />}
        {/* The value layer, below the paper — savings, rewards, PapeX's own
            observation, the merchant's voucher, the opt-in. Deliberately
            below: the receipt is the thing the visitor tapped for and has to
            arrive first and intact. Everything here is additive, and a sid
            with no enrichment renders exactly the page that shipped. */}
        <EnrichmentSections enrichment={enrichment} daysRemaining={daysRemaining} />
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
