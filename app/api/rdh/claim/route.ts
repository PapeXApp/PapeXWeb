// app/api/rdh/claim/route.ts
//
// Server-side proxy for the RDH "Save to PapeX" claim flow (see
// app/r/SaveToPapex.tsx). The browser never talks to the adapter backend
// directly — same CORS-avoidance reasoning as lib/rdh.ts's receipt fetch,
// plus this keeps the adapter host itself out of client-shipped code.
//
// Pinned contract (do not deviate):
//   POST {ADAPTER_API_BASE}/api/v1/rdh/claim
//   body: {"sid": "<16 lowercase hex>"}
//   Authorization: Bearer <firebase ID token>, forwarded from the request
//   Upstream statuses this route understands and passes through verbatim:
//     200 {receiptId, status: "claimed" | "already_claimed"}
//     400 (bad request — shouldn't happen given the sid check below)
//     401 (bad/expired token)
//     404 (receipt not found / expired)
//     409 (already claimed by a different account)
//   Anything else upstream returns collapses to a generic 502 here so the
//   client's response-status switch stays exhaustive without needing to
//   know about every possible upstream failure mode.
//
// `ADAPTER_API_BASE` is the adapter backend's *host* base (no `/api/v1`
// suffix) — e.g. `https://adapter.api.papex.app`, not
// `https://adapter.api.papex.app/api/v1`. It resolves to the adapter EC2 (tag
// papex-adapter-backend, i-0e331185d1c29871e per
// OCR_PIPELINE_DEPLOY_2026-04-15.md) — NOT 3.226.96.195, which is the old
// unrelated prod backend. See .env.example for the documented override.
//
// **Must stay HTTPS.** This request carries the user's Firebase ID token, and
// the default used to be `http://3.90.44.195:3000` — plaintext across the
// public internet, with no browser warning because the browser->Vercel hop is
// itself HTTPS. Fixed 2026-08-17: `adapter.api.papex.app` is an A record in the
// existing api.papex.app Route 53 zone, and nginx on the box terminates TLS
// (Let's Encrypt, auto-renew) in front of localhost:3000. Never point this at
// a bare IP or an http:// origin again.
//
// Never logs the sid or the bearer token — this route only ever sees them
// in memory for the duration of the request, per the task's capability-
// model requirement (lib/rdh.ts already follows the same rule for GETs).

import { NextRequest, NextResponse } from "next/server";
import { isValidSid } from "@/lib/rdh";

const DEFAULT_ADAPTER_HOST = "https://adapter.api.papex.app";

function adapterBase(): string {
  const fromEnv = process.env.ADAPTER_API_BASE?.trim();
  const base = fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_ADAPTER_HOST;
  return base.replace(/\/+$/, "");
}

const PASSTHROUGH_STATUSES = new Set([200, 400, 401, 404, 409]);

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !/^Bearer\s+.+/i.test(authHeader)) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const sid = (body as { sid?: unknown } | null)?.sid;
  if (typeof sid !== "string" || !isValidSid(sid)) {
    return NextResponse.json({ error: "invalid_sid" }, { status: 400 });
  }

  const controller = new AbortController();
  // Must exceed the adapter's own 8s RDH-backend fetch budget plus its
  // Firestore writes, or we 502 after the claim already succeeded.
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const upstream = await fetch(`${adapterBase()}/api/v1/rdh/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ sid }),
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await upstream.text();
    let json: unknown = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    if (PASSTHROUGH_STATUSES.has(upstream.status)) {
      return NextResponse.json(json ?? {}, { status: upstream.status });
    }
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  } catch {
    // Network failure, timeout, DNS, TLS — never bubble a raw error to the
    // client (and never log the sid alongside it).
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
