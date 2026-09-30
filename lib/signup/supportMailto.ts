// lib/signup/supportMailto.ts
//
// The /support message form's safety net. Until PAPEXWEB_SERVICE_ACCOUNT (and
// the AWS_SES_* keys) are set on Vercel, POST /api/signup answers 503 and the
// request goes nowhere. Rather than lose it, the form then offers a one-click
// "Open email" link: a mailto: to nico@papex.app pre-filled with the visitor's
// own message, so it still reaches Nico and he still replies from his inbox.
//
// Deliberately NOT a client-side Firestore write (unlike the DemoForm's
// temporary fallback): an email always reaches a person; a stray document in
// a collection nobody watches does not.
//
// Pure (no browser APIs) so it can be unit-tested.

import type { SignupResult } from "./client";
import { SUPPORT_TOPICS, type SupportTopic } from "./schema";

export const SUPPORT_FALLBACK_TO = "nico@papex.app";

export interface SupportMailtoFields {
  fullName: string;
  email: string;
  topic: SupportTopic | "";
  message: string;
  path?: string;
}

/**
 * When the form should show the email fallback instead of a plain error.
 * Everything except "fix your fields" (400 invalid_fields, shown inline) and
 * success: 503 unavailable/not_configured, network failure, 500, 429 and any
 * other unexpected answer all mean the server did not take the message, and
 * the visitor's text is still right there to send another way. Never for a
 * filled honeypot (a bot).
 */
export function shouldOfferEmailFallback(result: SignupResult, honeypotFilled: boolean): boolean {
  if (honeypotFilled || result.ok) return false;
  return result.error !== "invalid_fields";
}

/** RFC 6068: every value percent-encoded; line breaks as CRLF (%0D%0A). */
function enc(value: string): string {
  return encodeURIComponent(value.replace(/\r\n?|\n/g, "\r\n"));
}

/** mailto:nico@papex.app?subject=…&body=… with the visitor's message in it. */
export function buildSupportMailto(fields: SupportMailtoFields): string {
  const name = fields.fullName.trim();
  const topic = fields.topic ? SUPPORT_TOPICS[fields.topic] : "";
  const body = [
    fields.message.trim(),
    "",
    "---",
    `Name: ${name || "(not given)"}`,
    `Email: ${fields.email.trim() || "(not given)"}`,
    `Topic: ${topic || "(not given)"}`,
    `Page: ${fields.path || "/support"}`,
  ].join("\n");
  return `mailto:${SUPPORT_FALLBACK_TO}?subject=${enc(subjectLine(topic, name))}&body=${enc(body)}`;
}

/** Same shape as the server email's subject: "PapeX support: <topic> — <name>". */
function subjectLine(topic: string, name: string): string {
  if (topic && name) return `PapeX support: ${topic} — ${name}`;
  if (topic || name) return `PapeX support: ${topic || name}`;
  return "PapeX support";
}
