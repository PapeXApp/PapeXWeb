// POST /api/events/loyalty-click — counts a click on the /w rewards-enroll
// link. Logic and storage: lib/server/loyaltyClick/. Called with
// navigator.sendBeacon, so the response is never read by the page.

import { NextResponse, type NextRequest } from "next/server";
import { getPapexWebDb, hasPapexWebCredentials } from "@/lib/server/firebaseAdminWeb";
import { createRateLimiter, clientIpFromHeaders } from "@/lib/server/signup/rateLimit";
import {
  LOYALTY_CLICK_RATE_LIMIT,
  MAX_BODY_BYTES,
  handleLoyaltyClick,
  type LoyaltyClickStore,
} from "@/lib/server/loyaltyClick/handler";
import { createFirestoreLoyaltyClickStore } from "@/lib/server/loyaltyClick/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimiter = createRateLimiter(LOYALTY_CLICK_RATE_LIMIT);

let store: LoyaltyClickStore | null = null;
function getStore(): LoyaltyClickStore | null {
  if (!hasPapexWebCredentials()) return null;
  store ??= createFirestoreLoyaltyClickStore(getPapexWebDb());
  return store;
}

async function readBoundedText(req: NextRequest, max: number): Promise<string | null> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > max) return null;
  const text = await req.text();
  return Buffer.byteLength(text, "utf8") > max ? null : text;
}

export async function POST(req: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const res = await handleLoyaltyClick(
      {
        bodyText: await readBoundedText(req, MAX_BODY_BYTES),
        ip: clientIpFromHeaders((n) => req.headers.get(n)),
        userAgent: req.headers.get("user-agent") ?? "",
      },
      { getStore, rateLimiter, now: () => new Date(), log: { error: (m) => console.error(m) } },
    );
    return NextResponse.json(res.body, { status: res.status, headers });
  } catch (err) {
    console.error("[loyalty-click] unexpected error:", err instanceof Error ? err.message : "unknown error");
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500, headers });
  }
}
