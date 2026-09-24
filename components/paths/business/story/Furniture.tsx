import { cn } from "@/lib/utils"
import s from "../story.module.css"

/** The thermal printer the slip feeds out of (same artwork as the 2026-09-22 scene). */
export function Printer({ busy, ref }: { busy: boolean; ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div className={cn(s.printer, busy && s.printerBusy)} ref={ref}>
      <svg viewBox="0 0 260 150" className={s.fill} aria-hidden="true">
        <defs>
          <linearGradient id="st-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3A4753" />
            <stop offset="1" stopColor="#1B242E" />
          </linearGradient>
          <linearGradient id="st-lid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#55636F" />
            <stop offset="1" stopColor="#2C3742" />
          </linearGradient>
        </defs>
        <ellipse cx="130" cy="132" rx="106" ry="9" fill="#00121D" opacity="0.14" />
        <rect x="48" y="6" width="164" height="34" rx="17" fill="url(#st-lid)" />
        <rect x="70" y="14" width="120" height="9" rx="4.5" fill="#0C141C" opacity="0.45" />
        <rect x="18" y="34" width="224" height="90" rx="16" fill="url(#st-body)" />
        <rect x="18" y="34" width="224" height="30" rx="16" fill="#FFFFFF" opacity="0.05" />
        <rect x="34" y="92" width="192" height="32" rx="12" fill="#141C24" />
        <rect x="52" y="112" width="156" height="9" rx="4.5" fill="#02070C" />
        <rect x="52" y="112" width="156" height="3" rx="1.5" fill="#000" opacity="0.65" />
        <circle cx="214" cy="78" r="6" className={s.printerLed} />
        <rect x="44" y="72" width="54" height="6" rx="3" fill="#FFFFFF" opacity="0.09" />
      </svg>
    </div>
  )
}

/** The bin. `landed` pops the lid once, when the plane goes in. */
export function Bin({ landed, ref }: { landed: boolean; ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div className={cn(s.bin, landed && s.binLanded)} ref={ref}>
      <svg viewBox="0 0 140 170" className={s.fill} aria-hidden="true">
        <ellipse cx="70" cy="162" rx="52" ry="7" fill="#00121D" opacity="0.16" />
        <g className={s.binLid}>
          <rect x="12" y="26" width="116" height="14" rx="7" fill="#37424E" />
          <rect x="56" y="16" width="28" height="10" rx="5" fill="#37424E" />
        </g>
        <path d="M22 44H118L108 156A8 8 0 0 1 100 163H40A8 8 0 0 1 32 156Z" fill="#46525F" />
        <path d="M22 44H70V163H40A8 8 0 0 1 32 156Z" fill="#FFFFFF" opacity="0.06" />
        <path d="M48 60V148M70 60V148M92 60V148" stroke="#00121D" strokeOpacity="0.22" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )
}

/**
 * The PapeX device, as the pilot unit ships. The same generated artwork the
 * rest of /business uses (public/product/rdh-device.svg, from
 * scripts/generate-rdh-device.mjs) — as an <img>, so it brings no gradient
 * ids into the page and no second copy of the art to drift.
 */
export function DeviceArt({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a small static SVG; next/image adds nothing here
    <img src="/product/rdh-device.svg" alt="" aria-hidden="true" className={className} draggable={false} />
  )
}
