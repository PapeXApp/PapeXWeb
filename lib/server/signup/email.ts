// lib/server/signup/email.ts
//
// SERVER ONLY. Tells the team about a new sign-up through AWS SES (v2 API).
//
// Env (all optional; see docs/SIGNUP_ROUTE.md):
//   AWS_SES_ACCESS_KEY_ID + AWS_SES_SECRET_ACCESS_KEY   both required to send
//   AWS_SES_REGION        default us-east-1 (where papexmail.com is verified)
//   SIGNUP_NOTIFY_FROM    default notifications@papexmail.com
//   SIGNUP_NOTIFY_TO      default nico@papex.app (comma-separated for several)
//
// Credentials are passed explicitly rather than read from the default AWS
// chain, so the route can never pick up some other AWS identity by accident.
// Missing key pair = no sender: the route still saves and logs
// "email skipped (no SES config)".
//
// Header injection: the subject is a fixed string per kind, and the From/To
// come from env only. No user input ever reaches a header; submitted values
// appear only in the plain-text body (already stripped of control chars by
// lib/signup/schema.ts).

import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { SignupInput } from "../../signup/schema";

export const DEFAULT_NOTIFY_FROM = "notifications@papexmail.com";
export const DEFAULT_NOTIFY_TO = "nico@papex.app";
export const DEFAULT_SES_REGION = "us-east-1";
const SEND_TIMEOUT_MS = 8000;

export interface SesConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  from: string;
  to: string[];
}

export interface NotificationEmail {
  subject: string;
  text: string;
}

export type SendNotification = (email: NotificationEmail) => Promise<void>;

// A bare address: no display name, no whitespace, no header-breaking chars.
const ADDRESS_RE = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;

type Env = Record<string, string | undefined>;

/** null when SES isn't configured (or configured with an unusable address). */
export function readSesConfig(env: Env = process.env): SesConfig | null {
  const accessKeyId = env.AWS_SES_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.AWS_SES_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) return null;
  const from = env.SIGNUP_NOTIFY_FROM?.trim() || DEFAULT_NOTIFY_FROM;
  const to = (env.SIGNUP_NOTIFY_TO?.trim() || DEFAULT_NOTIFY_TO)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!ADDRESS_RE.test(from) || to.length === 0 || !to.every((a) => ADDRESS_RE.test(a))) {
    console.error("[signup] SIGNUP_NOTIFY_FROM / SIGNUP_NOTIFY_TO is not a plain email address; email disabled.");
    return null;
  }
  return { accessKeyId, secretAccessKey, region: env.AWS_SES_REGION?.trim() || DEFAULT_SES_REGION, from, to };
}

export function buildNotificationEmail(input: SignupInput, at: Date): NotificationEmail {
  const when = at.toISOString();
  if (input.kind === "demo") {
    return {
      subject: "PapeX: new demo request",
      text: [
        "New demo request from papex.app/business (saved to the Firestore `waitlist` collection).",
        "",
        `Name:          ${input.fullName}`,
        `Business:      ${input.businessName}`,
        `Email:         ${input.email}`,
        `Phone:         ${input.phone || "(not given)"}`,
        `POS system:    ${input.posSystem || "(not given)"}`,
        `Received at:   ${when}`,
      ].join("\n"),
    };
  }
  return {
    subject: "PapeX: new blog sign-up",
    text: [
      "New blog sign-up on papex.app (saved to the Firestore `blog_subscribers` collection).",
      "",
      `Email:         ${input.email}`,
      `Source:        ${input.source}`,
      `Page:          ${input.path ?? "(not given)"}`,
      `Received at:   ${when}`,
    ].join("\n"),
  };
}

export function createSesSender(config: SesConfig): SendNotification {
  const client = new SESv2Client({
    region: config.region,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  return async ({ subject, text }) => {
    await client.send(
      new SendEmailCommand({
        FromEmailAddress: config.from,
        Destination: { ToAddresses: config.to },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: { Text: { Data: text, Charset: "UTF-8" } },
          },
        },
      }),
      { abortSignal: AbortSignal.timeout(SEND_TIMEOUT_MS) }
    );
  };
}
