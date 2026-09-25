// lib/server/signup/handler.ts
//
// SERVER ONLY. The whole POST /api/signup pipeline as a plain function, with
// every side effect injected (store, email sender, rate limiter, scheduler,
// clock, logger), so lib/server/signup/signup.test.ts can drive it without
// Next, Firestore or SES. app/api/signup/route.ts is only the adapter.
//
// Order of checks (cheapest first, and nothing is written before all pass):
//   415 not JSON -> 413 too big -> 429 rate limited -> 400 bad JSON ->
//   honeypot (fake 200, nothing saved/sent) -> 400 invalid ->
//   503 storage not configured -> save (500 on failure) -> 200.
// The notification email is scheduled AFTER the save and can never change
// the response: a failed or skipped email is logged, not surfaced.

import { isHoneypotTripped, validateSignupInput, type SignupInput, type SignupResponse } from "../../signup/schema";
import { buildNotificationEmail, type SendNotification } from "./email";
import type { RateLimiter } from "./rateLimit";
import type { SignupStore } from "./store";

/** Generous for a form (a real submission is well under 1 KB). */
export const MAX_SIGNUP_BODY_BYTES = 4 * 1024;

export interface SignupLogger {
  info(msg: string): void;
  error(msg: string): void;
}

export interface SignupDeps {
  /** null = storage credentials missing (503). A thrown error = broken config (503, logged). */
  getStore: () => SignupStore | null;
  /** null = SES not configured: save anyway, log "email skipped (no SES config)". */
  sendEmail: SendNotification | null;
  rateLimiter: RateLimiter;
  /** Runs work after the response (next/server `after` in the route). */
  schedule: (task: () => Promise<void>) => void;
  now: () => Date;
  /** Development: 503 explains which env var is missing. Production: generic. */
  isDev: boolean;
  log: SignupLogger;
  /** Named in the dev-only 503 message. */
  storeEnvName: string;
}

export interface SignupHttpRequest {
  contentType: string | null;
  /** The raw body, or null when it exceeded MAX_SIGNUP_BODY_BYTES while reading. */
  bodyText: string | null;
  ip: string;
}

export interface SignupHttpResponse {
  status: number;
  body: SignupResponse;
  headers?: Record<string, string>;
}

const ok = (): SignupHttpResponse => ({ status: 200, body: { ok: true } });

function fail(status: number, body: Exclude<SignupResponse, { ok: true }>, headers?: Record<string, string>): SignupHttpResponse {
  return { status, body, headers };
}

function isJsonContentType(ct: string | null): boolean {
  if (!ct) return false;
  return ct.split(";")[0].trim().toLowerCase() === "application/json";
}

function describe(input: SignupInput): string {
  return input.kind === "demo" ? "demo request" : `blog sign-up (${input.source})`;
}

export async function handleSignup(req: SignupHttpRequest, deps: SignupDeps): Promise<SignupHttpResponse> {
  if (!isJsonContentType(req.contentType)) return fail(415, { ok: false, error: "unsupported_media_type" });
  if (req.bodyText === null || Buffer.byteLength(req.bodyText, "utf8") > MAX_SIGNUP_BODY_BYTES) {
    return fail(413, { ok: false, error: "too_large" });
  }

  const limit = deps.rateLimiter.check(req.ip);
  if (!limit.allowed) {
    return fail(429, { ok: false, error: "rate_limited" }, { "Retry-After": String(limit.retryAfterSeconds) });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(req.bodyText);
  } catch {
    return fail(400, { ok: false, error: "invalid_json" });
  }

  // A bot filled the invisible field: look successful, keep nothing.
  if (isHoneypotTripped(raw)) {
    deps.log.info("[signup] honeypot tripped; dropped");
    return ok();
  }

  const parsed = validateSignupInput(raw);
  if (!parsed.ok) {
    return fail(400, parsed.fields ? { ok: false, error: parsed.error, fields: parsed.fields } : { ok: false, error: parsed.error });
  }
  const input = parsed.value;

  let store: SignupStore | null;
  try {
    store = deps.getStore();
  } catch (err) {
    // e.g. malformed service-account JSON. The message never contains the key.
    deps.log.error(`[signup] storage init failed: ${err instanceof Error ? err.message : "unknown error"}`);
    store = null;
  }
  if (!store) {
    deps.log.error(`[signup] ${describe(input)} NOT saved: storage not configured (${deps.storeEnvName})`);
    return deps.isDev
      ? fail(503, {
          ok: false,
          error: "not_configured",
          message: `Sign-ups are not configured: set ${deps.storeEnvName} (see docs/SIGNUP_ROUTE.md).`,
        })
      : fail(503, { ok: false, error: "unavailable" });
  }

  let notify = true;
  try {
    if (input.kind === "demo") {
      await store.saveDemoRequest(input);
    } else {
      // Already subscribed: same answer as a new sign-up (no address
      // enumeration), and no second email to the team.
      notify = (await store.saveBlogSubscriber(input)).created;
    }
  } catch (err) {
    deps.log.error(`[signup] saving ${describe(input)} failed: ${err instanceof Error ? err.message : "unknown error"}`);
    return fail(500, { ok: false, error: "server_error" });
  }

  if (notify) {
    const sendEmail = deps.sendEmail;
    if (!sendEmail) {
      deps.log.info(`[signup] ${describe(input)} saved; email skipped (no SES config)`);
    } else {
      const email = buildNotificationEmail(input, deps.now());
      deps.schedule(async () => {
        try {
          await sendEmail(email);
        } catch (err) {
          deps.log.error(`[signup] notification email failed: ${err instanceof Error ? err.name : "unknown error"}`);
        }
      });
    }
  }
  return ok();
}
