// Shown automatically by Next.js while app/r/page.tsx's server-side fetch
// to api.papex.app is in flight (Suspense boundary implied by this file's
// presence in the route segment). Covers the "slow fetch" requirement
// without any client-side polling/spinner logic.
//
// Restyled to the dark liquid-glass look (see app/r/ui.tsx's header
// comment for why tokens are inlined rather than added to
// tailwind.config.ts) with skeleton placeholders shaped like the cards
// that are about to render, so the loading state doesn't jump/flash white.

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[24px] border p-6 ${className}`}
      style={{ background: "rgba(20, 26, 36, 0.6)", borderColor: "rgba(255, 255, 255, 0.12)" }}
    >
      <div className="h-4 w-2/3 rounded-full bg-white/10" />
      <div className="mt-3 h-3 w-1/2 rounded-full bg-white/5" />
    </div>
  );
}

export default function ReceiptLoading() {
  return (
    <main
      className="min-h-screen w-full text-[#F4F4F4]"
      style={{
        backgroundColor: "#181A20",
        backgroundImage: [
          "radial-gradient(ellipse 120% 60% at 50% -10%, rgba(251,133,0,0.16) 0%, rgba(251,133,0,0) 60%)",
          "linear-gradient(180deg, rgba(24,26,32,0.55) 0%, rgba(11,43,59,0.75) 100%)",
          "url('/rdh-background.jpg')",
        ].join(", "),
        backgroundSize: "cover, cover, cover",
        backgroundPosition: "center, center, center",
        backgroundAttachment: "fixed, fixed, fixed",
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pb-10 pt-6">
        <header className="mb-5 flex items-center gap-2 px-1">
          <span className="font-barlow text-lg font-medium tracking-tight text-[#F4F4F4]">
            papex
          </span>
          <span className="h-[7px] w-[7px] rounded-sm bg-[#FB8500]" aria-hidden />
          <span className="ml-auto text-xs font-medium uppercase tracking-wide text-[#9AA1A8]">
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
