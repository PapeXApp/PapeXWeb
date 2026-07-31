# Handoff: PapeX Homepage — Forked Landing (Customers / Business)

## Overview

A redesigned PapeX homepage built around a **forking landing screen**. Instead of one homepage, the site opens on a full-viewport split: the top half is *For Customers* (dark navy), the bottom half is *For Business* (light). A **single gesture commits** the visitor to one of two distinct "homes." Once committed, scrolling back up does **not** return to the split — only clicking the logo or the "Home" nav item does. This is deliberate: the split is a one-time choice, not a scroll position.

Each path is a full homepage: hero, problem/value framing, feature detail, a scroll-driven "how it works" sequence, social proof, and CTA + footer.

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes that demonstrate intended look, motion, and behavior. **They are not production code to copy directly.**

The task is to **recreate these designs inside the existing `papexweb` codebase**, using its established framework, routing, component patterns, styling approach, and libraries. Match the visual and motion spec documented below; do not port the prototype's DOM or its runtime.

Notes on the prototype's implementation that should **not** carry over:
- It is authored as a "Design Component" (`.dc.html`) with a small custom template runtime (`support.js`). That runtime is a prototyping tool — irrelevant to production.
- All styling is **inline** (a constraint of the prototyping environment). In `papexweb`, use whatever the codebase already uses — CSS modules, Tailwind, styled-components, etc.
- Motion is hand-rolled with `IntersectionObserver`, `requestAnimationFrame`, and direct style mutation. If `papexweb` already has an animation library (Framer Motion, GSAP, etc.), prefer it.

**Requested outcome:** implement this as a **fully functional branch that can be run and viewed** in `papexweb`.

### Recommended files to read, in order
1. `PapeX Homepage.html` — **open this in a browser first.** Fully self-contained and offline; the fastest way to understand the intended experience. Scroll up/down on the split, then explore both paths.
2. `source/PapeX Home.dc.html` — the authored source. The `<x-dc>` template holds the markup; the `<script data-dc-script>` block holds the logic class (state, scroll engine, motion helpers). Best reference for exact values and animation math.
3. `source/PapeX Footer.dc.html` — the shared footer.
4. `PapeX_Website_PRD.md` — original product requirements, for intent and content strategy beyond this page.

## Fidelity

**High-fidelity (hifi).** Colors, typography, spacing, motion timing, and easing are final and intentional. Recreate the UI faithfully — but express it through `papexweb`'s existing design system and component library rather than duplicating literal values where a token already exists.

Two deliberate exceptions, which are **placeholders by design**:
- **Copy** is polished-but-provisional. Stats (`256B`, `10M`, `1,284,920`, `4,210`, `342`), the merchant/press logos, and testimonial slots are illustrative. Wire them to real data/CMS; do not treat the numbers as factual.
- **Imagery** is intentionally striped placeholder boxes with monospace labels (e.g. `[ app screen: receipt list + search ]`, `[ RDH hardware render ]`, `[ press logo ]`). Real assets are pending. Keep the boxes' dimensions and aspect ratios as layout reservations. The phone/receipt/RDH UI *is* styled in detail, because the tap moment is the core narrative.

---

## Design Tokens

### Colors
| Token | Hex | Usage |
|---|---|---|
| Navy (primary bg) | `#00121D` | Dark sections, customer path, text on light |
| Navy raised | `#0a2431` | Phone chassis, placeholder stripes |
| Navy deep | `#04161f` | Phone chassis gradient end, notch |
| Navy alt | `#0c2937` | Placeholder stripe alternate |
| Navy glass | `rgba(8,26,37,.5)` | Nav bubble fill |
| Orange (accent) | `#EB7100` | CTAs, eyebrows, stats, marquee bg, active states |
| Orange dark | `#c85f00` | Logo plane underside |
| Off-white | `#F5F5F5` | Light sections, text on dark |
| White | `#FFFFFF` | Cards, elevated surfaces |
| Body text on light | `#4a4a4a` / `#5a5a5a` | Paragraphs |
| Muted on light | `#8a8a8a` / `#9a9a9a` | Captions, placeholder labels |
| Hairline on light | `#ececec` / `#d8d8d8` / `#e6e6e6` | Dividers, dashed receipt rule |

Alpha conventions — on dark: text `rgba(245,245,245,.66)`, muted `rgba(245,245,245,.5)`, faint `rgba(245,245,245,.4)`, border `rgba(255,255,255,.08)`–`.16`. On light: text `rgba(0,18,29,.62)`, muted `rgba(0,18,29,.5)`, border `rgba(0,18,29,.08)`–`.2`.

### Typography
- **Display / headings:** `Kameron`, serif — weights 400/500/600/700
- **Body / UI:** `Barlow`, sans-serif — weights 300/400/500/600/700
- **Mono (placeholder labels, persona eyebrows):** `Courier New`, monospace
- Google Fonts: `family=Kameron:wght@400;500;600;700&family=Barlow:wght@300;400;500;600;700`

Scale (all fluid via `clamp()`):
| Role | Value | Font |
|---|---|---|
| H1 hero (customer) | `clamp(40px,6vw,84px)` / lh `.98` / ls `-.025em` | Kameron 700 |
| H1 hero (merchant) | `clamp(38px,5.6vw,80px)` / lh `1` / ls `-.025em` | Kameron 700 |
| Fork half heading | `clamp(34px,5.4vw,72px)` / lh `1.02` / ls `-.02em` | Kameron 700 |
| H2 section | `clamp(30px,4.4vw,58px)` / lh `1.03` / ls `-.02em` | Kameron 700 |
| H2 emphasis | `clamp(32px,4.8vw,66px)` | Kameron 700 |
| H3 feature | `clamp(28px,3.4vw,46px)` / lh `1.05` | Kameron 700 |
| Stat numeral | `clamp(44px,6vw,80px)` / lh `1` | Kameron 700 |
| Card title | `24px` / lh `1.15` | Kameron 700 |
| Step title | `clamp(21px,2.4vw,28px)` | Kameron 600 |
| Lead paragraph | `clamp(17px,1.5vw,20px)` / lh `1.5` | Barlow 400 |
| Body | `15–17px` / lh `1.45–1.55` | Barlow 400 |
| Eyebrow | `13px` / weight 600 / ls `.24–.28em` / uppercase | Barlow |
| Nav link | `14.5px` / weight 500 | Barlow |
| Mono label | `12–13px` / ls `.08–.1em` | Courier New |

Measure caps are used throughout (`max-width` in `ch`: `15ch`–`52ch`) — preserve them; they control the editorial rag.

### Spacing
- Section padding: `clamp(90px,11vw,160px)` vertical, `clamp(20px,5vw,56px)` horizontal
- Section max-width: `1100px` / `1150px` / `1200px` (varies; see per-section notes)
- Grid gaps: `clamp(16px,2vw,26px)` (cards) → `clamp(30px,5vw,90px)` (two-column)
- Nav padding: `clamp(12px,2vw,20px)` / `clamp(14px,4vw,40px)`

### Radii
`999px` (pills, nav bubbles, CTAs) · `44px` (phone chassis) · `30px` (phone screen) · `22px` (mobile menu sheet) · `20px` (cards, feature placeholders) · `18px` (merchant cards, receipt card, dashboard) · `16px` / `12px` / `10px` (nested UI) · `50%` (dots, ripples)

### Shadows
| Use | Value |
|---|---|
| Nav bubble | `0 12px 34px rgba(0,18,29,.3), inset 0 1px 0 rgba(255,255,255,.16)` |
| Mobile menu | `0 22px 50px rgba(0,18,29,.4), inset 0 1px 0 rgba(255,255,255,.16)` |
| CTA rest | `0 6px 22px rgba(235,113,0,.3)` (nav: `0 8px 24px rgba(235,113,0,.35)`) |
| CTA hover | `0 12px 34px rgba(235,113,0,.5)` |
| Phone (dark bg) | `0 40px 80px rgba(0,0,0,.5), inset 0 0 0 8px #00121D` |
| Phone (light bg) | `0 40px 90px rgba(0,18,29,.28)` |
| Card hover | `0 24px 50px rgba(0,18,29,.12)` |
| Card selected | `0 26px 55px rgba(235,113,0,.22)` |
| Receipt card | `0 10px 30px rgba(0,18,29,.1)` |

### Easing & Duration
- **Primary easing:** `cubic-bezier(.16,1,.3,1)` (expo-out) — reveals, magnetic pull, card lift
- **Fork commit:** `cubic-bezier(.7,0,.3,1)` — 620ms
- **Mask wipe:** `cubic-bezier(.7,0,.15,1)` — 1100ms
- Reveal 900ms · word reveal 850ms (stagger 55ms) · child stagger 750ms (80ms) · counters 1600ms (cubic ease-out) · hover 250–350ms · ripple 600–700ms

---

## Global: Navigation

Fixed, `z-index:120`, full width, `pointer-events:none` on the bar with `pointer-events:auto` on each child — so the page remains interactive between bubbles.

**"Liquid glass bubbles"** — three separate floating capsules rather than one solid bar:
1. **Logo bubble** (left): paper-plane SVG (rotated `-8deg`) + "PapeX" in Kameron 700 `20px`. `padding:9px 17px 9px 14px`. Hover: border → `rgba(235,113,0,.5)`. **Click → returns to the split.**
2. **Links bubble** (center, desktop ≥821px): `Home · For Customers · For Business · Features · Blog · About`. `padding:6px`; each link `9px 15px`, `border-radius:999px`. Hover: `background:rgba(255,255,255,.1)`, color → `#F5F5F5`. Active path link: color `#EB7100`, background `rgba(235,113,0,.15)`.
3. **CTA + hamburger** (right): orange pill; hamburger only <821px as a `46px` circle bubble.

Shared glass recipe: `background:rgba(8,26,37,.5)`, `backdrop-filter:blur(20px) saturate(160%)` (+ `-webkit-` prefix), `border:1px solid rgba(255,255,255,.13)`, `border-radius:999px`, plus the nav shadow above.

**CTA label is contextual:** split → `Get Started`; customer → `Download App`; merchant → `Get the RDH`.

Mobile menu: full-width sheet below the bar, `top:calc(100% + 4px)`, inset by `clamp(14px,4vw,40px)`, `border-radius:22px`, `background:rgba(8,26,37,.72)`, `blur(24px) saturate(160%)`. Items `17px` weight 500, `13px 6px`, hairline dividers `rgba(255,255,255,.07)` (none on last).

> **Contrast caveat:** the glass bubbles are tuned dark and always render light text. They sit over both dark and light sections. Verify legibility over the light business hero and light sections; if it fails, add a scroll-aware light-glass variant (`rgba(245,245,245,.6)` fill + navy text) rather than changing the bubble geometry.

---

## Screen 1: The Fork (Landing)

**Purpose:** force one deliberate choice between the customer and business homepages.

**Layout:** `position:fixed; inset:0; z-index:60`, `display:flex; flex-direction:column`, `overflow:hidden`.

- **Top half — For Customers.** `flex:1`, background `#00121D`. Radial glow `radial-gradient(120% 90% at 30% 20%, rgba(235,113,0,.16), transparent 60%)`. Diagonal hairline texture: `repeating-linear-gradient(115deg, rgba(255,255,255,.02) 0 2px, transparent 2px 26px)`. Eyebrow `For Customers` (orange, ls `.28em`). H2 "Never lose a receipt again." (`max-width:15ch`, centered). Cue: `↑ Scroll up or click to enter` (CSS chevron via rotated borders).
- **Seam.** `height:1px`, `z-index:5`, full width. Centered label "Choose your path" in Kameron 600 `15px` orange, flanked by gradient rules fading to transparent. Animates with `seamGlow` (opacity `.5 → 1`, 2.6s). `pointer-events:none`.
- **Bottom half — For Business.** `flex:1`, background `#F5F5F5`. Radial glow at `70% 80%` (`.1` alpha). Eyebrow `For Business`. H2 "Modern checkout. Zero paper." in `#00121D` (`max-width:16ch`). Cue: `↓ Scroll down or click to enter`.

**Watermarks** (brand texture, `pointer-events:none`):
- `assets/plane-white.png` — top-left of the dark half: `top:22%; left:5%; width:min(260px,20vw); opacity:.05; transform:rotate(-8deg)`
- `assets/plane-blue.png` — bottom-right of the light half: `bottom:20%; right:5%; width:min(260px,20vw); opacity:.06; transform:rotate(-8deg)`

Both are intentionally very faint and inset from the edges. Do not enlarge or darken them.

### The commit interaction (most important behavior)

| Input | Result |
|---|---|
| `wheel` with `deltaY < 0` (scroll up), `|deltaY| ≥ 6` | → Customer |
| `wheel` with `deltaY > 0` (scroll down) | → Merchant |
| Touch swipe, `|Δy| ≥ 40px` | swipe up → Customer; swipe down → Merchant |
| Click either half | → that path |
| Nav "For Customers" / "For Business" | → that path |

**A lock (`wheelLock`) latches on the first qualifying gesture** so a single trackpad flick can't skip through. It releases only after the transition resolves.

**Commit animation (620ms, `cubic-bezier(.7,0,.3,1)`):** the chosen half's `flex-grow` animates `1 → 40` while the other goes `1 → 0.0001`; the losing half gets `pointer-events:none`, its content fades to `opacity:0` + `scale(.96)`; the seam fades out. On completion: scroll to top, swap view, release the lock.

**Color continuity is essential.** The fork halves are flat `#00121D` / `#F5F5F5` (no gradients), and each destination hero opens on that exact same color — customer hero `#00121D`, **merchant hero `#F5F5F5`**. The expand reads as one surface growing, not a page swap. Preserve this if you re-theme.

**Returning to the fork:** only the logo or nav "Home". Scrolling back up within a path must **never** restore it.

**Fork variant (prop `forkStyle`):** `horizontal` (default, straight seam) or `diagonal` — top half `clip-path:polygon(0 0,100% 0,100% 78%,0 100%)`, bottom half `clip-path:polygon(0 22%,100% 0,100% 100%,0 100%)` with `margin-top:-4%`. Optional; ship `horizontal` unless directed otherwise.

---

## Screen 2: Customer Path

Section order and background rhythm (strict alternation — do not collapse):
`hero #00121D` → `problem #F5F5F5` → `marquee #EB7100` → `personas #FFFFFF` → `features #00121D` → `how-it-works #F5F5F5` → `proof #00121D` → `vision #F5F5F5` → `footer #00121D`

### 2.1 Hero (dark)
`min-height:100vh`, `padding:120px clamp(20px,5vw,56px) 80px`, flex centered, `max-width:1200px` inner. Pointer-tracked glow at `78% 30%`.

Left column (`max-width:560px`): eyebrow "Digital receipts, one tap away" → H1 "The last receipt you'll ever lose." (word-by-word reveal) → lead paragraph (`max-width:44ch`) → CTA `Download the App` + "Free on the App Store".

Right column — **the NFC phone**, the hero's signature moment. `width:clamp(230px,24vw,300px)`, `height:clamp(470px,49vw,610px)`, `border-radius:44px`, gradient chassis `linear-gradient(160deg,#0a2431,#04161f)`, `2px` border `rgba(255,255,255,.1)`, notch `96×26px` (`border-radius:0 0 16px 16px`). Screen `#F5F5F5`, `border-radius:30px`. Floats via `floaty` (±10px, 6s).

Inside: header bar ("Receipts" + orange avatar `P`) · a **receipt card that materializes on a 5.2s loop** (`receiptCycle`: fade/rise in at 7–17%, hold to 80%, fade/lift out by 94%) · a bottom "Tap to receive" zone with a `24px` orange dot, `0 0 0 6px rgba(235,113,0,.18)` halo, and two `ripple` rings (2.2s, second offset 1.1s).

Receipt contents: "Blue Bottle Coffee", `Jul 22, 2026 · 8:41 AM`, a `TAPPED` chip (orange outline), line items Cappuccino `$5.25` / Almond croissant `$4.75` / Tax `$0.90`, dashed rule `1.5px dashed #d8d8d8`, total `$10.90` above a `1.5px solid #00121D` rule, then Save / Share buttons.

Bottom-center scroll cue: "Scroll" + a `1px` gradient rule animating with `arrowBob` (1.9s).

> **Cleanup for implementation:** the prototype has a stray absolutely-positioned empty `<div>` after the phone with an invalid `-bottom:0` property, and the phone carries a `title="Tap to demo"` whose click handler is a no-op. Drop the empty div. Either wire the tap to actually trigger the receipt animation (recommended — it's listed as a next step) or remove the affordance.

### 2.2 Problem (light)
`max-width:1100px`. Eyebrow "The problem" → H2 "Paper receipts fade. So does the money you could get back." (word reveal, `max-width:20ch`). Then a three-up `repeat(auto-fit,minmax(230px,1fr))` grid of stats: **256B** receipts printed yearly · **10M** trees cut · **$0** back without proof. Numerals Kameron 700 `clamp(48px,6vw,76px)` in orange; captions `16px #4a4a4a`, `max-width:24ch`.

### 2.3 Marquee (orange)
Full-bleed band, `padding:15px 0`, `overflow:hidden`. Two identical inline-flex runs animating `marquee` (`translateX(0 → -50%)`, 30s linear infinite) for a seamless loop. Navy Kameron 700 `clamp(20px,2.3vw,30px)`; phrases separated by `9px` navy squares rotated `45deg`:
`One tap, done. · No paper. · No app to receive. · Saved forever. · Fully searchable. · Zero waste.`
Second run is `aria-hidden="true"`.

### 2.4 Personas (white) — interactive
`max-width:1150px`. Centered eyebrow "Which one are you?" → H2 "Three kinds of receipt people. PapeX works for all of them." (word reveal). Three cards, `repeat(auto-fit,minmax(280px,1fr))`.

Each card: mono eyebrow (`THE KEEPER` / `THE CASUAL` / `THE NON-KEEPER`), Kameron 700 `24px` title, `15px #5a5a5a` body. Rest: `background:#F5F5F5`, transparent `1.5px` border, `padding:34px 30px`, `border-radius:20px`.
- **Hover:** `translateY(-6px)`, shadow `0 24px 50px rgba(0,18,29,.12)`
- **Selected (click):** `background:#fff`, border `1.5px solid #EB7100`, `translateY(-8px)`, shadow `0 26px 55px rgba(235,113,0,.22)`, plus a click ripple in `rgba(235,113,0,.15)`
- Cards need `position:relative; overflow:hidden` for the ripple

Below, a status line (`min-height:24px`, `#8a8a8a`) reads "Tap a card above." and swaps to a per-persona message on selection:
- Keeper → "The Keeper — PapeX turns your shoebox into a searchable, exportable archive."
- Casual → "The Casual — no more "where did that receipt go?" It's always saved for you."
- Non-keeper → "The Non-Keeper — you're now covered for every return, warranty and deduction."

Single-select; selection persists (no deselect in the prototype).

### 2.5 Features (dark)
`max-width:1150px`, two rows, `gap:clamp(70px,9vw,130px)`. Each row is a `1fr 1fr` grid, `align-items:center`. Row 1 is text-left; **row 2 is mirrored using `direction:rtl` on the row with `direction:ltr` restored on children** — implement the mirror with your normal ordering primitives (`order`, `flex-direction`, grid placement) instead.

1. "Everything in one place" → "Your entire receipt history, always a search away." + `[ app screen: receipt list + search ]`
2. "Share in a tap" → "Text, email or AirDrop any receipt in seconds." + `[ app screen: share sheet ]`

Placeholders: `aspect-ratio:4/3`, `border-radius:20px`, `repeating-linear-gradient(45deg,#0a2431 0 12px,#0c2937 12px 24px)`, `1px` border `rgba(255,255,255,.08)`, centered mono label. Both reveal with the **clip-path wipe**.

### 2.6 How it works — pinned scroll sequence (light)

The centerpiece. **Two implementations by viewport.**

**Desktop (≥821px):** section is `height:300vh` with an inner `position:sticky; top:0; height:100vh` stage — pinned for two viewport-heights of scroll. Inner grid `1fr 1fr`, `max-width:1150px`.

Left: eyebrow "How it works" → H2 "Get started in three taps." (word reveal) → three steps. Each step is a flex row: a `3px` vertical rail (`background:rgba(0,18,29,.1)`, `border-radius:3px`) containing an absolutely-positioned orange fill, then `01/02/03` (Kameron 700 `14px` orange), title (Kameron 600 `clamp(21px,2.4vw,28px)`), body (`15px #5a5a5a`, `max-width:34ch`).

Right: a phone, `height:min(560px,60vh)`, `aspect-ratio:300/600`, same chassis recipe, holding three absolutely-positioned states.

**Scroll mapping:** progress `p = clamp(-rect.top / (sectionHeight - viewportHeight), 0, 0.999)`. With `n = 3`: `active = floor(p * n)`, `localP = p*n - active`.
- Active step: `opacity:1`, `translateX(0)`. Inactive: `opacity:.32`, `translateX(-8px)`. Transition `.45s ease`.
- Rail fill height: `100%` if index < active, `localP * 100%` if index === active, else `0`.
- Active phone state: `opacity:1`, `translateY(0) scale(1)`, `pointer-events:auto`. Inactive: `opacity:0`, `translateY(24px) scale(.97)`, `pointer-events:none`. Transition `.5s ease`.

Steps / phone states:
1. **Tap at checkout** — "Hold your phone to any PapeX device at the register. No app required." → phone shows a `130px` ripple target (two rings, 2.1s, offset 1.05s) with a `46px` orange dot, "Ready to tap" / "Hold your phone to the device".
2. **Receipt appears instantly** — "Your digital receipt lands on your phone the moment you tap." → the Blue Bottle receipt card + caption "Delivered the instant you tapped".
3. **Saved & organized** — "Download the app to keep, search and categorize everything automatically." → receipts list: header + avatar, a search field, then rows Blue Bottle `$10.90` (Food) / Whole Foods `$63.40` (Groceries) / Uber `$18.20` (Transport), each with an orange category label.

**Mobile (<821px):** replaced by a plain stacked three-step layout (`gap:32px`) with `54px` navy numbered circles and orange numerals — no pinning, no scroll-scrubbing. Standard reveals only.

### 2.7 Social proof (dark)
`max-width:1100px`. Parallax glow (`radial-gradient(80% 60% at 50% 0%, rgba(235,113,0,.1), transparent 60%)`, factor `0.06`). Three counters, `repeat(auto-fit,minmax(180px,1fr))`, centered: **1,284,920** receipts delivered · **4,210** trees saved · **342** merchants onboarded. Numerals Kameron 700 `clamp(44px,6vw,80px)` orange; labels `15px rgba(245,245,245,.6)`.

Counters animate **once**, triggered when the block enters view: 1600ms, ease-out cubic (`1-(1-p)³`), formatted with `toLocaleString('en-US')`. Guard against re-running.

Below: four `[ press logo ]` slots, `repeat(auto-fit,minmax(150px,1fr))`, `height:64px`, `1px dashed rgba(245,245,245,.16)`, `border-radius:12px`.

### 2.8 Vision + CTA (light)
`max-width:900px`, centered. Eyebrow "The vision" → H2 "A world where every receipt is useful — and none of them are wasted." (word reveal) → paragraph (`18px`, `max-width:52ch`) → two buttons: primary `Download the App` (magnetic + ripple) and secondary `Get the RDH for Business` (transparent, `1.5px solid rgba(0,18,29,.2)`; hover → `border-color:#00121D`, `background:rgba(0,18,29,.04)`). **The secondary button cross-navigates to the merchant path** — an intentional bridge between the two homes.

---

## Screen 3: Business / Merchant Path

Rhythm: `hero #F5F5F5` → `why #F5F5F5` → `marquee #EB7100` → `how #00121D` → `RDH #FFFFFF` → `dashboard #00121D` → `demo #F5F5F5` → `footer #00121D`

### 3.1 Hero (light — matches the fork's bottom half)
`min-height:100vh`, same padding as the customer hero. Grid `repeat(auto-fit,minmax(300px,1fr))`. Pointer-tracked glow at `22% 40%` (`.16` alpha).

Eyebrow "For Business" → H1 "Modernize your checkout. No cost. No hassle." (word reveal) → lead in `rgba(0,18,29,.62)` (`max-width:46ch`) → CTA `Request a Demo` + "or call 415-261-8675".

Right: a **stylized RDH at the POS** inside a `[ RDH device photo ]` placeholder (`aspect-ratio:1/1`, `border-radius:24px`, navy stripes). Centered within it, a device card at `64%` width: `linear-gradient(160deg,#12303e,#081d27)`, `border-radius:18px`, "PapeX RDH" (Kameron 700 `15px`), an `80px` ripple target (two rings, 2.4s, offset 1.2s) with a `34px` orange dot and `0 0 0 8px rgba(235,113,0,.16)` halo, then `TAP TO RECEIVE RECEIPT` (`11px`, weight 600, ls `.06em`). Floats via `floaty` (7s).

> Note: this placeholder wraps a styled mock. When the real render arrives, keep the ripple/tap affordance — it carries the story.

### 3.2 Why merchants love PapeX (light)
`max-width:1150px`. Eyebrow + H2 "Every reason to switch. None to say no." (word reveal, `max-width:22ch`). Four white cards, `repeat(auto-fit,minmax(260px,1fr))`, `border-radius:18px`, `padding:30px`, `0 12px 30px rgba(0,18,29,.05)`. Each: orange Kameron 700 `22px` title + `15px #5a5a5a` body — **Free forever** · **Works with your POS** · **Customers love it** · **Cut paper & cost**.

### 3.3 Marquee (orange)
Same mechanics, 32s: `Free device. · Free install. · Works with your POS. · Zero paper. · PCI compliant. · No contract.`

### 3.4 How it works for business (dark)
`max-width:1100px`. Centered H2 "Up and running the same afternoon." (word reveal). Four steps, `repeat(auto-fit,minmax(220px,1fr))`: orange Kameron 700 `34px` numerals `01–04`, Kameron 600 `19px` titles, `15px rgba(245,245,245,.6)` bodies — **We install the RDH** · **It connects to your POS** · **Customers tap** · **You track adoption** (marked "coming soon").

### 3.5 The RDH device (white)
`max-width:1150px`, `1fr 1fr`. Left: `[ RDH hardware render ]` placeholder (`aspect-ratio:1/1`, `border-radius:22px`, light stripes `#eee`/`#e6e6e6`) with the **clip-path wipe** reveal. Right: eyebrow "The RDH device" → H2 "Small device. Standard ports. PCI compliant." → three rows, each an orange `→` glyph + `16px #4a4a4a` text: standard USB/serial/Ethernet ports, no terminal modification · two install modes (printer replacement or inline extension) · PCI DSS compliant, with an orange "see documentation" link.

### 3.6 Dashboard preview (dark)
`max-width:1000px`, centered. A `Coming soon` pill (`1px solid rgba(235,113,0,.4)`, `border-radius:999px`, `padding:6px 14px`, orange, uppercase ls `.16em`) → H2 "A dashboard for your digital receipts." (`max-width:20ch`) → `[ merchant dashboard mockup ]` (`aspect-ratio:16/9`, `border-radius:18px`, navy stripes at `14px`) → an inline email capture: rounded `999px` input (`rgba(255,255,255,.05)`, `1px solid rgba(255,255,255,.16)`) + orange `Notify me`.

### 3.7 Request a demo (light)
`max-width:960px`, `1fr 1fr`, `align-items:start`. Left: eyebrow "Get started" → H2 "Request a demo." → paragraph (`max-width:34ch`) → "Or call us: **415-261-8675**" (number in orange). Right: a form, `gap:12px` — Your name · Business name · Email · then a `1fr 1fr` row of Phone + POS system · submit `Request Demo`. Inputs `padding:14px 16px`, `border-radius:12px`, `1px solid rgba(0,18,29,.14)`, white fill.

---

## Global: Footer (dark)

`padding:clamp(60px,7vw,90px) clamp(20px,5vw,56px) 40px`, top border `1px solid rgba(255,255,255,.08)`, `max-width:1150px`. Four columns, `repeat(auto-fit,minmax(200px,1fr))`, `gap:clamp(30px,5vw,60px)`:

1. Plane mark + "PapeX" (Kameron 700 `20px`), tagline "Digital receipts, one tap at checkout. No paper, no hassle." (`max-width:30ch`), then three `36px` circular social chips (`in`, `X`, `IG`) — `1px solid rgba(255,255,255,.16)`, hover → orange border + orange text.
2. **Product:** For Customers · For Business · Features · Blog
3. **Company:** About · Support · PCI Docs · Contact
4. **Stay in the loop:** email + orange `Join` (`border-radius:10px`), then `support@papex.app` / `415-261-8675` / `San Francisco, CA`

Column headings: `13px`, weight 600, ls `.14em`, uppercase, `rgba(245,245,245,.4)`. Links `15px rgba(245,245,245,.7)`, hover orange.

Bottom bar: `margin-top:44px`, `padding-top:24px`, top hairline; "© 2026 PapeX. All rights reserved." left, Terms · Privacy right; `13px rgba(245,245,245,.4)`.

In the prototype this is a separate component imported by both paths — keep it a shared component.

---

## Motion System

Reusable behaviors, applied declaratively via data attributes in the prototype. Recreate them as composable utilities (hooks/directives/mixins).

| Behavior | Spec |
|---|---|
| **Reveal** | `IntersectionObserver`, threshold `.12`, `rootMargin:0px 0px -6% 0px`, fires **once** (unobserve after). 900ms `cubic-bezier(.16,1,.3,1)`. Variants: `up` (default, `translateY(46px)`), `left` (`translateX(-48px)`), `right` (`+48px`), `scale` (`scale(.92)`), `mask` (`clip-path: inset(0 100% 0 0) → inset(0)`, 1100ms `cubic-bezier(.7,0,.15,1)`). |
| **Word reveal** | Split the heading on spaces; wrap each word in an `overflow:hidden` span with an inner span starting at `translateY(115%)`, `opacity:0`; animate to `0`/`1`, 850ms, **55ms stagger**. Applied to nearly every H1/H2. |
| **Child stagger** | Direct children start `translateY(30px)`, `opacity:0`; 750ms with **80ms** stagger. Used on both hero copy columns. |
| **Counter** | Fires with its reveal, once. 1600ms, ease-out cubic, `toLocaleString('en-US')`. |
| **Parallax** | On scroll (rAF-throttled): `translate3d(0, -(elementCenter - viewportCenter) * factor, 0)`. Factor `0.06` on the proof glow. |
| **Spotlight** | `pointermove` (fine pointers only): offset `translate3d(dx*s, dy*s, 0)` where `dx/dy` are normalized cursor offsets from element center and `s` is strength (60–70 on hero/fork glows). Transition `.4s cubic-bezier(.16,1,.3,1)`. |
| **Magnetic** | On the primary CTAs. Within `width*0.9 + 60px` of the cursor: `translate(dx*0.28, dy*0.4)`; otherwise return to `0,0`. 350ms expo-out. |
| **Ripple** | On `pointerdown`: append an absolutely-positioned circle at the click point, diameter `max(w,h)*2.2`, animate `scale(0)→scale(1)` with `opacity .6→0` (600/700ms), remove after 720ms. Requires `position:relative; overflow:hidden` on the host. Navy `rgba(0,18,29,.22)` on orange CTAs; orange `rgba(235,113,0,.15)` on persona cards. |
| **Loops** | `ripple` (NFC rings, expand + fade, paired with a half-duration offset) · `receiptCycle` 5.2s · `floaty` ±10px 6–7s · `marquee` 30–32s linear · `seamGlow` 2.6s · `arrowBob` 1.9s |

**Accessibility:** the prototype includes `@media (prefers-reduced-motion: reduce)` that collapses animation durations. Honor it properly in production — skip the pinned scroll-scrubbing, marquee, floaty, and NFC loops; render reveals in their final state; keep counters static at final values.

**Performance:** scroll and pointer work is rAF-throttled with `will-change:opacity, transform` on animated nodes. The pinned sequence recomputes on every scroll frame — memoize `getBoundingClientRect()` reads and avoid layout thrash. Spotlight/magnetic listeners are bound only when `(pointer:fine)` matches.

---

## State Management

Prototype state (recreate with your store/router):

| State | Values | Notes |
|---|---|---|
| `view` | `'split' | 'customer' | 'merchant'` | Drives everything |
| `committing` | `null | 'customer' | 'merchant'` | Transient, during the 620ms fork animation |
| `menuOpen` | boolean | Mobile menu |
| `persona` | `null | 'keeper' | 'casual' | 'non'` | Persona selection |
| `mobile` | boolean | From `matchMedia('(max-width:820px)')` |
| counters | three formatted strings | Animated once on reveal |

Non-state refs: `wheelLock` (gesture latch), an `IntersectionObserver` handle, a rAF handle, and a "counters already run" flag.

**Transitions:** `split → committing → path` (620ms, then scroll to top). Nav "Home"/logo → `split` (immediate, scroll to top, disconnect observers, close menu). Cross-path nav (nav links, the vision CTA) → immediate swap + scroll to top, no fork animation.

**Routing (production):** the prototype is a single stateful page. In `papexweb`, prefer real routes — `/` (fork), `/customers`, `/business` — with the commit animation as a route transition. That makes both homes linkable and shareable, which the fork concept needs. Also ensure a **direct visit to `/customers` or `/business` never shows the fork**, and consider remembering the choice (cookie/localStorage) so returning visitors can skip it — worth confirming with Nico before implementing.

**Data:** no fetching in the prototype. Real integrations needed for the demo-request form, the dashboard-notify and footer email captures, and the live counter stats. Forms currently `preventDefault()` with no validation, no loading state, and no success/error states — all of that must be designed/implemented (add inline validation, a pending state on submit, and confirmation + failure messaging).

---

## Responsive

Single breakpoint: **820px** (`matchMedia('(max-width:820px)')`), which switches the nav (links bubble → hamburger) and the how-it-works section (pinned → stacked). Everything else is fluid via `clamp()` and `auto-fit` grids.

**Verify on real devices:** the fork's swipe-to-commit is the riskiest interaction on touch (it competes with native scroll — the prototype uses a 40px threshold on `touchend` with `passive` listeners). Confirm both halves' tap targets are obvious on mobile, since the scroll cue text assumes a mouse. Fixed two-column grids (features `1fr 1fr`, RDH, demo form) need explicit single-column collapse at narrow widths — the merchant hero already uses `auto-fit` for this.

---

## Assets

| File | Use |
|---|---|
| `assets/plane-white.png` | Fork watermark, dark/customer half (top-left) |
| `assets/plane-blue.png` | Fork watermark, light/business half (bottom-right) |

Both supplied by the client (white-line and blue-line variants of the orange paper-plane mark). The nav and footer logo is an **inline SVG** paper plane: `M2 12L22 3L15 21L11.5 13.5L2 12Z` filled `#EB7100`, with a `M11.5 13.5L22 3L11.5 13.5Z` underside in `#c85f00`, rotated `-8deg`. Replace with the official brand SVG from `papexweb` if one exists.

**Still needed (currently placeholders):** app screenshots (receipt list + search, share sheet), RDH hardware render + a real photo at a POS, the merchant dashboard mockup, press/merchant logos, and testimonial content.

## Files in This Bundle

| Path | What it is |
|---|---|
| `PapeX Homepage.html` | Self-contained offline prototype — **start here** |
| `source/PapeX Home.dc.html` | Authored source: template + logic class (exact values, motion math) |
| `source/PapeX Footer.dc.html` | Shared footer component |
| `assets/plane-white.png`, `assets/plane-blue.png` | Fork watermarks |
| `PapeX_Website_PRD.md` | Original product requirements |

## Open Questions for the Team

1. **Routing & re-entry** — real routes per path? Should a returning visitor skip the fork?
2. **Nav contrast** — do the dark glass bubbles need a light variant over light sections?
3. **Real content** — final stats, press logos, testimonials, and app/hardware imagery.
4. **Form backends** — where do demo requests and email captures go?
5. **Fork variant** — ship `horizontal`, or evaluate `diagonal`?
6. **Hero tap** — should tapping the hero phone trigger the receipt animation on demand?
