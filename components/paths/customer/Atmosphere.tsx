import type { CSSProperties, ReactNode } from "react";
import { PlaneMark } from "@/components/brand/plane-mark";
import { cn } from "@/lib/utils";
import styles from "./customer.module.css";

/**
 * The customer path's shared depth layer.
 *
 * WHY THIS EXISTS. The path shipped as a stack of flat colour bands: every
 * section was one `background` with a hard edge against its neighbour and
 * nothing behind the content. This gives all of them the same vocabulary —
 * seams, blurred orbs, skewed hairlines, a watermark — so depth is applied
 * consistently instead of improvised per section.
 *
 * Everything it renders is decorative: `aria-hidden`, `pointer-events: none`,
 * and painted beneath the content. It is a SERVER component and nothing in it
 * animates or listens to scroll — these are static layers that cost a single
 * paint. That is deliberate: the fork already owns the page's one rAF loop, and
 * the depth here must not add a second.
 *
 * Usage: wrap the section body in `<AtmosphereHost>`, drop an `<Atmosphere>`
 * in as the first child, and the host lifts the real content above it.
 */

type Tone = "light" | "dark";

/** Colour recipes per surface. Light surfaces need far less alpha than dark
 *  ones to read as the same amount of depth. */
/** Colour recipes per surface. Light surfaces need far less alpha than dark
 *  ones to read as the same amount of depth. */
const TONE = {
  light: {
    orbWarm: "rgba(235,113,0,.10)",
    orbCool: "rgba(0,18,29,.055)",
    line: "rgba(0,18,29,.13)",
    lineAccent: "rgba(235,113,0,.34)",
    rule: "rgba(0,18,29,.08)",
    markBody: "rgba(0,18,29,.04)",
    markLines: "rgba(0,18,29,.022)",
    /* The seam is a SHADOW CAST BY THE BAND ABOVE, not a wash of that band's
       colour. The first version bled the neighbour's colour in at .14 alpha,
       which over off-white is just a grey smudge across the top of the section
       — it read as a rendering fault, not as depth. A ~5% neutral shadow
       falling from the edge is what light actually does, and it stays clean. */
    seam: "rgba(0,18,29,.055)",
    seamEdge: "rgba(0,18,29,.10)",
    /* Third aurora hue. On light surfaces a cool blue keeps the warm pool from
       reading as a stain; the two together make the field feel lit rather than
       tinted. */
    orbAccent: "rgba(96,166,214,.09)",
    grain: 0.035,
  },
  dark: {
    orbWarm: "rgba(235,113,0,.14)",
    orbCool: "rgba(96,166,214,.085)",
    line: "rgba(245,245,245,.11)",
    lineAccent: "rgba(235,113,0,.4)",
    rule: "rgba(245,245,245,.09)",
    markBody: "rgba(235,113,0,.045)",
    markLines: "rgba(245,245,245,.03)",
    /* Dark surfaces take a LIFT rather than a shadow — the light band above
       spills onto them. Same idea, opposite sign. */
    seam: "rgba(245,245,245,.05)",
    seamEdge: "rgba(245,245,245,.09)",
    orbAccent: "rgba(235,113,0,.07)",
    grain: 0.05,
  },
} satisfies Record<Tone, Record<string, string | number>>;

export function AtmosphereHost({
  children,
  className,
  style,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "section";
}) {
  return (
    <Tag className={cn(styles.atmosHost, className)} style={style}>
      {children}
    </Tag>
  );
}

/** Lifts real content above the decorative layer. */
export function AtmosphereContent({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn(styles.atmosContent, className)} style={style}>
      {children}
    </div>
  );
}

export function Atmosphere({
  tone = "light",
  /** Which edges get the cast-shadow seam. */
  seam,
  orbs = true,
  /** "pair" is one long rule with an orange one alongside it; "none" turns
   *  lines off. There is deliberately no "scatter" option. */
  lines = "pair",
  watermark = false,
  watermarkStyle,
  grain = true,
}: {
  tone?: Tone;
  seam?: "top" | "bottom" | "both";
  orbs?: boolean;
  lines?: "pair" | "none";
  watermark?: boolean;
  watermarkStyle?: CSSProperties;
  grain?: boolean;
}) {
  const t = TONE[tone];
  const seamTop = seam === "top" || seam === "both";
  const seamBottom = seam === "bottom" || seam === "both";

  return (
    <div aria-hidden="true" className={styles.atmos}>
      {/* --- seams --------------------------------------------------------
          A soft cast shadow plus a single hairline exactly on the boundary.
          The hairline is what gives the edge definition; the gradient is what
          stops it being a cut. */}
      {seamTop ? (
        <>
          <div
            className={styles.atmosSeamTop}
            style={{ background: `linear-gradient(to bottom, ${t.seam}, transparent)` }}
          />
          <div className={styles.atmosRule} style={{ top: 0, background: t.seamEdge }} />
        </>
      ) : null}
      {seamBottom ? (
        <>
          <div
            className={styles.atmosSeamBottom}
            style={{ background: `linear-gradient(to top, ${t.seam}, transparent)` }}
          />
          <div className={styles.atmosRule} style={{ bottom: 0, background: t.seamEdge }} />
        </>
      ) : null}

      {/* --- aurora ---------------------------------------------------------
          Three blurred pools rather than two, at different sizes, blurs and
          hues. That is what separates an "aurora" field — which reads as light
          in a room — from a single tinted blob. The blur radii are large on
          purpose: anything under ~40px still shows its own edge. */}
      {orbs ? (
        <>
          <div
            className={styles.atmosOrb}
            style={{
              top: "-18%",
              right: "-12%",
              width: "min(820px, 66vw)",
              height: "min(820px, 66vw)",
              background: `radial-gradient(circle, ${t.orbWarm} 0%, ${t.orbWarm} 26%, transparent 70%)`,
              filter: "blur(72px)",
            }}
          />
          <div
            className={styles.atmosOrb}
            style={{
              bottom: "-26%",
              left: "-16%",
              width: "min(680px, 58vw)",
              height: "min(680px, 58vw)",
              background: `radial-gradient(circle, ${t.orbCool}, transparent 70%)`,
              filter: "blur(84px)",
            }}
          />
          <div
            className={styles.atmosOrb}
            style={{
              top: "42%",
              left: "34%",
              width: "min(520px, 44vw)",
              height: "min(520px, 44vw)",
              background: `radial-gradient(circle, ${t.orbAccent}, transparent 72%)`,
              filter: "blur(96px)",
            }}
          />
        </>
      ) : null}

      {/* --- lines --------------------------------------------------------
          ONE decision, not three scattered ones. A single rule and its orange
          partner, at the same angle, both running well past BOTH edges of the
          section so neither ever shows an endpoint. The earlier version placed
          three at unrelated offsets with visible starts and stops, which read
          as debris rather than design. */}
      {lines === "pair" ? (
        <>
          <div
            className={styles.atmosLine}
            style={{
              top: "34%",
              left: "-20%",
              width: "140%",
              transform: "rotate(-13deg)",
              background: `linear-gradient(90deg, transparent, ${t.line} 30%, ${t.line} 70%, transparent)`,
            }}
          />
          <div
            className={styles.atmosLine}
            style={{
              top: "calc(34% + 26px)",
              left: "-20%",
              width: "140%",
              transform: "rotate(-13deg)",
              background: `linear-gradient(90deg, transparent, ${t.lineAccent} 42%, transparent 68%)`,
            }}
          />
        </>
      ) : null}

      {/* --- watermark ----------------------------------------------------- */}
      {/* Grain goes LAST: it must lie over the aurora, because half its job is
          breaking up the banding those big soft gradients produce. */}
      {grain ? (
        <div className={styles.atmosGrain} style={{ opacity: t.grain }} />
      ) : null}

      {watermark ? (
        <div
          className={styles.atmosMark}
          style={{
            right: "-6%",
            bottom: "-14%",
            transform: "rotate(-8deg)",
            ...watermarkStyle,
          }}
        >
          <PlaneMark body={t.markBody} lines={t.markLines} size={520} />
        </div>
      ) : null}
    </div>
  );
}
