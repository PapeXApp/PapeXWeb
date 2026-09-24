"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type Ref,
  type RefObject,
} from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { problemContent, type ProblemCardId } from "./content";
import { PROBLEM_SOURCE_URLS } from "./problemSources";
import styles from "./flipcards.module.css";

/**
 * The Problem section's three tap-to-flip cards. Each back runs a short scripted
 * scene (SVG + CSS keyframes, timed by mount), then the scene DOCKS: it shrinks
 * into a short, wide strip that settles in the gap under the caption, while the
 * stat, rule and caption rise in at the top. The revealed card is filled top to
 * bottom: label row → stat → caption → docked scene → linked source.
 *
 * Sequence: tap → 360ms flip → scene → dock (750ms clip + transform) with the
 * text rising in → stat counts. Flip back keeps the docked layout while the card
 * turns away, then resets. Reduced motion branches in JS: instant flip, the scene
 * mounts already docked on its last frame, no count.
 *
 * Structure: the card is a <div>, not a <button>, because the back face holds a
 * real link (the source) and a link inside a button is invalid HTML. Each face
 * has its own full-bleed flip <button> underneath its content; the hidden face
 * is `inert`, and focus hops to the other face's button after a keyboard flip.
 *
 * Illustration system (front plates + back scenes share it): flat vector. One
 * light direction (top-left), every volume is ONE lit tone + ONE shade tone with
 * a hard edge (the `split` gradients in Defs), every silhouette carries the same
 * 1px navy ink line (INK — strokes are non-scaling, so 1px on every card at every
 * size), contact shadows are flat ellipses. No glows, blurs, halos or motion
 * trails. Brand orange is the ONE accent per card (printer LED / axe head / till
 * total). Motion is CSS transform/opacity only. Gradient/clip ids are prefixed
 * per card + useId.
 */

type Card = (typeof problemContent.cards)[number];

/** Mono label word per card — "[01] Paper". Presentation only, so it lives here, not in content.ts. */
const LABEL: Record<ProblemCardId, string> = { print: "Paper", forest: "Forest", proof: "Cost" };

/** Wait for the flip to expose the back face before the scene mounts. */
const FLIP_TO_SCENE_MS = 360;
/** Matches .inner's rotateY transition — the back stays intact until it has turned away. */
const FLIP_BACK_MS = 800;
const COUNT_MS = 1200;

/** Every scene is drawn in this view box. */
const VB_W = 280;
const VB_H = 320;

/**
 * The part of each scene that is kept in the docked strip, in view-box units
 * [x, y, w, h]. The strip is wide and short, so the region is scaled to the
 * strip's HEIGHT and centred; the scenery bleeds out sideways to fill the width.
 */
const DOCK_FOCUS: Record<ProblemCardId, [number, number, number, number]> = {
  print: [10, 84, 260, 214],
  forest: [0, 176, 280, 118],
  proof: [0, 84, 280, 200],
};

const r1 = (n: number) => Math.round(n * 10) / 10;
const px = (n: number) => `${r1(n)}px`;
const rad = (deg: number) => (deg * Math.PI) / 180;
/** Rotate a point like CSS/SVG rotate(deg) does in y-down space. */
const rot = (x: number, y: number, deg: number): [number, number] => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [x * c - y * s, x * s + y * c];
};

// ---------------------------------------------------------------------------
// palette + shared gradients
// ---------------------------------------------------------------------------
const NAVY = "#00121D";
const ORANGE = "#EB7100";
/** Flat contact shadow — one tone everywhere. */
const SHADOW = "rgba(0,18,29,0.13)";
const SHADOW_SOFT = "rgba(0,18,29,0.07)";
/** The one outline every silhouette wears. */
const INK = { stroke: NAVY, strokeOpacity: 0.34, strokeWidth: 1 } as const;
/** Detail lines (grain, seams, print rows) — same weight, lighter. */
const DETAIL = { strokeWidth: 1, fill: "none" } as const;

type Ids = { id: (name: string) => string; url: (name: string) => string };
type U = Ids["url"];

function useSvgIds(prefix: string): Ids {
  const base = `fc-${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return { id: (n) => `${base}-${n}`, url: (n) => `url(#${base}-${n})` };
}

type Stop = [number, string, number?];
type Vec = [number, number, number, number];

/** Left→right lit/shade split (light from the left). */
const H: Vec = [0, 0, 1, 0];
/** Top→bottom lit/shade split (light from above). */
const V: Vec = [0, 0, 0, 1];

function Defs({ ids, children }: { ids: Ids; children?: ReactElement | ReactElement[] }) {
  const lin = (name: string, stops: Stop[], v: Vec = V) => (
    <linearGradient id={ids.id(name)} x1={v[0]} y1={v[1]} x2={v[2]} y2={v[3]}>
      {stops.map(([o, c, a = 1], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={a} />
      ))}
    </linearGradient>
  );
  /** One lit tone, one shade tone, a hard edge between them. */
  const split = (name: string, lit: string, shade: string, at = 0.5, v: Vec = H) =>
    lin(name, [[0, lit], [at, lit], [at, shade], [1, shade]], v);
  return (
    <defs>
      {/* outdoors — the sky and ground are the only soft ramps: they're light, not objects */}
      {lin("sky", [[0, "#D9E8EC"], [1, "#F4F0E6"]])}
      {lin("grass", [[0, "#A3CD85"], [1, "#78AE5F"]])}
      {split("pine", "#63AB68", "#377F4E", 0.5)}
      {split("leaf", "#72B86C", "#468F55", 0.52, [0, 0, 1, 1])}
      {split("bark", "#8E5E36", "#643F24", 0.5)}
      {/* the axe */}
      {split("wood", "#DDA468", "#B07440", 0.5)}
      {split("paint", ORANGE, "#C45E00", 0.56, V)}
      {/* indoors: wall + counter */}
      {lin("wall", [[0, "#E4EAEE"], [1, "#F1EEE8"]])}
      {/* paper */}
      {split("paper", "#FFFFFF", "#EEF1F3", 0.72, V)}
      {split("paperSide", "#FFFFFF", "#EEF1F3", 0.7)}
      {split("roll", "#FFFFFF", "#E1E6EA", 0.55, V)}
      {/* printer */}
      {split("printerTop", "#5A6772", "#46525D", 0.5, V)}
      {split("printerFront", "#35424D", "#27323B", 0.5, H)}
      {/* till */}
      {split("tillTop", "#F4F6F8", "#DCE2E6", 0.5, V)}
      {split("drawer", "#C9D0D6", "#AAB4BC", 0.5, V)}
      {split("steel", "#DCE2E7", "#A1ACB6", 0.5)}
      <>{children}</>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// shared scenery
// ---------------------------------------------------------------------------

/** Wall + counter slab. Bleeds far past the viewBox so letterboxing never shows. */
function Counter({ u, back, front }: { u: U; back: number; front: number }) {
  return (
    <g>
      <rect x="-300" y="-300" width="900" height={back + 300} fill={u("wall")} />
      <rect x="-300" y={back} width="900" height={front - back} fill="#ECE4D6" />
      <path d={`M-300 ${back}H600`} stroke={NAVY} strokeOpacity={0.12} strokeWidth={1} />
      <rect x="-300" y={front} width="900" height="400" fill="#BFAE95" />
      <path d={`M-300 ${front}H600`} stroke="#F8F3EA" strokeWidth={1} />
    </g>
  );
}

/** Sky, sun, two hill planes and the grass field — the forest's world. */
function Outdoors({ u, horizon, sun }: { u: U; horizon: number; sun: [number, number, number] }) {
  const h = horizon;
  return (
    <g>
      <rect x="-300" y="-300" width="900" height="900" fill={u("sky")} />
      <circle cx={sun[0]} cy={sun[1]} r={sun[2]} fill="#FFF3D6" />
      <path
        d={`M-300 ${h - 18}C-60 ${h - 40} 20 ${h - 52} 90 ${h - 34}S200 ${h - 56} 270 ${h - 40}S420 ${h - 44} 600 ${h - 30}V${h + 40}H-300Z`}
        fill="#CFE1D6"
      />
      <path
        d={`M-300 ${h}C-40 ${h - 22} 40 ${h - 30} 120 ${h - 14}S240 ${h - 26} 320 ${h - 16}S440 ${h - 12} 600 ${h - 6}V${h + 60}H-300Z`}
        fill="#B5D3AB"
      />
      <path d={`M-300 ${h + 8}C0 ${h - 6} 180 ${h - 8} 600 ${h + 4}V900H-300Z`} fill={u("grass")} />
    </g>
  );
}

function GrassTufts({ tufts }: { tufts: [number, number, number][] }) {
  const d = tufts
    .map(
      ([x, y, s]) =>
        `M${x} ${y}q${r1(-1.5 * s)} ${r1(-4 * s)} ${r1(-3.5 * s)} ${r1(-5.5 * s)}M${x} ${y}q${r1(0.4 * s)} ${r1(-5 * s)} ${r1(0.2 * s)} ${r1(-7.5 * s)}M${x} ${y}q${r1(1.8 * s)} ${r1(-3.6 * s)} ${r1(4 * s)} ${r1(-5 * s)}`,
    )
    .join("");
  return <path d={d} stroke="#4E8A45" strokeOpacity={0.7} {...DETAIL} />;
}

// ---------------------------------------------------------------------------
// trees — drawn with the cut point (top of the stump) at 0,0, growing up
// ---------------------------------------------------------------------------
type TreeKind = "pine" | "round";
const STUMP_H = 7;
/** Trunk half-width at the cut, tree-local. */
const TRUNK_HALF = 4;

function tierPath(top: number, bot: number, w: number) {
  const h = bot - top;
  return (
    `M0 ${r1(top)}C${r1(w * 0.1)} ${r1(top + h * 0.3)} ${r1(w * 0.3)} ${r1(bot - h * 0.2)} ${r1(w / 2)} ${r1(bot)}` +
    `Q0 ${r1(bot + h * 0.16)} ${r1(-w / 2)} ${r1(bot)}` +
    `C${r1(-w * 0.3)} ${r1(bot - h * 0.2)} ${r1(-w * 0.1)} ${r1(top + h * 0.3)} 0 ${r1(top)}Z`
  );
}

function pineTiers(h: number) {
  const H = h - STUMP_H;
  const W = h * 0.56;
  const yb = -H * 0.16;
  const span = -H - yb;
  return [
    { bot: yb, top: yb + span * 0.62, w: W },
    { bot: yb + span * 0.3, top: yb + span * 0.85, w: W * 0.78 },
    { bot: yb + span * 0.56, top: -H, w: W * 0.56 },
  ].map((t) => ({ ...t, d: tierPath(t.top, t.bot, t.w) }));
}

function roundBlobs(h: number): [number, number, number][] {
  const H = h - STUMP_H;
  return [
    [-H * 0.2, -H * 0.5, H * 0.2],
    [H * 0.21, -H * 0.53, H * 0.19],
    [0, -H * 0.66, H * 0.27],
    [H * 0.05, -H * 0.86, H * 0.17],
  ];
}

/** The tree above the cut. `haze` (0..1) veils it toward the sky colour — atmospheric depth. */
function Tree({ kind, h, u, haze = 0 }: { kind: TreeKind; h: number; u: U; haze?: number }) {
  const H = h - STUMP_H;
  const veil = haze > 0 ? r1(haze * 100) / 100 : 0;
  if (kind === "pine") {
    const tiers = pineTiers(h);
    return (
      <g>
        <path d={`M${-TRUNK_HALF} 0.5L-2.4 ${r1(-H * 0.5)}H2.4L${TRUNK_HALF} 0.5Z`} fill={u("bark")} {...INK} />
        {tiers.map((t, i) => (
          <path key={i} d={t.d} fill={u("pine")} {...INK} />
        ))}
        {veil > 0 && <path d={tiers.map((t) => t.d).join("")} fill="#E4EEEE" opacity={veil} />}
      </g>
    );
  }
  const blobs = roundBlobs(h);
  return (
    <g>
      <path d={`M${-TRUNK_HALF} 0.5L-2.6 ${r1(-H * 0.56)}H2.6L${TRUNK_HALF} 0.5Z`} fill={u("bark")} {...INK} />
      <path d={`M0.5 ${r1(-H * 0.36)}L${r1(H * 0.13)} ${r1(-H * 0.5)}`} stroke="#643F24" strokeWidth={1.5} fill="none" />
      {blobs.map(([cx, cy, r], i) => (
        <circle key={i} cx={r1(cx)} cy={r1(cy)} r={r1(r)} fill={u("leaf")} {...INK} />
      ))}
      {veil > 0 && (
        <g fill="#E4EEEE" opacity={veil}>
          {blobs.map(([cx, cy, r], i) => (
            <circle key={i} cx={r1(cx)} cy={r1(cy)} r={r1(r)} />
          ))}
        </g>
      )}
    </g>
  );
}

/** Stump sitting on the ground at 0,0 — bark sides, root flare, a cut face with rings. */
function Stump({ u }: { u: U }) {
  const s = STUMP_H;
  return (
    <g>
      <path d={`M-4.4 ${-s}V-1.2Q-4.6 0.6 -7.2 1.2H7.2Q4.6 0.6 4.4 -1.2V${-s}Z`} fill={u("bark")} {...INK} />
      <ellipse cx="0" cy={-s} rx="4.4" ry="1.7" fill="#EECE98" {...INK} />
      <ellipse cx="-0.2" cy={-s} rx="2.4" ry="0.9" stroke="#C39158" {...DETAIL} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// the axe — a classic felling axe in strict side profile. Grip (the knob end of
// the haft) at 0,0; the haft rises straight up (-y); the steel head sits on TOP
// of the haft; the poll faces -x and the cutting edge faces +x. Rotating it
// clockwise (+deg) swings the head forward and down into whatever is at +x.
// ---------------------------------------------------------------------------
const AXE_L = 96;
/** The middle of the cutting edge, axe-local. */
const AXE_EDGE: [number, number] = [26.5, -AXE_L + 1.8];

function Axe({ u }: { u: U }) {
  const T = -AXE_L; // where the haft passes through the eye
  return (
    <g>
      {/* haft — hickory, a swell at the knob, slimmer through the throat */}
      <path
        d={`M-3.2 3Q0 5.4 3.4 2.8L3.5 -2.6C2.5 -8 2.3 -24 2.4 -44C2.5 -64 2.7 ${T + 22} 2.6 ${T - 1}H-2.6C-2.5 ${T + 22} -2.3 -64 -2.2 -44C-2.1 -24 -2.3 -8 -3.4 -2.6Z`}
        fill={u("wood")}
        {...INK}
      />
      <path d={`M-0.4 -12C-0.2 -40 -0.7 -64 -0.3 ${T + 16}`} stroke="#8A5A2E" strokeOpacity={0.4} {...DETAIL} />
      {/* head: flat poll · eye · neck · flared bit, painted, with a ground steel edge */}
      <path
        d={`M-7.5 ${T - 7}H4C8 ${T - 7} 11 ${T - 5.6} 13.5 ${T - 5}C17 ${T - 6} 21 ${T - 8.5} 24 ${T - 12}Q29 ${T + 1.5} 24 ${T + 16}C20.5 ${T + 12.5} 17 ${T + 8.5} 13.5 ${T + 7}C11 ${T + 6.6} 8 ${T + 8.5} 4 ${T + 9}H-7.5Z`}
        fill={u("paint")}
        {...INK}
      />
      <path
        d={`M24 ${T - 12}Q29 ${T + 1.5} 24 ${T + 16}L19.6 ${T + 11.4}Q23.4 ${T + 1.5} 19.8 ${T - 7.8}Z`}
        fill="#DCE2E7"
      />
      <path d={`M24.7 ${T - 10.4}Q28.4 ${T + 1.5} 24.7 ${T + 14.2}`} stroke="#FFFFFF" {...DETAIL} />
      <path d={`M-7.5 ${T - 7}H-4.6V${T + 9}H-7.5Z`} fill="#8E99A3" {...INK} />
      {/* the haft's end showing through the top of the eye, wedged */}
      <path d={`M-2.6 ${T - 7}V${T - 9.6}H2.6V${T - 7}Z`} fill="#E6C28C" {...INK} />
      <path d={`M0 ${T - 9.6}V${T - 7}`} stroke="#8A5A2E" strokeOpacity={0.6} {...DETAIL} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// the receipt printer — base centre at 0,0; slot line at y = PRINTER_SLOT_Y
// ---------------------------------------------------------------------------
const PRINTER_SLOT_Y = -50;
const PRINTER_WINDOW_D = "M-48 -88H48L51 -70H-51Z";

function Printer({
  u,
  ids,
  rollClass,
  rollStyle,
  ledOn,
}: {
  u: U;
  ids: Ids;
  rollClass?: string;
  rollStyle?: CSSProperties;
  ledOn?: { className: string; style: CSSProperties };
}) {
  return (
    <g>
      <ellipse cx="8" cy="1" rx="76" ry="5" fill={SHADOW} />
      <path d="M-52 -92H52Q59 -92 60.5 -86L64.5 -58H-64.5L-60.5 -86Q-59 -92 -52 -92Z" fill={u("printerTop")} {...INK} />
      <clipPath id={ids.id("window")}>
        <path d={PRINTER_WINDOW_D} />
      </clipPath>
      <path d={PRINTER_WINDOW_D} fill="#141E26" />
      <g clipPath={u("window")}>
        <g className={rollClass} style={rollStyle}>
          <rect x="-42" y="-87" width="84" height="16" rx="8" fill={u("roll")} />
          <ellipse cx="-42" cy="-79" rx="3.2" ry="8" fill="#ECEFF1" />
          <ellipse cx="-42" cy="-79" rx="1.3" ry="3.1" fill="#B98A57" />
        </g>
      </g>
      <path d={PRINTER_WINDOW_D} fill="#9FB4C2" fillOpacity={0.22} />
      <path d="M-30 -88H-20L-26 -70H-36Z" fill="#FFFFFF" opacity={0.16} />
      <path d={PRINTER_WINDOW_D} stroke="#7A8996" {...DETAIL} />
      <rect x="-64" y="-58" width="128" height="58" rx="7" fill={u("printerFront")} {...INK} />
      <rect x="-41" y="-52" width="82" height="3.6" rx="1.8" fill="#070C10" />
      <path d="M-54 -12H-38M-54 -8H-38M-54 -4H-38" stroke="#161F26" {...DETAIL} />
      <circle cx="-46" cy="-24" r="4" fill="#A1ACB6" {...INK} />
      <circle cx="47" cy="-24" r="3.6" fill="#0A1014" />
      <circle cx="47" cy="-24" r="1.8" fill="#6FCF8C" />
      {ledOn && (
        <g className={ledOn.className} style={ledOn.style}>
          <circle cx="47" cy="-24" r="6.5" stroke={ORANGE} strokeOpacity={0.55} {...DETAIL} />
          <circle cx="47" cy="-24" r="2.4" fill={ORANGE} />
        </g>
      )}
      <rect x="-60" y="-1.5" width="12" height="3" rx="1.2" fill="#0A0F13" />
      <rect x="48" y="-1.5" width="12" height="3" rx="1.2" fill="#0A0F13" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// a receipt slip — top centre at 0,0, 46 × 60, bottom edge curling toward you
// ---------------------------------------------------------------------------
const SLIP_BODY_D = `M-23 0H23V53C23 56 -23 56 -23 53Z`;
const SLIP_ROWS = "M-16 16H3M11 16H16M-16 22H-3M11 22H16M-16 28H6M11 28H16";
const SLIP_BARS = "M-10 44V49M-8.4 44V49M-5.6 44V49M-4 44V49M-1.2 44V49M1.6 44V49M3 44V49M6 44V49M8.4 44V49M10 44V49";

function Slip({ u }: { u: U }) {
  return (
    <g>
      <path d={SLIP_BODY_D} transform="translate(2 3)" fill={SHADOW} />
      <path d={SLIP_BODY_D} fill={u("paper")} {...INK} />
      <path d="M-23 53C-23 60 23 60 23 53C23 50 -23 50 -23 53Z" fill="#DCE2E7" {...INK} />
      <path d="M-9 8H9" stroke={NAVY} strokeWidth={1.5} />
      <path d={SLIP_ROWS} stroke="#97A3AE" {...DETAIL} />
      <path d="M-16 34H16" stroke="#B8C1C8" strokeDasharray="2 2" {...DETAIL} />
      <path d="M-16 40H-4M8 40H16" stroke={NAVY} strokeWidth={1.5} />
      <path d={SLIP_BARS} stroke="#5C6873" {...DETAIL} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// the paper roll — left end-cap centre at 0,0, 80 long, radius 22
// ---------------------------------------------------------------------------
function Roll({ u }: { u: U }) {
  return (
    <g>
      <path d="M0 -22H80A8 22 0 0 1 80 22H0Z" fill={u("roll")} {...INK} />
      <ellipse cx="0" cy="0" rx="8" ry="22" fill="#F4F2EC" {...INK} />
      <ellipse cx="0" cy="0" rx="5.4" ry="15" stroke="#DCE1E5" {...DETAIL} />
      <ellipse cx="0" cy="0" rx="3" ry="8" fill="#C39561" {...INK} />
      <ellipse cx="0.2" cy="0" rx="1.5" ry="4.2" fill="#5B4632" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// the till — base centre at 0,0; a lit display on a neck, sloped keypad, drawer
// ---------------------------------------------------------------------------
const TILL_KEYS = (() => {
  const out: { x: number; y: number; w: number; dark: boolean }[] = [];
  [-91, -81.5, -72].forEach((y, row) => {
    const left = -44 - (y + 96) * (8 / 36) + 5;
    const width = -2 * left;
    const gap = 3.5;
    const w = (width - gap * 3) / 4;
    for (let c = 0; c < 4; c++) out.push({ x: left + c * (w + gap), y, w, dark: row === 2 && c === 3 });
  });
  return out;
})();

function Till({ u, total, totalRef }: { u: U; total: string; totalRef?: Ref<SVGTextElement> }) {
  return (
    <g>
      <ellipse cx="8" cy="1" rx="66" ry="4.6" fill={SHADOW} />
      <rect x="-56" y="-34" width="112" height="34" rx="4" fill={u("drawer")} {...INK} />
      <rect x="-14" y="-22" width="28" height="3.2" rx="1.6" fill="#66727D" />
      <rect x="-52" y="-60" width="104" height="27" fill="#C2CAD1" {...INK} />
      <path d="M-44 -96H44L52 -60H-52Z" fill={u("tillTop")} {...INK} />
      {TILL_KEYS.map((k, i) => (
        <g key={i}>
          <rect x={r1(k.x)} y={k.y + 1.6} width={r1(k.w)} height="7" rx="1.8" fill={k.dark ? "#0B141A" : "#AEB8C1"} />
          <rect x={r1(k.x)} y={k.y} width={r1(k.w)} height="7" rx="1.8" fill={k.dark ? "#26323D" : "#FFFFFF"} />
        </g>
      ))}
      <rect x="-6" y="-126" width="12" height="32" fill={u("steel")} {...INK} />
      <rect x="-52" y="-170" width="104" height="48" rx="6" fill="#1F2A34" {...INK} />
      <rect x="-46" y="-164" width="92" height="36" rx="3" fill="#07121A" />
      <text x="-38" y="-151" className={styles.tillLabel}>
        TOTAL
      </text>
      <text x="-38" y="-135" ref={totalRef} className={styles.tillTotal}>
        {total}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// card "print" — a printer spits slips faster and faster (220ms → 36ms); they
// curl out, drop and pile up on the counter until the roll runs out
// ---------------------------------------------------------------------------
const SLIP_COUNT = 20;
const PRINT_SLIPS = (() => {
  const out: { delay: number; dx: number; dy: number; rot: number; s: number }[] = [];
  let t = 0;
  for (let k = 0; k < SLIP_COUNT; k++) {
    t += 220 - 184 * (k / (SLIP_COUNT - 1));
    const sign = k % 2 ? 1 : -1;
    out.push({
      delay: Math.round(t),
      dx: sign * (4 + ((k * 13) % 40)),
      dy: 98 + ((k * 29) % 30) - k * 0.7,
      rot: sign * (6 + ((k * 17) % 46)),
      s: 1 + ((k * 7) % 9) / 60,
    });
  }
  return out;
})();
const PAPER_OUT_AT = PRINT_SLIPS[PRINT_SLIPS.length - 1].delay + 260;
const PRINT_DURATION = PAPER_OUT_AT + 900;

const PRINTER_AT: [number, number] = [140, 182];
const COUNTER_BACK = 168;
const COUNTER_FRONT = 298;

function PrintScene() {
  const ids = useSvgIds("print");
  const u = ids.url;
  const slotY = PRINTER_AT[1] + PRINTER_SLOT_Y;
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className={styles.sceneSvg} aria-hidden="true">
      <Defs ids={ids}>
        {/* slips only exist below the slot — nothing peeks over the printer while they wait */}
        <clipPath id={ids.id("slot")}>
          <rect x="-300" y={slotY} width="900" height="700" />
        </clipPath>
      </Defs>
      <Counter u={u} back={COUNTER_BACK} front={COUNTER_FRONT} />
      <g transform={`translate(${PRINTER_AT[0]} ${PRINTER_AT[1]})`}>
        <Printer
          u={u}
          ids={ids}
          rollClass={styles.printRoll}
          rollStyle={{ animationDuration: `${PAPER_OUT_AT}ms` }}
          ledOn={{ className: styles.ledOn, style: { animationDelay: `${PAPER_OUT_AT}ms` } }}
        />
      </g>
      <g clipPath={u("slot")}>
        <g transform={`translate(${PRINTER_AT[0]} ${slotY})`}>
          {PRINT_SLIPS.map((s, i) => (
            <g
              key={i}
              className={styles.slip}
              style={
                {
                  "--dx": px(s.dx),
                  "--dy": px(s.dy),
                  "--rot": `${s.rot}deg`,
                  "--sx": s.s.toFixed(3),
                  "--sy": (s.s * 0.6).toFixed(3),
                  animationDelay: `${s.delay}ms`,
                } as CSSProperties
              }
            >
              <Slip u={u} />
            </g>
          ))}
        </g>
      </g>
      <text x="140" y="76" textAnchor="middle" className={styles.paperOut} style={{ animationDelay: `${PAPER_OUT_AT}ms` }}>
        PAPER OUT
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// card "forest" — the nearest tree is felled the way a person does it: the axe
// winds back and bites into the trunk three times, chips fly back out of the
// notch, and on the third blow the tree tips over, away from the cut. Then the
// rest of the stand goes down in turn, leaving a field of stumps.
// ---------------------------------------------------------------------------

/** The tree being chopped: base at (x, base), drawn at `s` × the stand's scale. */
const FT = { x: 106, base: 284, s: 1.9, h: 80 };
/** Its cut point (top of the stump), in view-box units. */
const FT_CUT: [number, number] = [FT.x, FT.base - STUMP_H * FT.s];
/** Where the middle of the edge stops: just inside the trunk's left face, a notch above the stump. */
const FT_BITE: [number, number] = [FT.x - TRUNK_HALF * FT.s + 2.4, FT_CUT[1] - 1.4 * FT.s];

/** The rest of the stand, far → near (draw order). */
const STAND: { x: number; base: number; s: number; h: number; kind: TreeKind }[] = [
  { x: 30, base: 222, s: 0.62, h: 96, kind: "pine" },
  { x: 268, base: 224, s: 0.6, h: 102, kind: "pine" },
  { x: 228, base: 230, s: 0.68, h: 110, kind: "round" },
  { x: 176, base: 236, s: 0.76, h: 112, kind: "pine" },
  { x: 250, base: 242, s: 0.74, h: 94, kind: "pine" },
  { x: 204, base: 246, s: 0.8, h: 92, kind: "pine" },
  { x: 150, base: 252, s: 0.86, h: 104, kind: "round" },
];
const GROW_STAGGER = 55;

// The axe's timeline (ms from its own start) — .axe's keyframe percentages in
// flipcards.module.css are these over AXE_MS. Three blows, each: wind back, swing
// (ease-in, it accelerates), bite and hold, pull out.
const AXE_START = 420;
const AXE_MS = 1800;
const AXE_IMPACTS = [600, 1080, 1560];
const FALL_AT = AXE_START + AXE_IMPACTS[2] + 40;
const CASCADE_AT = FALL_AT + 520;
const CASCADE_STAGGER = 95;
const FALL_MS = 1000;
const FOREST_DURATION = CASCADE_AT + (STAND.length - 1) * CASCADE_STAGGER + FALL_MS - 120;

const AXE_SCALE = 0.55;
const AXE_BITE_DEG = 32;
/** Grip position that puts the middle of the edge exactly at (bx, by) at `deg`. */
const gripFor = (bx: number, by: number, deg: number): [number, number] => {
  const [ox, oy] = rot(AXE_EDGE[0] * AXE_SCALE, AXE_EDGE[1] * AXE_SCALE, deg);
  return [bx - ox, by - oy];
};
const AXE_GRIP = gripFor(FT_BITE[0], FT_BITE[1], AXE_BITE_DEG);
const AXE_VARS = {
  "--gx": px(AXE_GRIP[0]),
  "--gy": px(AXE_GRIP[1]),
  // the hands draw back and up a little on the wind-up, and leave to the left
  "--wx": px(AXE_GRIP[0] - 9),
  "--wy": px(AXE_GRIP[1] - 7),
  "--ox": px(AXE_GRIP[0] - 26),
  "--oy": px(AXE_GRIP[1] - 4),
  "--r-bite": `${AXE_BITE_DEG}deg`,
  "--r-wind": "-50deg",
  "--r-back": "-62deg",
  "--r-out": "-24deg",
  animationDelay: `${AXE_START}ms`,
  animationDuration: `${AXE_MS}ms`,
} as CSSProperties;

/** The notch after each blow: a wedge of fresh wood cut into the trunk's left face. */
const NOTCHES = [
  [2.4, 1.8],
  [4.6, 3.1],
  [7, 4.4],
].map(([depth, half], i) => {
  const x0 = FT.x - TRUNK_HALF * FT.s;
  const y = FT_BITE[1];
  return {
    d: `M${r1(x0)} ${r1(y - half)}L${r1(x0 + depth)} ${r1(y)}L${r1(x0)} ${r1(y + half)}Z`,
    at: AXE_START + AXE_IMPACTS[i],
  };
});

/** Chips fly back out of the notch toward the axe, arc, and land. */
const CHIPS = [
  { mx: -8, my: -12, ex: -15, ey: 10, r: 220, c: "#EBC894" },
  { mx: -13, my: -6, ex: -22, ey: 12, r: -170, c: "#C9955A" },
  { mx: -4, my: -15, ex: -9, ey: 9, r: 300, c: "#F2D4A2" },
  { mx: -10, my: -10, ex: -18, ey: 11, r: -200, c: "#B9844C" },
];

const FOREST_TUFTS: [number, number, number][] = [
  [14, 302, 1.2],
  [44, 312, 1],
  [150, 306, 1.3],
  [206, 296, 1],
  [254, 306, 1.2],
  [124, 272, 0.8],
  [232, 264, 0.7],
];

function Chips({ at, x, y }: { at: number; x: number; y: number }) {
  return (
    <g transform={`translate(${r1(x)} ${r1(y)})`}>
      {CHIPS.map((c, i) => (
        <path
          key={i}
          d="M-1.8 -1.1L2 -0.8L1.3 1.2L-1.5 1Z"
          fill={c.c}
          className={styles.chip}
          style={
            {
              "--cmx": px(c.mx),
              "--cmy": px(c.my),
              "--cex": px(c.ex),
              "--cey": px(c.ey),
              "--cr": `${c.r}deg`,
              animationDelay: `${at}ms`,
            } as CSSProperties
          }
        />
      ))}
    </g>
  );
}

/** One tree on its stump: grows in at `grow`, falls over (away to the right) at `fall`. */
function StandTree({
  u,
  x,
  base,
  s,
  h,
  kind,
  haze,
  grow,
  fall,
}: {
  u: U;
  x: number;
  base: number;
  s: number;
  h: number;
  kind: TreeKind;
  haze: number;
  grow: number;
  fall: number;
}) {
  return (
    <g transform={`translate(${r1(x)} ${r1(base)}) scale(${r1(s * 100) / 100})`}>
      <g className={styles.treeGrow} style={{ animationDelay: `${grow}ms` }}>
        <ellipse
          cx={r1(h * 0.3)}
          cy="0.6"
          rx={r1(h * 0.36)}
          ry="3.2"
          fill={SHADOW}
          className={styles.treeShadow}
          style={{ animationDelay: `${fall}ms` }}
        />
        <Stump u={u} />
        <g transform={`translate(0 ${-STUMP_H})`}>
          <g className={styles.treeFell} style={{ animationDelay: `${fall}ms` }}>
            <Tree kind={kind} h={h} u={u} haze={haze} />
          </g>
        </g>
      </g>
    </g>
  );
}

function ForestScene() {
  const ids = useSvgIds("forest");
  const u = ids.url;
  // the stand falls left → right after the big tree
  const order = [...STAND].sort((a, b) => a.x - b.x);
  const fallFor = (x: number) => CASCADE_AT + order.findIndex((t) => t.x === x) * CASCADE_STAGGER;
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className={styles.sceneSvg} aria-hidden="true">
      <Defs ids={ids} />
      <Outdoors u={u} horizon={204} sun={[214, 72, 14]} />
      {STAND.map((t, i) => {
        const fall = fallFor(t.x);
        return (
          <g key={t.x}>
            <StandTree
              u={u}
              {...t}
              haze={Math.max(0, (0.9 - t.s) * 1.3)}
              grow={(i + 1) * GROW_STAGGER}
              fall={fall}
            />
            <Chips at={fall} x={t.x - TRUNK_HALF * t.s} y={t.base - STUMP_H * t.s - 1} />
          </g>
        );
      })}
      <StandTree u={u} x={FT.x} base={FT.base} s={FT.s} h={FT.h} kind="round" haze={0} grow={0} fall={FALL_AT} />
      {NOTCHES.map((n, i) => (
        <path
          key={i}
          d={n.d}
          fill="#EFCF98"
          {...INK}
          className={styles.notch}
          style={{ animationDelay: `${n.at}ms`, animationDuration: `${FALL_AT - n.at + 60}ms` }}
        />
      ))}
      <GrassTufts tufts={FOREST_TUFTS} />
      {AXE_IMPACTS.map((t) => (
        <Chips key={t} at={AXE_START + t} x={FT_BITE[0] - 2} y={FT_BITE[1]} />
      ))}
      <g className={styles.axe} style={AXE_VARS}>
        <g transform={`scale(${AXE_SCALE})`}>
          <Axe u={u} />
        </g>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// card "proof" — "What do businesses pay?": a roll unspools while the till total climbs
// ---------------------------------------------------------------------------
const COST_FEED_MS = 2500;
const COST_TICK_TARGET = 540_000_000;
const COST_DURATION = COST_FEED_MS + 500;
const formatTotal = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

const ROLL_AT: [number, number] = [56, 58];
const STRIP_X = 62;
const STRIP_W = 60;
const STRIP_L = 560;
const STRIP_END = ROLL_AT[1] + 24; // lead edge starts tucked under the roll
const STRIP_D = (() => {
  let d = `M${STRIP_X} ${STRIP_END - STRIP_L}H${STRIP_X + STRIP_W}V${STRIP_END}`;
  const teeth = 8;
  for (let i = 0; i < teeth; i++) d += `l${-STRIP_W / teeth / 2} 3l${-STRIP_W / teeth / 2} -3`;
  return `${d}Z`;
})();
const STRIP_ROWS = Array.from({ length: 44 }, (_, j) => {
  const y = STRIP_END - 16 - j * 12;
  const len = 14 + ((j * 13) % 20);
  const price = 7 + ((j * 5) % 7);
  return `M${STRIP_X + 7} ${y}H${STRIP_X + 7 + len}M${STRIP_X + 53 - price} ${y}H${STRIP_X + 53}`;
}).join("");
const TILL_AT: [number, number] = [210, 274];

function CostScene({ still }: { still: boolean }) {
  const ids = useSvgIds("proof");
  const u = ids.url;
  const total = useRef<SVGTextElement>(null);

  useEffect(() => {
    if (still) {
      if (total.current) total.current.textContent = formatTotal(COST_TICK_TARGET);
      return;
    }
    let raf = 0;
    const start = performance.now() + 200;
    const span = COST_FEED_MS - 300;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / span));
      const v = COST_TICK_TARGET * p * p * p; // ease-in: spend accelerates with the feed
      if (total.current) total.current.textContent = formatTotal(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [still]);

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className={styles.sceneSvg} aria-hidden="true">
      <Defs ids={ids}>
        <clipPath id={ids.id("feed")}>
          <rect x="-300" y={ROLL_AT[1] + 12} width="900" height="700" />
        </clipPath>
      </Defs>
      <Counter u={u} back={COUNTER_BACK} front={COUNTER_FRONT} />
      {/* wall bracket + the roll's flat shadow on the wall */}
      <ellipse cx="100" cy="88" rx="52" ry="6" fill={SHADOW_SOFT} />
      <rect x="38" y="42" width="7" height="32" rx="2" fill={u("steel")} {...INK} />
      <rect x="44" y="56.6" width="13" height="2.8" fill="#8894A0" />
      <g clipPath={u("feed")}>
        <g className={styles.feed} style={{ animationDuration: `${COST_FEED_MS}ms` }}>
          <path d={STRIP_D} transform="translate(5 3)" fill={SHADOW_SOFT} />
          <path d={STRIP_D} fill={u("paperSide")} {...INK} />
          <path d={STRIP_ROWS} stroke="#9AA6B0" {...DETAIL} />
        </g>
      </g>
      {/* the roll, drawn over the strip's root; it thins as it unspools */}
      <g className={styles.roll} style={{ animationDuration: `${COST_FEED_MS}ms` }}>
        <g transform={`translate(${ROLL_AT[0]} ${ROLL_AT[1]})`}>
          <Roll u={u} />
        </g>
      </g>
      <g transform={`translate(${TILL_AT[0]} ${TILL_AT[1]})`}>
        <Till u={u} total="$0" totalRef={total} />
      </g>
    </svg>
  );
}

const SCENES: Record<ProblemCardId, (p: { still: boolean }) => ReactElement> = {
  print: PrintScene,
  forest: ForestScene,
  proof: CostScene,
};
const SCENE_DURATION: Record<ProblemCardId, number> = {
  print: PRINT_DURATION,
  forest: FOREST_DURATION,
  proof: COST_DURATION,
};

// ---------------------------------------------------------------------------
// front illustrations — static hero frames of each scene, same flat language.
// No CSS transforms on the front face (see the CSS header); SVG transform
// attributes are fine.
// ---------------------------------------------------------------------------
function FrontPrint() {
  const ids = useSvgIds("print-front");
  const u = ids.url;
  return (
    <svg viewBox="0 0 200 100" className={styles.artSvg} aria-hidden="true">
      <Defs ids={ids} />
      <Counter u={u} back={54} front={92} />
      {/* two slips already on the counter, lying flat */}
      <g transform="translate(52 70) scale(0.62 0.36) rotate(-24)">
        <Slip u={u} />
      </g>
      <g transform="translate(150 72) scale(0.64 0.38) rotate(30)">
        <Slip u={u} />
      </g>
      <g transform="translate(100 86) scale(0.5)">
        <Printer u={u} ids={ids} />
      </g>
      {/* the slip coming out of the slot, curling forward onto the counter */}
      <path d="M89.5 61.5H110.5V84C110.5 92 89.5 92 89.5 84Z" fill={u("paperSide")} {...INK} />
      <path d="M89.5 84C89.5 94 110.5 94 110.5 84C110.5 80.6 89.5 80.6 89.5 84Z" fill="#DCE2E7" {...INK} />
      <path d="M93 66H101M104 66H107M93 70H99M104 70H107M93 74H102M104 74H107" stroke="#97A3AE" {...DETAIL} />
      <path d="M93 79H98M103 79H107" stroke={NAVY} {...DETAIL} />
    </svg>
  );
}

/** The forest front plate: the scene's third blow — axe bitten into the trunk, notch open. */
function FrontForest() {
  const ids = useSvgIds("forest-front");
  const u = ids.url;
  const t = { x: 88, base: 93, s: 1.05, h: 82 };
  const cutY = t.base - STUMP_H * t.s;
  const x0 = t.x - TRUNK_HALF * t.s;
  const bite: [number, number] = [x0 + 1.5, cutY - 1.4 * t.s];
  const axeScale = 0.36;
  const [ox, oy] = rot(AXE_EDGE[0] * axeScale, AXE_EDGE[1] * axeScale, AXE_BITE_DEG);
  const grip: [number, number] = [bite[0] - ox, bite[1] - oy];
  return (
    <svg viewBox="0 0 200 100" className={styles.artSvg} aria-hidden="true">
      <Defs ids={ids} />
      <Outdoors u={u} horizon={68} sun={[170, 24, 7]} />
      {[
        { x: 128, y: 76, h: 60, kind: "pine" as TreeKind, haze: 0.4, s: 0.7 },
        { x: 176, y: 78, h: 66, kind: "round" as TreeKind, haze: 0.3, s: 0.74 },
        { x: 150, y: 84, h: 70, kind: "pine" as TreeKind, haze: 0.1, s: 0.86 },
        { x: 26, y: 78, h: 58, kind: "pine" as TreeKind, haze: 0.4, s: 0.7 },
      ].map((tr, i) => (
        <g key={i} transform={`translate(${tr.x} ${tr.y}) scale(${tr.s})`}>
          <ellipse cx={r1(tr.h * 0.3)} cy="0.6" rx={r1(tr.h * 0.36)} ry="3" fill={SHADOW} />
          <Stump u={u} />
          <g transform={`translate(0 ${-STUMP_H})`}>
            <Tree kind={tr.kind} h={tr.h} u={u} haze={tr.haze} />
          </g>
        </g>
      ))}
      {/* one already down: a stump in the grass */}
      <g transform="translate(184 92) scale(0.9)">
        <Stump u={u} />
      </g>
      {/* the tree being felled */}
      <g transform={`translate(${t.x} ${t.base}) scale(${t.s})`}>
        <ellipse cx={r1(t.h * 0.3)} cy="0.6" rx={r1(t.h * 0.36)} ry="3" fill={SHADOW} />
        <Stump u={u} />
        <g transform={`translate(0 ${-STUMP_H})`}>
          <Tree kind="round" h={t.h} u={u} />
        </g>
      </g>
      <path
        d={`M${r1(x0)} ${r1(bite[1] - 3.2)}L${r1(x0 + 4.4)} ${r1(bite[1])}L${r1(x0)} ${r1(bite[1] + 3.2)}Z`}
        fill="#EFCF98"
        {...INK}
      />
      <g transform={`translate(${r1(grip[0])} ${r1(grip[1])}) rotate(${AXE_BITE_DEG}) scale(${axeScale})`}>
        <Axe u={u} />
      </g>
      {/* chips thrown back out of the notch */}
      <path d="M72 84l2.6 -0.8l-0.2 1.4ZM66 88l2.4 0.4l-1.2 1.1ZM78 80l2 -0.6l-0.2 1.2ZM60 94l2.6 -0.4l-0.6 1.3Z" fill="#E4BE86" />
      <GrassTufts tufts={[[12, 95, 0.8], [110, 97, 0.9], [196, 96, 0.8], [132, 88, 0.6]]} />
    </svg>
  );
}

function FrontCost() {
  const ids = useSvgIds("proof-front");
  const u = ids.url;
  return (
    <svg viewBox="0 0 200 100" className={styles.artSvg} aria-hidden="true">
      <Defs ids={ids} />
      <Counter u={u} back={54} front={92} />
      <ellipse cx="70" cy="32" rx="28" ry="3.4" fill={SHADOW_SOFT} />
      <rect x="30" y="16" width="4" height="18" rx="1.2" fill={u("steel")} {...INK} />
      <rect x="33" y="24.2" width="7" height="1.6" fill="#8894A0" />
      {/* strip runs from the roll down to the counter and loops over */}
      <path d="M43 36H74V78C74 88 60 90 50 88C43 86 43 82 43 78Z" fill={SHADOW_SOFT} transform="translate(3 2)" />
      <path d="M43 36H74V80H43Z" fill={u("paperSide")} {...INK} />
      <path d="M43 80C43 92 74 92 74 80C74 76.5 43 76.5 43 80Z" fill="#DCE2E7" {...INK} />
      <path d="M47 44H58M66 44H70M47 50H56M66 50H70M47 56H60M66 56H70M47 62H55M66 62H70M47 68H59M66 68H70" stroke="#9AA6B0" {...DETAIL} />
      <g transform="translate(40 25) scale(0.55)">
        <Roll u={u} />
      </g>
      <g transform="translate(140 94) scale(0.5)">
        <Till u={u} total="$0.00" />
      </g>
    </svg>
  );
}

const FRONT_ART: Record<ProblemCardId, () => ReactElement> = { print: FrontPrint, forest: FrontForest, proof: FrontCost };

function FrontArt({ id }: { id: ProblemCardId }) {
  const Art = FRONT_ART[id];
  return <Art />;
}

function FlipGlyph() {
  return (
    <span className={styles.glyph} aria-hidden="true">
      <svg viewBox="0 0 14 14">
        <path d="M2 4.5H11.5M9 2l2.5 2.5L9 7M12 9.5H2.5M5 7l-2.5 2.5L5 12" />
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// the stat — prefix/suffix kept, numeric part counts up; a hidden sizer pins the width
// ---------------------------------------------------------------------------
function parseStat(value: string) {
  const m = value.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const [, prefix, num, rest] = m;
  const space = rest.indexOf(" ");
  return {
    prefix,
    num,
    target: parseFloat(num.replace(/,/g, "")),
    decimals: (num.split(".")[1] ?? "").length,
    commas: num.includes(","),
    magnitude: space < 0 ? rest : rest.slice(0, space),
    unit: space < 0 ? "" : rest.slice(space + 1),
  };
}

function Stat({ value, run, instant }: { value: string; run: boolean; instant: boolean }) {
  const stat = parseStat(value);
  const [shown, setShown] = useState<number | null>(null); // null = final value (SSR, reduced, done)
  const target = stat?.target ?? 0;

  useEffect(() => {
    if (!run || instant) {
      setShown(null);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / COUNT_MS);
      const eased = 1 - Math.pow(2, -10 * p);
      setShown(p >= 1 ? null : target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setShown(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, instant, target]);

  if (!stat) return <span className={styles.stat}>{value}</span>;
  const fmt = (n: number) =>
    stat.commas
      ? n.toLocaleString("en-US", { minimumFractionDigits: stat.decimals, maximumFractionDigits: stat.decimals })
      : n.toFixed(stat.decimals);

  return (
    <span className={styles.stat}>
      {stat.prefix && <span className={styles.statPrefix}>{stat.prefix}</span>}
      <span className={styles.statNum}>
        <span className={styles.statSizer} aria-hidden="true">
          {stat.num}
        </span>
        <span className={styles.statLive}>{shown === null ? stat.num : fmt(shown)}</span>
      </span>
      {stat.magnitude}
      {stat.unit && <span className={styles.statUnit}>{stat.unit}</span>}
    </span>
  );
}

// ---------------------------------------------------------------------------
// the dock — measure the empty strip under the caption (layout px, so the card's
// 3D rotation can't skew it) and hand the stage two CSS values: the clip window
// (--dock-clip) and the move that scales + slides the scene's DOCK_FOCUS region
// into that window (--dock-move). The strip is filled by layout; nothing about
// the card's outer size changes.
// ---------------------------------------------------------------------------
function offsetIn(el: HTMLElement, root: HTMLElement): [number, number] {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return [x, y];
}

/** The stage's border (it wears the .plate frame) — the scene sits inside it. */
const STAGE_BORDER = 1;
const DOCK_RADIUS = 12;

function useDock(
  active: boolean,
  id: ProblemCardId,
  face: RefObject<HTMLDivElement | null>,
  stage: RefObject<HTMLDivElement | null>,
  slot: RefObject<HTMLDivElement | null>,
) {
  useLayoutEffect(() => {
    const f = face.current;
    const st = stage.current;
    const sl = slot.current;
    if (!active || !f || !st || !sl) return;
    const measure = () => {
      const W = st.offsetWidth;
      const Hh = st.offsetHeight;
      const [stX, stY] = offsetIn(st, f);
      const [slX, slY] = offsetIn(sl, f);
      const sx = slX - stX;
      const sy = slY - stY;
      const sw = sl.offsetWidth;
      const sh = sl.offsetHeight;
      if (W <= 0 || Hh <= 0 || sw <= 0 || sh <= 0) return;
      st.style.setProperty(
        "--dock-clip",
        `inset(${px(sy)} ${px(W - sx - sw)} ${px(Hh - sy - sh)} ${px(sx)} round ${DOCK_RADIUS}px)`,
      );
      // the scene's own box (inside the border), letterboxed like an <svg> "meet"
      const cw = W - 2 * STAGE_BORDER;
      const ch = Hh - 2 * STAGE_BORDER;
      const k = Math.min(cw / VB_W, ch / VB_H);
      const ox = (cw - VB_W * k) / 2;
      const oy = (ch - VB_H * k) / 2;
      const [fx, fy, fw, fh] = DOCK_FOCUS[id];
      const m = Math.min(sh / (fh * k), sw / (fw * k));
      const tx = sx - STAGE_BORDER + sw / 2 - m * (ox + (fx + fw / 2) * k);
      const ty = sy - STAGE_BORDER + sh / 2 - m * (oy + (fy + fh / 2) * k);
      st.style.setProperty("--dock-move", `translate(${px(tx)}, ${px(ty)}) scale(${m.toFixed(4)})`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(f);
    ro.observe(sl);
    return () => ro.disconnect();
  }, [active, id, face, stage, slot]);
}

// ---------------------------------------------------------------------------
// the card
// ---------------------------------------------------------------------------
type Stage = "idle" | "scene" | "revealed";

export function FlipCard({ card, index }: { card: Card; index: number }) {
  const { id, question, hint, value, caption, source } = card;
  const href = PROBLEM_SOURCE_URLS[id];
  const [flipped, setFlipped] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [sceneMounted, setSceneMounted] = useState(false);
  /** Reduced motion: the scene mounts on its last frame, already docked. */
  const [still, setStill] = useState(false);
  const prefersReduced = useReducedMotion() ?? false;
  const timers = useRef<number[]>([]);
  const focusAfterFlip = useRef(false);
  const frontBtn = useRef<HTMLButtonElement>(null);
  const backBtn = useRef<HTMLButtonElement>(null);
  const backFace = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const resultId = useId();
  const Scene = SCENES[id];
  const label = `[${String(index + 1).padStart(2, "0")}]`;

  useDock(sceneMounted, id, backFace, stageRef, slotRef);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // A keyboard flip leaves focus on a button that just went inert — hand it across.
  useEffect(() => {
    if (!focusAfterFlip.current) return;
    focusAfterFlip.current = false;
    (flipped ? backBtn : frontBtn).current?.focus({ preventScroll: true });
  }, [flipped]);

  const after = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  function toggle(e: ReactMouseEvent<HTMLButtonElement>) {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    focusAfterFlip.current = document.activeElement === e.currentTarget;

    if (flipped) {
      // The docked layout stays put while the card turns away, then resets.
      setFlipped(false);
      const reset = () => {
        setStage("idle");
        setSceneMounted(false);
        setStill(false);
      };
      if (prefersReduced) reset();
      else after(FLIP_BACK_MS, reset);
      return;
    }

    setFlipped(true);
    if (prefersReduced) {
      setStill(true);
      setSceneMounted(true);
      setStage("revealed");
      return;
    }
    setStill(false);
    setStage("idle");
    setSceneMounted(false);
    after(FLIP_TO_SCENE_MS, () => {
      setStage("scene");
      setSceneMounted(true);
      after(SCENE_DURATION[id], () => setStage("revealed"));
    });
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--mx", `${x.toFixed(1)}%`);
    el.style.setProperty("--mxf", `${(100 - x).toFixed(1)}%`); // the back face is mirrored
    el.style.setProperty("--my", `${y.toFixed(1)}%`);
  }

  const revealed = stage === "revealed";

  return (
    <div data-flipcard={id} onPointerMove={onPointerMove} className={cn(styles.card, flipped && styles.cardFlipped)}>
      <div className={styles.inner}>
        <div className={styles.face} inert={flipped} aria-hidden={flipped}>
          <button
            ref={frontBtn}
            type="button"
            className={styles.flipBtn}
            aria-label={`${question} ${hint}`}
            onClick={toggle}
          />
          <div className={styles.head}>
            <span className={styles.label}>
              <span className={styles.labelIndex}>{label}</span> {LABEL[id]}
            </span>
            <FlipGlyph />
          </div>
          <div className={styles.plate}>
            <FrontArt id={id} />
          </div>
          <p className={styles.question}>{question}</p>
          <div className={styles.foot}>
            <span>{hint}</span>
            <svg viewBox="0 0 16 10" className={styles.footArrow} aria-hidden="true">
              <path d="M1 5H14.5M10.5 1l4 4-4 4" />
            </svg>
          </div>
        </div>

        <div ref={backFace} className={cn(styles.face, styles.faceBack)} inert={!flipped} aria-hidden={!flipped}>
          <button
            ref={backBtn}
            type="button"
            className={styles.flipBtn}
            aria-label={`Flip back: ${question}`}
            aria-describedby={revealed ? resultId : undefined}
            onClick={toggle}
          />
          <div className={styles.head}>
            <span className={styles.label}>
              <span className={styles.labelIndex}>{label}</span> {LABEL[id]}
            </span>
            <FlipGlyph />
          </div>
          <div id={resultId} className={cn(styles.result, revealed && styles.resultOn)}>
            <div className={styles.resultTop}>
              <Stat value={value} run={revealed} instant={prefersReduced} />
              <span className={styles.rule} aria-hidden="true" />
              <p className={styles.caption}>{caption}</p>
            </div>
            {/* the strip the scene docks into */}
            <div ref={slotRef} className={styles.slot} aria-hidden="true" />
            <p className={styles.source}>
              Source:{" "}
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                  tabIndex={revealed ? 0 : -1}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {source}
                  <span className={styles.sourceArrow} aria-hidden="true">
                    ↗
                  </span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                source
              )}
            </p>
          </div>
          {sceneMounted && (
            <div
              ref={stageRef}
              className={cn(styles.plate, styles.stage, revealed && styles.stageDocked, still && styles.still)}
              aria-hidden="true"
            >
              <div className={styles.stageContent}>
                <Scene still={still} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** The card grid Problem renders under its headline. */
export function FlipCardGrid() {
  return (
    <div className={styles.grid}>
      {problemContent.cards.map((card, i) => (
        <FlipCard key={card.id} card={card} index={i} />
      ))}
    </div>
  );
}
