// middleware.ts
//
// Host-based routing for merchant.papex.app (PRD: docs/MERCHANT_DASHBOARD_PRD.md
// §6, plan: memory/goals/merchant-dashboard/plan.md M5). Reuses this same
// Vercel project/repo for the merchant subdomain (Q2: DECIDED -> reuses the
// ESC/POS renderer + design system, one repo, brandable URL).
//
// REWRITE ONLY — never a redirect. A Vercel *redirect* once silently broke
// Apple's AASA fetch (see docs/rdh_orchestrator.md); this project's policy
// since then is host/path routing tricks use rewrites exclusively, which are
// invisible to the client (URL bar, and any external fetcher like Apple's
// AASA crawler, never sees a 3xx). All decision logic is delegated to the
// pure, unit-tested lib/merchantHost.ts so this file stays a thin adapter.
//
// The `matcher` below is the primary guard for leaving /r, /rdh, /api,
// /_next, static assets, /.well-known, and the AASA file byte-for-byte
// untouched — this middleware's function body never even runs for those
// paths. lib/merchantHost.ts's non-merchant-host branch is a *second*,
// defensive layer in case the matcher's exclusions are ever loosened.

import { NextResponse, type NextRequest } from "next/server";
import { resolveMerchantRewrite } from "@/lib/merchantHost";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const decision = resolveMerchantRewrite(host, request.nextUrl.pathname);

  if (decision.action === "rewrite") {
    const url = request.nextUrl.clone();
    url.pathname = decision.pathname;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Matches everything EXCEPT:
  //  - /_next/*                          (Next.js internals/assets)
  //  - /api/*                            (route handlers, incl. the RDH claim proxy)
  //  - /.well-known/*                    (AASA + any future well-known files)
  //  - /apple-app-site-association       (root-level AASA alias, see next.config.ts headers())
  //  - any path with a file extension    (favicon.ico, images, fonts, etc. — static assets)
  matcher: [
    "/((?!_next/|api/|\\.well-known/|apple-app-site-association$|.*\\..*).*)",
  ],
};
