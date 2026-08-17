// Shown automatically by Next.js while app/r/page.tsx's server-side fetch
// to api.papex.app is in flight (Suspense boundary implied by this file's
// presence in the route segment). Covers the "slow fetch" requirement
// without any client-side polling/spinner logic.
//
// Mirrors <Shell>'s chrome (app/r/ui.tsx) - same `.papex-receipt` theme
// scope, same logo header - so the loading state doesn't flash a
// differently-themed/branded frame before the real page swaps in. Kept as
// a separate file (Next.js requires loading.tsx to be its own module) with
// skeleton placeholders shaped like the cards about to render.

import "./theme.css";

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[24px] border p-6 ${className}`}
      style={{ background: "var(--r-badge-bg)", borderColor: "var(--r-badge-border)" }}
    >
      <div className="h-4 w-2/3 rounded-full bg-white/10" />
      <div className="mt-3 h-3 w-1/2 rounded-full bg-white/5" />
    </div>
  );
}

export default function ReceiptLoading() {
  return (
    <main
      className="papex-receipt min-h-screen w-full"
      style={{
        color: "var(--r-text)",
        backgroundColor: "var(--r-bg-solid)",
        backgroundImage: [
          "radial-gradient(ellipse 120% 60% at 50% -10%, var(--r-bg-glow) 0%, rgba(235,113,0,0) 60%)",
          "linear-gradient(180deg, var(--r-bg-tint-top) 0%, var(--r-bg-tint-bottom) 100%)",
          "url('/rdh-background.jpg')",
        ].join(", "),
        backgroundSize: "cover, cover, cover",
        backgroundPosition: "center, center, center",
        backgroundAttachment: "fixed, fixed, fixed",
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pb-10 pt-6">
        <header className="mb-5 flex items-center gap-3 px-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/main_logo.png" alt="PapeX" className="r-logo-dark h-7 w-auto" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/Main_blue_transparent_outline.png"
            alt="PapeX"
            className="r-logo-light h-7 w-auto"
          />
          <span
            className="ml-auto text-[11px] font-medium uppercase"
            style={{ color: "var(--r-text-muted)", fontFamily: "var(--font-ibm-plex-mono)", letterSpacing: "0.08em" }}
          >
            Receipt
          </span>
        </header>
        <div className="flex flex-1 flex-col gap-4">
          <SkeletonCard />
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-40" />
        </div>
      </div>
    </main>
  );
}
