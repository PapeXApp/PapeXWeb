"use client";

// Small client island for the one interactive bit on an otherwise fully
// server-rendered page: re-running the server fetch on demand. A plain
// full reload is simplest and correct here — the sid lives in the URL, so
// reloading re-triggers app/r/page.tsx's server-side fetch against the
// backend with a fresh 8s timeout.
//
// Styled as PapeXV2's Button.tsx "ghost" variant (transparent bg, orange
// text, Barlow-SemiBold) rather than "primary" — this is a secondary nudge
// next to a state message, not the page's main CTA (that's "Save to
// PapeX" in SaveToPapex.tsx, which uses "primary"). The doc's Button.tsx
// spec is silent on ghost's exact border, so the 1px orange-tinted outline
// here is this file's own affordance choice for a page with no native
// press feedback, not a ported value.

export default function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="font-barlow mt-5 inline-flex items-center justify-center rounded-full px-6 py-2.5 text-[15px] font-semibold tracking-[-0.02em] transition active:opacity-85"
      style={{ background: "transparent", color: "#EB7100", border: "1px solid rgba(235,113,0,0.4)" }}
    >
      Try again
    </button>
  );
}
