# PapeX homepage prototype — working notes

Design-handoff prototype for the forked PapeX homepage (customers / business).
Read `README.md` for the original design spec. This file covers what you only
learn by working on it.

## Running it

```bash
python3 -m http.server 4321 --directory "/Users/wdalcorn/papex_8-12/Website UI-UX/source"
# then open http://localhost:4321
```

The workspace `.claude/launch.json` already defines this as `papex-prototype`, so
Claude Code can start it directly — don't add a second `launch.json` in this folder.

`source/index.html` redirects to the prototype. The `.dc.html` files **must** be
served over HTTP — they `fetch()` the footer component and load
`papex-receipt.js`, both of which `file://` blocks. Emailing someone the file
gives them a broken page (and a phone screen that says the decoder didn't load).

**Edit `source/PapeX Home.dc.html`.** `PapeX Homepage.html` in the root is the
original self-contained export, is ~880,000 characters on one line, predates all
of this work, and cannot be regenerated without the design tool. Ignore it.

## Runtime traps (these cost hours — read before debugging)

1. **Bound styles truncate at the first top-level comma.** `style="{{ foo }}"`
   silently drops every declaration after a comma outside parens. This killed
   `transition: opacity .5s ease, transform .5s ease` — everything from
   `transition` onward vanished. Keep commas out of bound styles, or set the
   property imperatively via a ref.
2. **Refs go stale.** After a re-render the stored node is *truthy but detached*,
   so writes to it silently do nothing. Always re-resolve with
   `document.contains(el)` before using a cached ref.
3. **`componentDidUpdate` gets one argument.** `support.js:943` calls it as
   `componentDidUpdate(prevProps)` — there is no `prevState`. Reading a second
   arg throws on every state update.
4. **`max-width` in `ch` on a wrapper div.** `ch` resolves against that element's
   own font. A wrapper with no font-size inherits 16px body text, so `20ch` caps
   at ~180px while the 60px heading inside needed ~600px. This bit four separate
   headings. Put `ch` caps on the element that declares the font-size.
5. **`runReveals()` re-runs on every `setState`, not just on view changes.** The
   `setRoot` ref fires on each render, and `runReveals()` used to reset every
   `[data-reveal]` back to `opacity:0` and replay the .9s fade. Harmless while
   the only interactive thing was below the fold — but the hero now has a
   tappable phone, so every tap re-faded the headline beside it. Reveals are now
   idempotent: the observer stamps `dataset.revealed = '1'` and `runReveals()`
   skips anything carrying it. **Don't "simplify" that guard away**, and don't
   fix it by making `setRoot` run once — nodes mount late during the 620ms path
   transition and genuinely need the re-run to get observed.
6. **`data-reveal` / `data-stagger` write inline `transform`, which beats any CSS
   `:hover` transform.** On intersect, `runReveals` sets `el.style.transform =
   'none'` on every reveal target and, with `data-stagger`, on each of its direct
   children. Inline wins over the stylesheet, so a card that is itself a reveal or
   stagger target can never animate on hover. Fix: wrap each card in a plain
   `<div>`, let the wrapper absorb the reveal, and keep `transform` free on the
   card. `.wgrid > div` exists only for this.

## The preview browser does not animate

It does not advance CSS animations or transitions. A 0.62s animation still
reports `playState: "running"` after 5 seconds. `getComputedStyle().transform`
and `getBoundingClientRect()` also misreport inside `zoom` subtrees.

**It also does not fire `IntersectionObserver`.** A brand-new observer with the
same options as `runReveals()` never fires on an element that is plainly on
screen. Two consequences, both of which have already cost hours:

- Every `[data-reveal]` element sits at `opacity: 0` forever, so **screenshots of
  the preview come back blank or half-empty** and look exactly like a rendering
  bug. Nothing is wrong; the reveal just never triggered.
- Because transitions don't advance either, `getComputedStyle(el).opacity`
  returns the *start* value even after the code has set `el.style.opacity = '1'`.
  So computed style disagrees with inline style and computed is the liar.

**Assert on `el.style.*` (inline) and `el.dataset.*`, never on
`getComputedStyle()`, when checking reveal logic here.** To test something that
depends on a reveal having happened, simulate it — set `dataset.revealed = '1'`
and the inline styles by hand — then test your actual change against that.

**Consequence:** you can verify structure, classes, state and instant style
changes. You cannot verify motion — a human has to look. Don't burn time
chasing an animation that "isn't working" here; check the logic and move on.

## What's built

Customer path — **hero** (copy left; on the right a phone that bows down onto the
RDH and receives the real App Clip receipt — see below) → problem (three
tap-to-flip cards: printer spray, forest felled by an axe, receipt with nothing
on it) → personas (three-question quiz) → feature claims (text only) →
how-it-works (two clicks, three steps, reader behind the phone) → closing CTA.

The hero used to have its *own* tap-and-bow with a light-mode mock receipt, and
the real demo lived in its own section further down. That was two versions of
the same beat on one page, so the mock was deleted and the real one moved up.
Only two tap interactions remain — the hero and how-it-works — and they differ
in payoff: the hero delivers a decoded receipt, how-it-works steps through
screens. If a third is ever proposed, cut one instead.

The fork's "Choose your path" label was removed; the two seam gradients still
meet at centre, so the divider reads brightest in the middle on its own. The
`seamGlow` keyframe went with it.

Business path — hero (call number is a `tel:` pill) → why (2×2 claim cards, each
led by a number: `$0` / `1 port` / `1 tap` / `0 rolls`, with the free-forever card
inverted to dark so the set has hierarchy of its own) → process (roadmap on a
dashed path) → RDH device (**placeholder**) → dashboard (a real screenshot of the
shipping product — see below) → demo form.

Interactive JS lives in the logic class at the bottom of `PapeX Home.dc.html`,
grouped by section. Animation CSS is in the `<helmet><style>` block — static CSS
avoids trap #1 entirely, so prefer classes over bound styles for anything
animated.

## The hero demo runs the real parser — `papex-receipt.js`

The phone in the hero is **not a mockup**. `source/papex-receipt.js` is a
mechanical type-strip of two production files, concatenated:

    PapeXWeb/lib/escpos.ts          -> parseEscPos, encodeEscPos, …
    PapeXWeb/lib/receiptSummary.ts  -> summarizeReceipt, detectPaymentMethod, …

`demoReceiptBytes()` in the logic class builds a genuine ESC/POS stream (the
Bluebird Coffee receipt from `PapeXWeb/lib/sampleReceipt.ts`, re-authored as
bytes), and `renderDemoReceipt()` renders whatever the parser returns. Styling
flags survive end to end: `ESC ! 0x30` → 18px, `ESC E 1` → bold, `ESC a 1` →
centred, and the tax rate is computed from the parsed numbers, not hardcoded.

**This is now a third copy of the ESC/POS parser.** `CLAUDE.md` already requires
the Swift and TS parsers to stay in parity; this file joins that rule. Fix a
parser bug in `PapeXWeb/lib/escpos.ts` and it must be re-ported here, or the
marketing site starts demoing behaviour the product no longer has.

Re-verify a re-port by diffing both implementations over the same inputs — do
not eyeball it:

```bash
# original
cd PapeXWeb && npx tsx <script importing lib/escpos + lib/receiptSummary>
# port
node -e "require('./Website UI-UX/source/papex-receipt.js')"
# then diff JSON.stringify(parseEscPos(b)) and JSON.stringify(summarizeReceipt(lines))
```

The port was verified this way over 124 byte streams + 69 strings (1,464 field
comparisons, 0 mismatches), including a negative control: 12 single-line
mutations were injected into copies and all 12 were caught, so the harness is
known to be able to detect a difference.

Two things about the file itself:

- It is **wrapped in an IIFE** and exposes only `window.PapeXReceipt`. It
  declares ~30 top-level names (`DATE_RE`, `isDivider`, `ParserContext`, …); at
  bare script scope a `const` redeclaration from any other script is a
  `SyntaxError` that kills both files. Keep the wrapper.
- `parseEscPos` always returns `{header:[], lines, footer:[]}` — **`header` and
  `footer` are never populated**, don't render them. `lines: []` is the
  "nothing to show" signal and is reachable from valid-looking input.

### Hero composition knobs

Four values control how the hero sits together; they interact, so change them
together and re-measure:

- `.demo-screen` `height: calc(100vh - 278px)` — viewport-relative, not
  width-relative, because the phone *and* the reader beneath it must both be
  above the fold or the tap is undiscoverable. The 278px is everything else in
  the column (hero padding, hint line, the reader's visible portion).
- The copy block's `flex: 1 1 500px` — with `auto` the basis becomes the
  headline's natural width (~1030px), which wraps the phone underneath it.
- The glow behind the headline is `.hero-glow` — a **section-level absolute
  div**, not a background on the copy card. As a card background it was clipped
  to the box and read as a rectangular panel. It is centred on the *headline*
  (`left:29%`, measured), not on the section; below 900px the hero wraps, the
  copy goes full-width and the media query moves it to 50%. Re-measure the h1
  centre if the hero's proportions change.
- `.demo-rdh` `margin-top` / `translateX` are both `clamp()`d to the viewport.
  On desktop the reader tucks deep behind the phone and shows itself to the
  right; on mobile there is no room to the right, so it shows below instead.

## The RDH artwork is generated vector — `rdh-device.svg`

There is no photo or 3D render of the RDH in the workspace, so the device on the
site is **hand-authored SVG**, drawn from a reference photo of the real unit
(matte-black 3D-printed enclosure, green status LED, white PapeX label). Vector
was chosen over a raster render deliberately: crisp at any size, ~3 KB instead of
~200 KB, exact brand colours, and it recolours with the palette.

**The geometry is generated, not eyeballed.** It is a true isometric projection
of a 100 x 68 x 30 box:

    sx = (x - z)·cos30        sy = (x + z)·sin30 - y

Note `+z` runs **toward** the viewer, so the visible walls are the `z=D` and
`x=W` faces — drawing `z=0`/`x=0` gives a box that reads as a table with legs.
The `<g transform="matrix(…)">` maps label-space (x 0-100, y 0-68) onto the top
surface, so the label and LED are positioned in plain rectangular coordinates and
land correctly projected. Corner rounding is `stroke-linejoin:round` with a
stroke matching the fill — far simpler than arcing skewed paths. If the
proportions change, regenerate the coordinates rather than nudging them.

Two details worth keeping:

- The wordmark carries `textLength` + `lengthAdjust="spacingAndGlyphs"`. Without
  it the X overhangs the label wherever Kameron fails to load.
- The LED sits at label-space (29, 59) — the **front** edge. Anywhere further
  back and the phone covers it in the hero, which also kills the `.rdh-led`
  pulse on tap.

**It appears three times, two different ways.** The hero copy is **inlined** so
CSS can pulse `.rdh-led` when the phone bows; the two business-path placements
are `<img src="rdh-device.svg">`. That split is deliberate — inlining it three
times would collide the `<defs>` ids (`rdhTop`, `ledGlow`, …). **Edit the .svg
file and the inlined copy together**, or the hero silently drifts from the rest
of the site.

## The merchant dashboard shot is real — `merchant-dashboard.png`

`source/merchant-dashboard.png` is a genuine capture of the **shipping** merchant
dashboard (`PapeXWeb/app/merchant/insights`), not a mockup. It is 2880×1800 (2×)
so it stays sharp on retina.

The dashboard runs with **no backend and no credentials** — `PapeXWeb/.env.local`
already carries both flags:

```
NEXT_PUBLIC_MERCHANT_MOCK=1            # merchantApi.ts routes to lib/merchantMock.ts
NEXT_PUBLIC_MERCHANT_DEV_AUTH_BYPASS=1 # AuthContext signs in a synthetic user
```

```bash
cd PapeXWeb && npm run dev
open http://merchant.localhost:3000/insights
```

**The `merchant.` subdomain is required** — `middleware.ts` rewrites
`merchant.*` hosts to `/merchant/*`, and `localhost:3000/merchant` deliberately
404s so the route tree isn't exposed on the apex host.

To re-capture, the window toggle is React state (`useState("7d")`), not a URL
param, so a plain headless screenshot can't reach the fuller 30-day view. Drive
Chrome over CDP instead — Node has a global `WebSocket`, so this needs no npm
deps. A working script is at `/tmp/shot/capture.mjs` (recreate it if that's
gone): launch `--headless=new --remote-debugging-port=…`, attach, `Page.navigate`,
`Runtime.evaluate` to click **30 days**, then `Page.captureScreenshot`.

Two presentational tweaks are applied in that evaluate step and should be kept
on re-capture: the sidebar's dev-bypass name **"Dev Merchant" → "Bluebird
Coffee"** (and its avatar letter D → B). That is not a fabrication — the mock
merchant *is* Bluebird Coffee, the same fixture as the hero receipt, so the two
sections tell one story. "Dev Merchant" is only an artefact of the auth bypass.

**The dashboard ships today.** The section used to carry a "Coming soon" badge,
a "Notify me" email capture, and a "Soon" pill on roadmap step 04 — all stale,
all removed. Don't reintroduce them.

### It uses the app's palette, not the site's

The demo renders in the **App Clip's** tokens (`Papex_AppClip/Sources/AppClip/Theme.swift`),
which are deliberately not this site's:

| | app / App Clip | rest of this site |
|---|---|---|
| orange | `#FB8500` | `#EB7100` |
| dark   | `#181A20` | `#00121D` |
| blue   | `#2B7FC6` | none |

That mismatch is intentional — it is a render of the product, so it uses the
product's colours, and it sits inside a phone frame where the seam reads as a
screen. Will has not decided whether the site should move to `#FB8500`; until he
does, don't "fix" one to match the other.

## Open work

- **RDH render is vector, not a photo.** If a photoreal render or product photo
  ever arrives, it would replace `rdh-device.svg` — see the section below before
  swapping, because the hero copy is inlined, not linked.
- **site palette vs app palette** — decide whether the site moves to `#FB8500`.
  See the hero-demo section above. Until then the two coexist on purpose, and
  the hero now shows both at once: `#EB7100` chrome around an `#FB8500` phone.
- **the hero reveal is unverified in a real browser** — the fade-in of the hero
  copy and the tap-flash fix (see below) could not be confirmed in the preview,
  because it fires no `IntersectionObserver`. Worth one human look.
- **crumpled-receipt-with-text idea** — parked by Will, likely belongs in
  `problem`.

## Eventually

The README's goal is rebuilding this in the `PapeXWeb` Next.js app. Will's plan
is to settle the design here first, then port in one pass. Nothing here is
production code — the prototyping runtime (`support.js`) does not ship.
