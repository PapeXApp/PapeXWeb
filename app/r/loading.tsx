// Shown automatically by Next.js while app/r/page.tsx's server-side fetch
// to api.papex.app is in flight (Suspense boundary implied by this file's
// presence in the route segment). Covers the "slow fetch" requirement
// without any client-side polling/spinner logic.
//
// Restyled to match the shipping glass look — see app/r/ui.tsx and
// glass.module.css for the full token/recipe source (this file mirrors
// Shell's markup rather than importing it, to keep the Suspense fallback
// self-contained and free of any dependency on ReceiptView's data-shaped
// props). Skeleton placeholders are the plain frost card (emphasis="none"
// equivalent) — no ring/tier on a loading placeholder, since nothing is
// known yet about the receipt's content.

import styles from "./glass.module.css";

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={styles.card} style={{ padding: "24px" }}>
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 w-2/3 rounded-full bg-white/10" />
        <div className="mt-3 h-3 w-1/2 rounded-full bg-white/5" />
      </div>
    </div>
  );
}

export default function ReceiptLoading() {
  return (
    <main className={`min-h-screen w-full ${styles.shell} ${styles.shellBg}`} style={{ color: "rgba(255,255,255,0.90)" }}>
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pb-10 pt-6">
        <header className="mb-5 flex items-center gap-3 px-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/main_logo.png" alt="PapeX" className="h-6 w-auto shrink-0" style={{ objectFit: "contain" }} />
          <span className="ml-auto text-xs font-medium uppercase tracking-wide" style={{ color: "var(--page-text-muted)" }}>
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
