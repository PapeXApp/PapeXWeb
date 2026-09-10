# HANDOFF — PapeX website, customer-path polish

Written 2026-09-10. For a fresh session picking this up mid-iteration.

Operator is **Nico** (founder, moves fast, not a full-time engineer). Plain English,
business framing, give a recommendation rather than a survey. He reviews on his own
screen between batches and sends terse voice-style feedback — act on it, don't
re-litigate it.

---

## 1. Where the work lives

- Repo: `/Users/nicolascourbage/Documents/Claude/code/PapeXWeb`
- Branch: `feat/forked-landing-redesign-v2`
- Last commit: `f44ef02` (the first batch — brand foundation, fork, both paths, legacy pages)
- **24 dirty files. Three later batches are UNCOMMITTED.** Nico approved committing
  batch 1 only. Ask before committing; never commit to `main`.
- Dev server: `preview_start` with name `papex-web` → port 3001. **Never bare Bash for the server.**

Read first: `PapeXWeb/CLAUDE.md` (rewritten 2026-09-09, trustworthy now),
`../CLAUDE.md` (cross-repo map), and
`.claude/plans/2026-09-09-website-depth-and-branding.md` (the running plan).

---

## 2. What Nico asked for, and what's done

### Done and verified

| Ask | Outcome |
|---|---|
| Swap the fork's customer/business sides | Down → `/customers`, up → `/business`. Colours unchanged (navy still on top). `data-surface` (look) is now decoupled from `data-side` (destination), so flipping again is a one-line change to `TOP_PATH`/`BOTTOM_PATH` in `components/brand/fork.tsx`. |
| Real logo top-left, not just the plane | `components/brand/full-logo.tsx` — the real lockup extracted from `public/brand/vector/wordmark-src-primary.svg`, viewBox tightened from a measured `getBBox`, recoloured off the retired `#003148`/`#f57e20`. In nav (76px) and footer (96px). Also exports `Wordmark` (letters only). |
| Hero phone "looks like a foldable brick" | Was 376×580 (0.65). Now locked to the real iPhone 393:852 = 0.461, Dynamic Island instead of a notch. Driven from one `--phone-h` var; interior type scales via `--ac-u`. |
| Receipt text cut off | Interior paddings were 393pt-design point values that never scaled. Scaled them, and the ESC/POS body is now capped by a container query so 32 columns always fit. |
| CTA "chases the mouse too far" | `components/motion/Magnetic.tsx` could travel 60×85px. Now hard-capped at 12×9px. |
| "Original receipt" needed two taps | Taps inside the live receipt no longer bubble to the phone's toggle; the hidden layer no longer swallows the first tap. |
| How It Works phone "looks shitty, not our app" | Rebuilt as `components/paths/customer/WalkPhone.tsx`: real iPhone proportions, titanium rail, **iOS status bar** (time/cellular/wifi/battery), Dynamic Island, home indicator, and the **iOS 26 Liquid Glass tab bar** (inset capsule, backdrop blur+saturate — the "mirrored effect" he meant). App UI measured from PapeXV2's `theme/tokens.ts`, `components/ui/ReceiptRow.tsx` and `docs/design/prd-execution/screenshots/`. |
| Tap **and** swipe through How It Works | Swipe left advances, right goes back, wraps; tap advances; arrow keys work; **vertical drag ignored** (that's page scroll). Page dots added as the affordance. Verified end-to-end. |
| RDH box + sticker logo | Real enclosure renders exist at `Papex_RDH_Firmware/docs/enclosure/rdh_final_{top,front}.png` — it's a **solid orange box with the logotype debossed into the top face**. Ours was matte black with a white sticker carrying a hand-drawn triangle that isn't the PapeX mark. Rebuilt orange + real logotype debossed; `public/product/rdh-device.svg` regenerated to match. |
| Flip cards "less vibe coded" | Gradient face instead of flat white, three-part shadow, inset lit lip, brand hairline, stat bloom + rule, pill hint, 5px hover lift (on the outer card — the inner owns `rotateY`). |
| Depth: lines, fades, blurs, watermark | `components/paths/customer/Atmosphere.tsx` — shared layer on all 7 sections. |
| Scroll cue: revert to text + hairline | Reverted. **See §3 — the real bug.** |
| Research how other sites do depth | Done, applied. See §4. |

### The depth system — history matters here

`Atmosphere.tsx` has been through **two rounds of Nico rejecting it**:

1. v1 seams bled the *neighbouring band's colour* at `.14` alpha → over off-white that's a
   grey smudge. He called them "really shitty and unprofessional." **Don't reintroduce this.**
   The seam is now a ~5% neutral *cast shadow* (dark sections get a light *lift* instead),
   plus one hairline on the boundary.
2. v1 had three lines at unrelated offsets with visible endpoints → "look like you put them
   in random spots." Now **one pair**: a rule and its orange partner, same angle, both running
   140% width so neither shows an endpoint. Lines are OFF on Personas and Proof.
3. Watermark was on 5 sections → "too much." Now **exactly two**: Hero and Vision.

Current API: `<Atmosphere tone seam lines watermark grain />`.

---

## 3. The scroll-cue bug — read this before touching the hero

Nico asked for a scroll tab, got one, then asked to revert because **he had never actually
seen the original** — "my screen was too small."

He was right that something was wrong, but it was **not the cue's design**. The hero was
overflowing 100vh at *every* size (952px tall on a 900px screen), and the cue is absolutely
positioned at the section's bottom, so it sat below the fold.

Cause: `--phone-h`'s reserve didn't account for the **RDH device below the phone** (~149px net).
Reserve is now **400px** and the arithmetic is written into `customer.module.css`.

**Verified: hero fits exactly 100vh with the cue visible at 660, 700, 720, 768, 800, 900, 982, 1080 tall.**
If you change the reader artwork or the hint row, re-measure that reserve.

Lesson worth carrying: a layout bug can masquerade as a design problem. Measure the DOM
before redesigning.

---

## 4. Depth research (done 2026-09-09, already applied)

Two techniques recurred and were missing from the page:

- **Film grain** — `feTurbulence` noise tile at low opacity. Stops flat fills reading as
  plastic and kills banding on the big soft gradients. Now on all 7 sections at **3.5% light /
  5% dark**. Trend pieces say 15–30%; at that level it reads as a dirty screen. `mix-blend-mode`
  is deliberately OFF here (unlike the fork's grain) — visually identical on near-neutral
  surfaces and avoids a full-section backdrop re-read.
- **Aurora layering** — several large heavily-blurred pools at different sizes/blurs/hues, not
  one tinted blob. Three orbs at 72/84/96px blur. Under ~40px a blur still shows its own edge.

Deliberately NOT applied: "tactile maximalism" (dense overlapping layering) contradicts his
"too much" note; animated glow blobs would add a second rAF loop competing with the fork's.

Sources: gezar.dk/en/blog/web-design-trends-2026 · wildandfreetools.com/blog/grainy-noise-css-gradient-generator
· css-zone.com/blog/css-gradient-trends-2026 · jaconir.online/blogs/css-radial-gradient

---

## 5. Open — pick up here

| Item | Notes |
|---|---|
| **RDH box photo** | Nico said "I will give you an image of the RDH box in a second." It never arrived. The box is currently the orange CAD enclosure. **Ask him for it before reworking.** Also unconfirmed: whether orange is the production colour or just V3 3D-print filament. |
| ~~"Once it's yours" images~~ | **DONE 2026-09-10.** The two striped "[ app screen: … ]" TODO boxes are now real app screens (`FeatureScreens.tsx`): receipt list mid-search with filter chips, and an iOS share sheet over the list. Both reuse `PhoneChrome` from `WalkPhone.tsx` (same device, not a copy). Categories are the app's real ones (`Dining`, `Gas & auto`…). Also fixed a pre-existing bug: the row grid was a hard `1fr 1fr`, so mobile got two squeezed 160px columns — now `auto-fit`. |
| **Stats section — NEEDS NICO** | Visual restyle DONE (hairline-framed strip, dividers, tabular figures, tracked labels). **But the numbers are fake**: `content.ts` marks them "ILLUSTRATIVE PLACEHOLDER COUNTERS — not factual" (1,284,920 receipts / 4,210 trees / 342 merchants) and they render as fact. Need real pilot numbers, a reframe, or removal before launch. |
| **Press logo row — NEEDS NICO** | Four dashed "[ press logo ]" boxes are visible on the live page. Real outlets or drop the row. |
| Plane resting opacity | 0.15 navy / 0.11 light on the fork. Chosen from headless screenshots; needs his eyes. One-line change. |
| Press logo slots (×4) | Blocked on Nico/Will. Don't put outlets on the site we can't claim. |
| Brand kit + OneDrive prune | Brand Kit doc still states the OLD palette. Never delete from that OneDrive folder without his approval — it syncs to the whole team. |
| `.grain` on the fork | Full-half `mix-blend-mode: overlay` through the 620ms commit. Can't be measured headlessly; also a design call. |

---

## 6. Traps

- **Never `npm run build` while the dev server runs** — both write `.next`, server then 500s.
  Recovery: stop → `rm -rf .next` → restart. Use `npx tsc --noEmit` and `npx next lint --file <path>`.
- **`npm run lint` has 20 pre-existing failing files**, none of them redesign code. Not you.
- **The Browser pane is hidden** → 0×0 viewport, `visibilityState: hidden`, rAF throttled.
  Screenshots come back black and perf/frame numbers would be fiction. **Measure via an
  offscreen `<iframe>` sized to a real viewport** — that pattern works well and is how every
  layout number in this handoff was obtained.
- **The fork remembers your choice** (`localStorage` key `papex.pathChoice`). Clear it or the
  fork stops showing.
- **Peer session files: `.claude/launch.json` and `app/merchant/AuthContext.tsx`** carry another
  session's uncommitted work. Deliberately excluded from `f44ef02`. Leave byte-for-byte alone.
- Reveal animations write inline `transform` and silently defeat a CSS `:hover` transform on the
  same element. Wrap the card; let the wrapper absorb the reveal.
- `app/merchant/**`, `app/r/**` and the `/customers` receipt demo intentionally use the **App Clip**
  palette (`#181A20`/`#FB8500`/`#2B7FC6`). Don't "fix" it to brand tokens.
- The `/customers` hero demo must keep decoding through the repo's own `lib/escpos.ts` —
  `grep -rn "papex-receipt" components/` must stay empty.

---

## 7. Gate

No tests, no CI. `npm run build` (server stopped) + a real browser pass is the only gate.
Deploy = push to `main`, which fires a Vercel hook with no checks — anything merged goes live.

Current state: **`tsc` clean, no new lint errors, all routes 200.**
