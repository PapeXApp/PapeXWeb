"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type Ref,
} from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { problemContent, type ProblemCardId } from "./content";
import styles from "./flipcards.module.css";

/**
 * The Problem section's three tap-to-flip cards. Each back runs a short scripted
 * scene (SVG + CSS keyframes, timed by mount) before the stat counts up.
 *
 * Sequence: tap → 360ms flip → scene → stage fades → stat reveals + counts.
 * Reduced motion branches in JS: instant flip, no scene, no count.
 *
 * Illustration system (front plates + back scenes share it): full-bleed painted
 * dioramas — backdrop, ground plane with perspective, objects with volume, soft
 * cast + contact shadows. Light comes from the top-left; farther things are
 * lighter and cooler. Brand orange is the ONE accent per card (printer LED /
 * axe head / till total). Everything is inline SVG with static gradients; motion
 * is CSS transform/opacity only. Gradient/clip ids are prefixed per card + useId.
 */

type Card = (typeof problemContent.cards)[number];

/** Mono label word per card — "[01] Paper". Presentation only, so it lives here, not in content.ts. */
const LABEL: Record<ProblemCardId, string> = { print: "Paper", forest: "Forest", proof: "Cost" };

/** Wait for the flip to expose the back face before the scene mounts. */
const FLIP_TO_SCENE_MS = 360;
/** Stage cross-fade after the scene, before it unmounts. */
const STAGE_OUT_MS = 420;
/** Matches .inner's rotateY transition — the back stays intact until it has turned away. */
const FLIP_BACK_MS = 800;
const COUNT_MS = 1200;

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

type Ids = { id: (name: string) => string; url: (name: string) => string };
type U = Ids["url"];

function useSvgIds(prefix: string): Ids {
  const base = `fc-${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return { id: (n) => `${base}-${n}`, url: (n) => `url(#${base}-${n})` };
}

type Stop = [number, string, number?];
type Vec = [number, number, number, number];

function Defs({ ids, children }: { ids: Ids; children?: ReactElement | ReactElement[] }) {
  const lin = (name: string, stops: Stop[], v: Vec = [0, 0, 0, 1]) => (
    <linearGradient id={ids.id(name)} x1={v[0]} y1={v[1]} x2={v[2]} y2={v[3]}>
      {stops.map(([o, c, a = 1], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={a} />
      ))}
    </linearGradient>
  );
  const radial = (name: string, stops: Stop[], cx = 0.5, cy = 0.5, r = 0.5) => (
    <radialGradient id={ids.id(name)} cx={cx} cy={cy} r={r}>
      {stops.map(([o, c, a = 1], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={a} />
      ))}
    </radialGradient>
  );
  return (
    <defs>
      {/* shadows */}
      {radial("shadow", [[0, NAVY, 0.34], [0.5, NAVY, 0.14], [1, NAVY, 0]])}
      {radial("shadowSoft", [[0, NAVY, 0.16], [0.6, NAVY, 0.06], [1, NAVY, 0]])}
      {/* outdoors */}
      {lin("sky", [[0, "#D6E7EC"], [0.5, "#E9F0EC"], [1, "#F6F0E3"]])}
      {radial("sun", [[0, "#FFF7E2"], [0.28, "#FFF1D0", 0.9], [1, "#FFF1D0", 0]])}
      {lin("hillFar", [[0, "#D2E3DA"], [1, "#C4DACD"]])}
      {lin("hillMid", [[0, "#B9D5B0"], [1, "#A2C79A"]])}
      {lin("grass", [[0, "#B0D291"], [0.4, "#8DBF72"], [1, "#629A4E"]])}
      {lin("pine", [[0, "#86C47F"], [0.47, "#4F9D5E"], [0.53, "#2F7849"], [1, "#215A39"]], [0, 0, 1, 0.3])}
      {radial("leaf", [[0, "#A3D492"], [0.55, "#56A262"], [1, "#2D6C44"]], 0.34, 0.3, 0.78)}
      {lin("bark", [[0, "#A6743F"], [0.45, "#7E502C"], [1, "#52321E"]], [0, 0, 1, 0])}
      {radial("stumpTop", [[0, "#F7E0B5"], [1, "#D6AA70"]], 0.42, 0.4, 0.62)}
      {lin("logEnd", [[0, "#F3D7A6"], [1, "#D2A46A"]], [0, 0, 1, 1])}
      {/* the axe */}
      {lin("wood", [[0, "#E7B277"], [0.5, "#BE7F46"], [1, "#8B5228"]], [0, 0, 1, 0])}
      {lin("paint", [[0, "#FFA852"], [0.45, ORANGE], [1, "#B45100"]], [0, 0, 0.55, 1])}
      {lin("bevel", [[0, "#AEB9C2"], [0.55, "#E8EDF1"], [1, "#FFFFFF"]], [0, 0, 1, 0])}
      {lin("steel", [[0, "#F1F4F6"], [0.5, "#BCC6CE"], [1, "#8894A0"]], [0, 0, 1, 1])}
      {lin("steelDark", [[0, "#808B96"], [1, "#46505A"]])}
      {lin("swoosh", [[0, "#FFFFFF", 0], [1, "#FFFFFF", 0.85]], [0, 0, 1, 0])}
      {/* indoors: wall + counter */}
      {lin("wall", [[0, "#E1E8EC"], [1, "#F1EEE8"]])}
      {lin("counter", [[0, "#EFE8DC"], [1, "#DACDBA"]])}
      {lin("counterEdge", [[0, "#C8B8A0"], [0.12, "#BBAA90"], [1, "#A6947B"]])}
      {lin("wallShade", [[0, NAVY, 0], [1, NAVY, 0.07]])}
      {/* paper */}
      {lin("paper", [[0, "#FFFFFF"], [0.72, "#FBF9F4"], [1, "#E8ECEF"]])}
      {lin("paperSide", [[0, "#FFFFFF"], [0.62, "#F8F6F1"], [1, "#D4DCE3"]], [0, 0, 1, 0])}
      {lin("curl", [[0, "#C3CDD6"], [0.6, "#E9EDF0"], [1, "#FFFFFF"]])}
      {lin("roll", [[0, "#FFFFFF"], [0.45, "#F5F2EB"], [1, "#C4CED7"]])}
      {/* printer */}
      {lin("printerTop", [[0, "#62717E"], [1, "#384450"]], [0, 0, 0.35, 1])}
      {lin("printerFront", [[0, "#35424D"], [1, "#182129"]])}
      {lin("glass", [[0, "#B3C7D4", 0.5], [1, "#1E2B35", 0.35]])}
      {radial("ledGlow", [[0, "#FF8A1F", 0.95], [0.35, "#FF8A1F", 0.4], [1, "#FF8A1F", 0]])}
      {radial("ledGreen", [[0, "#7BE09A", 0.7], [1, "#7BE09A", 0]])}
      {/* till */}
      {lin("tillTop", [[0, "#F5F7F8"], [1, "#D3D9DE"]])}
      {lin("tillFront", [[0, "#D6DCE1"], [1, "#B4BDC5"]])}
      {lin("drawer", [[0, "#C4CCD3"], [1, "#98A3AD"]])}
      {lin("key", [[0, "#FFFFFF"], [1, "#E0E5EA"]])}
      {lin("bezel", [[0, "#2C3844"], [1, "#11181E"]])}
      {radial("screenGlow", [[0, ORANGE, 0.42], [0.55, ORANGE, 0.12], [1, ORANGE, 0]], 0.32, 0.72, 0.78)}
      {lin("glare", [[0, "#FFFFFF", 0], [0.5, "#FFFFFF", 0.14], [1, "#FFFFFF", 0]], [0, 0, 1, 0.5])}
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
      <rect x="-200" y="-200" width="700" height={back + 200} fill={u("wall")} />
      <rect x="-200" y={back - 14} width="700" height="14" fill={u("wallShade")} />
      <rect x="-200" y={back} width="700" height={front - back} fill={u("counter")} />
      <path d={`M-200 ${back}H500`} stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={1} />
      <rect x="-200" y={front} width="700" height="300" fill={u("counterEdge")} />
      <path d={`M-200 ${front}H500`} stroke="#F8F3EA" strokeWidth={1.2} />
    </g>
  );
}

/** Sky, sun, two hill planes and the grass field — the forest's world. */
function Outdoors({ u, horizon, sun }: { u: U; horizon: number; sun: [number, number, number] }) {
  const h = horizon;
  return (
    <g>
      <rect x="-200" y="-200" width="700" height="800" fill={u("sky")} />
      <circle cx={sun[0]} cy={sun[1]} r={sun[2] * 3.2} fill={u("sun")} />
      <circle cx={sun[0]} cy={sun[1]} r={sun[2]} fill="#FFF8E8" />
      <path
        d={`M-200 ${h - 18}C-60 ${h - 40} 20 ${h - 52} 90 ${h - 34}S200 ${h - 56} 270 ${h - 40}S420 ${h - 44} 500 ${h - 30}V${h + 40}H-200Z`}
        fill={u("hillFar")}
      />
      <path
        d={`M-200 ${h}C-40 ${h - 22} 40 ${h - 30} 120 ${h - 14}S240 ${h - 26} 320 ${h - 16}S440 ${h - 12} 500 ${h - 6}V${h + 60}H-200Z`}
        fill={u("hillMid")}
      />
      <path d={`M-200 ${h + 8}C0 ${h - 6} 180 ${h - 8} 500 ${h + 4}V700H-200Z`} fill={u("grass")} />
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
  return <path d={d} fill="none" stroke="#4E8A45" strokeWidth={1.1} strokeOpacity={0.85} />;
}

// ---------------------------------------------------------------------------
// trees — drawn with the cut point (top of the stump) at 0,0, growing up
// ---------------------------------------------------------------------------
type TreeKind = "pine" | "round";
const STUMP_H = 7;

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
  if (kind === "pine") {
    const tiers = pineTiers(h);
    return (
      <g>
        <path d={`M-4 0.5L-2.4 ${r1(-H * 0.5)}H2.4L4 0.5Z`} fill={u("bark")} />
        {tiers.map((t, i) => (
          <g key={i}>
            {i > 0 && <ellipse cx="0" cy={r1(t.bot + 1.2)} rx={r1(t.w * 0.44)} ry="2.4" fill="#173F2A" opacity={0.32} />}
            <path d={t.d} fill={u("pine")} />
          </g>
        ))}
        {haze > 0 && (
          <path d={tiers.map((t) => t.d).join("")} fill="#E4EEEE" opacity={r1(haze * 100) / 100} />
        )}
      </g>
    );
  }
  const blobs = roundBlobs(h);
  return (
    <g>
      <path d={`M-4 0.5L-2.6 ${r1(-H * 0.56)}H2.6L4 0.5Z`} fill={u("bark")} />
      <path d={`M0.5 ${r1(-H * 0.36)}L${r1(H * 0.13)} ${r1(-H * 0.5)}`} stroke="#6F4527" strokeWidth={1.6} fill="none" />
      {blobs.map(([cx, cy, r], i) => (
        <circle key={i} cx={r1(cx)} cy={r1(cy)} r={r1(r)} fill={u("leaf")} />
      ))}
      <ellipse cx="0" cy={r1(-H * 0.4)} rx={r1(H * 0.2)} ry="2.6" fill="#173F2A" opacity={0.28} />
      {haze > 0 && (
        <g fill="#E4EEEE" opacity={r1(haze * 100) / 100}>
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
      <path d={`M-4.4 ${-s}V-1.2Q-4.6 0.6 -7.2 1.2H7.2Q4.6 0.6 4.4 -1.2V${-s}Z`} fill={u("bark")} />
      <ellipse cx="0" cy={-s} rx="4.4" ry="1.7" fill={u("stumpTop")} />
      <ellipse cx="-0.2" cy={-s} rx="2.6" ry="0.95" fill="none" stroke="#B98549" strokeWidth={0.6} />
      <circle cx="-0.3" cy={-s} r="0.55" fill="#9A6A38" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// the axe — grip end at 0,0, handle hanging down, head at the bottom, bit facing +x
// ---------------------------------------------------------------------------
const AXE_L = 94;
/** The centre of the cutting edge, in the axe's own coordinates. */
const AXE_BIT: [number, number] = [29, AXE_L - 2];

function Axe({ u }: { u: U }) {
  const L = AXE_L;
  return (
    <g>
      <path
        d={`M-3.4 -1Q0 -5.4 3.4 -1L2.5 9C2.1 38 2.7 68 2.9 ${L + 6}L-2.9 ${L + 6}C-2.7 68 -2.1 38 -2.5 9Z`}
        fill={u("wood")}
        stroke={NAVY}
        strokeOpacity={0.35}
        strokeWidth={0.8}
      />
      <path
        d={`M-0.9 12C-0.5 40 -1.1 64 -0.7 ${L - 10}M1.1 22C1.5 46 1 58 1.3 ${L - 18}M-1.6 30C-1.4 42 -1.7 50 -1.5 58`}
        fill="none"
        stroke="#7A4520"
        strokeOpacity={0.45}
        strokeWidth={0.7}
      />
      <path d="M-2.9 6H2.9M-2.8 8.6H2.8" stroke="#6B3D1C" strokeOpacity={0.55} strokeWidth={0.8} />
      <path
        d={`M-9 ${L - 7}L4 ${L - 8}C12 ${L - 8} 20 ${L - 11} 27 ${L - 17}Q31.5 ${L - 2} 27 ${L + 13}C20 ${L + 8} 12 ${L + 5} 4 ${L + 5}L-9 ${L + 4}Q-10.5 ${L - 1.5} -9 ${L - 7}Z`}
        fill={u("paint")}
        stroke={NAVY}
        strokeOpacity={0.5}
        strokeWidth={0.8}
      />
      <path d={`M21.6 ${L - 13.2}Q25.6 ${L - 2} 21.4 ${L + 9.6}L27 ${L + 13}Q31.5 ${L - 2} 27 ${L - 17}Z`} fill={u("bevel")} />
      <path d={`M27.3 ${L - 15.6}Q31 ${L - 2} 27.2 ${L + 11.6}`} fill="none" stroke="#FFFFFF" strokeWidth={1} />
      <path d={`M-9 ${L - 7}L-4.5 ${L - 7.3}V${L + 4.2}L-9 ${L + 4}Q-10.5 ${L - 1.5} -9 ${L - 7}Z`} fill={u("steelDark")} />
      <path
        d={`M-8 ${L - 6.2}L4 ${L - 7}C12 ${L - 7} 19 ${L - 9.8} 25 ${L - 14.6}`}
        fill="none"
        stroke="#FFC894"
        strokeOpacity={0.9}
        strokeWidth={0.9}
      />
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
      <ellipse cx="18" cy="2" rx="92" ry="11" fill={u("shadowSoft")} />
      <ellipse cx="2" cy="0.5" rx="70" ry="4.2" fill={u("shadow")} />
      <path d="M-52 -92H52Q59 -92 60.5 -86L64.5 -58H-64.5L-60.5 -86Q-59 -92 -52 -92Z" fill={u("printerTop")} />
      <path d="M-51 -91H51" stroke="#8C9BA7" strokeWidth={0.8} strokeOpacity={0.8} />
      <clipPath id={ids.id("window")}>
        <path d={PRINTER_WINDOW_D} />
      </clipPath>
      <path d={PRINTER_WINDOW_D} fill="#0D161D" />
      <g clipPath={u("window")}>
        <g className={rollClass} style={rollStyle}>
          <rect x="-42" y="-87" width="84" height="16" rx="8" fill={u("roll")} />
          <ellipse cx="-42" cy="-79" rx="3.2" ry="8" fill="#ECEFF1" />
          <ellipse cx="-42" cy="-79" rx="1.3" ry="3.1" fill="#B98A57" />
        </g>
      </g>
      <path d={PRINTER_WINDOW_D} fill={u("glass")} />
      <path d="M-30 -88H-19L-25 -70H-36Z" fill="#FFFFFF" opacity={0.14} />
      <path d={PRINTER_WINDOW_D} fill="none" stroke="#7A8996" strokeWidth={0.8} />
      <rect x="-64" y="-58" width="128" height="58" rx="7" fill={u("printerFront")} />
      <path d="M-62 -57.3H62" stroke="#8E9EAB" strokeWidth={0.9} />
      <path d="M-63.3 -52V-8" stroke="#56646F" strokeWidth={0.8} />
      <rect x="-41" y="-52" width="82" height="3.6" rx="1.8" fill="#05090C" />
      <path d="M-40 -47.3H40" stroke="#5E6C78" strokeWidth={0.8} />
      <path d="M-54 -12H-38M-54 -8H-38M-54 -4H-38" stroke="#0E151B" strokeWidth={1} />
      <circle cx="-46" cy="-24" r="4.2" fill="#10181E" />
      <circle cx="-46.3" cy="-24.3" r="3" fill={u("steel")} />
      <circle cx="47" cy="-24" r="4" fill="#0A1014" />
      <circle cx="47" cy="-24" r="7" fill={u("ledGreen")} opacity={0.55} />
      <circle cx="47" cy="-24" r="2" fill="#70D38E" />
      {ledOn && (
        <g className={ledOn.className} style={ledOn.style}>
          <circle cx="47" cy="-24" r="11" fill={u("ledGlow")} />
          <circle cx="47" cy="-24" r="2.4" fill="#FF8A1F" />
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
      <path d={SLIP_BODY_D} transform="translate(2 3)" fill={NAVY} opacity={0.12} />
      <path d={SLIP_BODY_D} fill={u("paper")} stroke={NAVY} strokeOpacity={0.14} strokeWidth={0.7} />
      <path d="M-23 53C-23 60 23 60 23 53C23 50 -23 50 -23 53Z" fill={u("curl")} />
      <path d="M-9 8H9" stroke={NAVY} strokeWidth={1.6} />
      <path d={SLIP_ROWS} stroke="#97A3AE" strokeWidth={1} />
      <path d="M-16 34H16" stroke="#B8C1C8" strokeWidth={0.8} strokeDasharray="2 2" />
      <path d="M-16 40H-4M8 40H16" stroke={NAVY} strokeWidth={1.3} />
      <path d={SLIP_BARS} stroke="#5C6873" strokeWidth={0.8} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// the paper roll — left end-cap centre at 0,0, 80 long, radius 22
// ---------------------------------------------------------------------------
function Roll({ u }: { u: U }) {
  return (
    <g>
      <path d="M0 -22H80A8 22 0 0 1 80 22H0Z" fill={u("roll")} />
      <path d="M2 -20.5H78" stroke="#FFFFFF" strokeWidth={1.2} />
      <ellipse cx="0" cy="0" rx="8" ry="22" fill="#F2F0EA" />
      <ellipse cx="0" cy="0" rx="6.5" ry="17.8" fill="none" stroke="#DCE1E5" strokeWidth={0.6} />
      <ellipse cx="0" cy="0" rx="5" ry="13.4" fill="none" stroke="#DCE1E5" strokeWidth={0.6} />
      <ellipse cx="0" cy="0" rx="3" ry="8" fill="#C39561" />
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
      <ellipse cx="16" cy="2" rx="76" ry="10" fill={u("shadowSoft")} />
      <ellipse cx="0" cy="0.5" rx="60" ry="4" fill={u("shadow")} />
      <rect x="-56" y="-34" width="112" height="34" rx="4" fill={u("drawer")} />
      <path d="M-55 -33.4H55" stroke="#E4E9ED" strokeWidth={0.8} />
      <rect x="-14" y="-22" width="28" height="3.2" rx="1.6" fill="#66727D" />
      <path d="M-13 -17.8H13" stroke="#E4E9ED" strokeWidth={0.7} />
      <rect x="-52" y="-60" width="104" height="27" fill={u("tillFront")} />
      <path d="M-44 -96H44L52 -60H-52Z" fill={u("tillTop")} />
      <path d="M-43.6 -95.4H43.6" stroke="#FFFFFF" strokeWidth={0.9} />
      {TILL_KEYS.map((k, i) => (
        <g key={i}>
          <rect x={r1(k.x)} y={k.y + 1.6} width={r1(k.w)} height="7" rx="1.8" fill={k.dark ? "#0B141A" : "#AEB8C1"} />
          <rect x={r1(k.x)} y={k.y} width={r1(k.w)} height="7" rx="1.8" fill={k.dark ? "#26323D" : u("key")} />
        </g>
      ))}
      <rect x="-6" y="-126" width="12" height="32" fill={u("steel")} />
      <ellipse cx="-4" cy="-94" rx="26" ry="3" fill={NAVY} opacity={0.12} />
      <rect x="-52" y="-170" width="104" height="48" rx="6" fill={u("bezel")} />
      <path d="M-47 -169.4H47" stroke="#5A6875" strokeWidth={0.8} />
      <rect x="-46" y="-164" width="92" height="36" rx="3" fill="#06111A" />
      <rect x="-46" y="-164" width="92" height="36" rx="3" fill={u("screenGlow")} />
      <text x="-38" y="-151" className={styles.tillLabel}>
        TOTAL
      </text>
      <text x="-38" y="-135" ref={totalRef} className={styles.tillTotal}>
        {total}
      </text>
      <path d="M-46 -164H-10L-30 -128H-46Z" fill={u("glare")} />
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
    <svg viewBox="0 0 280 320" className={styles.sceneSvg} aria-hidden="true">
      <Defs ids={ids}>
        {/* slips only exist below the slot — nothing peeks over the printer while they wait */}
        <clipPath id={ids.id("slot")}>
          <rect x="-200" y={slotY} width="700" height="600" />
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
// card "forest" — a receding row of trees grows in; an axe swings in and sweeps
// the row at the base; each tree tips and falls as the blade passes, chips fly,
// leaves burst on impact, stumps with rings remain
// ---------------------------------------------------------------------------
const TREE_HEIGHTS = [78, 104, 88, 118, 94, 110, 82, 100, 76];
const GROW_STAGGER = 70;
const SWEEP_START = TREE_HEIGHTS.length * GROW_STAGGER + 520;
const SWEEP_MS = 760;
const FOREST_DURATION = SWEEP_START + SWEEP_MS + 700;

const ROUND_TREES = new Set([1, 4, 6]);
const ROW = TREE_HEIGHTS.map((h, k) => {
  const t = k / (TREE_HEIGHTS.length - 1);
  const sc = 1 - t * 0.32;
  const base = 266 - t * 44;
  return {
    k,
    h,
    t,
    sc,
    cx: 38 + k * 25.5,
    base,
    cutY: base - STUMP_H * sc,
    kind: (ROUND_TREES.has(k) ? "round" : "pine") as TreeKind,
    growDelay: k * GROW_STAGGER,
  };
});

// the blade's path: along the row, just above the stumps
const BLADE_X0 = ROW[0].cx - 4;
const BLADE_X1 = ROW[ROW.length - 1].cx + 40;
const BLADE_SLOPE = (ROW[ROW.length - 1].cutY - ROW[0].cutY) / (ROW[ROW.length - 1].cx - ROW[0].cx);
const bladeY = (x: number) => ROW[0].cutY - 2 + (x - ROW[0].cx) * BLADE_SLOPE;

const FELLED = ROW.map((tree) => ({
  ...tree,
  fellDelay: Math.round(SWEEP_START + ((tree.cx - BLADE_X0) / (BLADE_X1 - BLADE_X0)) * SWEEP_MS),
}));

// The axe animates about its grip. Solve the grip position for where the bit must be.
const AXE_SCALE = 0.9;
const AXE_LEAD = 600; // enters + winds up before the strike lands at SWEEP_START
const AXE_EXIT = 300;
const gripFor = (bx: number, by: number, deg: number): [number, number] => {
  const [ox, oy] = rot(AXE_BIT[0] * AXE_SCALE, AXE_BIT[1] * AXE_SCALE, deg);
  return [bx - ox, by - oy];
};
const AXE_STRIKE = gripFor(BLADE_X0, bladeY(BLADE_X0), -18);
const AXE_END = gripFor(BLADE_X1, bladeY(BLADE_X1), -10);
const AXE_WIND: [number, number] = [AXE_STRIKE[0] - 24, AXE_STRIKE[1] - 18];
const AXE_VARS = {
  "--hex": px(AXE_WIND[0] - 30),
  "--hey": px(AXE_WIND[1] - 40),
  "--hwx": px(AXE_WIND[0]),
  "--hwy": px(AXE_WIND[1]),
  "--h0x": px(AXE_STRIKE[0]),
  "--h0y": px(AXE_STRIKE[1]),
  "--h1x": px(AXE_END[0]),
  "--h1y": px(AXE_END[1]),
  "--hxx": px(AXE_END[0] + 40),
  "--hxy": px(AXE_END[1] - 34),
  animationDelay: `${SWEEP_START - AXE_LEAD}ms`,
  animationDuration: `${AXE_LEAD + SWEEP_MS + AXE_EXIT}ms`,
} as CSSProperties;

// the motion trail of the down-swing: a crescent swept by the bit around the grip
const SWOOSH_D = (() => {
  const [gx, gy] = AXE_STRIKE;
  const pts = (k: number) =>
    Array.from({ length: 9 }, (_, i) => {
      const deg = 78 - (96 * i) / 8;
      const [x, y] = rot(AXE_BIT[0] * AXE_SCALE * k, AXE_BIT[1] * AXE_SCALE * k, deg);
      return `${r1(gx + x)} ${r1(gy + y)}`;
    });
  const outer = pts(1.06);
  const inner = pts(0.8).reverse();
  return `M${outer.join("L")}L${inner.join("L")}Z`;
})();

const CHIPS = [
  { mx: 7, my: -13, ex: 13, ey: 3, r: 220, c: "#EBC894" },
  { mx: 11, my: -7, ex: 19, ey: 4, r: -170, c: "#C9955A" },
  { mx: 3, my: -16, ex: 8, ey: 2, r: 300, c: "#F2D4A2" },
  { mx: -4, my: -9, ex: -8, ey: 3, r: -200, c: "#B9844C" },
];
const LEAVES = [
  { mx: -6, my: -10, ex: -10, ey: -2, r: 160 },
  { mx: 4, my: -13, ex: 8, ey: -3, r: -220 },
  { mx: 10, my: -6, ex: 15, ey: 0, r: 120 },
];

const FOREST_TUFTS: [number, number, number][] = [
  [14, 300, 1.2],
  [40, 312, 1],
  [96, 296, 1.1],
  [150, 308, 1.3],
  [204, 294, 1],
  [252, 304, 1.2],
  [120, 276, 0.8],
  [230, 262, 0.7],
];

function ForestScene() {
  const ids = useSvgIds("forest");
  const u = ids.url;
  return (
    <svg viewBox="0 0 280 320" className={styles.sceneSvg} aria-hidden="true">
      <Defs ids={ids} />
      <Outdoors u={u} horizon={206} sun={[212, 70, 15]} />
      <ellipse cx="150" cy="248" rx="150" ry="30" fill="#6E9F58" opacity={0.18} />
      {[...FELLED].reverse().map((t) => {
        const H = t.h - STUMP_H;
        return (
          <g key={t.k} transform={`translate(${r1(t.cx)} ${r1(t.base)}) scale(${r1(t.sc * 100) / 100})`}>
            <g className={styles.treeGrow} style={{ animationDelay: `${t.growDelay}ms` }}>
              <ellipse
                cx={r1(t.h * 0.3)}
                cy="0.6"
                rx={r1(t.h * 0.38)}
                ry="3.6"
                fill={u("shadow")}
                className={styles.treeShadow}
                style={{ animationDelay: `${t.fellDelay}ms` }}
              />
              <Stump u={u} />
              <g transform={`translate(0 ${-STUMP_H})`}>
                <g className={styles.treeFell} style={{ animationDelay: `${t.fellDelay}ms` }}>
                  <Tree kind={t.kind} h={t.h} u={u} haze={t.t * 0.42} />
                </g>
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
                        animationDelay: `${t.fellDelay}ms`,
                      } as CSSProperties
                    }
                  />
                ))}
              </g>
              <g transform={`translate(${r1(H * 0.58)} -2)`}>
                <ellipse
                  rx={r1(H * 0.34)}
                  ry="4"
                  fill="#DCD3B6"
                  className={styles.dust}
                  style={{ animationDelay: `${t.fellDelay + 470}ms` }}
                />
                {LEAVES.map((l, i) => (
                  <ellipse
                    key={i}
                    rx="2.2"
                    ry="1.1"
                    fill={i % 2 ? "#4E9A5C" : "#7DBE78"}
                    className={styles.chip}
                    style={
                      {
                        "--cmx": px(l.mx),
                        "--cmy": px(l.my),
                        "--cex": px(l.ex),
                        "--cey": px(l.ey),
                        "--cr": `${l.r}deg`,
                        animationDelay: `${t.fellDelay + 470}ms`,
                      } as CSSProperties
                    }
                  />
                ))}
              </g>
            </g>
          </g>
        );
      })}
      <GrassTufts tufts={FOREST_TUFTS} />
      <path d={SWOOSH_D} fill={u("swoosh")} className={styles.swoosh} style={{ animationDelay: `${SWEEP_START - 170}ms` }} />
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

function CostScene() {
  const ids = useSvgIds("proof");
  const u = ids.url;
  const total = useRef<SVGTextElement>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now() + 200;
    const span = COST_FEED_MS - 300;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / span));
      const v = COST_TICK_TARGET * p * p * p; // ease-in: spend accelerates with the feed
      if (total.current) total.current.textContent = `$${Math.round(v).toLocaleString("en-US")}`;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg viewBox="0 0 280 320" className={styles.sceneSvg} aria-hidden="true">
      <Defs ids={ids}>
        <clipPath id={ids.id("feed")}>
          <rect x="-200" y={ROLL_AT[1] + 12} width="700" height="600" />
        </clipPath>
      </Defs>
      <Counter u={u} back={COUNTER_BACK} front={COUNTER_FRONT} />
      {/* wall bracket + the roll's soft shadow on the wall */}
      <ellipse cx="104" cy="92" rx="60" ry="9" fill={u("shadowSoft")} />
      <rect x="38" y="42" width="7" height="32" rx="2" fill={u("steel")} />
      <rect x="44" y="56.6" width="13" height="2.8" fill="#8894A0" />
      <g clipPath={u("feed")}>
        <g className={styles.feed} style={{ animationDuration: `${COST_FEED_MS}ms` }}>
          <path d={STRIP_D} transform="translate(6 3)" fill={NAVY} opacity={0.08} />
          <path d={STRIP_D} fill={u("paperSide")} stroke={NAVY} strokeOpacity={0.12} strokeWidth={0.7} />
          <path d={STRIP_ROWS} stroke="#9AA6B0" strokeWidth={1} />
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

const SCENES: Record<ProblemCardId, () => ReactElement> = { print: PrintScene, forest: ForestScene, proof: CostScene };
const SCENE_DURATION: Record<ProblemCardId, number> = {
  print: PRINT_DURATION,
  forest: FOREST_DURATION,
  proof: COST_DURATION,
};

// ---------------------------------------------------------------------------
// front illustrations — static hero frames of each scene, same painted language.
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
      <path d="M89.5 61.5H110.5V84C110.5 92 89.5 92 89.5 84Z" fill={u("paperSide")} stroke={NAVY} strokeOpacity={0.14} strokeWidth={0.7} />
      <path d="M89.5 84C89.5 94 110.5 94 110.5 84C110.5 80.6 89.5 80.6 89.5 84Z" fill={u("curl")} />
      <path d="M93 66H101M104 66H107M93 70H99M104 70H107M93 74H102M104 74H107" stroke="#97A3AE" strokeWidth={0.9} />
      <path d="M93 79H98M103 79H107" stroke={NAVY} strokeWidth={1.1} />
    </svg>
  );
}

function FrontForest() {
  const ids = useSvgIds("forest-front");
  const u = ids.url;
  const stump: [number, number] = [140, 84];
  const S = 2.3;
  const topY = stump[1] - STUMP_H * S;
  // axe lodged in the stump: bit a little below the cut face, handle rising to the right
  const axeDeg = 50;
  const axeScale = 0.42;
  const [ox, oy] = rot(AXE_BIT[0] * axeScale, AXE_BIT[1] * axeScale, axeDeg);
  const grip: [number, number] = [stump[0] + 1 - ox, topY + 3 - oy];
  return (
    <svg viewBox="0 0 200 100" className={styles.artSvg} aria-hidden="true">
      <Defs ids={ids}>
        <clipPath id={ids.id("lodged")}>
          <path d={`M-100 -100H300V${r1(topY + 0.4)}H-100Z`} />
        </clipPath>
      </Defs>
      <Outdoors u={u} horizon={70} sun={[168, 24, 7]} />
      {[
        { x: 28, y: 78, h: 44, kind: "pine" as TreeKind, haze: 0.45, s: 0.72 },
        { x: 62, y: 80, h: 58, kind: "round" as TreeKind, haze: 0.18, s: 0.82 },
        { x: 44, y: 88, h: 72, kind: "pine" as TreeKind, haze: 0, s: 0.95 },
        { x: 84, y: 90, h: 62, kind: "pine" as TreeKind, haze: 0, s: 0.92 },
      ].map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.s})`}>
          <ellipse cx={r1(t.h * 0.3)} cy="0.6" rx={r1(t.h * 0.38)} ry="3.4" fill={u("shadow")} />
          <Stump u={u} />
          <g transform={`translate(0 ${-STUMP_H})`}>
            <Tree kind={t.kind} h={t.h} u={u} haze={t.haze} />
          </g>
        </g>
      ))}
      {/* a felled log, rings to camera */}
      <g transform="translate(166 82)">
        <ellipse cx="4" cy="6.4" rx="24" ry="2.6" fill={u("shadow")} />
        <path d="M-12 -5H18A3.2 5.6 0 0 1 18 6.2H-12Z" fill={u("bark")} />
        <path d="M-10 -2.6H14M-6 1.8H16" stroke="#4A2D19" strokeOpacity={0.5} strokeWidth={0.6} />
        <ellipse cx="-12" cy="0.6" rx="3.4" ry="5.6" fill={u("logEnd")} stroke="#7E502C" strokeWidth={0.8} />
        <ellipse cx="-12" cy="0.6" rx="2" ry="3.4" fill="none" stroke="#B98549" strokeWidth={0.5} />
        <ellipse cx="-12" cy="0.6" rx="0.9" ry="1.5" fill="none" stroke="#B98549" strokeWidth={0.5} />
      </g>
      {/* the stump with the axe in it */}
      <ellipse cx={stump[0] + 12} cy={stump[1] + 1} rx="20" ry="3.4" fill={u("shadow")} />
      <g transform={`translate(${stump[0]} ${stump[1]}) scale(${S})`}>
        <Stump u={u} />
        <ellipse cx="-0.2" cy={-STUMP_H} rx="1.5" ry="0.55" fill="none" stroke="#B98549" strokeWidth={0.5} />
      </g>
      <path d={`M${stump[0] - 3} ${r1(topY + 0.6)}L${stump[0] + 5} ${r1(topY - 0.4)}`} stroke="#5A3820" strokeWidth={1.1} />
      <g clipPath={u("lodged")}>
        <g transform={`translate(${r1(grip[0])} ${r1(grip[1])}) rotate(${axeDeg}) scale(${axeScale})`}>
          <Axe u={u} />
        </g>
      </g>
      {/* chips on the grass */}
      <path d="M122 88l3 -0.6l-0.4 1.4ZM131 91l2.6 0.4l-1.2 1.2ZM153 90l2.8 -0.8l0 1.4ZM159 87l2 0.5l-1 1Z" fill="#E4BE86" />
      <GrassTufts tufts={[[16, 94, 0.8], [104, 96, 0.9], [184, 95, 0.8], [118, 84, 0.6]]} />
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
      <ellipse cx="72" cy="34" rx="34" ry="5" fill={u("shadowSoft")} />
      <rect x="30" y="16" width="4" height="18" rx="1.2" fill={u("steel")} />
      <rect x="33" y="24.2" width="7" height="1.6" fill="#8894A0" />
      {/* strip runs from the roll down to the counter and loops over */}
      <path d="M43 36H74V78C74 88 60 90 50 88C43 86 43 82 43 78Z" fill={NAVY} opacity={0.07} transform="translate(3 2)" />
      <path d="M43 36H74V80H43Z" fill={u("paperSide")} stroke={NAVY} strokeOpacity={0.12} strokeWidth={0.6} />
      <path d="M43 80C43 92 74 92 74 80C74 76.5 43 76.5 43 80Z" fill={u("curl")} />
      <path d="M47 44H58M66 44H70M47 50H56M66 50H70M47 56H60M66 56H70M47 62H55M66 62H70M47 68H59M66 68H70" stroke="#9AA6B0" strokeWidth={0.8} />
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
// the card
// ---------------------------------------------------------------------------
type Stage = "idle" | "scene" | "revealed";

export function FlipCard({ card, index }: { card: Card; index: number }) {
  const { id, question, hint, value, caption, source } = card;
  const [flipped, setFlipped] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [sceneMounted, setSceneMounted] = useState(false);
  const prefersReduced = useReducedMotion() ?? false;
  const timers = useRef<number[]>([]);
  const resultId = useId();
  const Scene = SCENES[id];
  const label = `[${String(index + 1).padStart(2, "0")}]`;

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const after = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  function toggle() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];

    if (flipped) {
      setFlipped(false);
      const reset = () => {
        setStage("idle");
        setSceneMounted(false);
      };
      if (prefersReduced) reset();
      else after(FLIP_BACK_MS, reset);
      return;
    }

    setFlipped(true);
    setStage("idle");
    setSceneMounted(false);
    if (prefersReduced) {
      setStage("revealed");
      return;
    }
    after(FLIP_TO_SCENE_MS, () => {
      setStage("scene");
      setSceneMounted(true);
      after(SCENE_DURATION[id], () => {
        setStage("revealed");
        after(STAGE_OUT_MS, () => setSceneMounted(false));
      });
    });
  }

  function onPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
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
    <button
      type="button"
      data-flipcard={id}
      aria-pressed={flipped}
      aria-label={`Flip card: ${question}`}
      aria-describedby={revealed ? resultId : undefined}
      onClick={toggle}
      onPointerMove={onPointerMove}
      className={cn(styles.card, flipped && styles.cardFlipped)}
    >
      <div className={styles.inner}>
        <div className={styles.face}>
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

        <div className={cn(styles.face, styles.faceBack)}>
          <div className={styles.head}>
            <span className={styles.label}>
              <span className={styles.labelIndex}>{label}</span> {LABEL[id]}
            </span>
            <FlipGlyph />
          </div>
          {sceneMounted && (
            <div className={cn(styles.plate, styles.stage, revealed && styles.stageOut)} aria-hidden="true">
              <Scene />
            </div>
          )}
          <div id={resultId} className={cn(styles.result, revealed && styles.resultOn)}>
            <div className={styles.resultTop}>
              <Stat value={value} run={revealed} instant={prefersReduced} />
              <span className={styles.rule} aria-hidden="true" />
              <p className={styles.caption}>{caption}</p>
            </div>
            <p className={styles.source}>Source: {source}</p>
          </div>
        </div>
      </div>
    </button>
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
