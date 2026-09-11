// lib/server/notify.ts
//
// SERVER ONLY. Emails PapeX staff when a merchant submits a change request.
//
// Sends through Resend only when RESEND_API_KEY is set; otherwise (and
// always in mock mode) it is a no-op. It NEVER throws: a failed email must
// not fail a merchant's saved request. Callers run it after the response
// (next/server `after`), and it logs and returns on any error.

import type { ChangeRequest } from "../changeRequests/types";
import { getAdminEmails } from "./merchantAuth";
import { isMerchantMockMode } from "./merchantData";

const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "PapeX <onboarding@resend.dev>";
const ADMIN_URL = "https://merchant.papex.app/admin";
const TIMEOUT_MS = 8000;

function oneLine(s: string): string {
  return s.replace(/[\r\n]+/g, " ").trim();
}

export function buildChangeRequestEmail(request: ChangeRequest): { subject: string; text: string } {
  const merchant = request.merchantName ?? request.merchantId ?? "Unlinked merchant";
  const subject = oneLine(`New change request: ${merchant} / ${request.section}`).slice(0, 200);
  const lines = [
    `${request.requesterEmail} asked to ${request.action} something in "${request.section}" for ${merchant}.`,
    "",
  ];
  if (request.itemLabels.length > 0) lines.push(`Items: ${request.itemLabels.join(", ")}`);
  if (request.proposedColors?.primary || request.proposedColors?.secondary) {
    lines.push(`Proposed colors: ${[request.proposedColors.primary, request.proposedColors.secondary].filter(Boolean).join(" and ")}`);
  }
  if (request.attachments.length > 0) lines.push(`Images attached: ${request.attachments.length}`);
  lines.push("", "Message:", request.message || "(no message)", "", `Review it at ${ADMIN_URL}`);
  return { subject, text: lines.join("\n") };
}

export async function notifyNewChangeRequest(request: ChangeRequest): Promise<void> {
  try {
    if (isMerchantMockMode()) return;
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) return;
    const { subject, text } = buildChangeRequestEmail(request);
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MERCHANT_REQUEST_FROM?.trim() || DEFAULT_FROM,
        to: getAdminEmails(),
        subject,
        text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) console.error(`[merchant-profile] change request email failed: HTTP ${res.status}`);
  } catch (err) {
    console.error("[merchant-profile] change request email failed:", err instanceof Error ? err.message : err);
  }
}
