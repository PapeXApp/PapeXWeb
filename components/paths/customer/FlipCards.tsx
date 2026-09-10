"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
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

// ---------------------------------------------------------------------------
// card "print" — a printer spits slips faster and faster (220ms → 36ms), then the roll runs out
// ---------------------------------------------------------------------------
const SLIP_COUNT = 20;
const PRINT_SLIPS = (() => {
  const out: { delay: number; dx: number; rot: number }[] = [];
  let t = 0;
  for (let k = 0; k < SLIP_COUNT; k++) {
    t += 220 - 184 * (k / (SLIP_COUNT - 1));
    const sign = k % 2 ? 1 : -1;
    out.push({ delay: Math.round(t), dx: sign * (10 + ((k * 7) % 58)), rot: sign * (10 + ((k * 11) % 44)) });
  }
  return out;
})();
const PAPER_OUT_AT = PRINT_SLIPS[PRINT_SLIPS.length - 1].delay + 260;
const PRINT_DURATION = PAPER_OUT_AT + 900;

function slipPath(x: number, y: number, w: number, h: number, teeth: number) {
  const tw = w / teeth;
  let d = `M${x} ${y}H${x + w}V${y + h}`;
  for (let i = 0; i < teeth; i++) d += `l${r1(-tw / 2)} 3l${r1(-tw / 2)} -3`;
  return `${d}Z`;
}
const SLIP_D = slipPath(122, 58, 36, 46, 6);

function PrintScene() {
  const clip = `fc-slot-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="0 0 280 320" className={styles.sceneSvg} aria-hidden="true">
      <defs>
        {/* slips only exist below the slot — nothing peeks over the printer while they wait */}
        <clipPath id={clip}>
          <rect x="0" y="60" width="280" height="260" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
      {PRINT_SLIPS.map((s, i) => (
        <g
          key={i}
          className={styles.slip}
          style={{ "--dx": `${s.dx}px`, "--rot": `${s.rot}deg`, animationDelay: `${s.delay}ms` } as CSSProperties}
        >
          <path d={SLIP_D} className={styles.paper} />
          <path d="M129 68H147M129 75H151M129 82H143" className={styles.inkSoft} />
          <path d="M129 93H151" className={styles.ink} />
        </g>
      ))}
      </g>
      {/* printer body sits above the slips so they emerge from the slot */}
      <rect x="84" y="20" width="112" height="48" rx="9" className={styles.paper} />
      <path d="M98 34H138" className={styles.inkSoft} />
      <rect x="102" y="58" width="76" height="5" rx="2.5" className={styles.slot} />
      <circle
        cx="180"
        cy="34"
        r="3.2"
        className={cn(styles.paper, styles.led)}
        style={{ animationDelay: `${PAPER_OUT_AT}ms` }}
      />
      <text
        x="140"
        y="12"
        textAnchor="middle"
        className={styles.paperOut}
        style={{ animationDelay: `${PAPER_OUT_AT}ms` }}
      >
        PAPER OUT
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// card "forest" — a row of trees grows in, a cut sweeps the row, they fall, stumps remain
// ---------------------------------------------------------------------------
function treeParts(cx: number, base: number, h: number) {
  const w = h * 0.58;
  const top = base - h;
  const cb = base - h * 0.16;
  const t1 = top + h * 0.44;
  const canopy =
    `M${r1(cx)} ${r1(top)}L${r1(cx + w * 0.3)} ${r1(t1)}L${r1(cx + w * 0.17)} ${r1(t1)}` +
    `L${r1(cx + w / 2)} ${r1(cb)}L${r1(cx - w / 2)} ${r1(cb)}L${r1(cx - w * 0.17)} ${r1(t1)}` +
    `L${r1(cx - w * 0.3)} ${r1(t1)}Z`;
  return { canopy, trunk: `M${r1(cx)} ${r1(cb)}V${base}` };
}

const GROUND_Y = 236;
const TREE_HEIGHTS = [78, 104, 88, 118, 94, 110, 82, 100, 76];
const GROW_STAGGER = 70;
const SWEEP_START = TREE_HEIGHTS.length * GROW_STAGGER + 520;
const SWEEP_MS = 760;
const SWEEP_FROM = -40;
const SWEEP_TO = 320;
const FOREST_TREES = TREE_HEIGHTS.map((h, k) => {
  const cx = 32 + k * 27;
  return {
    cx,
    ...treeParts(cx, GROUND_Y, h),
    growDelay: k * GROW_STAGGER,
    // each tree falls as the sweep passes its trunk
    fellDelay: Math.round(SWEEP_START + ((cx - SWEEP_FROM) / (SWEEP_TO - SWEEP_FROM)) * SWEEP_MS),
  };
});
const FOREST_DURATION = SWEEP_START + SWEEP_MS + 700;

function ForestScene() {
  return (
    <svg viewBox="0 0 280 320" className={styles.sceneSvg} aria-hidden="true">
      <path d={`M12 ${GROUND_Y}H268`} className={styles.inkSoft} />
      {FOREST_TREES.map((t, i) => (
        <g key={i}>
          <g className={styles.stump} style={{ animationDelay: `${t.fellDelay}ms` }}>
            <rect x={t.cx - 3.5} y={GROUND_Y - 7} width="7" height="7" rx="1" className={styles.paper} />
            <path d={`M${t.cx - 3.5} ${GROUND_Y - 7}H${t.cx + 3.5}`} className={styles.accent} />
          </g>
          <g className={styles.treeGrow} style={{ animationDelay: `${t.growDelay}ms` }}>
            <g className={styles.treeFell} style={{ animationDelay: `${t.fellDelay}ms` }}>
              <path d={t.trunk} className={styles.ink} />
              <path d={t.canopy} className={styles.paper} />
            </g>
          </g>
        </g>
      ))}
      <path
        d={`M${SWEEP_FROM} ${GROUND_Y - 4}h30`}
        className={cn(styles.accent, styles.sweep)}
        style={{ animationDelay: `${SWEEP_START}ms`, animationDuration: `${SWEEP_MS}ms` } as CSSProperties}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// card "proof" — "What do businesses pay?": a roll unspools while the till total climbs
// ---------------------------------------------------------------------------
const COST_FEED_MS = 2500;
const COST_TICK_TARGET = 540_000_000;
const COST_DURATION = COST_FEED_MS + 500;

const STRIP_L = 560;
const STRIP_D = (() => {
  const x = 80;
  const w = 60;
  const yEnd = 64; // lead edge starts tucked under the roll
  let d = `M${x} ${yEnd - STRIP_L}H${x + w}V${yEnd}`;
  const teeth = 8;
  for (let i = 0; i < teeth; i++) d += `l${-w / teeth / 2} 3l${-w / teeth / 2} -3`;
  return `${d}Z`;
})();
const STRIP_ROWS = Array.from({ length: 44 }, (_, j) => {
  const y = 64 - 16 - j * 12;
  const len = 14 + ((j * 13) % 20);
  const price = 7 + ((j * 5) % 7);
  return `M87 ${y}H${87 + len}M${133 - price} ${y}H133`;
}).join("");

function CostScene() {
  const clip = `fc-clip-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
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
      <defs>
        <clipPath id={clip}>
          <rect x="0" y="58" width="280" height="262" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <g className={styles.feed} style={{ animationDuration: `${COST_FEED_MS}ms` }}>
          <path d={STRIP_D} className={styles.paper} />
          <path d={STRIP_ROWS} className={styles.inkSoft} />
        </g>
      </g>
      {/* the roll, drawn over the strip's root; it thins as it unspools */}
      <g className={styles.roll} style={{ animationDuration: `${COST_FEED_MS}ms` }}>
        <path d="M76 26H146a7 20 0 0 1 0 40H76Z" className={styles.paper} />
        <ellipse cx="76" cy="46" rx="7" ry="20" className={styles.paper} />
        <ellipse cx="76" cy="46" rx="2.4" ry="7" className={styles.inkSoft} />
      </g>
      {/* the till */}
      <rect x="164" y="118" width="100" height="58" rx="8" className={styles.paper} />
      <text x="176" y="138" className={styles.tillLabel}>
        TOTAL
      </text>
      <text x="176" y="161" ref={total} className={styles.tillTotal}>
        $0
      </text>
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={170 + col * 30}
            y={190 + row * 18}
            width="24"
            height="11"
            rx="3"
            className={styles.key}
          />
        )),
      )}
      <path d="M164 256H264" className={styles.inkSoft} />
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
// front illustrations — same line language as the scenes: 1.5px navy, one orange accent
// ---------------------------------------------------------------------------
const FRONT_TREES = [treeParts(72, 82, 54), treeParts(100, 82, 68)];

function FrontArt({ id }: { id: ProblemCardId }) {
  if (id === "print") {
    return (
      <svg viewBox="0 0 200 100" className={styles.artSvg} aria-hidden="true">
        <ellipse cx="100" cy="91" rx="50" ry="2.5" className={styles.shadow} />
        <path d="M76 50V14l4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4V50" className={styles.paper} />
        <path d="M84 22H104M84 28H116M84 34H110" className={styles.inkSoft} />
        <path d="M84 42H116" className={styles.accent} />
        <rect x="56" y="50" width="88" height="36" rx="7" className={styles.paper} />
        <rect x="68" y="46" width="64" height="7" rx="3.5" className={styles.paper} />
        <path d="M68 68H94" className={styles.inkSoft} />
        <circle cx="130" cy="68" r="3" className={styles.paper} />
      </svg>
    );
  }
  if (id === "forest") {
    return (
      <svg viewBox="0 0 200 100" className={styles.artSvg} aria-hidden="true">
        <path d="M40 82H160" className={styles.inkSoft} />
        {FRONT_TREES.map((t, i) => (
          <g key={i}>
            <path d={t.trunk} className={styles.ink} />
            <path d={t.canopy} className={styles.paper} />
          </g>
        ))}
        <rect x="126" y="74" width="10" height="8" rx="1.2" className={styles.paper} />
        <ellipse cx="131" cy="74" rx="5" ry="1.6" className={cn(styles.paper, styles.accentStroke)} />
        <path d="M141 81l14-3.5" className={styles.inkSoft} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 100" className={styles.artSvg} aria-hidden="true">
      <ellipse cx="104" cy="92" rx="44" ry="2.5" className={styles.shadow} />
      <path d="M72 30V82l4.5 3 4.5-3 4.5 3 4.5-3 4.5 3 4.5-3 4.5 3 4.5-3V30" className={styles.paper} />
      <path d="M80 46H98M80 53H104M80 60H94M80 70H108" className={styles.inkSoft} />
      <path d="M68 10H112a6 14 0 0 1 0 28H68Z" className={styles.paper} />
      <ellipse cx="68" cy="24" rx="6" ry="14" className={styles.paper} />
      <ellipse cx="68" cy="24" rx="2" ry="5" className={styles.inkSoft} />
      <circle cx="140" cy="68" r="15" className={cn(styles.paper, styles.accentStroke)} />
      <text x="140" y="73" textAnchor="middle" className={styles.coin}>
        $
      </text>
    </svg>
  );
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
            <p className={styles.source}>Source — {source}</p>
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
