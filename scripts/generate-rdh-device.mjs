#!/usr/bin/env node
// scripts/generate-rdh-device.mjs
//
// The single source of the RDH device illustration. Emits BOTH
//   components/paths/customer/RdhDevice.tsx   (inline, LED pulses via CSS)
//   public/product/rdh-device.svg             (static <img> for /business)
// from one geometry model, so the two can never drift. Edit this file, then:
//   node scripts/generate-rdh-device.mjs
//
// The model is rendered through one or more CAMERAS ("views"). `iso` is the
// original front-right isometric (hero + the static /business file); its
// constants below are frozen so its output stays byte-identical. Every other
// view is a generic orthographic camera (see `camera()`), emitted as
// <RdhDevice view="..."/>. The static .svg is iso only.
//   RDH_PREVIEW=<dir> node scripts/generate-rdh-device.mjs   also writes
//   <dir>/rdh-<view>.svg for every view, for eyeballing a camera change.
//
// Reference: photos of the pilot unit (matte-black FDM print, white PapeX
// sticker, green status LED, two USB-C ports on the short end opposite the
// sticker — hidden from this camera angle, so only the white braided cable
// emerging from behind the box is drawn). The orange CAD renders in
// Papex_RDH_Firmware/docs/enclosure/ are a future enclosure concept.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_TSX = path.join(ROOT, "components/paths/customer/RdhDevice.tsx");
const OUT_SVG = path.join(ROOT, "public/product/rdh-device.svg");
const LOGO_SRC = path.join(ROOT, "components/brand/full-logo.tsx");

/* ---------------------------------------------------------------- model --- */
// World units are millimetres of the real box (68 x 100 x 42).
//   u along the 100 mm length; u = 0 is the BACK end (carries the two USB-C
//     ports, hidden from this camera — only the cable leaving it is visible),
//     u = L the FRONT end (the sticker end),
//   v across the 68 mm width; v = 0 is the RIGHT side as seen from the front,
//   z up.
// Camera: front-right, so we see the top, the right long side and the front
// end. Chosen over front-left because the /customers hero phone covers the
// upper-left of the device; this way the back-right status LED stays visible
// next to the phone when the tap pulses it.
const VB_W = 169.5;
const VB_H = 138;
const L = 100;
const W = 68;
const H = 42;
const S = 0.9; // mm -> viewBox units
const OX = 99.5; // screen x of the back-left vertical edge
const OY = 44; // screen y of that edge's bottom end
const C = Math.cos(Math.PI / 6);

const fx = (n, dp = 2) => {
  const r = Number(n.toFixed(dp));
  return Object.is(r, -0) ? "0" : String(r);
};
/** True isometric projection of a world point. */
const P = (u, v, z) => [OX + S * C * (W - v - u), OY + S * (0.5 * (u + W - v) - z)];
const mat = (...m) => `matrix(${m.map((n) => fx(n, 4)).join(",")})`;
const pts = (list, close = true) =>
  list.map(([x, y], i) => `${i ? "L" : "M"}${fx(x)} ${fx(y)}`).join(" ") + (close ? " Z" : "");

// Face coordinate systems. A shape drawn axis-aligned inside one of these
// groups lands correctly foreshortened on that face (all are proper
// rotations + shear, never mirrors, so text stays readable).
//   top : (u, v)                      z = H
//   side: (a, t)  a = L - u, t = H - z   v = 0   (right long side, lit)
//   end : (w, t)  w = W - v, t = H - z   u = L   (front end, plain)
const M_TOP = mat(-S * C, S * 0.5, -S * C, -S * 0.5, OX + S * C * W, OY + S * (0.5 * W - H));
const M_SIDE = mat(S * C, -S * 0.5, 0, S, OX + S * C * (W - L), OY + S * (0.5 * (L + W) - H));
const M_END = mat(S * C, S * 0.5, 0, S, OX - S * C * L, OY + S * (0.5 * L - H));

/** Closed polygon with every corner eased by a quadratic of radius r. */
function roundedPoly(v, r) {
  const unit = (a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.hypot(dx, dy);
    return [dx / d, dy / d];
  };
  let d = "";
  v.forEach((p, i) => {
    const prev = v[(i - 1 + v.length) % v.length];
    const next = v[(i + 1) % v.length];
    const a = unit(p, prev);
    const b = unit(p, next);
    const A = [p[0] + a[0] * r, p[1] + a[1] * r];
    const B = [p[0] + b[0] * r, p[1] + b[1] * r];
    d += `${i ? "L" : "M"}${fx(A[0])} ${fx(A[1])} Q${fx(p[0])} ${fx(p[1])} ${fx(B[0])} ${fx(B[1])} `;
  });
  return d + "Z";
}

/* ------------------------------------------------------------- node tree -- */
const h = (tag, attrs = {}, ...kids) => ({ tag, attrs, kids: kids.flat(Infinity).filter(Boolean) });
const raw = (svg, jsx) => ({ raw: true, svg, jsx });
const note = (text) => raw(`<!-- ${text} -->`, `{/* ${text} */}`);
const SVG_ATTR = {
  strokeWidth: "stroke-width",
  stopColor: "stop-color",
  stopOpacity: "stop-opacity",
  strokeLinejoin: "stroke-linejoin",
  strokeLinecap: "stroke-linecap",
  strokeDasharray: "stroke-dasharray",
  strokeDashoffset: "stroke-dashoffset",
  strokeOpacity: "stroke-opacity",
  strokeMiterlimit: "stroke-miterlimit",
  fillOpacity: "fill-opacity",
  clipPath: "clip-path",
  fillRule: "fill-rule",
};
function ser(node, mode, ind = "") {
  if (node.raw) return node[mode] === null ? "" : node[mode].split("\n").map((l) => ind + l).join("\n");
  const attrs = [];
  for (const [k, v] of Object.entries(node.attrs)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "object") {
      if (mode === "jsx") attrs.push(`${k}={${v.jsx}}`);
      continue;
    }
    attrs.push(`${mode === "svg" ? (SVG_ATTR[k] ?? k) : k}="${typeof v === "number" ? fx(v) : v}"`);
  }
  const open = `<${node.tag}${attrs.length ? " " + attrs.join(" ") : ""}`;
  if (!node.kids.length) return `${ind}${open} />`;
  const kids = node.kids.map((k) => ser(k, mode, ind + "  ")).filter((s) => s.trim());
  return `${ind}${open}>\n${kids.join("\n")}\n${ind}</${node.tag}>`;
}

/* -------------------------------------------------------------- palette -- */
const INK = "#00121D"; // logo letters (canonical navy)
const ORANGE = "#EB7100"; // plane body (canonical orange)
const PAPER = "#FFFFFF"; // plane highlights: FullLogo's default white — folds on the sticker
const RIM = "#B9CCDF"; // cool rim light — keeps the black box off a navy page
const LED = "#3EE584";

/* ----------------------------------------------------------------- defs -- */
const stops = (...s) =>
  s.map(([o, c, a]) => h("stop", { offset: o, stopColor: c, ...(a !== undefined ? { stopOpacity: a } : {}) }));
const lin = (id, [x1, y1, x2, y2], s, extra = {}) => h("linearGradient", { id, x1, y1, x2, y2, ...extra }, stops(...s));
const rad = (id, s, extra = {}) => h("radialGradient", { id, ...extra }, stops(...s));

// Cable geometry. Both USB-C ports live on the hidden back end (u = 0) now,
// so nothing is drawn there — only the white braided cable is visible,
// emerging from behind the box right at the back-right vertical edge
// (u = 0, v = 0), well clear of the LED on the top face.
// Cable: a 3D cubic (iso is affine, so projecting the control points is
// exact). It leaves the port low on that hidden end, at desk height, drops
// onto the desk plane immediately, then lies flat (z = 0) as it trails in a
// relaxed S past the box's visible right side toward the viewer, staying
// clear of the side face's silhouette the whole way.
const cab3 = [
  [0, 0, 2],
  [4, -14, 0.3],
  [14, -26, 0],
  [28, -34, 0],
];
const cab = cab3.map((p) => P(...p));
const cabD = `M${fx(cab[0][0])} ${fx(cab[0][1])} C${cab
  .slice(1)
  .map(([x, y]) => `${fx(x)} ${fx(y)}`)
  .join(" ")}`;
// The cable fades in from nothing over its first third (emerging from behind
// the box) and fades out again over its last ~15% (trailing off the desk
// out of frame), so it never reads as ending abruptly in mid-air at either end.
const fadeFrom = cab[0];
const fadeTo = cab[3];

const LED_U = 20; // 20% in from the back edge
const LED_V = 15; // ~22% in from the right side
const ledScreen = P(LED_U, LED_V, H + 0.6);

const SILHOUETTE = [P(0, W, H), P(0, 0, H), P(0, 0, 0), P(L, 0, 0), P(L, W, 0), P(L, W, H)];

/* ---------------------------------------------------------------- views -- */
// `iso` is the constants above, FROZEN: /business renders its static file and
// the hero is tuned around it, so its output must stay byte-identical. Don't
// route it through camera() — re-deriving the same numbers another way can
// flip a 4th-decimal digit.
const ISO = {
  name: "iso",
  sfx: "",
  VB_W,
  VB_H,
  P,
  M_TOP,
  M_SIDE,
  M_END,
  SILHOUETTE,
  cab,
  cabD,
  fadeFrom,
  fadeTo,
  ledScreen,
  cableBehind: false,
  cableStops: [[0, "#000000"], [0.32, "#FFFFFF"], [0.85, "#FFFFFF"], [1, "#000000"]],
  led: { glowR: 4.2, rx: 2.15, ry: 1.75, hx: 0.55, hy: 0.55, hrx: 0.6, hry: 0.42 },
};

/**
 * A generic orthographic camera around the same box. `yaw` swings the camera
 * from straight in front of the sticker end (0) toward the right long side;
 * `pitch` is its elevation above the desk. Any yaw in (0, 90deg) with
 * pitch > 0 sees exactly the faces the iso sees (top, right side, front end),
 * so the scene code and the silhouette hexagon are shared unchanged. The
 * viewBox is fitted to the art with `pad` all round.
 */
function camera({ name, yaw, pitch, pad, cab3: path3, cableStops }) {
  const sy = Math.sin(yaw);
  const cy = Math.cos(yaw);
  const sp = Math.sin(pitch);
  const cp = Math.cos(pitch);
  const proj = (u, v, z) => [S * (-sy * u - cy * v), S * (sp * cy * u - sp * sy * v - cp * z)];
  const hull = [[0, W, H], [0, 0, H], [0, 0, 0], [L, 0, 0], [L, W, 0], [L, W, H], ...path3].map((p) => proj(...p));
  const minX = Math.min(...hull.map((p) => p[0]));
  const minY = Math.min(...hull.map((p) => p[1]));
  const maxX = Math.max(...hull.map((p) => p[0]));
  const maxY = Math.max(...hull.map((p) => p[1]));
  const ox = pad - minX;
  const oy = pad - minY;
  const vP = (u, v, z) => {
    const [x, y] = proj(u, v, z);
    return [ox + x, oy + y];
  };
  // A face frame: origin o, unit axes e1/e2 (world vectors) -> SVG matrix.
  const face = (o, e1, e2) => mat(...proj(...e1), ...proj(...e2), ...vP(...o));
  const vCab = path3.map((p) => vP(...p));
  return {
    name,
    sfx: name[0].toUpperCase() + name.slice(1),
    VB_W: Math.ceil((maxX - minX + 2 * pad) * 2) / 2,
    VB_H: Math.ceil((maxY - minY + 2 * pad) * 2) / 2,
    P: vP,
    //                 origin      axis 1 (x)   axis 2 (y)   — same frames as the iso's M_*
    M_TOP: face([0, 0, H], [1, 0, 0], [0, 1, 0]),
    M_SIDE: face([L, 0, H], [-1, 0, 0], [0, 0, -1]),
    M_END: face([L, W, H], [0, -1, 0], [0, 0, -1]),
    SILHOUETTE: [vP(0, W, H), vP(0, 0, H), vP(0, 0, 0), vP(L, 0, 0), vP(L, W, 0), vP(L, W, H)],
    cab: vCab,
    cabD: `M${fx(vCab[0][0])} ${fx(vCab[0][1])} C${vCab
      .slice(1)
      .map(([x, y]) => `${fx(x)} ${fx(y)}`)
      .join(" ")}`,
    fadeFrom: vCab[0],
    fadeTo: vCab[3],
    ledScreen: vP(LED_U, LED_V, H + 0.6),
    cableBehind: true,
    cableStops,
    // A circle on the top face foreshortens by sin(pitch) vertically.
    led: { glowR: 4.2, rx: 2.15, ry: Number((2.15 * sp).toFixed(2)), hx: 0.55, hy: 0.45, hrx: 0.6, hry: Number((0.6 * sp).toFixed(2)) },
  };
}

// `front`: a steep 3/4 from the sticker end, for /customers section 5, where
// the phone rises toward the box from in front and below. The sticker is the
// near end, so the phone's top edge sits over the plain front face and the
// lockup + LED stay clear above it. The cable leaves the hidden back end, is
// drawn BEHIND the box (so no fade-in is needed where it emerges), and trails
// away up-right, off the desk.
const FRONT = camera({
  name: "front",
  // Yaw kept small: past ~12deg the sticker reads as a TILTED box once the
  // phone crops the sides away (tried 18deg first, 2026-09-10).
  yaw: (10 * Math.PI) / 180,
  pitch: (50 * Math.PI) / 180,
  pad: 3,
  cab3: [
    [0, 12, 1.5],
    [-10, 4, 0],
    [-10, -20, 0],
    [-26, -38, 0],
  ],
  cableStops: [[0, "#FFFFFF"], [0.8, "#FFFFFF"], [1, "#000000"]],
});

const VIEWS = [ISO, FRONT];

function buildScene(V) {
  const { P, M_TOP, M_SIDE, M_END, SILHOUETTE, ledScreen, cabD, fadeFrom, fadeTo } = V;
  const id = (n) => n + V.sfx;
  const url = (n) => `url(#${id(n)})`;

  const defs = h(
    "defs",
    {},
    // Top face: brightest toward the back vertex, falling off to the front.
    lin(id("rdhTopFill"), [0, 1, 1, 0], [[0, "#3A3D42"], [0.5, "#2A2D31"], [1, "#1F2124"]]),
    lin(id("rdhSideFill"), [0, 0, 0, 1], [[0, "#2B2E33"], [0.55, "#1E2023"], [1, "#151618"]]),
    lin(id("rdhSideSweep"), [0, 0, 1, 0], [[0, "#FFFFFF", 0.035], [0.6, "#FFFFFF", 0], [1, "#000000", 0.12]]),
    lin(id("rdhEndFill"), [0, 0, 0, 1], [[0, "#1D1F22"], [0.6, "#141517"], [1, "#0D0E0F"]]),
    lin(id("rdhEdgeDown"), [0, 0, 0, 1], [[0, RIM, 0.2], [1, RIM, 0]]),
    lin(id("rdhEdgeUp"), [0, 1, 0, 0], [[0, RIM, 0.14], [1, RIM, 0]]),
    lin(id("rdhEdgeLeft"), [0, 0, 1, 0], [[0, RIM, 0.13], [1, RIM, 0]]),
    lin(id("rdhEdgeRight"), [1, 0, 0, 0], [[0, RIM, 0.14], [1, RIM, 0]]),
    h(
      "pattern",
      { id: id("rdhLayers"), width: 8, height: 1.3, patternUnits: "userSpaceOnUse" },
      h("rect", { width: 8, height: 0.3, fill: "#FFFFFF", fillOpacity: 0.028 }),
      h("rect", { y: 0.66, width: 8, height: 0.24, fill: "#000000", fillOpacity: 0.1 })
    ),
    h(
      "pattern",
      { id: id("rdhHatch"), width: 1.25, height: 1.25, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" },
      h("rect", { width: 0.3, height: 1.25, fill: "#FFFFFF", fillOpacity: 0.022 })
    ),
    lin(id("rdhSticker"), [0, 0, 1, 1], [[0, "#F8F8F5"], [0.6, "#F3F3F0"], [1, "#E8E8E4"]]),
    rad(id("rdhLedHalo"), [[0, LED, 0.7], [0.35, LED, 0.28], [1, LED, 0]]),
    rad(id("rdhLedGlow"), [[0, LED, 0.5], [1, LED, 0]]),
    rad(id("rdhLedDome"), [[0, "#F4FFF8"], [0.28, "#B4F9D1"], [0.62, LED], [1, "#16924D"]], { cx: 0.4, cy: 0.36, r: 0.7 }),
    lin(
      id("rdhCableFade"),
      [fx(fadeFrom[0]), fx(fadeFrom[1]), fx(fadeTo[0]), fx(fadeTo[1])],
      V.cableStops,
      { gradientUnits: "userSpaceOnUse" }
    ),
    h(
      "mask",
      { id: id("rdhCableMask"), maskUnits: "userSpaceOnUse", x: 0, y: 0, width: V.VB_W, height: V.VB_H },
      h("rect", { width: V.VB_W, height: V.VB_H, fill: url("rdhCableFade") })
    ),
    h("clipPath", { id: id("rdhBodyClip") }, h("path", { d: roundedPoly(SILHOUETTE, 1.5) }))
  );

  /* ------------------------------------------------------------------ logo -- */
  // FullLogo, verbatim. Inline JSX gets the component; the static file gets its
  // paths lifted out of components/brand/full-logo.tsx (so it can't drift).
  const LOGO_W = 52;
  const LOGO_VB = [76.5, 187.4, 1767.1, 705.1];
  const LOGO_H = (LOGO_W * LOGO_VB[3]) / LOGO_VB[2];
  function logoSvgString() {
    const src = readFileSync(LOGO_SRC, "utf8");
    const body = src.slice(src.indexOf("export function FullLogo("), src.indexOf("export function FullLogoOnDark"));
    const colours = { letters: INK, body: ORANGE, lines: PAPER };
    const paths = [...body.matchAll(/<path\b([\s\S]*?)\/>/g)].map(([, a]) => {
      const fill = colours[/fill=\{(\w+)\}/.exec(a)[1]];
      const stroke = /stroke=\{(\w+)\}/.exec(a);
      const sw = /strokeWidth=\{([\d.]+)\}/.exec(a);
      const d = /\bd="([^"]+)"/.exec(a)[1];
      const strokeAttrs = stroke ? ` stroke="${colours[stroke[1]]}" stroke-width="${sw[1]}" stroke-miterlimit="10"` : "";
      return `  <path fill="${fill}"${strokeAttrs} d="${d}"/>`;
    });
    if (paths.length !== 13) throw new Error(`expected 13 FullLogo paths, found ${paths.length}`);
    return `<svg viewBox="${LOGO_VB.join(" ")}" width="${LOGO_W}" height="${fx(LOGO_H, 3)}">\n${paths.join("\n")}\n</svg>`;
  }

  /* ----------------------------------------------------------------- scene -- */
  // Sticker: front ~42% of the length, ~4% black margin each side. Its own frame
  // reads from the front end: x runs across the width (-v), y toward the front (+u).
  const ST_M = 2.7;
  const ST_W = W - 2 * ST_M;
  const ST_H = 40.5;
  const ST_U0 = L - 2.4 - ST_H;
  const SEAM_T = 4.2; // lid seam, ~10% of the height down

  const seam = (len, lightOpacity) => [
    h("path", { d: `M0 ${SEAM_T} H${len}`, stroke: "#040505", strokeWidth: 0.55, strokeOpacity: 0.9 }),
    h("path", { d: `M0 ${SEAM_T + 0.55} H${len}`, stroke: "#FFFFFF", strokeWidth: 0.35, strokeOpacity: lightOpacity }),
  ];
  const rim = (list, opacity, width) =>
    h("path", { d: pts(list, false), fill: "none", stroke: RIM, strokeOpacity: opacity, strokeWidth: width, strokeLinejoin: "round" });

  const faces = h(
    "g",
    { clipPath: url("rdhBodyClip") },
    h("path", { d: pts(SILHOUETTE), fill: "#121315" }),
    note("Right long side: the lit face. Print layer lines + lid seam."),
    h(
      "g",
      { transform: M_SIDE },
      h("rect", { width: L, height: H, fill: url("rdhSideFill") }),
      h("rect", { width: L, height: H, fill: url("rdhSideSweep") }),
      h("rect", { width: L, height: H, fill: url("rdhLayers") }),
      h("rect", { width: L, height: 2.6, fill: url("rdhEdgeDown") }),
      h("rect", { width: 2.2, height: H, fill: url("rdhEdgeLeft") }),
      seam(L, 0.09)
    ),
    note("Front end: plain enclosure — the ports live on the hidden back end."),
    h(
      "g",
      { transform: M_END },
      h("rect", { width: W, height: H, fill: url("rdhEndFill") }),
      h("rect", { width: W, height: H, fill: url("rdhLayers") }),
      h("rect", { width: W, height: 2.6, fill: url("rdhEdgeDown") }),
      h("rect", { x: W - 2, width: 2, height: H, fill: url("rdhEdgeRight") }),
      seam(W, 0.07)
    ),
    note("Top face: fine diagonal top-layer infill, eased edges."),
    h(
      "g",
      { transform: M_TOP },
      h("rect", { width: L, height: W, fill: url("rdhTopFill") }),
      h("rect", { width: L, height: W, fill: url("rdhHatch") }),
      h("rect", { x: L - 2.4, width: 2.4, height: W, fill: url("rdhEdgeRight") }),
      h("rect", { width: L, height: 2.4, fill: url("rdhEdgeDown") }),
      h("rect", { width: 2, height: W, fill: url("rdhEdgeLeft") }),
      h("rect", { y: W - 2, width: L, height: 2, fill: url("rdhEdgeUp") })
    ),
    note("Cool rim light on the top edges (keeps the black box off a navy page)."),
    rim([P(L, W, H), P(0, W, H), P(0, 0, H)], 0.55, 0.7),
    rim([P(L, W, H), P(L, 0, H), P(0, 0, H)], 0.5, 0.5),
    rim([P(L, 0, H), P(L, 0, 0)], 0.16, 0.5),
    rim([P(L, W, H - 0.4), P(L, W, 0)], 0.2, 0.6),
    rim([P(0, 0, H - 0.4), P(0, 0, 0)], 0.2, 0.6)
  );

  const sticker = h(
    "g",
    { transform: `${M_TOP} ${mat(0, -1, 1, 0, ST_U0, W - ST_M)}` },
    h("rect", { x: -0.35, y: -0.2, width: ST_W + 0.7, height: ST_H + 0.75, rx: 1.9, fill: "#000000", fillOpacity: 0.45 }),
    h("rect", { width: ST_W, height: ST_H, rx: 1.5, fill: url("rdhSticker") }),
    h("rect", {
      width: ST_W,
      height: ST_H,
      rx: 1.5,
      fill: "none",
      stroke: "#000000",
      strokeOpacity: 0.12,
      strokeWidth: 0.3,
    }),
    h(
      "g",
      { transform: `translate(${fx((ST_W - LOGO_W) / 2)},${fx((ST_H - LOGO_H) / 2)})` },
      raw(logoSvgString(), `<FullLogo size={${LOGO_W}} letters="${INK}" body="${ORANGE}" lines="${PAPER}" />`)
    )
  );

  const led = [
    h(
      "g",
      { transform: M_TOP },
      raw(null, `{/* The glow is the element the tap pulses. customer.module.css scales it\n    about 29px 59px, so it stays at (29,59) and the wrapper moves it. */}`),
      h(
        "g",
        { transform: `translate(${LED_U - 29},${LED_V - 59})` },
        h("circle", {
          className: { jsx: "`${styles.rdhLed} ${pulsing ? styles.rdhLedPulsing : \"\"}`" },
          cx: 29,
          cy: 59,
          r: 9,
          fill: url("rdhLedHalo"),
        }),
        h("circle", { cx: 29, cy: 59, r: 3.1, fill: "#08090A", stroke: "#FFFFFF", strokeOpacity: 0.1, strokeWidth: 0.35 })
      )
    ),
    h("circle", { cx: fx(ledScreen[0]), cy: fx(ledScreen[1]), r: V.led.glowR, fill: url("rdhLedGlow") }),
    h("ellipse", { cx: fx(ledScreen[0]), cy: fx(ledScreen[1]), rx: V.led.rx, ry: V.led.ry, fill: url("rdhLedDome") }),
    h("ellipse", {
      cx: fx(ledScreen[0] - V.led.hx),
      cy: fx(ledScreen[1] - V.led.hy),
      rx: V.led.hrx,
      ry: V.led.hry,
      fill: "#FFFFFF",
      fillOpacity: 0.9,
    }),
  ];

  const cable = [
    note("White braided cable, emerging from behind the box, dropping onto the"),
    note("desk and fading in/out at both ends. A faint contact shadow grounds it."),
    h(
      "g",
      { mask: url("rdhCableMask"), fill: "none", strokeLinecap: "round" },
      h("path", { d: cabD, stroke: "#000000", strokeWidth: 4.6, strokeOpacity: 0.1, transform: "translate(0,1.6)" }),
      h("path", { d: cabD, stroke: "#9D9E99", strokeWidth: 3.5, transform: "translate(0,0.35)" }),
      h("path", { d: cabD, stroke: "#ECECE8", strokeWidth: 3.1 }),
      h("path", { d: cabD, stroke: "#B5B6B0", strokeWidth: 2.9, strokeDasharray: "0.42 0.5", strokeOpacity: 0.55 }),
      h("path", {
        d: cabD,
        stroke: "#FFFFFF",
        strokeWidth: 2.0,
        strokeDasharray: "0.25 0.67",
        strokeDashoffset: 0.45,
        strokeOpacity: 0.6,
      }),
      h("path", { d: cabD, stroke: "#C9CAC4", strokeWidth: 1.1, strokeOpacity: 0.55, transform: "translate(0,0.95)" }),
      h("path", { d: cabD, stroke: "#FFFFFF", strokeWidth: 0.7, strokeOpacity: 0.95, transform: "translate(0,-0.8)" })
    ),
  ];

  return V.cableBehind ? [defs, ...cable, faces, sticker, ...led] : [defs, faces, sticker, ...led, ...cable];
}

const ARIA =
  "The PapeX RDH: a small matte-black box with a white PapeX label on its top, a green status light, and a white USB-C cable plugged into one end.";

const scene = buildScene(ISO);

/* ---------------------------------------------------------------- output -- */
const svgFor = (V, sceneNodes) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${V.VB_W} ${V.VB_H}" role="img" aria-label="${ARIA}">
  <!-- GENERATED by scripts/generate-rdh-device.mjs — do not hand-edit.
       Same artwork as components/paths/customer/RdhDevice.tsx (static LED). -->
${sceneNodes.map((n) => ser(n, "svg", "  ")).filter((s) => s.trim()).join("\n")}
</svg>
`;
const svgOut = svgFor(ISO, scene);

const EXTRA = VIEWS.filter((V) => V !== ISO);
const compName = (V) => `RdhDevice${V.sfx}`;
const viewUnion = VIEWS.map((V) => `"${V.name}"`).join(" | ");

const extraTsx = EXTRA.map(
  (V) => `
/** \`view="${V.name}"\` — same model, another camera (see camera() in the generator). */
function ${compName(V)}({ pulsing }: { pulsing: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${V.VB_W} ${V.VB_H}"
      role="img"
      aria-label="${ARIA}"
    >
${buildScene(V).map((n) => ser(n, "jsx", "      ")).filter((s) => s.trim()).join("\n")}
    </svg>
  );
}
`
).join("");

const tsxOut = `// GENERATED by scripts/generate-rdh-device.mjs — edit the script, not this file.
import { FullLogo } from "@/components/brand/full-logo";
import styles from "./customer.module.css";

/** Camera angles the generator emits. "iso" is the hero / static-file view. */
export type RdhView = ${viewUnion};

/**
 * Landmarks in each view's viewBox, for callers that seat other art against
 * the box (section 5 tucks the phone under the "front" view): the box's
 * horizontal centre (the viewBox also holds the trailing cable, so its centre
 * is NOT the box's), and the y of the top face's nearest corner — everything
 * above it is top face, sticker and LED. Regenerated with the art.
 */
export const RDH_VIEWS = {
${VIEWS.map((V) => `  ${V.name}: { width: ${V.VB_W}, height: ${V.VB_H}, boxCentreX: ${fx((V.P(L, W, 0)[0] + V.P(0, 0, 0)[0]) / 2)}, frontEdgeY: ${fx(V.P(L, 0, H)[1])} },`).join("\n")}
} as const satisfies Record<RdhView, { width: number; height: number; boxCentreX: number; frontEdgeY: number }>;

/**
 * The PapeX RDH, as the pilot unit actually ships: a matte-black FDM-printed
 * box (68 x 100 x 42 mm, separate lid, print layer lines), a white PapeX
 * sticker over the front of the lid, a green status LED near the back-right
 * corner, and two USB-C ports on the back end (opposite the sticker) — hidden
 * from this camera, so only the white braided cable leaving one of them is
 * drawn. Reference: Nico's photos of the pilot unit. The orange CAD renders
 * in Papex_RDH_Firmware/docs/enclosure/rdh_final_*.png are a FUTURE enclosure
 * concept, not what ships — don't draw from them.
 *
 * True isometric projection, seen from the front-right (so the /customers hero
 * phone, which overlaps the device's upper-left, never hides the LED). Every
 * marking is drawn in its face's own coordinate matrix so it foreshortens
 * correctly; the sticker carries the real lockup (FullLogo, canonical colours).
 *
 * Inlined (not <img>) so \`.rdhLed\` can pulse when the hero phone taps down.
 * public/product/rdh-device.svg is the same artwork for /business; both files
 * come from scripts/generate-rdh-device.mjs, so regenerate rather than edit.
 * The cool rim light is deliberate: without it the box vanishes on navy.
 *
 * \`view\` picks another camera on the SAME model (${EXTRA.map((V) => `"${V.name}"`).join(", ")}). Each view
 * keeps the LED glow at local (29,59) inside its own top-face matrix, so
 * \`.rdhLed\`'s pivot is right in every view, and suffixes its gradient/clip
 * ids so two views can share a page.
 */
export function RdhDevice({ pulsing = false, view = "iso" }: { pulsing?: boolean; view?: RdhView }) {
${EXTRA.map((V) => `  if (view === "${V.name}") return <${compName(V)} pulsing={pulsing} />;\n`).join("")}  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${VB_W} ${VB_H}"
      role="img"
      aria-label="${ARIA}"
    >
${scene.map((n) => ser(n, "jsx", "      ")).filter((s) => s.trim()).join("\n")}
    </svg>
  );
}
${extraTsx}`;

writeFileSync(OUT_SVG, svgOut);
writeFileSync(OUT_TSX, tsxOut);

if (process.env.RDH_PREVIEW) {
  for (const V of VIEWS) {
    const f = path.join(process.env.RDH_PREVIEW, `rdh-${V.name}.svg`);
    writeFileSync(f, svgFor(V, V === ISO ? scene : buildScene(V)));
    console.log(`preview ${f}`);
  }
}

// Bounds report, so a geometry change can't silently spill out of the viewBox.
for (const V of VIEWS) {
  const all = [...V.SILHOUETTE, ...V.cab];
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  console.log(`[${V.name}] viewBox 0 0 ${V.VB_W} ${V.VB_H}`);
  console.log(`[${V.name}] art bounds x ${fx(Math.min(...xs))}..${fx(Math.max(...xs))}  y ${fx(Math.min(...ys))}..${fx(Math.max(...ys))}`);
  console.log(`[${V.name}] LED centre ${fx(V.ledScreen[0])},${fx(V.ledScreen[1])}`);
}
console.log(`wrote ${path.relative(ROOT, OUT_TSX)} and ${path.relative(ROOT, OUT_SVG)}`);
