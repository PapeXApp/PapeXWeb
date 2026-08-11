// app/api/rdh/merchant/[...path]/route.ts
//
// Server-side proxy for the merchant dashboard's reads against the RDH
// merchant API. Same reasoning as app/api/rdh/claim/route.ts: the browser
// never talks to api.papex.app directly.
//
// This is what plan.md ("Dashboard (PapeXWeb) — ... server-side fetch (no
// CORS issue)") originally called for. lib/merchantApi.ts was built fetching
// api.papex.app straight from the client instead, which works in production
// only because merchant.papex.app is in the API Gateway allow_origins list —
// and breaks anywhere else, including local dev on merchant.localhost, where
// every request dies on the preflight. Routing through this handler removes
// the CORS dependency entirely rather than adding another origin to the
// production API for a dev convenience.
//
// Contract: every route under /merchant/* on the RDH API is a GET, is gated
// by API Gateway's JWT authorizer, and resolves merchant_id server-side from
// the token's uid. This handler therefore:
//   - forwards ONLY the Authorization header (no cookies, no client headers)
//   - forwards the query string verbatim (cursor/from/to/limit/window)
//   - passes the upstream status straight through, so the client's existing
//     401/404 handling keeps working unchanged
//   - reads the body as bytes, not text, because /merchant/receipt/{sid}
//     returns raw ESC/POS that the detail page parses (a text round-trip
//     would corrupt it)
//
// Never logs the bearer token or any receipt content — same rule the claim
// proxy follows.

import { NextRequest, NextResponse } from "next/server";

// Reads must never be cached: a merchant polling for a just-uploaded receipt
// has to see it, and responses are per-merchant.
export const dynamic = "force-dynamic";

const DEFAULT_RDH_API = "https://api.papex.app";

function rdhApiBase(): string {
  const fromEnv =
    process.env.RDH_API_BASE?.trim() || process.env.NEXT_PUBLIC_RDH_API_BASE?.trim();
  return (fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_RDH_API).replace(/\/+$/, "");
}

// Path segments the dashboard is allowed to reach. Anything else 404s here
// rather than being forwarded — this handler is a proxy for a known route
// list, not an open relay to the RDH API.
const ALLOWED_FIRST_SEGMENT = new Set([
  "transactions",
  "insights",
  "devices",
  "tap-rate",
  "export.csv",
  "receipt",
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  if (!path?.length || !ALLOWED_FIRST_SEGMENT.has(path[0])) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    // Mirrors what the JWT authorizer would say, without spending the round trip.
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const search = request.nextUrl.search;
  const upstream = `${rdhApiBase()}/merchant/${path.map(encodeURIComponent).join("/")}${search}`;

  let response: Response;
  try {
    response = await fetch(upstream, {
      method: "GET",
      headers: {
        Authorization: authorization,
        Accept: request.headers.get("accept") ?? "application/json",
      },
      cache: "no-store",
    });
  } catch {
    // Upstream unreachable — distinct from any status the API itself returns.
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }

  const body = await response.arrayBuffer();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}
