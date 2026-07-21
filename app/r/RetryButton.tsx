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
      className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 active:scale-[0.98]"
    >
      Try again
    </button>
  );
}
