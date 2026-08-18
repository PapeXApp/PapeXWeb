// app/api/r/[sid]/parsed/route.ts
//
// Same-origin proxy for `GET /receipt/{sid}/parsed` on the RDH API, so the
// polling island in app/r/ReceiptUpgrade.tsx can call it from the browser.
//
// WHY A PROXY RATHER THAN A DIRECT BROWSER FETCH. Every other backend call on
// this page goes through the server for the same reason (lib/rdh.ts,
// app/api/rdh/claim/route.ts): the RDH API is built for the App Clip's native
// URLSession, and betting a live pilot's customer experience on a CORS
// preflight matching an allow-list configured somewhere else is a bad bet for
// zero upside. Proxying is same-origin by construction, and it keeps the API
// host out of client-shipped code.
//
// NO CACHING ANYWHERE. The entire purpose of this endpoint is that its answer
// CHANGES — from "ok_raster, no receipt yet" to "ok, here is the receipt" —
// roughly 46 seconds after the sale. A cached response would make the upgrade
// invisible for the life of the page, which is precisely the bug this route
// exists to avoid.
//
// The sid is a capability (see Papex_RDH/lambdas/fetch/handler.js) and is
// never logged here, matching lib/rdh.ts and the claim route.

import { NextResponse } from "next/server";
import { isValidSid, rdhApiBase } from "@/lib/rdh";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sid: string }> },
) {
  const { sid } = await params;

  if (!isValidSid(sid)) {
    return noStore({ error: "not_found" }, 404);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${rdhApiBase()}/receipt/${sid}/parsed`, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (res.status === 404) return noStore({ error: "not_found" }, 404);
    if (!res.ok) return noStore({ error: "upstream_error" }, 502);

    return noStore(await res.json(), 200);
  } catch {
    // Timeout, DNS, TLS, connection reset. The poller treats a 502 as
    // "try again shortly", which is the right response to all of them — and
    // the page still has the image either way.
    return noStore({ error: "upstream_error" }, 502);
  } finally {
    clearTimeout(timeout);
  }
}

function noStore(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
