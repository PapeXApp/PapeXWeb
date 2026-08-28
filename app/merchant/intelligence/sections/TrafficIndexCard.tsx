// app/merchant/intelligence/sections/TrafficIndexCard.tsx
//
// "Coffee traffic in your metro was down 8% last week. You were down 3% —
// you outperformed by 5 points." (use-cases doc §4, Family D2 — "the number
// that gets a merchant opening the dashboard weekly, and the cleanest
// possible use of other merchants' data: everyone contributes to an index,
// nobody's business is legible in it").
//
// The card leads with the GAP, not with either percentage, because the gap is
// the only part that is about this merchant. Two numbers side by side invite
// the reader to fixate on their own -3% and miss that the category fell twice
// as far, which inverts the conclusion.
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
import { BasisLine, InfoPopover, SuppressedCard, type InfoSection } from "../ui";
import { BarChart, type BarDatum } from "../../insights/BarChart";
import type { OwnBasis, PanelMetric, TrafficIndex } from "@/lib/merchantApi";

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

/** Window length in days, derived from the basis rather than passed in, so it
 *  can never disagree with the window the figures were actually computed over. */
function windowDays(basis: { windowStart: string; windowEnd: string }): number {
  const ms = new Date(basis.windowEnd).getTime() - new Date(basis.windowStart).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

function signed(pct: number): string {
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

// A point either way is inside the noise this panel can resolve, so treat it
// as flat rather than narrating a direction the sample can't actually support.
const FLAT = 1;

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
  const days = windowDays(metric.basis);
  const priorLabel = `vs the previous ${days} days`;

  const gap = Math.round((yourChangePct - categoryChangePct) * 10) / 10;
  const outperforming = gap > 0;
  const tracking = Math.abs(gap) < FLAT;
  const headline = tracking
    ? "You tracked your category closely."
    : `You ${outperforming ? "outperformed" : "underperformed"} your category by ${Math.abs(gap).toFixed(1)} points.`;

  const categoryDown = categoryChangePct < -FLAT;
  const youDown = yourChangePct < -FLAT;

  // Branch on the GAP, not on the two raw directions. Keying off "did both
  // fall?" produced advice that contradicted the headline: a merchant down
  // 4% against a category down 9% has indeed fallen, but telling them the
  // market moved and not to react buries the fact that they gained ~5 points
  // on everyone around them. The card leads with the gap, so the advice has
  // to be about the gap or the two disagree on the same screen.
  //
  // The three are mutually exclusive and cover the line, so exactly one is
  // always emphasised and it always agrees with the headline above.
  const actions: InfoSection[] = [
    {
      heading: "When you and the category move together",
      body:
        "The market moved, not your business — whichever way it went. This is the week to resist cutting staff or discounting to chase it: you would be paying to fix something that isn't yours and that tends to recover on its own.",
      emphasis: tracking,
    },
    {
      heading: "When you fall behind the category",
      body:
        "The businesses around you did better than you did, and that difference is yours to explain. Start with Needs your attention above for a till or device problem, then compare your opening hours and staffing against the by-hour chart on Insights — a gap concentrated in a few hours is usually operational, one spread evenly is usually demand.",
      emphasis: !tracking && !outperforming,
    },
    {
      heading: "When you hold up better than the category",
      body:
        "You are taking share. Worth working out what is doing it — a new item, a change in hours, a promotion, a staffing change — while you can still see it, because this is the hardest thing to reconstruct months later once it stops.",
      emphasis: !tracking && outperforming,
    },
  ];

  const info: InfoSection[] = [
    {
      heading: "How this is calculated",
      body: `Your figure compares your own receipts over the last ${days} days against the ${days} days immediately before, computed live from your transactions. The category figure is that same comparison pooled across other businesses in your category and converted to an index — it carries the direction and size of the movement, never any individual business's sales, revenue or customer count. The lines underneath say how many businesses and shoppers it draws on.`,
    },
    {
      heading: "What it means",
      body:
        "The gap between the two is the signal; neither percentage means much alone. When both move together the market moved, and that is not about you. When they diverge, the difference is yours. The category side comes from a sample of shoppers, so the direction is reliable while the exact percentage is an estimate — read it as \"roughly this much, this way\".",
    },
    ...actions,
  ];

  const chartData: BarDatum[] = series.map((p) => ({ label: shortDate(p.date), value: p.index }));

  return (
    <Card className="flex flex-col gap-3">
      <InfoPopover title="Traffic index" label="How the traffic index works" sections={info} />

      {/* The gap leads. The two inputs sit underneath it, smaller. */}
      <div className="flex flex-col gap-1">
        <span
          className="font-barlow text-2xl font-medium leading-tight"
          style={{ color: tracking ? T.text : outperforming ? T.success : T.error }}
        >
          {headline}
        </span>
        <span className="text-xs" style={{ color: T.textMuted }}>
          Your customer visits {youDown ? "fell" : yourChangePct > FLAT ? "rose" : "held steady"} {priorLabel}, against
          a category that {categoryDown ? "fell" : categoryChangePct > FLAT ? "rose" : "held steady"}.
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: T.divider }}>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
            Your change
          </span>
          <span className="font-barlow text-xl font-medium" style={{ color: T.text }}>
            {signed(yourChangePct)}
          </span>
          <span className="text-[10px]" style={{ color: T.textMuted }}>
            {priorLabel}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
            Your category
          </span>
          <span className="font-barlow text-xl font-medium" style={{ color: T.text }}>
            {signed(categoryChangePct)}
          </span>
          <span className="text-[10px]" style={{ color: T.textMuted }}>
            pooled, {priorLabel}
          </span>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
            Category traffic, day by day
          </span>
          <BarChart
            data={chartData}
            sparseLabels={chartData.length > 10}
            formatValue={(v) => `${v.toFixed(0)} vs 100 at the start of the window`}
          />
          <span className="text-[10px] leading-snug" style={{ color: T.textMuted }}>
            An index, not a count: the first day is set to 100 and each bar shows the category
            against that starting point. It says how the category moved — never how much any
            business sold.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1 border-t pt-2.5" style={{ borderColor: T.divider }}>
        <BasisLine basis={metric.basis} />
        {yourBasis && <BasisLine basis={yourBasis} />}
      </div>
    </Card>
  );
}
