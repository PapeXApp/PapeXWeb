// app/r/CtaRow.tsx
//
// The production receipt footer: "Save to PapeX" + the install links.
//
// Split out of ui.tsx for the same reason chrome.tsx was: this is the ONLY
// thing in the segment that renders SaveToPapex, a "use client" island that
// pulls in the Firebase auth SDK, and Next.js includes every client entry
// point reachable from a page's module graph whether it is rendered or not.
// While it lived in ui.tsx, every route that wanted a receipt card
// (app/merchant/tx/[sid], and now the demo routes) dragged the sign-in
// bundle along with it.
//
// That matters more than bundle size here. The demo routes must never offer
// a claim — a demo sid is single-owner like any other, so the second person
// to press Save would be told the receipt "was already saved by another
// account" (see lib/demoReceipts.ts). Keeping the claim island out of their
// module graph entirely is a stronger guarantee than remembering not to
// render it.
//
// So: import from "./ui" for cards and the non-claiming CTA; import from
// here only when the route genuinely offers a claim.

import { AppCta, DemoCtaRow } from "./ui";
import SaveToPapex from "./SaveToPapex";
import type { Platform } from "@/lib/storeLinks";

export function CtaRow({
  sid,
  isSample,
  isDemo = false,
  platform,
}: {
  sid?: string;
  isSample: boolean;
  /**
   * This sid is a demo receipt (lib/demoReceipts.ts) reached through the
   * PRODUCTION `/r?sid=` URL — a stale tag, a shared link, a screenshot
   * someone retyped. Suppresses the claim affordance exactly as the demo
   * routes do.
   *
   * A dedicated prop rather than folding it into `isSample`: `isSample`
   * means "this content is fabricated" and drives copy that says so
   * ("Nothing to save — this is a sample receipt"). A demo receipt is REAL
   * seeded data from a real provisioned merchant, so that caption would be
   * untrue — and the marking machinery `isSample` also controls (the pinned
   * banner, the dashed frame, the watermark) exists to flag made-up data and
   * must not be applied to a real one.
   */
  isDemo?: boolean;
  platform: Platform;
}) {
  if (isDemo) {
    return <DemoCtaRow platform={platform} />;
  }

  return (
    <div className="mt-2 flex flex-col items-center gap-4">
      <SaveToPapex sid={sid} isSample={isSample} isIOS={platform === "ios"} />
      <AppCta platform={platform} />
    </div>
  );
}
