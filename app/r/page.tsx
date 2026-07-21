// app/r/page.tsx
//
// RDH receipt web fallback. A customer taps the countertop NFC device;
// iPhones with the App Clip installed launch it natively, but Android
// phones and non-App-Clip iPhones land here in a plain browser at
// `https://papex.app/r?sid=<16-hex>`. Before this page existed that was a
// raw 404 — see docs/RDH_WEB_FALLBACK_PLAN.md and docs/rdh_orchestrator.md.
//
// Deliberately a Server Component, not a client component with a
// browser-side fetch: the backend
// (Papex_RDH/lambdas/fetch/handler.js, GET /receipt/{sid}) has no CORS
// configured — it's designed for the App Clip's native URLSession, which
// isn't CORS-gated. A browser-side `fetch()` here would just fail silently.
// Fetching server-side sidesteps that entirely and matches the task's
// explicit instruction to never fetch from the browser.
//
// `loading.tsx` in this segment covers the "slow fetch" state automatically
// via the Suspense boundary Next.js creates around this async component.

import type { Metadata } from "next";
import { headers } from "next/headers";
import { fetchReceiptBytes, isValidSid } from "@/lib/rdh";
import { parseEscPos, guessMerchantName } from "@/lib/escpos";
import { Shell, StateCard, ReceiptCard, AppCta } from "./ui";
import RetryButton from "./RetryButton";

export const metadata: Metadata = {
  title: "Your PapeX Receipt",
  description: "View your digital receipt from PapeX.",
  robots: {
    index: false,
    follow: false,
  },
};

// Every render depends on a query param + a live upstream fetch — never
// prerender or cache this route.
export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawSid = Array.isArray(params.sid) ? params.sid[0] : params.sid;
  const uaHeader = (await headers()).get("user-agent") ?? "";
  const isAndroid = /android/i.test(uaHeader);

  if (!isValidSid(rawSid)) {
    return (
      <Shell>
        <StateCard
          icon="warning"
          title="This receipt link isn't valid"
          message="Double check the link, or ask the store for a new one."
        />
        <AppCta isAndroid={isAndroid} />
      </Shell>
    );
  }

  const result = await fetchReceiptBytes(rawSid);

  if (result.status === "not_found") {
    return (
      <Shell>
        <StateCard
          icon="clock"
          title="This receipt isn't available anymore"
          message="Receipts expire after 30 days."
        />
        <AppCta isAndroid={isAndroid} />
      </Shell>
    );
  }

  if (result.status === "error") {
    return (
      <Shell>
        <StateCard
          icon="warning"
          title="Couldn't load your receipt"
          message="We're having trouble right now — try again in a moment."
        >
          <RetryButton />
        </StateCard>
        <AppCta isAndroid={isAndroid} />
      </Shell>
    );
  }

  const receipt = parseEscPos(result.bytes);
  const merchantName = guessMerchantName(receipt.lines);

  return (
    <Shell>
      <ReceiptCard lines={receipt.lines} merchantName={merchantName} />
      <AppCta isAndroid={isAndroid} />
    </Shell>
  );
}
