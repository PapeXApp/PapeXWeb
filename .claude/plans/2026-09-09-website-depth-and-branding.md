# PapeX website — depth + branding pass

Branch `feat/forked-landing-redesign-v2`. Goal: take the new site from a faithful
build of the old design draft to a finished, on-brand site — more depth, no gaps,
smoother transitions, branding consistent with the product.

> **Reconstructed 2026-09-09.** The original running plan and the section-by-section
> prototype-delta doc were lost (`.claude/plans/` did not exist). Everything under
> "Done" below was re-verified against the code, not copied from a status report.
> The one thing that could NOT be re-verified is the list of 20 retired palette
> hexes — that list lived only in the lost doc.

## Locked decisions — do not re-litigate

- Canonical palette: orange `#EB7100`, navy `#00121D`. Four competing pairs existed; the UI tokens won and the artwork was recoloured to match.
- Keep all three sections the designer deleted: the counters band, Vision + closing CTA, and both Features image rows. The prototype pass was therefore purely additive.
- Keep the fuller footer; retitle unclear labels. **Never drop a footer destination** — that orphans a live page.
- Harmonise the legacy pages, don't redesign them: same skin, same structure.
- `app/merchant/**`, `app/r/**` and the `/customers` receipt demo keep the App Clip palette (`#181A20` / `#FB8500` / `#2B7FC6`) on purpose.

## Done (committed in f44ef02)

- **Brand foundation.** One recolourable vector `components/brand/plane-mark.tsx` replaced three competing logos plus a Lucide `Send` glyph posing as the plane on `/contact` and `/blog`. `scripts/generate-brand-assets.mjs` regenerates every raster asset from it. favicon.ico 327KB → 3.8KB; seven bloated fake icons deleted.
- **The fork is alive.** One rAF loop: plane idle-drift, bank toward the half being scrolled into, fly-out on commit; layered light pool, haze, vignette, grain. Reduced motion branches in JS, not just CSS. The locked 620ms commit motion is untouched.
- **Customer path.** Live hero receipt demo (tap → bow → decode), tap-to-flip problem cards, 3-question persona quiz, 2-click how-it-works. Decodes through the repo's own `lib/escpos.ts` + `lib/receiptSummary.ts` — `grep -rn "papex-receipt" components/` must stay empty.
- **Business path.** Numeric-lead 2×2 grid, roadmap with dashed connectors, dashboard section. No placeholders left on `/business`.
- **Ten legacy routes harmonised** via `components/framer/framer-page-shell.tsx` (`.rd` scoping is load-bearing — see CLAUDE.md).
- **Hydration bug fixed:** returning visitors hit an error on `/` because `FORK_SKIP_SCRIPT` stamps `<html data-fork-skip>` before React hydrates. `suppressHydrationWarning` added in `app/layout.tsx`.
- **CLAUDE.md rewritten** against the code. Two prior claims were actively dangerous: "intentionally NO `/r` route" (it is a real shipped web fallback) and "never calls `api.papex.app`" (it does). Root workspace map also corrected.

## Closed as false alarms — do not spend time here

- **Legacy wordmark "letterboxed in the nav."** `public/framer-assets/logo.svg` → only `framer-nav.tsx` → only `framer-landing-page.tsx` → imported by nothing. It renders nowhere on the live site; the ten legacy routes use the new `SiteNav`. Two earlier viewBox attempts "failed" because they were editing an invisible asset.
- **`will-change` permanently set on glow/haze/plane.** Correct, not sloppy: the rAF loop animates those continuously while mounted, and the reduced-motion block already resets it to `auto`.

## Open

| Item | Blocked on | Notes |
|---|---|---|
| `.grain` full-half `mix-blend-mode: overlay` through the 620ms commit | a real display | Cannot be measured from a hidden Browser pane (0×0 viewport, `visibilityState: hidden`, rAF throttled). Also a design call: overlay darkens over navy and screens over off-white, so normal compositing is a visible change, not a free win. |
| Plane resting opacity (0.15 navy / 0.11 light) | Nico's eyes | Chosen from headless screenshots. One-line change either way. |
| Four press logo slots | Nico / Will | Do not put outlets on the site we can't legitimately claim. Real outlets, or drop the row. |
| Brand kit rewrite + OneDrive prune | Nico | Brand Kit doc still states the OLD palette. Never delete from that OneDrive folder without Nico approving the list — it syncs to the whole team. |

## Traps

- **Never `npm run build` while the dev server runs** — both write `.next`, the server then 500s. Recovery: stop → `rm -rf .next` → restart. Use `npx tsc --noEmit` + `npx next lint --file` during development.
- **Screenshots come back black when the Browser pane is hidden** — the page does not paint, and the viewport reports 0×0. Verify through the DOM instead, and tell Nico that motion and "does it feel right" need his own display.
- **The fork remembers your choice** (`localStorage` key `papex.pathChoice`). Once you pick a half, `/` stops showing the fork. Clear it or use a private window.
- **zsh does not word-split unquoted variables** — `for f in $FILES` silently edits nothing. Use an array, and re-run the verification grep rather than trusting a "migrated" count.
- **Peer sessions may share this worktree.** `.claude/launch.json` and `app/merchant/AuthContext.tsx` carry another session's uncommitted work and were deliberately excluded from f44ef02. Leave them byte-for-byte alone.
- Reveal animations that write inline `transform` silently defeat any CSS `:hover` transform on the same element. Wrap the card; let the wrapper absorb the reveal.
- `npm run lint` has 20 pre-existing failing files, none of them redesign code. Don't read the red as "I broke it".
