// lib/rdh.ts
//
// Server-side fetch helper for the RDH receipt web fallback (`/r` page).
//
// The backend (Papex_RDH/lambdas/fetch/handler.js) has no CORS configured —
// it's meant to be called from the App Clip (native URLSession, no CORS
// enforcement) not a browser `fetch()`. So this call happens in a Next.js
// Server Component, not client-side JS, per
// docs/RDH_WEB_FALLBACK_PLAN.md Phase 1/3 and the task brief. `cache:
// 'no-store'` because every sid is single-use-ish and privacy-sensitive
// (no auth beyond the sid itself — see handler.js's threat-model comment).

const RDH_API_HOST = "https://api.papex.app";

/** 16 lowercase hex chars — matches the Lambda's SID_RE exactly. */
const SID_RE = /^[a-f0-9]{16}$/;

export function isValidSid(sid: string | undefined | null): sid is string {
  return typeof sid === "string" && SID_RE.test(sid);
}

export type ReceiptFetchResult =
  | { status: "ok"; bytes: Uint8Array }
  | { status: "not_found" }
  | { status: "error" };

/**
 * Fetch raw ESC/POS bytes for a session id. Never throws — network errors,
 * timeouts, and non-200/404 responses all collapse to `{status: "error"}`
 * so the page can render a friendly retry state instead of a Next.js error
 * boundary.
 */
export async function fetchReceiptBytes(sid: string): Promise<ReceiptFetchResult> {
  const controller = new AbortController();
  // Keep this well under Vercel's function timeout so a hung backend still
  // renders our own "having trouble" state rather than a platform 504.
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${RDH_API_HOST}/receipt/${sid}`, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/octet-stream" },
    });

    if (res.status === 404) {
      return { status: "not_found" };
    }
    if (!res.ok) {
      return { status: "error" };
    }

    const buf = await res.arrayBuffer();
    return { status: "ok", bytes: new Uint8Array(buf) };
  } catch {
    // Covers abort-on-timeout, DNS failure, TLS failure, connection reset.
    return { status: "error" };
  } finally {
    clearTimeout(timeout);
  }
}
