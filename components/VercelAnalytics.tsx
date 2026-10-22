"use client";

// components/VercelAnalytics.tsx
//
// <Analytics /> from @vercel/analytics with its URLs redacted. A function prop
// cannot cross from the server layout into a client component, so the
// beforeSend lives here. What is redacted and why: lib/analyticsGate.ts
// (redactVercelEvent). Page views on receipt/invite/merchant routes are kept,
// under their masked route (`/invite/[token]`, `/r`).

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/react";
import { redactVercelEvent } from "@/lib/analyticsGate";

// Module level, so the function's identity is stable across renders.
function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  return redactVercelEvent(event, { referrer: document.referrer, hostname: window.location.hostname });
}

export default function VercelAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
