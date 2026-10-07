"use client";

// app/r/ItemName.tsx
//
// An item name on the receipt cards, one line with an ellipsis, that a tap
// (or Enter/Space) expands to the full name when, and only when, it was cut.
//
// The names are already whole in the data (the Dutchie extractor joins the
// printer's hard-split continuation line, e.g. "SUNSET CONNECT - 1G - SATIVA -
// FULTON 5ER"); only the card's `truncate` was hiding the end on a phone.
//
// Server render is byte-for-byte the plain span it replaced, so /r's parity
// goldens are untouched and nothing moves before hydration. After hydration
// the span measures itself: if the text does not fit it becomes a toggle
// (role="button", aria-expanded, focusable). A name that fits, as most do on
// desktop, never becomes interactive, so tapping it does nothing and nothing
// shifts.

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { DecodedText } from "@/components/DecodedText";

// COLLAPSED is the exact class string ItemsCard used before this existed (the
// parity goldens compare HTML byte for byte).
const COLLAPSED = "font-barlow min-w-0 flex-1 truncate text-base font-medium";
const EXPANDED = "font-barlow min-w-0 flex-1 whitespace-normal break-words text-base font-medium";

/** True when the rendered text is wider than its box, i.e. the ellipsis shows. */
export function isCut(el: { scrollWidth: number; clientWidth: number }): boolean {
  return el.scrollWidth > el.clientWidth + 1;
}

/** The keys that toggle a role="button" element, as a native button would. */
export function isToggleKey(key: string): boolean {
  return key === "Enter" || key === " ";
}

/** Presentational half, exported for tests (no DOM in this repo's test runner). */
export function ItemNameView({
  name,
  style,
  cut,
  expanded,
  onToggle,
  spanRef,
}: {
  name: string;
  style?: CSSProperties;
  cut: boolean;
  expanded: boolean;
  onToggle?: () => void;
  spanRef?: React.Ref<HTMLSpanElement>;
}) {
  const className = `${expanded ? EXPANDED : COLLAPSED}${cut ? " cursor-pointer" : ""}`;
  if (!cut) {
    return (
      <span ref={spanRef} className={className} style={style}>
        <DecodedText text={name} />
      </span>
    );
  }
  return (
    <span
      ref={spanRef}
      className={className}
      style={style}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={expanded ? undefined : `${name}, show full name`}
      onClick={onToggle}
      onKeyDown={(e: KeyboardEvent<HTMLSpanElement>) => {
        if (!isToggleKey(e.key)) return;
        e.preventDefault();
        onToggle?.();
      }}
    >
      <DecodedText text={name} />
    </span>
  );
}

export function ItemName({ name, style }: { name: string; style?: CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Measure only while collapsed: once expanded the text fits by
    // construction, and re-measuring then would remove the way back.
    if (expanded) return;
    const el = ref.current;
    if (!el) return;
    const measure = () => setCut(isCut(el));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded, name]);

  return (
    <ItemNameView
      name={name}
      style={style}
      cut={cut}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      spanRef={ref}
    />
  );
}
