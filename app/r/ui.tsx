// app/r/ui.tsx
//
// Presentational pieces for the RDH receipt web viewer, restyled to match
// the PapeX iOS app's receipt-detail screen per
// docs/PAPEX_DESIGN_KIT_FOR_WEB.md (extracted 2026-08-17 from
// PapeXV2/theme/tokens.ts + components/ui/GlassCard.tsx + GlassEdgeRing.tsx
// on release/testflight-2026-08-17 - the build submitted to Apple that day).
//
// Canonical source: PapeXV2/theme/tokens.ts. This file previously claimed
// that but had drifted (#FB8500 orange, a retired #2B7FC6 blue) - fixed
// here. Colour VALUES that are themable (text, dividers, the glass face/rim/
// glow) are read through the CSS custom properties defined in ./theme.css,
// not hardcoded here, so light/dark can differ without a client-side theme
// switch. If a colour looks wrong, check theme.css against the design doc
// before editing a hex in this file.
//
// The shipping app deliberately walked back the heavy glass treatment
// (3150a5c "outline, not frost", 3b35bd8 "glass face without a backdrop
// blur") - the card face below is a near-invisible gradient with ZERO
// backdrop-filter/blur, and all the visual weight is on the 1px corner-lit
// rim (CornerLitRing). Do not add backdrop-blur back in; that would make
// the web page glassier than the app it's supposed to match.
//
// All server components except where noted - SaveToPapex.tsx and
// RetryButton.tsx are their own "use client" islands, imported here.

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, FlaskConical, SearchX } from "lucide-react";
import type { DecodedLogo, ReceiptLine } from "@/lib/escpos";
import {
  type ReceiptSummary,
  detectPaymentMethod,
  extractLastFour,
  PAYMENT_METHOD_STYLES,
} from "@/lib/receiptSummary";
import SaveToPapex from "./SaveToPapex";
import "./theme.css";

const APP_STORE_URL = "https://apps.apple.com/us/app/papex/id6754945242";

// ---- Tokens (PapeXV2/theme/tokens.ts) --------------------------------------
//
// `orange` is the one brand hex the app never themes by light/dark
// (colors.accent/primary/tint is #EB7100 in both `colors` and `colorsLight`
// - spec §1.2/§1.3), so it's a literal here rather than a CSS var. Every
// other token below is themable and reads through theme.css.

const T = {
  orange: "#EB7100",
  text: "var(--r-text)",
  textSecondary: "var(--r-text-secondary)",
  textMuted: "var(--r-text-muted)",
  success: "#34C759",
  error: "#FF3B30",
  divider: "var(--r-divider)",
};

// Orange opacity ramp - §1.1. Used for the sample/demo marker, which
// previously used an ad hoc rgba(251,133,0,...) family built on the stale
// #FB8500 hue.
const ORANGE_RAMP = {
  o08: "var(--r-orange-08)",
  o12: "var(--r-orange-12)",
  o20: "var(--r-orange-20)",
};

// ---- Glass card primitive: face fill + inset shadow + corner-lit rim -------
//
// §2 of the design doc, reconstructed as CSS. Layer order (bottom -> top):
// face fill -> inset depth shadow -> content -> the rim (drawn last, on
// top, as real border pieces) -> outer glow (on the wrapping element).
// This order is load-bearing: it's why the face can stay translucent
// without the rim's colour bleeding into it (two other approaches - a
// gradient background behind the face, and a masked ring - were tried in
// the source and reverted; see §2.1).

type RimTier = "neutral" | "important" | "standard";

const RIM_VARS: Record<RimTier, { lit: string; faint: string; glow: string }> = {
  neutral: {
    lit: "var(--r-rim-neutral-lit)",
    faint: "var(--r-rim-neutral-faint)",
    glow: "var(--r-glow-neutral)",
  },
  important: {
    lit: "var(--r-rim-important-lit)",
    faint: "var(--r-rim-important-faint)",
    glow: "var(--r-glow-important)",
  },
  standard: {
    lit: "var(--r-rim-standard-lit)",
    faint: "var(--r-rim-standard-faint)",
    glow: "var(--r-glow-standard)",
  },
};

// The 8-piece corner-lit ring - §2.4. Not a gradient border (no CSS
// primitive expresses "fade over 60% of each edge's own length"
// independently per edge when edges are different lengths) - 4 quarter-
// circle corners (flat colour, two coloured border-sides each) + 4
// absolutely-positioned 1px gradient strips, ported directly from
// GlassEdgeRing.tsx's RN structure rather than a cleverer CSS trick.
// `far === lit` today (§1.6), so `lit` is reused for the bottom-right
// corner and the far ends of the bottom/right edges.
function CornerLitRing({ tier, radius }: { tier: RimTier; radius: number }) {
  const { lit, faint } = RIM_VARS[tier];
  const corner = (pos: CSSProperties): CSSProperties => ({
    position: "absolute",
    width: radius,
    height: radius,
    ...pos,
  });
  const edge = (pos: CSSProperties): CSSProperties => ({
    position: "absolute",
    ...pos,
  });
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {/* top-left corner - always full "lit" brightness, where the light originates */}
      <div
        style={corner({
          top: 0,
          left: 0,
          borderTopWidth: 1,
          borderLeftWidth: 1,
          borderTopColor: lit,
          borderLeftColor: lit,
          borderTopLeftRadius: radius,
        })}
      />
      {/* top-right corner - faint */}
      <div
        style={corner({
          top: 0,
          right: 0,
          borderTopWidth: 1,
          borderRightWidth: 1,
          borderTopColor: faint,
          borderRightColor: faint,
          borderTopRightRadius: radius,
        })}
      />
      {/* bottom-left corner - faint */}
      <div
        style={corner({
          bottom: 0,
          left: 0,
          borderBottomWidth: 1,
          borderLeftWidth: 1,
          borderBottomColor: faint,
          borderLeftColor: faint,
          borderBottomLeftRadius: radius,
        })}
      />
      {/* bottom-right corner - "far", equal brightness to top-left (ratified 2026-07-31) */}
      <div
        style={corner({
          bottom: 0,
          right: 0,
          borderBottomWidth: 1,
          borderRightWidth: 1,
          borderBottomColor: lit,
          borderRightColor: lit,
          borderBottomRightRadius: radius,
        })}
      />
      {/* top edge - lit fade, stops [0, 0.6, 1] (EDGE_FADE_REACH = 0.6) */}
      <div
        style={edge({
          top: 0,
          left: radius,
          right: radius,
          height: 1,
          backgroundImage: `linear-gradient(to right, ${lit} 0%, ${faint} 60%, ${faint} 100%)`,
        })}
      />
      {/* left edge - lit fade, same stops */}
      <div
        style={edge({
          left: 0,
          top: radius,
          bottom: radius,
          width: 1,
          backgroundImage: `linear-gradient(to bottom, ${lit} 0%, ${faint} 60%, ${faint} 100%)`,
        })}
      />
      {/* bottom edge - far fade, MIRRORED stops [0, 0.4, 1] - getting this
          backwards is a documented past bug ("flares at the corner") */}
      <div
        style={edge({
          bottom: 0,
          left: radius,
          right: radius,
          height: 1,
          backgroundImage: `linear-gradient(to right, ${faint} 0%, ${faint} 40%, ${lit} 100%)`,
        })}
      />
      {/* right edge - far fade, mirrored */}
      <div
        style={edge({
          right: 0,
          top: radius,
          bottom: radius,
          width: 1,
          backgroundImage: `linear-gradient(to bottom, ${faint} 0%, ${faint} 40%, ${lit} 100%)`,
        })}
      />
    </div>
  );
}

const RADII = { lg: 18, xl: 24 } as const;

export function GlassCard({
  children,
  className = "",
  tier = "neutral",
  radius = RADII.xl,
}: {
  children: ReactNode;
  className?: string;
  /** Rim colour tier - §1.5. `important` = money (orange), `standard` =
   * what/who (blue), `neutral` = everything else. Never tint a label to
   * match; colour lives only in the rim. */
  tier?: RimTier;
  radius?: number;
}) {
  const { glow } = RIM_VARS[tier];
  return (
    <div className={className} style={{ borderRadius: radius, boxShadow: glow }}>
      <div
        className="relative p-6"
        style={{
          borderRadius: radius,
          background: "var(--r-face-fill)",
          boxShadow: "inset 2px 2px 4px -2px var(--r-inset-corner), inset 0 -12px 24px var(--r-inset-bottom)",
        }}
      >
        <div className="relative z-10">{children}</div>
        <CornerLitRing tier={tier} radius={radius} />
      </div>
    </div>
  );
}

// Plain faint-bordered circular badge - the corner-lit ring has no defined
// circular form in the source (GlassEdgeRing.tsx only draws rectangular
// corners), so round chrome (state icons, the decoded-logo frame) gets a
// simple uniform border instead. A judgment call, not a spec value.
const badgeStyle: CSSProperties = {
  background: "var(--r-badge-bg)",
  borderColor: "var(--r-badge-border)",
};

// ---- Demo (sample) banner -----------------------------------------------------
//
// Pinned, not inline. The previous banner sat at the top of the normal flow
// and scrolled away after ~one swipe, so a screenshot of the middle of the
// page showed fabricated line items with nothing marking them as fake. This
// one sticks to the top of the viewport for the life of the page.
//
// `sticky` (not `fixed`) so it still participates in the flex column's
// spacing; none of its ancestors in <Shell> set overflow/transform/filter,
// which is what would otherwise break stickiness.

export function DemoBanner() {
  return (
    <div className="sticky top-0 z-30 -mx-1 pb-1 pt-1">
      <div
        className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        style={{
          background: "rgba(120, 60, 0, 0.85)",
          borderColor: ORANGE_RAMP.o20,
          color: "#FFD9A8",
        }}
      >
        <FlaskConical className="h-4 w-4 shrink-0" style={{ color: T.orange }} strokeWidth={2} />
        <span>
          <strong className="font-semibold" style={{ color: "#FFF0DC" }}>
            Sample receipt.
          </strong>{" "}
          Made-up data, not a real purchase.
        </span>
      </div>
    </div>
  );
}

// ---- Sample frame: watermark + dashed border + persistent chip ---------------
//
// The banner alone isn't enough - the receipt *body* has to carry the mark,
// so that a crop or screenshot of any part of it is still self-evidently
// fake. Three redundant signals: a repeating diagonal SAMPLE watermark laid
// over the cards, a dashed orange border around the whole block, and a chip
// riding the top edge.
//
// The watermark is an inline SVG data URI rather than a repeated DOM node so
// it tiles at any content height with one element and zero layout cost.
// Single quotes inside the SVG survive encodeURIComponent untouched, which
// keeps the CSS `url("…")` wrapper valid.

const SAMPLE_WATERMARK_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='150' viewBox='0 0 240 150'>
  <g font-family='Barlow, Helvetica, Arial, sans-serif' font-size='26' font-weight='700' letter-spacing='7' fill='rgba(235,113,0,0.16)'>
    <text x='4' y='58' transform='rotate(-24 4 58)'>SAMPLE</text>
    <text x='124' y='133' transform='rotate(-24 124 133)'>SAMPLE</text>
  </g>
</svg>`;

const SAMPLE_WATERMARK_URL = `url("data:image/svg+xml,${encodeURIComponent(SAMPLE_WATERMARK_SVG)}")`;

export function SampleFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative rounded-[28px] border-2 border-dashed p-3 pt-6"
      style={{
        borderColor: ORANGE_RAMP.o20,
        background: ORANGE_RAMP.o08,
      }}
    >
      <span
        className="absolute -top-[11px] left-1/2 -translate-x-1/2 rounded-full border px-3 py-[3px] text-[10px] font-bold uppercase tracking-[1.5px]"
        style={{
          background: "#1b1408",
          borderColor: ORANGE_RAMP.o20,
          color: "#ffb74d",
        }}
      >
        Sample
      </span>
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px]"
        style={{
          backgroundImage: SAMPLE_WATERMARK_URL,
          backgroundRepeat: "repeat",
          backgroundSize: "240px 150px",
        }}
      />
    </div>
  );
}

// ---- Receipt not available ----------------------------------------------------
//
// The heart of the fix. Reached when a sid *was* supplied but there is no
// receipt behind it (backend 404, empty/unparseable payload, malformed sid).
// This screen must never contain sample content of any kind - the person
// looking at it tapped a real device and is trying to find a real purchase.

export function ReceiptNotAvailable({ children }: { children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border" style={badgeStyle}>
        <SearchX className="h-6 w-6" style={{ color: T.textMuted }} strokeWidth={1.75} />
      </div>
      <h1 className="font-barlow text-xl font-semibold" style={{ color: T.text }}>
        Receipt not available
      </h1>
      <p className="mt-2 max-w-[19rem] text-sm" style={{ color: T.textSecondary }}>
        We couldn&apos;t find a receipt for this link. The link may have been
        mistyped or cut short when it was shared, or this receipt isn&apos;t in
        our system.
      </p>
      <p className="mt-3 max-w-[19rem] text-sm" style={{ color: T.textMuted }}>
        If you just tapped the device, give it a moment and try again.
      </p>
      {children}
    </div>
  );
}

// ---- Error / empty states -----------------------------------------------------

export function StateCard({
  icon,
  title,
  message,
  children,
}: {
  icon: "warning" | "clock";
  title: string;
  message: string;
  children?: ReactNode;
}) {
  const Icon = icon === "clock" ? Clock : AlertTriangle;
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border" style={badgeStyle}>
        <Icon className="h-6 w-6" style={{ color: T.textMuted }} strokeWidth={1.75} />
      </div>
      <h1 className="font-barlow text-xl font-semibold" style={{ color: T.text }}>
        {title}
      </h1>
      <p className="mt-2 max-w-xs text-sm" style={{ color: T.textSecondary }}>
        {message}
      </p>
      {children}
    </div>
  );
}

// ---- Logo (decoded ESC/POS raster, see lib/escpos.ts) --------------------------
//
// Rendered above everything else, centered, scaled to the card width. The
// decoded bitmap is a 2-color PNG (transparent background, near-white
// foreground - see lib/escpos.ts's LOGO_FOREGROUND, which mirrors T.text
// here) so it reads as a deliberate light logo mark on the dark glass card
// rather than an inverted/broken image. `image-rendering: pixelated` keeps
// the 1-bit source crisp instead of letting the browser smear it with
// bilinear scaling. A plain `<img>` (not next/image) - this is a `data:`
// URI, so there's no network fetch to optimize away either way, and
// next/image's remote-loader machinery doesn't apply to embedded data.
//
// This is the *merchant's* raster logo, decoded from the thermal-printer
// bitmap on the receipt itself - unrelated to the PapeX brand wordmark in
// <Shell>'s header below. Untouched by this restyle pass beyond the card
// chrome it sits in (badgeStyle -> neutral rim), per the task brief.

function LogoBlock({ logo }: { logo: DecodedLogo }) {
  return (
    <div className="flex justify-center">
      <div className="flex max-w-[240px] items-center justify-center rounded-[20px] border px-6 py-5" style={badgeStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.dataUri}
          alt="Merchant logo"
          width={logo.widthPx}
          height={logo.heightPx}
          className="h-auto w-full max-h-[120px]"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}

// ---- Merchant header card ------------------------------------------------------

function monogram(name?: string): string {
  if (!name) return "P";
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : "P";
}

export function MerchantHeaderCard({
  summary,
  isSample = false,
}: {
  summary: ReceiptSummary;
  isSample?: boolean;
}) {
  const { merchantName, addressLines, dateline } = summary;
  return (
    // "standard" (blue rim) - the substance of a purchase: what/who. §1.5.
    <GlassCard tier="standard">
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white"
          style={{ border: `2px solid ${T.orange}` }}
        >
          <span className="text-xl font-medium" style={{ color: "#181A20" }}>
            {monogram(merchantName)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          {/* storeName: Barlow-Medium 24px - §3.4 */}
          <h1 className="font-barlow truncate text-2xl font-medium" style={{ color: T.text }}>
            {merchantName ?? "Your receipt"}
          </h1>
          {addressLines.length > 0 && (
            <p className="mt-0.5 truncate text-sm" style={{ color: T.textMuted }}>
              {addressLines.join(", ")}
            </p>
          )}
          {dateline && (
            <p className="mt-1 text-sm font-medium" style={{ color: T.orange }}>
              {dateline}
            </p>
          )}
          <p className="mt-1 text-xs" style={{ color: isSample ? "#ffb74d" : T.textMuted }}>
            {isSample ? "Sample data — not a real purchase" : "📟 RDH Receipt"}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

// ---- Items card ------------------------------------------------------------------

export function ItemsCard({ summary }: { summary: ReceiptSummary }) {
  if (summary.items.length === 0) return null;
  return (
    <div>
      {/* sectionTitle: Barlow-Medium 20px - §3.4 (rendered smaller/uppercase here as
          an eyebrow-style section label, consistent with the existing layout) */}
      <p className="mb-2 px-1 text-sm font-medium uppercase tracking-wide" style={{ color: T.textSecondary }}>
        Items Purchased
      </p>
      {/* "standard" (blue rim) - same tier as the store card, both "middle" per §1.5 */}
      <GlassCard tier="standard">
        <div className="flex flex-col">
          {summary.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 py-2.5"
              style={
                i === summary.items.length - 1
                  ? undefined
                  : { borderBottom: `1px solid ${T.divider}` }
              }
            >
              {/* itemName: Barlow-Medium 16px - §3.4 */}
              <span className="min-w-0 flex-1 truncate text-base font-medium" style={{ color: T.text }}>
                {item.name}
              </span>
              <div className="flex shrink-0 flex-col items-end">
                {item.qty > 1 && (
                  <span className="text-xs" style={{ color: T.textMuted }}>
                    ×{item.qty}
                  </span>
                )}
                {/* itemPrice: Barlow-Medium 16px - §3.4 */}
                <span className="text-base font-medium" style={{ color: T.text }}>
                  ${item.amount.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

// ---- Payment chip ------------------------------------------------------------------

function PaymentRow({ paymentLine }: { paymentLine: string }) {
  const network = detectPaymentMethod(paymentLine);
  const lastFour = extractLastFour(paymentLine);
  if (!network) {
    return (
      <span className="text-base font-medium" style={{ color: T.text }}>
        {paymentLine}
      </span>
    );
  }
  const style = PAYMENT_METHOD_STYLES[network];
  return (
    <div className="flex items-center gap-2">
      <span
        className="rounded px-[7px] py-[3px] text-[11px] font-bold uppercase tracking-[0.5px]"
        style={{ background: style.bg, color: style.textColor }}
      >
        {style.label}
      </span>
      {lastFour && (
        <span className="text-base font-medium" style={{ color: T.text }}>
          •••• {lastFour}
        </span>
      )}
    </div>
  );
}

// ---- Totals card ------------------------------------------------------------------

function TotalRow({
  label,
  value,
  valueColor = T.text,
  labelColor = T.textSecondary,
}: {
  label: ReactNode;
  value: ReactNode;
  valueColor?: string;
  labelColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      {/* totalLabel: Barlow-Regular 16px - §3.4 */}
      <span className="text-base" style={{ color: labelColor }}>
        {label}
      </span>
      {/* totalValue: Barlow-Medium 16px - §3.4 */}
      <span className="text-base font-medium" style={{ color: valueColor }}>
        {value}
      </span>
    </div>
  );
}

export function TotalsCard({
  summary,
  isSample = false,
}: {
  summary: ReceiptSummary;
  isSample?: boolean;
}) {
  const computedSubtotal =
    summary.subtotal ?? (summary.items.length > 0 ? summary.items.reduce((s, i) => s + i.amount * i.qty, 0) : undefined);
  const taxRate =
    summary.tax != null && computedSubtotal != null && computedSubtotal > 0
      ? ((summary.tax / computedSubtotal) * 100).toFixed(1)
      : null;

  if (
    computedSubtotal == null &&
    summary.tax == null &&
    summary.tip == null &&
    summary.discount == null &&
    summary.total == null &&
    !summary.paymentLine
  ) {
    return null;
  }

  return (
    <div>
      <p className="mb-2 px-1 text-sm font-medium uppercase tracking-wide" style={{ color: T.textSecondary }}>
        Totals
      </p>
      {/* "important" (orange rim, #e88036 - NOT the brand #EB7100, §1.5) - money,
          the amount actually paid. */}
      <GlassCard tier="important">
        <div className="flex flex-col">
          {computedSubtotal != null && (
            // No special colour in the app's actual totalValue style (§3.4) -
            // the previous `T.blue` override here was one of the two stale
            // hexes named in the spec (§7.1); subtotal is plain `text`.
            <TotalRow label="Subtotal" value={`$${computedSubtotal.toFixed(2)}`} />
          )}
          {summary.tax != null && summary.tax > 0 && (
            <TotalRow label={taxRate ? `Tax (${taxRate}%)` : "Tax"} value={`$${summary.tax.toFixed(2)}`} />
          )}
          {summary.tip != null && summary.tip > 0 && (
            <TotalRow label="Tip" value={`$${summary.tip.toFixed(2)}`} labelColor={T.textMuted} valueColor={T.textMuted} />
          )}
          {summary.discount != null && summary.discount > 0 && (
            <TotalRow label="Discount" value={`-$${summary.discount.toFixed(2)}`} valueColor={T.success} />
          )}
          {summary.total != null && (
            <div className="mt-2 flex items-center justify-between pt-2" style={{ borderTop: `2px solid ${T.orange}` }}>
              {/* totalLabelFinal: Barlow-Medium 20px - §3.4. Colour stays `text`,
                  not orange: "never tint a glyph or label to match a rim colour
                  ... colour lives only in the border" (§1.5) - the previous
                  bold-orange label was exactly that mistake. */}
              <span className="text-xl font-medium" style={{ color: T.text }}>
                Total
              </span>
              {/* totalValueFinal: Barlow-Medium 24px - §3.4 */}
              <span className="text-2xl font-medium" style={{ color: T.text }}>
                ${summary.total.toFixed(2)}
              </span>
            </div>
          )}
          {summary.paymentLine && (
            <div className="mt-2 flex items-center justify-between pt-2">
              <span className="text-sm" style={{ color: T.textSecondary }}>
                Payment
              </span>
              {isSample ? (
                // Never render a card-network chip + last-four for fabricated
                // data: "VISA •••• 4729" reads as a genuine transaction record
                // even in isolation. The sample's own payment line is still
                // visible verbatim inside the (marked) Original receipt body.
                <span
                  className="rounded-full border px-3 py-[3px] text-[11px] font-semibold uppercase tracking-[0.5px]"
                  style={{
                    borderColor: ORANGE_RAMP.o20,
                    color: "#ffb74d",
                  }}
                >
                  Demo card
                </span>
              ) : (
                <PaymentRow paymentLine={summary.paymentLine} />
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// ---- Original receipt (verbatim monospace) ------------------------------------

function styleClasses(style: ReceiptLine["style"]): string {
  const classes: string[] = [];
  if (style.doubleHeight && style.doubleWidth) classes.push("text-lg");
  else if (style.doubleHeight || style.doubleWidth) classes.push("text-base");
  else if (style.fontB) classes.push("text-[11px]");
  else classes.push("text-[13px]");
  if (style.bold) classes.push("font-bold");
  if (style.underline) classes.push("underline underline-offset-2");
  return classes.join(" ");
}

function alignClass(align: ReceiptLine["align"]): string {
  switch (align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    default:
      return "text-left";
  }
}

export function OriginalReceiptCollapsible({
  lines,
  defaultOpen,
}: {
  lines: ReceiptLine[];
  defaultOpen: boolean;
}) {
  return (
    <details open={defaultOpen} className="group">
      <summary
        className="flex cursor-pointer list-none items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium"
        style={{ ...badgeStyle, color: T.textSecondary }}
      >
        <span>Original receipt</span>
        <span className="text-xs transition-transform group-open:rotate-180" style={{ color: T.textMuted }}>
          ▾
        </span>
      </summary>
      <div className="mt-2 overflow-x-auto rounded-2xl border p-4" style={badgeStyle}>
        {/* Verbatim ESC/POS text dump - IBM Plex Mono, matching the app's
            monospace/stat-figure convention (§3.1/§3.3) elsewhere in PapeX,
            even though receiptDetail.tsx itself has no raw-dump equivalent
            to port from (§7's "Original receipt raw dump" row). */}
        <div
          className="leading-relaxed"
          style={{ color: T.textSecondary, fontFamily: "var(--font-ibm-plex-mono)" }}
        >
          {lines.map((line, i) => (
            <div key={i} className={`whitespace-pre ${alignClass(line.align)} ${styleClasses(line.style)}`}>
              {line.text.length === 0 ? " " : line.text}
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}

// ---- Full receipt view (structured cards + raw fallback) -----------------------

export function ReceiptView({
  summary,
  hasStructure,
  isSample = false,
  logo,
}: {
  summary: ReceiptSummary;
  hasStructure: boolean;
  isSample?: boolean;
  /** Decoded merchant logo, if any — see lib/escpos.ts. Never set on the sample/demo path. */
  logo?: DecodedLogo;
}) {
  return (
    <div className="flex flex-col gap-4">
      {logo && <LogoBlock logo={logo} />}
      {hasStructure && <MerchantHeaderCard summary={summary} isSample={isSample} />}
      {hasStructure && <ItemsCard summary={summary} />}
      {hasStructure && <TotalsCard summary={summary} isSample={isSample} />}
      <OriginalReceiptCollapsible lines={summary.bodyLines} defaultOpen={!hasStructure} />
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------
//
// `.papex-receipt` (theme.css) scopes every CSS custom property this route
// uses - light/dark values live there, not here. Header carries the real
// PapeX wordmark (main_logo.png / Main_blue_transparent_outline.png, spec
// §4) instead of the previous plain-text "papex" lockup - the concrete gap
// the design doc named. The "Receipt" label uses the app's IBM Plex Mono
// "eyebrow" convention (§3.3: Medium, 11px, +0.08em, uppercase).

export function Shell({ children }: { children: ReactNode }) {
  return (
    <main
      className="papex-receipt min-h-screen w-full"
      style={{
        color: "var(--r-text)",
        backgroundColor: "var(--r-bg-solid)",
        backgroundImage: [
          "radial-gradient(ellipse 120% 60% at 50% -10%, var(--r-bg-glow) 0%, rgba(235,113,0,0) 60%)",
          "linear-gradient(180deg, var(--r-bg-tint-top) 0%, var(--r-bg-tint-bottom) 100%)",
          "url('/rdh-background.jpg')",
        ].join(", "),
        backgroundSize: "cover, cover, cover",
        backgroundPosition: "center, center, center",
        backgroundAttachment: "fixed, fixed, fixed",
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pb-10 pt-6">
        <header className="mb-5 flex items-center gap-3 px-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/main_logo.png" alt="PapeX" className="r-logo-dark h-7 w-auto" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/Main_blue_transparent_outline.png"
            alt="PapeX"
            className="r-logo-light h-7 w-auto"
          />
          <span
            className="ml-auto text-[11px] font-medium uppercase"
            style={{ color: "var(--r-text-muted)", fontFamily: "var(--font-ibm-plex-mono)", letterSpacing: "0.08em" }}
          >
            Receipt
          </span>
        </header>
        <div className="flex flex-1 flex-col gap-4">{children}</div>
      </div>
    </main>
  );
}

// ---- CTA row: Save to PapeX + install links ------------------------------------

export function AppCta({ isAndroid }: { isAndroid: boolean }) {
  if (isAndroid) {
    return (
      <p className="text-center text-xs" style={{ color: T.textMuted }}>
        PapeX for Android isn&apos;t available yet.{" "}
        <Link href="/waitlist" className="font-medium underline underline-offset-2" style={{ color: T.orange }}>
          Join the waitlist
        </Link>{" "}
        to hear when it lands.
      </p>
    );
  }
  return (
    <p className="text-center text-xs" style={{ color: T.textMuted }}>
      <Link href={APP_STORE_URL} className="font-medium underline underline-offset-2" style={{ color: T.orange }}>
        Get the PapeX app
      </Link>{" "}
      to save every receipt automatically.
    </p>
  );
}

export function CtaRow({
  sid,
  isSample,
  isIOS,
  isAndroid,
}: {
  sid?: string;
  isSample: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}) {
  return (
    <div className="mt-2 flex flex-col items-center gap-4">
      <SaveToPapex sid={sid} isSample={isSample} isIOS={isIOS} />
      <AppCta isAndroid={isAndroid} />
    </div>
  );
}
