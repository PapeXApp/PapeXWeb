// app/api/signup/route.ts
//
// POST /api/signup: the one server route for public sign-ups.
//   { kind: "demo", fullName, businessName, email, phone?, posSystem?, hp? }
//       -> Firestore `waitlist` (same doc shape the DemoForm always wrote)
//   { kind: "blog", email, source: "footer"|"blog-index"|"blog-post", path?, hp? }
//       -> Firestore `blog_subscribers/{sha256(email)}`
// then emails the team via SES (after the response; skipped if unconfigured).
//
// Contract + env + deploy steps: docs/SIGNUP_ROUTE.md. Logic lives in
// lib/server/signup/handler.ts; this file only adapts Next to it. POST only:
// Next answers 405 to any other method because no other handler is exported.

import { after, NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getPapexWebDb, hasPapexWebCredentials, PAPEXWEB_CREDENTIALS_ENV } from "@/lib/server/firebaseAdminWeb";
import { createSesSender, readSesConfig, type SendNotification } from "@/lib/server/signup/email";
import { handleSignup, MAX_SIGNUP_BODY_BYTES } from "@/lib/server/signup/handler";
import { clientIpFromHeaders, createRateLimiter, SIGNUP_RATE_LIMIT } from "@/lib/server/signup/rateLimit";
import { createFirestoreSignupStore, type SignupStore } from "@/lib/server/signup/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Per-instance (see the serverless caveat in rateLimit.ts).
const rateLimiter = createRateLimiter(SIGNUP_RATE_LIMIT);

let store: SignupStore | null = null;
function getStore(): SignupStore | null {
  if (!hasPapexWebCredentials()) return null;
  store ??= createFirestoreSignupStore(getPapexWebDb(), () => FieldValue.serverTimestamp());
  return store;
}

let sender: SendNotification | null | undefined;
function getSender(): SendNotification | null {
  if (sender === undefined) {
    const config = readSesConfig();
    sender = config ? createSesSender(config) : null;
  }
  return sender;
}

/** Reads at most `max` bytes; null if the body is larger (stops reading early). */
async function readBoundedText(req: NextRequest, max: number): Promise<string | null> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > max) return null;
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function POST(req: NextRequest) {
  const noStore = { "Cache-Control": "no-store" };
  try {
    const contentType = req.headers.get("content-type");
    // Don't read the body of a request we're going to refuse anyway.
    const bodyText = contentType?.toLowerCase().includes("application/json")
      ? await readBoundedText(req, MAX_SIGNUP_BODY_BYTES)
      : "";
    const res = await handleSignup(
      { contentType, bodyText, ip: clientIpFromHeaders((n) => req.headers.get(n)) },
      {
        getStore,
        sendEmail: getSender(),
        rateLimiter,
        schedule: (task) => after(task),
        now: () => new Date(),
        isDev: process.env.NODE_ENV !== "production",
        log: { info: (m) => console.log(m), error: (m) => console.error(m) },
        storeEnvName: PAPEXWEB_CREDENTIALS_ENV,
      }
    );
    return NextResponse.json(res.body, { status: res.status, headers: { ...noStore, ...res.headers } });
  } catch (err) {
    console.error("[signup] unexpected error:", err instanceof Error ? err.message : "unknown error");
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500, headers: noStore });
  }
}
