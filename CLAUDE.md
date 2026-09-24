# CLAUDE.md — PapeXWeb

The papex.app website (Next.js 15 App Router, deployed on Vercel). Four surfaces now live here, not one:

1. **Marketing site** — the forked landing (`/` → `/customers` | `/business`), plus blog + hidden admin CMS, waitlist, and POS-vendor ROI calculator.
2. **RDH receipt web fallback** (`/r`) — the non-App-Clip path for `https://papex.app/r?sid=<sid>`. It **does** call `api.papex.app`, server-side.
3. **Merchant dashboard** (`/merchant/*`) — the RDH pilot's transaction/insights UI, talking to `api.papex.app` through same-origin proxies.
4. **Universal-link host** for the whole iOS ecosystem — it serves the AASA file that lets the mobile app and App Clip intercept `papex.app` URLs.

System map: `../CLAUDE.md`.

## Commands

```bash
npm run dev          # next dev --turbopack — port 3000 by default, but .claude/launch.json expects 3001: use `npm run dev -- -p 3001` for the preview
npm run dev:clean    # rm -rf .next && dev — clears stale build cache (unix-only)
npm run build        # next build — ESLint is SKIPPED during builds (ignoreDuringBuilds)
npm run lint         # the only lint gate; a green build proves nothing about lint
npx tsc --noEmit     # safe to run while the dev server is up
```

- **NEVER run `npm run build` while the dev server is running.** Both write the shared `.next` directory; the running server then returns HTTP 500 for every route. Recovery: stop the server → `rm -rf .next` → restart. During development use `npx tsc --noEmit` and `npx next lint --file <path>`; run the full build once, at the end, with the server stopped.
- `npm run lint` has **20 pre-existing failing files** (`lib/blogService*`, `lib/imageUpload*`, `components/ui/*`, `components/{AdminLogin,CreateBlogModal,EditBlogModal,waitlist-form*}`, `components/framer/anim/*`, `app/dashboard/components/*`, `app/blog/[slug]`, `app/global-error`, `app/waitlist`, `app/pos-calculator/pos-calculator-client`). They predate the redesign. Verified 2026-09-09: nothing under `components/brand`, `components/paths`, `app/r`, `app/merchant`, `app/business` or `app/customers` contributes an error — keep it that way, and don't read the red output as "I broke it".
- `npm run migrate:images` / `migrate:images:dry` / `migrate:static-blogs*` are **broken**: `scripts/` now exists but holds only `generate-brand-assets.mjs` — `scripts/migrateBlogImages.ts` and `scripts/migrateStaticBlogs.ts` were never committed.
- **Deploy = push to `main`.** The single GitHub Action just curls the Vercel deploy hook — no tests, no build check, no CI gate. Anything merged to main goes live immediately.
- There are no tests anywhere. `npm run build` plus a real browser pass is the only gate. First build on a fresh machine needs network (Inter via `next/font/google`).

## Route map

24 page routes. The redesign ones first:

- `/` — **the fork**: a full-viewport split forcing one choice between the customer and business homepages. `app/page.tsx` → `components/brand/site-shell.tsx` + `components/brand/fork-gate.tsx`. The choice is remembered in `localStorage` under `papex.pathChoice` (`lib/pathChoice.ts`), and `FORK_SKIP_SCRIPT` stamps `<html data-fork-skip>` during HTML parse so returning visitors never flash the fork. **Consequence when testing: once you pick a half, `/` stops showing the fork.** Clear that key or use a private window.
- `/customers`, `/business` — the two real, indexable path homes. Section content lives in `components/paths/{customer,business}/`. Each hero MUST open on the same flat colour as its fork half — top half navy → `/business` opens on navy `#00121D`; bottom half light → `/customers` opens on light `#F5F5F5` (flipped 2026-09-10 with the fork swap) — that continuity is what makes the 620ms commit read as one surface growing instead of a page swap. The first-paint colour is `FlowGround`'s `initial` prop in each path's `index.tsx`; if `TOP_PATH`/`BOTTOM_PATH` in `fork.tsx` swap again, swap those too.
- `/r` — RDH receipt web fallback (Android + non-App-Clip iPhones). A **Server Component on purpose**: the RDH API has no CORS, so a browser fetch would fail silently. Sample-receipt semantics are deliberate and were a bug fix — read the header comment in `app/r/page.tsx` before touching them.
- `/rdh` — landing spot for `https://links.papex.app/rdh?sid=<sid>`, the "Save to PapeX" handoff target. Only renders when iOS did *not* intercept the universal link.
- `app/merchant/*` — the merchant dashboard. **Subdomain-only, and not reachable at `papex.app/merchant`.** `middleware.ts` + `lib/merchantHost.ts` rewrite any `merchant.*` host's `/<path>` to `/merchant/<path>` (`/` → `/merchant`, `/devices` → `/merchant/devices`, …), and on every other host they rewrite `/merchant*` to `/__merchant_not_found__` so it 404s on purpose — **a 404 there is correct, not a regression.** Locally, browse `http://merchant.localhost:3001`; `NEXT_PUBLIC_MERCHANT_DEMO_HOST_ANY=1` opens it on any host. Routing is **rewrite-only, never redirect** — a Vercel redirect once broke Apple's AASA fetch, and the matcher deliberately excludes `/r`, `/rdh`, `/api`, `/_next`, `/.well-known` and anything with a file extension.
- `/blog` + `/blog/[slug]` — Firestore posts, on the redesign shell (`SiteShell path="page"` + `FlowGround` light + in-flow footer, styles in `components/blog/`). **Server Components with ISR (`revalidate = 60`)**: they read published posts via the Firestore REST API in `app/blog/_lib/posts.ts` (same public project id/key as `firebase/firebaseConfig.ts`), so titles, per-post metadata/OG and Article JSON-LD are in the HTML. Writes stay on the client SDK (`lib/blogServiceFree.ts` via the admin-only CreateBlogModal/EditBlogModal islands), so an edit reaches the public page within ~a minute. There are no static slug folders or embedded fallback HTML any more (removed 2026-07-22, b4caa57); the 4 old launch URLs are redirected by `LEGACY_SLUGS` in `_lib/posts.ts`. Post images on a host missing from `next.config.ts` `images.remotePatterns` render `unoptimized` (`components/blog/image.ts` mirrors that list — keep them in step).
- `/dashboard` — blog CMS. Its `LoginForm` accepts ANY non-empty credentials (cosmetic gate). The REAL admin login is the deliberately faint footer button (`AdminLogin` — commit b667fdd restored it on purpose; don't remove as dead UI) → Firebase auth + hardcoded email allowlist in `hooks/useAdmin.ts`.
- `/invite/[token]` — web fallback for mobile invite links → App Store id `6754945242` (same id as `APP_DOWNLOAD_URL` in `components/framer/constants.ts`).
- `/pos-calculator` — ROI model in `lib/posValuePropModel.ts` (pure TS). `/pos-value-prop` redirects to it.
- `/waitlist`, `/contact`, `/survey`, `/privacy`, `/terms`, `/pci`, `/support`.

Four API routes (not one):

- `app/api/upload-image` — Vercel Blob; needs `BLOB_READ_WRITE_TOKEN`.
- `app/api/r/[sid]/parsed` — same-origin proxy for `GET /receipt/{sid}/parsed`, for the polling island in `app/r/ReceiptUpgrade.tsx`.
- `app/api/rdh/claim` — posts to the **adapter EC2** at `https://adapter.api.papex.app` (an A record in the `api.papex.app` Route 53 zone; nginx terminates TLS). Not the RDH Lambda backend.
- `app/api/rdh/merchant/[...path]` — proxy to `https://api.papex.app` for the merchant dashboard.

## Data, auth, env

- All Firebase is client-side, project `papexweb-aed97` — config is HARDCODED in `firebase/firebaseConfig.ts` (the `NEXT_PUBLIC_FIREBASE_*` lines in `.env.example` are commented out and never read). Collections: `blogs`, `waitlist`. Firestore security rules are NOT in this repo (console-managed).
- `NEXT_PUBLIC_IMGBB_API_KEY` (blog image uploads — without it the dashboard upload fails), `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_RDH_API_BASE` (overrides the `https://api.papex.app` default in `lib/merchantApi.ts` / `lib/rdh.ts`), and `NEXT_PUBLIC_MERCHANT_DEMO_HOST_ANY` (see the merchant route note above).
- Images go through `lib/storageConfig.ts` — `STORAGE_PROVIDER = 'imgbb'` is a hardcoded const (the doc comment claiming it's an env var is wrong; edit the file to switch). ImgBB replaced Firebase Storage because the Firebase project has no billing plan — see `IMGBB_SETUP.md`.
- Active blog service: `lib/blogServiceFree.ts`. `lib/blogService.ts` is dead code.

## Universal links / App Clip contract — DO NOT BREAK

- `public/.well-known/apple-app-site-association`: appID `U78Z2HWA5Q.com.app.papex` claims `/invite/*`, `/r`, `/r/*`; appclips lists `U78Z2HWA5Q.com.app.papex.Clip`. Matching entitlements live in PapeXV2 and Papex_AppClip.
- The special Content-Type/Cache-Control headers for AASA in `next.config.ts` are required. Breaking either the file or the headers breaks App Clip launches and universal links for the mobile repos.
- **`/r` IS a real route** and must stay one. (An earlier version of this file said there was intentionally no `/r` route and that desktop browsers should 404 — that is wrong and has been wrong since the web fallback shipped. Don't "restore" the 404.) iOS with the App Clip still intercepts the URL before the web page loads; `/r` exists for everyone else.
- This repo **does** reach AWS: `/r` and `/merchant/*` call `api.papex.app` (server-side only — see the API routes above), and `app/api/rdh/claim` calls the adapter EC2. It still has no connection to the firmware.
- ESC/POS parsing lives in `lib/escpos.ts` (+ `lib/receiptSummary.ts`, `lib/starRaster.ts`, `lib/receiptState.ts`). Per `../CLAUDE.md`, this must stay fixture-compatible with the Swift parser in `Papex_AppClip/Sources/ESCPOSParser`. The marketing demo on `/customers` decodes through these same modules on purpose — `grep -rn "papex-receipt" components/` must stay empty, or the site starts drifting from how receipts actually parse.

## Styling & animation

- `app/layout.tsx` imports `styles/framer-site.css`, then `app/globals.css`, then `styles/papex-brand.css`. The order is load-bearing (per the comments).
- **Two coexisting design systems, separated by a scope class.** `.rd` activates `styles/papex-brand.css` (the redesign tokens); the legacy pages use `.framer-site` / `styles/framer-site.css`. Everything brand-new must sit inside `.rd`; a legacy page body must not.
  - `components/brand/site-shell.tsx` (fork + both path homes) wraps everything, `<main>` included, in one `.rd`.
  - `components/framer/framer-page-shell.tsx` (the re-skinned legacy pages — eight routes since the blog moved to `SiteShell` in 2.1: `/contact`, `/pci`, `/pos-calculator`, `/privacy`, `/support`, `/survey`, `/terms`, `/waitlist`) gives `SiteNav` and `SiteFooter` **their own separate `.rd` wrappers and deliberately leaves `<main className="framer-subpage">` OUTSIDE**. That scoping is load-bearing — collapsing it into one wrapper restyles the legacy page bodies.
- The fork's **commit** motion (flex-grow 1 → 40 / 0.0001 over 620ms, the content `scale(.96)`, the seam fade) is a locked spec in `styles/papex-brand.css`. `components/brand/fork.module.css` owns only what happens around it. Don't let the two fight.
- `components/brand/fork.tsx` drives plane drift, pointer parallax, approach bank and fly-out from **one** rAF loop writing `transform`/`opacity` only. It never starts under `prefers-reduced-motion: reduce` — the reduced-motion path genuinely branches in JS, not just in CSS, so don't "simplify" it into a CSS-only guard.
- **Path homes = one scroll-blended ground, not coloured bands** (2026-09-10). `components/paths/shared/FlowGround.tsx` wraps each path; every section is a `FlowSection` that declares `ground="light"|"navy"` and paints no background. An IntersectionObserver on a thin middle-of-viewport band stamps the winning ground on the wrapper, and the registered `--flow-*` colour properties (`@property` in `papex-brand.css`, values in `shared/flow.module.css`) crossfade the page colour AND its text ink together — so text on the page must use `var(--flow-fg|fg-2|fg-3)`, never a fixed navy/white, or it goes invisible mid-swap. Elevated surfaces (white cards, navy lead card, inputs, the demo phone) keep their own colours. The depth kit (aurora, grain, travelling plane watermark) is rendered once by FlowGround — don't add per-section orbs/lines/watermarks. Section eyebrows are `SectionLabel` (`[02] The problem`, Geist Mono via `--font-label`; `--font-mono` stays Courier because the receipt demo is sized on it).
- Brand marks: **one** recolourable vector, `components/brand/plane-mark.tsx`. Every raster brand asset is generated from it by `scripts/generate-brand-assets.mjs` — regenerate, don't hand-edit PNGs.
- Canonical palette: orange `#EB7100`, navy `#00121D`. Four competing pairs used to exist; the UI tokens won and the artwork was recoloured to match.
- `app/merchant/**` and `app/r/**` intentionally use the **App Clip's** palette (`#181A20` / `#FB8500` / `#2B7FC6`), not the brand palette. That mismatch is correct — don't "fix" it. **`/customers` is all brand palette since 2026-09-22** (Nico's call): the App Clip beats (lock-screen card, "Reading your receipt", the clip-rendered receipt + orange "Save to PapeX") AND the app-screen mockups in `components/paths/customer/appui/` use navy `#00121D`, orange `#EB7100`, blue `#0088EA`, outline `#7FC4EC`; only the lock-screen card's View pill stays iOS blue `#0A84FF` because it is Apple's UI. The appui kit ports PapeXV2's corner-lit `GlassEdgeRing` (thickened to 1.5–2px + orange bloom for mockup scale), the 128° `glassFace.frost` and the `mirrorFace` pill, so `appui.module.css` is the one place that has to track `PapeXV2/theme/tokens.ts`. The phone chrome is one `.frame` (thin graphite titanium band + black bezel ring, Dynamic Island, concentric radii, screen 0.14w) in `components/paths/customer/iphone.module.css`, shared by every phone on the page; the old `.wpFrame` family in `customer.module.css` was deleted at the 2.1 merge (only the `.wpSheet` share sheet and `.wpDots` remain there).
- **App mockups follow `docs/design/app-reference.md`** — the PapeXV2 layout (tab order, FAB only on Home/Receipts at bottom-right above the tab bar, header geometry, row anatomy, what can coexist) derived from the app's code with a source cited per fact; every appui screen must match it, a cropped phone cuts the real layout instead of moving anything to the crop line, and the doc is refreshed from PapeXV2 code, not screenshots.
- Stack: Tailwind 3.4 + shadcn/ui (full Radix kit in `components/ui`), motion 12 + GSAP + Lenis + Embla. Fonts: local Barlow + Kameron, Google Inter.

## Known dead/legacy files — don't trip on, don't wire in

`lib/blogService.ts`, `app/document.jsx`, `app/head.tsx` (pages-router remnants), `public/index.html`, `public/vercel.json` (root `vercel.json` is the real one), `storage.rules` (Firebase Storage abandoned), root-level stray assets (`Kameron-SemiBold.ttf`, `Navy-Carolina.png`, `trans2.png`), `FIREBASE_STORAGE_CHECKLIST.md` (historical). README.md is stale — trust the code.

`components/framer/framer-landing-page.tsx` is the **pre-fork landing page**: intentionally kept, untouched and unused, until the redesign ships. Not dead yet — don't delete, don't wire back in.

Its whole subtree is unreachable with it: `components/framer/framer-nav.tsx` is imported only by `framer-landing-page.tsx`, and `public/framer-assets/logo.svg` is referenced only by `framer-nav.tsx`. **So the old letterboxed 1920×1080 wordmark does not render anywhere on the live site** — those ten legacy routes get the new `SiteNav` via `FramerPageShell`. Verified 2026-09-09: the served HTML for `/contact`, `/privacy` and `/pos-calculator` contains zero references to it. Don't spend time tightening that SVG's viewBox to fix a nav logo; you'd be editing an asset nothing displays.

## Design source material

- `docs/design/forked-landing/` — the PRD + the designer's `.dc.html` prototype (this is the copy to read).
- `design-prototype/` — a second copy of the same material pulled from the designer's branch (`origin/design/interactive-prototype`, Will Alcorn / GitHub `wdalcorn`), plus `NOTES.md`. Editing it here does **not** reach his branch; clone separately for that.
- Either prototype must be served over HTTP to render — opening the `.dc.html` from the filesystem gives a broken page:
  `python3 -m http.server 4321 --directory "design-prototype/source"`
- `design-prototype/source/papex-receipt.js` is the prototype's **vendored** parser. The site must not use it (see the `grep` rule above).
