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

import { useState } from "react";
import { T } from "../ui/tokens";

export interface BarDatum {
  label: string;
  value: number;
  sub?: string; // shown in the tooltip beneath the value, e.g. gross $
}

export function BarChart({
  data,
  formatValue = (v: number) => String(v),
  sparseLabels = false,
}: {
  data: BarDatum[];
  formatValue?: (v: number) => string;
  /** Only show every-other-ish label (for 24-bar hourly charts, to avoid overlap). */
  sparseLabels?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const labelEvery = sparseLabels ? Math.ceil(data.length / 8) : 1;

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
        </div>
      )}
      <div className="flex h-40 items-end gap-[3px]" role="img" aria-label="Bar chart of transaction volume">
        {data.map((d, i) => {
          const pct = max > 0 ? Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0) : 0;
          return (
            <div
              key={i}
              className="group relative flex-1"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            >
              {/* Full-height hit target, taller than the visible bar (dataviz interaction rule). */}
              <div className="absolute inset-x-0 bottom-0 top-0 cursor-default" />
              <div
                className="mx-auto rounded-t-[4px] transition-[height,opacity] duration-150"
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
