"use client";

// Small client island for the one interactive bit on an otherwise fully
// server-rendered page: re-running the server fetch on demand. A plain
// full reload is simplest and correct here — the sid lives in the URL, so
// reloading re-triggers app/r/page.tsx's server-side fetch against the
// backend with a fresh 8s timeout.

export default function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="mt-5 inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(235,113,0,0.45)] transition active:scale-[0.98]"
      style={{ background: "#EB7100" }}
    >
      Try again
    </button>
  );
}
