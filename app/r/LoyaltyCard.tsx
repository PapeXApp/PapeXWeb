// app/r/LoyaltyCard.tsx
//
// The receipt's loyalty block on /w (lib/loyaltyView.ts decides what, if
// anything, shows). Server component; only the enroll link is a client island.

import type { LoyaltyView } from "@/lib/loyaltyView";
import { GlassCard, S, T } from "./chrome";
import { LoyaltyEnrollLink } from "./LoyaltyEnrollLink";

export function LoyaltyCard({ view, sid }: { view: LoyaltyView; sid: string }) {
  if (view.kind === "points") {
    return (
      <div>
        <p className="font-barlow mb-2 px-1 text-xl font-medium" style={{ color: S.text }}>
          {view.title}
        </p>
        <GlassCard emphasis="standard" className="p-6">
          <p className="text-base" style={{ color: T.text }}>
            {view.line}
          </p>
          {view.tier && (
            <p className="mt-1 text-sm" style={{ color: T.textSecondary }}>
              Tier: {view.tier}
            </p>
          )}
        </GlassCard>
      </div>
    );
  }
  return (
    <p className="px-1 text-center text-sm">
      <LoyaltyEnrollLink
        href={view.cta.href}
        click={{ merchantId: view.cta.merchantId, sid, page: "w", ctaVersion: view.cta.ctaVersion }}
        className="font-medium underline underline-offset-2"
        style={{ color: T.orange }}
      >
        {view.cta.label}
      </LoyaltyEnrollLink>
    </p>
  );
}
