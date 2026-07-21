// Shown automatically by Next.js while app/r/page.tsx's server-side fetch
// to api.papex.app is in flight (Suspense boundary implied by this file's
// presence in the route segment). Covers the "slow fetch" requirement
// without any client-side polling/spinner logic.

export default function ReceiptLoading() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center gap-2 px-5 pb-2 pt-6">
        <span className="font-barlow text-lg font-medium tracking-tight text-slate-900">
          papex
        </span>
        <span className="h-[7px] w-[7px] rounded-sm bg-orange" aria-hidden />
        <span className="ml-auto text-xs font-medium uppercase tracking-wide text-slate-400">
          Receipt
        </span>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 pb-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-orange" />
        <p className="text-sm text-slate-500">Loading your receipt…</p>
      </div>
    </main>
  );
}
