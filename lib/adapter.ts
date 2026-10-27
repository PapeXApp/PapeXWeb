// lib/adapter.ts
//
// Base URL of the adapter backend (papex-adapter-backend), shared by every
// server-side caller: the "Save to PapeX" claim proxy
// (app/api/rdh/claim/route.ts), the POS receipt fallback in lib/rdhParsed.ts
// and the RDS sticker route (app/r/[merchant]/[register]). Lives here because
// a route file may only export Next's own handlers.
//
// `ADAPTER_API_BASE` is the adapter's *host* base (no `/api/v1` suffix) —
// e.g. `https://adapter.api.papex.app`. See app/api/rdh/claim/route.ts for why
// it must stay HTTPS. SERVER-SIDE ONLY (no NEXT_PUBLIC_ prefix).

const DEFAULT_ADAPTER_HOST = "https://adapter.api.papex.app";

export function adapterBase(): string {
  const fromEnv = process.env.ADAPTER_API_BASE?.trim();
  const base = fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_ADAPTER_HOST;
  return base.replace(/\/+$/, "");
}
