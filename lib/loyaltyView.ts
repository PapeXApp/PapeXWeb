// lib/loyaltyView.ts
//
// What the /w page shows for a receipt's loyalty block (lib/rdhParsed.ts
// ParsedLoyalty). Three states, and nothing is ever inferred:
//   enrolled true  + any points printed -> the points line
//   enrolled false                      -> the enroll CTA, if the merchant has one
//   enrolled null, or no block at all   -> nothing

import type { ParsedLoyalty } from "./rdhParsed";
import { enrollCtaFor, merchantIdForName, type EnrollCta } from "./merchantLoyalty";

export type LoyaltyView =
  | { kind: "points"; title: string; line: string; tier: string | null }
  | { kind: "enroll"; cta: EnrollCta };

const points = (n: number) => `${n.toFixed(2)} points`;

export function loyaltyViewOf(loyalty: ParsedLoyalty | null, merchantName: string | null): LoyaltyView | null {
  if (!loyalty) return null;
  if (loyalty.enrolled === true) {
    const parts: string[] = [];
    if (loyalty.pointsEarned != null) parts.push(`You earned ${points(loyalty.pointsEarned)}`);
    if (loyalty.pointsRedeemed != null && loyalty.pointsRedeemed > 0) parts.push(`Used ${points(loyalty.pointsRedeemed)}`);
    if (loyalty.pointsBalance != null) parts.push(`Balance ${points(loyalty.pointsBalance)}`);
    if (parts.length === 0) return null;
    return { kind: "points", title: loyalty.programName ?? "Rewards", line: parts.join(" · "), tier: loyalty.tier };
  }
  if (loyalty.enrolled === false) {
    const cta = enrollCtaFor(merchantIdForName(merchantName));
    return cta ? { kind: "enroll", cta } : null;
  }
  return null;
}
