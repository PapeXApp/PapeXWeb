"use client";

// app/merchant/insights/page.tsx
//
// Insights (PRD §5.4): window toggle, stat tiles, by-hour / by-day-of-week
// volume charts, top items, and the tap-rate tile — PapeX's own pilot
// success metric surfaced back to the merchant. Tap rate depends on joining
// consumer-claim data from the adapter's Firestore (plan.md's "Tap-rate"
// section) through a backend that's a documented SPOF; both the real
// endpoint and this mock treat `rate: null` as first-class, not an error —
// the tile below renders an explicit "unavailable" state rather than
// swallowing it into a 0%.

import { useEffect, useState } from "react";
import { useMerchantAuth } from "../AuthContext";
import { getInsights, getTapRate, type InsightsWindow, type MerchantInsights, type TapRate } from "@/lib/merchantApi";
import { Card, StatTile, LoadingBlock, ErrorBanner } from "../ui/primitives";
import { T } from "../ui/tokens";
import { BarChart, type BarDatum } from "./BarChart";

const WINDOWS: { value: InsightsWindow; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

function hourLabel(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${hour < 12 ? "a" : "p"}`;
}

function TapRateTile({ tapRate, loading }: { tapRate: TapRate | null; loading: boolean }) {
  return (
    <Card className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
        Tap rate
      </span>
      {loading ? (
        <span className="font-barlow text-[28px] font-medium leading-none" style={{ color: T.textMuted }}>
          …
        </span>
      ) : tapRate == null || tapRate.rate == null ? (
        <>
          <span className="font-barlow text-[28px] font-medium leading-none" style={{ color: T.textMuted }}>
            Unavailable
          </span>
          <span className="text-xs" style={{ color: T.textSecondary }}>
            We couldn&apos;t reach the claim service — try again shortly.
          </span>
        </>
      ) : (
        <>
          <span className="font-barlow text-[28px] font-medium leading-none" style={{ color: T.text }}>
            {tapRate.rate.toFixed(1)}%
          </span>
          <span className="text-xs" style={{ color: T.textSecondary }}>
            {tapRate.claimed} of {tapRate.total} receipts viewed on PapeX
          </span>
        </>
      )}
    </Card>
  );
}

export default function InsightsPage() {
  const { getIdToken } = useMerchantAuth();
  const [window_, setWindow] = useState<InsightsWindow>("7d");
  const [insights, setInsights] = useState<MerchantInsights | null>(null);
  const [tapRate, setTapRate] = useState<TapRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [tapLoading, setTapLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError(null);
      setLoading(true);
      setTapLoading(true);
      const token = await getIdToken();
      if (!token) return;
      try {
        const data = await getInsights(token, window_);
        if (!cancelled) setInsights(data);
      } catch {
        if (!cancelled) setError("Couldn't load insights. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
      // Tap rate is allowed to lag/fail independently — never blocks the rest of the page.
      getTapRate(token, window_)
        .then((r) => {
          if (!cancelled) setTapRate(r);
        })
        .finally(() => {
          if (!cancelled) setTapLoading(false);
        });
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [window_, getIdToken]);

  const hourData: BarDatum[] =
    insights?.byHour.map((b) => ({ label: hourLabel(b.hour), value: b.count, sub: `$${b.gross.toFixed(2)}` })) ?? [];
  const dowData: BarDatum[] =
    insights?.byDayOfWeek.map((b) => ({ label: b.label, value: b.count, sub: `$${b.gross.toFixed(2)}` })) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-barlow text-2xl font-medium" style={{ color: T.text }}>
            Insights
          </h1>
          <p className="mt-1 text-sm" style={{ color: T.textSecondary }}>
            How business is trending, at a glance.
          </p>
        </div>
        <div className="flex rounded-full border p-1" style={{ borderColor: T.glassBorder }}>
          {WINDOWS.map((w) => (
            <button
              key={w.value}
              onClick={() => setWindow(w.value)}
              className="rounded-full px-4 py-1.5 text-sm font-medium transition"
              style={{
                background: window_ === w.value ? T.orange : "transparent",
                color: window_ === w.value ? "#181A20" : T.textSecondary,
              }}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading || !insights ? (
        <LoadingBlock label="Crunching the numbers…" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Transactions" value={insights.count} />
            <StatTile label="Gross" value={`$${insights.gross.toFixed(2)}`} />
            <StatTile label="Avg ticket" value={`$${insights.avgTicket.toFixed(2)}`} />
            <TapRateTile tapRate={tapRate} loading={tapLoading} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
                By hour of day
              </h2>
              {insights.count === 0 ? (
                <p className="py-10 text-center text-sm" style={{ color: T.textMuted }}>
                  No transactions in this window yet.
                </p>
              ) : (
                <BarChart data={hourData} sparseLabels formatValue={(v) => `${v} txn${v === 1 ? "" : "s"}`} />
              )}
            </Card>
            <Card>
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
                By day of week
              </h2>
              {insights.count === 0 ? (
                <p className="py-10 text-center text-sm" style={{ color: T.textMuted }}>
                  No transactions in this window yet.
                </p>
              ) : (
                <BarChart data={dowData} formatValue={(v) => `${v} txn${v === 1 ? "" : "s"}`} />
              )}
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
              Top items <span style={{ color: T.textMuted, fontWeight: 400, textTransform: "none" }}>(approximate)</span>
            </h2>
            {insights.topItems.length === 0 ? (
              <p className="py-6 text-center text-sm" style={{ color: T.textMuted }}>
                Not enough parsed items yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {insights.topItems.map((item, i) => {
                  const max = insights.topItems[0].count;
                  const pct = Math.max((item.count / max) * 100, 6);
                  return (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="w-5 shrink-0 text-xs" style={{ color: T.textMuted }}>
                        {i + 1}
                      </span>
                      <span className="w-32 shrink-0 truncate text-sm" style={{ color: T.text }}>
                        {item.name}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: T.orange }} />
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs" style={{ color: T.textSecondary }}>
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
