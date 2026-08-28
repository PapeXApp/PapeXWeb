// app/r/chrome.tsx
//
// The page chrome and the design tokens behind it: <Shell>, <GlassCard>,
// and the `T`/`S` token groups, split out of ui.tsx verbatim.
//
// Split for one reason — ui.tsx imports SaveToPapex, a "use client" island
// that pulls in the Firebase auth SDK. Next includes every client entry
// point reachable from a page's module graph, rendered or not, so any route
// that wanted a Shell or a GlassCard from ui.tsx shipped ~39 kB of sign-in
// JS it never ran (app/rdh, app/merchant/tx/[sid]). Nothing here may import
// a client component, or that comes straight back.
//
// ui.tsx re-exports Shell and GlassCard, so existing `from "./ui"` imports
// still resolve; import from here directly when the route wants only chrome.

import type { ReactNode } from "react";
import styles from "./glass.module.css";

// ---- Tokens (docs/PAPEX_DESIGN_KIT_FOR_WEB.md §1, §2) -----------------------
//
// `T` is what everything *inside* a glass card uses — cards are always a
// dark surface (§8), so these never change with the page shell's light/dark
// state. Shell-level chrome that sits directly on the page background
// (header kicker, empty-state copy) uses the theme-aware CSS custom
// properties defined in glass.module.css's `.shell` class instead — see the
// `S` token group below.

export const T = {
  navy: "#00121D",
  orange: "#EB7100", // THE brand accent. Never the important-tier rim orange (#e88036) — see §2 note.
  orangeRim: "#e88036", // important-tier ring color only — never a fill, never a CTA.
  blue: "#0088EA", // semantic info blue (subtotal callout, links) — NOT the rim "standard" blue.
  text: "rgba(255, 255, 255, 0.90)",
  textSecondary: "rgba(255, 255, 255, 0.64)",
  textMuted: "rgba(255, 255, 255, 0.45)",
  divider: "rgba(255, 255, 255, 0.10)",
  success: "#34C759",
  error: "#FF3B30",
  warning: "#FFB800",
  orange20: "rgba(235, 113, 0, 0.20)",
  orange12: "rgba(235, 113, 0, 0.12)",
  orange08: "rgba(235, 113, 0, 0.08)",
};

// Shell-level text tokens — theme-aware via CSS custom properties set on
// `.shell` (glass.module.css), which swap under `prefers-color-scheme:
// light` to the spec's `colorsLight` values. Only for text painted directly
// on the page background, never for card interiors.
export const S = {
  text: "var(--page-text)",
  textSecondary: "var(--page-text-secondary)",
  textMuted: "var(--page-text-muted)",
};

// ---- Shell ------------------------------------------------------------------

export function Shell({ children }: { children: ReactNode }) {
  return (
    <main className={`min-h-screen w-full ${styles.shell} ${styles.shellBg}`} style={{ color: T.text }}>
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pb-10 pt-6">
        <header className="mb-5 flex items-center gap-3 px-1">
          {/* PapeX brand logo — docs/PAPEX_DESIGN_KIT_FOR_WEB.md §4. The
              same artwork (main_logo.png, MD5-identical to
              PapeXV2/assets/logos/main_logo.png) the App Clip's own
              receipt view uses for its brand lockup. This is the PapeX
              brand mark; it is never the merchant's logo — see LogoBlock
              below for that, and the hierarchy note there. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/main_logo.png" alt="PapeX" className="h-6 w-auto shrink-0" style={{ objectFit: "contain" }} />
          <span
            className="ml-auto text-xs font-medium uppercase tracking-wide"
            style={{ color: S.textMuted }}
          >
            Receipt
          </span>
        </header>
        <div className="flex flex-1 flex-col gap-4">{children}</div>
      </div>
    </main>
  );
}

// ---- Glass card primitive (docs/PAPEX_DESIGN_KIT_FOR_WEB.md §2) -------------
//
// `emphasis` picks the tier: "none" (frost + inset shadow, no ring, no
// glow — used for quiet/supporting surfaces), "neutral" (white ring, no
// hue), "standard" (the #7FC4EC rim blue — "the substance of the
// purchase"), "important" (the #e88036 rim orange — "the amount actually
// paid", the one sanctioned second-orange in the whole system). Ranking
// orange > blue > white is doubly-validated per §7's closing note.
//
// No `backdrop-blur` anywhere here — see glass.module.css's file header for
// why that's a deliberate, spec-mandated omission rather than an oversight.

export type Emphasis = "none" | "neutral" | "standard" | "important";

const GLOW_CLASS: Record<Exclude<Emphasis, "none">, string> = {
  neutral: styles.glowNeutral,
  standard: styles.glowStandard,
  important: styles.glowImportant,
};

const RING_CLASS: Record<Exclude<Emphasis, "none">, string> = {
  neutral: styles.ringNeutral,
  standard: styles.ringStandard,
  important: styles.ringImportant,
};

export function GlassCard({
  children,
  className = "",
  emphasis = "none",
  radius,
}: {
  children: ReactNode;
  className?: string;
  emphasis?: Emphasis;
  /** Corner radius in px. Defaults to 24 (the card recipe's built-in radius) — pass 9999 for a circular badge. */
  radius?: number;
}) {
  const radiusStyle = radius != null ? { borderRadius: radius } : undefined;
  const card = (
    <div
      className={`${styles.card} ${emphasis !== "none" ? RING_CLASS[emphasis] : ""} ${className}`}
      style={radiusStyle}
    >
      {children}
    </div>
  );
  if (emphasis === "none") return card;
  return (
    <div className={`${styles.wrap} ${GLOW_CLASS[emphasis]}`} style={radiusStyle}>
      {card}
    </div>
  );
}
