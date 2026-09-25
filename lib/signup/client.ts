// lib/signup/client.ts
//
// Browser helper for POST /api/signup. Safe to import from "use client"
// components (no server imports). Never throws: network failures and
// unexpected responses come back as { ok: false, error }.
//
//   const res = await subscribeToBlog({ email, source: "footer", path: location.pathname })
//   if (res.ok) showThanks() else if (res.fields?.email) showFieldError(res.fields.email)
//
// Pass the form's honeypot input value as `hp` (see HONEYPOT_FIELD in
// ./schema): leave it undefined when the form has no honeypot input.

import type {
  BlogSignupPayload,
  DemoRequestPayload,
  SignupErrorCode,
  SignupFieldErrors,
  SignupPayload,
} from "./schema";

export const SIGNUP_ENDPOINT = "/api/signup";

export type SignupResult =
  | { ok: true }
  | {
      ok: false;
      /** Server error code, or "network" when the request never completed. */
      error: SignupErrorCode | "network";
      /** Per-field messages, present when error === "invalid_fields". */
      fields?: SignupFieldErrors;
      /** Seconds to wait, present when error === "rate_limited". */
      retryAfterSeconds?: number;
    };

export interface SignupRequestOptions {
  signal?: AbortSignal;
  /** Injected in tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

export async function submitSignup(payload: SignupPayload, opts: SignupRequestOptions = {}): Promise<SignupResult> {
  const doFetch = opts.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await doFetch(SIGNUP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: opts.signal,
      credentials: "same-origin",
    });
  } catch {
    return { ok: false, error: "network" };
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON (e.g. a platform error page): handled below.
  }
  const data = (body ?? {}) as { ok?: unknown; error?: unknown; fields?: unknown };
  if (res.ok && data.ok === true) return { ok: true };

  const error = typeof data.error === "string" ? (data.error as SignupErrorCode) : "server_error";
  const result: SignupResult = { ok: false, error };
  if (data.fields && typeof data.fields === "object") result.fields = data.fields as SignupFieldErrors;
  if (res.status === 429) {
    const retry = Number(res.headers.get("Retry-After"));
    if (Number.isFinite(retry) && retry > 0) result.retryAfterSeconds = retry;
  }
  return result;
}

export function requestDemo(fields: Omit<DemoRequestPayload, "kind">, opts?: SignupRequestOptions): Promise<SignupResult> {
  return submitSignup({ kind: "demo", ...fields }, opts);
}

export function subscribeToBlog(fields: Omit<BlogSignupPayload, "kind">, opts?: SignupRequestOptions): Promise<SignupResult> {
  return submitSignup({ kind: "blog", ...fields }, opts);
}
