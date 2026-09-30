// app/api/r/[sid]/cards-grant/route.ts
//
// POST {grant}: store the RDH cards TAP grant for this sid in an httpOnly
// cookie scoped to /r (1.7.1, PapeX #27; see lib/cards/grant.ts). Called once
// by app/r/cards/KeepCardsGrant.tsx after /r rendered cards inside the tap
// window, so the person who tapped can come back to their offer later.
//
// It verifies nothing cryptographically (the RDH service does, on every use)
// and grants nothing by itself: a cookie a browser sets for itself only ever
// reaches this site's own /r render. Same-origin only; never logs the sid or
// the grant.

import { NextResponse } from "next/server";
import { isValidSid } from "@/lib/rdh";
import { grantSetCookie, isTapGrant, sameOrigin } from "@/lib/cards/grant";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function reply(status: number, setCookie?: string) {
  const res = new NextResponse(null, { status });
  res.headers.set("Cache-Control", "no-store");
  if (setCookie) res.headers.append("Set-Cookie", setCookie);
  return res;
}

export async function POST(request: Request, { params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  if (!isValidSid(sid)) return reply(404);
  if (!sameOrigin(request)) return reply(403);
  let grant: unknown;
  try {
    grant = ((await request.json()) as { grant?: unknown } | null)?.grant;
  } catch {
    return reply(400);
  }
  if (!isTapGrant(grant)) return reply(400);
  const cookie = grantSetCookie(sid, grant, Date.now());
  return cookie ? reply(204, cookie) : reply(400);
}
