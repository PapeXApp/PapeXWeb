# HANDOFF — PapeX website, round 2 (flow, depth, real device, section 5 scroll)
Written 2026-09-10 (evening). Supersedes `2026-09-10-HANDOFF-customer-path-polish.md` for current state.

Operator is Nico (founder, moves fast, not a full-time engineer). Plain English, business framing,
recommend rather than survey. He reviews on his own screen and sends terse feedback — act on it.

## 1. Where the work lives
- Repo `PapeXWeb/`, branch `feat/forked-landing-redesign-v2`. Nothing pushed; main untouched
  (push to main = live deploy, no CI).
- Commits this session, newest first:
  - `670f864` flip cards: dimensional coloured scenes + real axe
  - `d30c59f` section 5 scroll walkthrough, RDH second angle, one colour swap, tighter rhythm
  - `8525f39` footer fade scrim restored, watermark kept off headlines
  - `213a63e` hero colours follow the fork, scroll-blended ground, depth kit, sourced flip cards, real RDH box
  - `23358f0` checkpoint of the previous session's batches 2–4
- Working tree: only peer-session files are dirty — `.claude/launch.json`, `app/merchant/AuthContext.tsx`,
  `app/merchant/insights/BarChart.tsx`. NOT ours; never stage them. New uncommitted: this file and
  `.claude/tools/` (screenshot scripts, see §5).
- Plan with decisions + a16z study: `../.claude/plans/2026-09-10-website-flow-and-depth.md`.
- Everything in §2 was independently verified (papex-verifier, all criteria CONFIRMED).

## 2. What's built (and the decisions behind it)
- **Hero colours match the fork**: top navy half → `/business` (navy hero), bottom light half →
  `/customers` (light hero). Nav glass starts correct. CLAUDE.md updated.
- **One scroll-blended ground** (`components/paths/shared/FlowGround.tsx`, `FlowSection.tsx`,
  `flow.module.css`): sections are transparent and declare `ground="light"|"navy"`; an
  IntersectionObserver on a mid-viewport band crossfades the page colour AND text colours (`--flow-*`
  registered properties, 700ms). No rAF. Footer counts as a navy tail.
  - Nico: "love the colour swap but not everywhere" → /customers is light for Hero…05, navy only for
    06 Proof + 07 Vision into the footer (one swap). To change: the `ground` prop per section.
- **Depth kit, once per page** (inside FlowGround): grain, 3 blurred aurora pools, gutter guide rails
  with crosshair + index at each section, one travelling plane watermark. Kit is masked out over the
  last 320px; the bottom scrim is a SIBLING of the kit (inside it, the mask erased it — that bug
  happened). Footer top border hidden only on path homes via `main:has(> .flow) + .rd-footer`.
  - Watermark: 520px, `right:-22vw`, vertical drift only, leading third masked — Nico's rule is
    nothing decorative behind text. Old diagonal line pair + per-section `Atmosphere.tsx` are deleted.
- **Motion**: blur-in `Reveal`, `ScrollLit` statements, pointer-lit cards, `useSafeReducedMotion`
  (fixed a reduced-motion hydration error), mask reveals that never opened (fixed).
- **Type**: `--font-label` = Geist Mono for labels. `--font-mono` stays Courier ON PURPOSE — the hero
  receipt demo's 32 columns are sized on it.
- **Flip cards** (`FlipCards.tsx` + `flipcards.module.css`): sourced figures in `content.ts` —
  620M lbs paper (Epson/Grand View 2025), 3.7M trees (Green America 2022), $540M+ business spend
  (Epson/Grand View 2025). Rejected-figure notes are in the content.ts comment — never reintroduce
  256B / 10M trees / $1.64B. Rich SVG scenes (printer + pile, forest + real axe, till).
- **Proof**: product facts 1 / 0 / 2 (tap, apps to download, ways to open). Press row removed until
  Nico supplies logos we can name.
- **RDH device** matches Nico's photos of the pilot unit: matte-black print, white sticker with the
  real lockup, green LED, cable leaving the LED end. Single source `scripts/generate-rdh-device.mjs`
  → `RdhDevice.tsx` + `public/product/rdh-device.svg`. Views: `iso` (hero, /business) and `front`
  (section 5). Edit the script, never the outputs; iso output must stay byte-identical.
  The orange CAD renders in the firmware repo are a future concept, not what ships.
- **Section 5 How it works**: desktop (≥821w, ≥600h, motion allowed) pins; scroll walks steps
  1→2→3 (70vh/step) with the tap/LED pulse, then releases. Tap/click/keys/step-list smooth-scroll
  to the matching runway position (scroll is the single source of truth); last tap continues to
  section 6. Mobile + reduced motion: tap-only.
- **Rhythm**: section gaps ≈186–204px at 1440 (was 317 between 03→04).

## 3. Open — pick up here
| Item | Notes |
|---|---|
| **Real app screens** | Nico offered iPhone screenshots + recordings; asked for: receipt list, opened receipt, search results, share sheet, App Clip screen after a tap, plus a 10–15s recording. Not received yet. Replace the markup screens in `WalkPhone.tsx` (steps 2–3) and `FeatureScreens.tsx` (search + share sheet); keep `PhoneChrome` as the frame. The HERO demo phone stays live-decoded through `lib/escpos.ts` (App Clip palette on purpose). |
| Press logos | Nico supplies; re-add the row only with nameable outlets. |
| Nico's own-screen check | Section 5 scroll feel, flip scenes in motion, pointer-lit hover, ground crossfade — can't be judged from stills. |
| /business | Has the ground/kit and navy hero but got none of round 2's /customers polish; ask before extending. |
| Plane resting opacity on the fork, `.grain` blend through the commit | Still from the first handoff; need his eyes. |
| Brand Kit doc | Still states the old palette; never delete from the team OneDrive without approval. |

## 4. Traps
- **Shared worktree**: other sessions dirty `app/merchant/**` mid-session. Never `git add -A`; stage
  explicit paths; check `git show --stat HEAD` after every commit (a peer file was swept in once
  and had to be amended out).
- **Dev server**: `preview_start` name `papex-web` → 3001. Another chat may own 3001; its server can
  vanish mid-session (a worker got blocked). If `curl localhost:3001` → 000, preview_start it here.
  Never `npm run build` while it runs (shared `.next` → 500s; recover: stop, `rm -rf .next`, restart).
- Shell cwd resets to the workspace root between Bash calls — `cd PapeXWeb` in the same command
  (several tsc/grep runs silently ran in the wrong folder this session).
- CSS Modules does not rename a keyframe inside an `animation` shorthand containing `var()` — use
  literal values or `animation-name`.
- Reveal writes inline transform → wrap cards so the wrapper takes the reveal and the card keeps `:hover`.
- `grep -rn "papex-receipt" components/` must stay empty.
- SendMessage is disabled in this environment — you can't talk to running agents; brief them fully.

## 5. Verification toolkit (`.claude/tools/`, Node 22, no deps)
The Browser pane is usually hidden (black screenshots). Real headless Chrome works:
- `node .claude/tools/shoot.mjs <url> <outPrefix> [w] [h] [max]` — viewport-by-viewport (fires reveals).
- `node .claude/tools/shootAt.mjs <url> <prefix> <w> <h> <y1,y2|footer:OFFSET,...>` — exact positions.
- `node .claude/tools/shootflip.mjs <url> <prefix> [w] [h] [ms,ms,...] [reduced]` — clicks flip cards, captures over time.
- `node .claude/tools/gap.mjs` — content gaps between sections at 1440 (heuristic; pinned runway and
  06→07 values are noise).
Write outputs to the session scratchpad, then Read the PNGs. Gate = tsc + per-file lint + routes 200
+ real-Chrome shots at 1440×900 and 390×844 + a papex-verifier pass.
