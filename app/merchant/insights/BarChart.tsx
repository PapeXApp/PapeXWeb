"use client";

// app/merchant/insights/BarChart.tsx
//
// Minimal single-series bar chart for "busiest periods" (PRD §5.4:
// transactions-by-hour, transactions-by-day-of-week). Built to the dataviz
// skill's mark spec: one axis (count), thin bars with rounded data-ends
// anchored to the baseline, a 2px gap between bars, a single accent hue
// (never a rainbow for one series), recessive gridlines/axis labels, and a
// per-bar hover tooltip. Plain flex/div markup — no chart library needed for
// two small single-series bars, and it keeps this in the same "raw
// primitives styled with tokens" idiom as the rest of app/merchant.
//
// Bars are drill-through targets (onBarClick) into the filtered transactions
// list — see app/merchant/insights/page.tsx. The hit target is a real
// <button>, not a click handler on a div: every bar is Tab-reachable, gets a
// visible focus ring, and Enter/Space activates it, same as clicking.

import { useState } from "react";
import { T } from "../ui/tokens";
import { formatCount } from "../ui/format";

export interface BarDatum {
  label: string;
  value: number;
  sub?: string; // shown in the tooltip beneath the value, e.g. gross $
}

export function BarChart({
  data,
  // Every current caller passes its own formatValue (a bare count still
  // needs the thousands-separator treatment); this default only covers a
  // future caller that doesn't bother, so it shouldn't regress to a raw,
  // un-comma'd `String(v)`.
  formatValue = (v: number) => formatCount(v),
  sparseLabels = false,
  onBarClick,
  chartLabel = "Bar chart of transaction volume",
}: {
  data: BarDatum[];
  formatValue?: (v: number) => string;
  /** Only show every-other-ish label (for 24-bar hourly charts, to avoid overlap). */
  sparseLabels?: boolean;
  /** Called with the clicked/activated bar's index. Omit to render a non-interactive chart (no button semantics, no hover/focus affordance). */
  onBarClick?: (index: number) => void;
  /** Accessible name for the chart as a whole (each bar also gets its own aria-label). */
  chartLabel?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const labelEvery = sparseLabels ? Math.ceil(data.length / 8) : 1;
  const interactive = onBarClick != null;

  return (
    <div className="relative">
      {hovered !== null && (
        <div
          className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border px-2.5 py-1.5 text-xs shadow-lg"
          style={{ background: T.glassBgSolid, borderColor: T.glassBorder, color: T.text, whiteSpace: "nowrap" }}
        >
          <div className="font-medium">{data[hovered].label}</div>
          <div style={{ color: T.textSecondary }}>
            {formatValue(data[hovered].value)}
            {data[hovered].sub ? ` · ${data[hovered].sub}` : ""}
          </div>
          {interactive && (
            <div className="mt-0.5" style={{ color: T.orange }}>
              View transactions →
            </div>
          )}
        </div>
      )}
      {/* role="group" (not role="img") -- the bars below are real focusable
          buttons now, and role="img" is only valid on elements with no
          interactive descendants. */}
      <div className="flex h-40 items-end gap-[3px]" role="group" aria-label={chartLabel}>
        {data.map((d, i) => {
          const pct = max > 0 ? Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0) : 0;
          return (
            // h-full + flex-col/justify-end is load-bearing, not cosmetic: the
            // bar's height is a PERCENTAGE, so it needs an ancestor with a
            // resolved height. The h-40 row uses items-end, which sizes flex
            // items to their content rather than stretching them — leaving this
            // wrapper auto-height, making the child's % circular, and collapsing
            // every bar to its 3px minHeight regardless of value.
            <div key={i} className="group relative flex h-full flex-1 flex-col justify-end">
              {/* Full-height hit target, taller than the visible bar (dataviz
                  interaction rule) -- a real <button>, not a click handler on
                  the wrapping div, so it's keyboard-reachable and gets a
                  native/visible focus outline. Non-interactive (no
                  onBarClick) renders inert: not a tab stop, no pointer
                  cursor, but still drives the hover tooltip above. */}
              <button
                type="button"
                tabIndex={interactive ? 0 : -1}
                onClick={interactive ? () => onBarClick(i) : undefined}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered((h) => (h === i ? null : h))}
                aria-label={`${d.label}: ${formatValue(d.value)}${d.sub ? `, ${d.sub}` : ""}${interactive ? " — view these transactions" : ""}`}
                className={`absolute inset-x-0 bottom-0 top-0 rounded-t-[4px] outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  interactive ? "cursor-pointer hover:bg-white/[0.04]" : "cursor-default"
                }`}
                style={{ outlineColor: T.orange }}
              />
              <div
                className="pointer-events-none mx-auto rounded-t-[4px] transition-[height,opacity] duration-150"
                style={{
                  height: `${pct}%`,
                  minHeight: d.value > 0 ? 3 : 0,
                  background: hovered === i ? T.orange : "rgba(251, 133, 0, 0.55)",
                  width: "100%",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[3px] border-t pt-1.5" style={{ borderColor: T.divider }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px]" style={{ color: T.textMuted }}>
            {i % labelEvery === 0 ? d.label : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
