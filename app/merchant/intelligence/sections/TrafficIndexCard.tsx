// app/merchant/intelligence/sections/TrafficIndexCard.tsx
//
// "Coffee traffic in your metro was down 8% last week. You were down 3% —
// you outperformed by 5 points." (use-cases doc §4, Family D2 — "the number
// that gets a merchant opening the dashboard weekly, and the cleanest
// possible use of other merchants' data: everyone contributes to an index,
// nobody's business is legible in it").
//
// `yourBasis` is a deliberately different type from `PanelBasis`
// (transactions, not merchants/shoppers — lib/merchantApi.ts's OwnBasis) so
// the merchant's own live-computed side can never be confused with the
// panel side. It's `null` whenever `metric` is suppressed for ANY reason,
// including the traffic index's own 4th, own-side-only suppression
// condition (< 30 of the merchant's own transactions in the current or
// prior period) — plan.md §4.

import { Card } from "../../ui/primitives";
import { T } from "../../ui/tokens";
import { BasisLine, SuppressedCard } from "../ui";
import { BarChart, type BarDatum } from "../../insights/BarChart";
import type { OwnBasis, PanelMetric, TrafficIndex } from "@/lib/merchantApi";

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

export function TrafficIndexCard({
  metric,
  yourBasis,
}: {
  metric: PanelMetric<TrafficIndex>;
  yourBasis: OwnBasis | null;
}) {
  if (metric.status === "suppressed") {
    return <SuppressedCard title="Traffic index" message={metric.message} reason={metric.reason} />;
  }

  const { categoryChangePct, yourChangePct, series } = metric.value;
  const diff = Math.round((yourChangePct - categoryChangePct) * 10) / 10;
  const comparison =
    diff > 0
      ? `You outperformed the category by ${diff.toFixed(0)} points.`
      : diff < 0
        ? `You underperformed the category by ${Math.abs(diff).toFixed(0)} points.`
        : "You tracked the category exactly.";

  const chartData: BarDatum[] = series.map((p) => ({ label: shortDate(p.date), value: p.index }));

  return (
    <Card className="flex flex-col gap-3">
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
        Traffic index
      </span>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
            Category
          </span>
          <span className="font-barlow text-xl font-medium" style={{ color: categoryChangePct < 0 ? T.error : T.success }}>
            {categoryChangePct > 0 ? "+" : ""}
            {categoryChangePct.toFixed(0)}%
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
            You
          </span>
          <span className="font-barlow text-xl font-medium" style={{ color: yourChangePct < 0 ? T.error : T.success }}>
            {yourChangePct > 0 ? "+" : ""}
            {yourChangePct.toFixed(0)}%
          </span>
        </div>
      </div>

      <p className="text-sm" style={{ color: T.textSecondary }}>
        {comparison}
      </p>

      {chartData.length > 0 && (
        <BarChart data={chartData} sparseLabels={chartData.length > 10} formatValue={(v) => `index ${v.toFixed(0)}`} />
      )}

      <div className="flex flex-col gap-1 border-t pt-2.5" style={{ borderColor: T.divider }}>
        <BasisLine basis={metric.basis} />
        {yourBasis && <BasisLine basis={yourBasis} />}
      </div>
    </Card>
  );
}
